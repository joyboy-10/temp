const express = require('express');
const { readDB, writeDB } = require('../services/database');
const ethereumService = require('../services/ethereum');
const { authenticateToken, requireRole, requireInstitutionAccess } = require('../middleware/auth');
const { validateTransactionCreation } = require('../middleware/validation');

const router = express.Router();

// Create transaction (associates only)
router.post('/', authenticateToken, requireRole('associate'), validateTransactionCreation, async (req, res) => {
  try {
    const { receiver, amountEther, purpose, comment, deadline, priority } = req.body;
    const { institutionId } = req.user;
    
    const db = readDB();
    const institution = db.institutions[institutionId];
    
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Check institution balance
    const balance = await ethereumService.getInstitutionBalance(institution.onchainId);
    if (parseFloat(balance) < parseFloat(amountEther)) {
      return res.status(400).json({ error: 'Insufficient institution balance' });
    }

    // Create transaction on blockchain
    const fullComment = `${comment || ''}\nDeadline: ${deadline || 'N/A'}\nPriority: ${priority || 'medium'}`;
    
    const result = await ethereumService.createTransaction(
      institution.onchainId,
      receiver,
      amountEther,
      purpose,
      fullComment
    );

    // Store local transaction record
    const transaction = {
      id: result.txId,
      institutionId,
      creatorId: req.user.userId,
      receiver,
      amount: amountEther,
      purpose,
      comment: fullComment,
      deadline,
      priority: priority || 'medium',
      status: 0, // Pending
      txHash: result.txHash,
      createdAt: new Date().toISOString()
    };

    db.transactions[result.txId] = transaction;
    writeDB(db);

    res.json({
      success: true,
      txId: result.txId,
      txHash: result.txHash
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Review transaction (auditors only)
router.post('/:txId/review', authenticateToken, requireRole('auditor'), async (req, res) => {
  try {
    const { txId } = req.params;
    const { decision, auditorComment } = req.body;
    const { institutionId } = req.user;

    if (!['Approved', 'Declined', 'Review'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const db = readDB();
    const transaction = db.transactions[txId];
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied to this transaction' });
    }

    if (transaction.status !== 0 && transaction.status !== 3) {
      return res.status(422).json({ error: 'Transaction is not editable' });
    }

    // Map decision to status number
    let statusNum;
    switch (decision) {
      case 'Approved': statusNum = 1; break;
      case 'Declined': statusNum = 2; break;
      case 'Review': statusNum = 3; break;
    }

    // Review transaction on blockchain
    const txHash = await ethereumService.reviewTransaction(
      txId,
      statusNum,
      auditorComment || ''
    );

    // Update local record
    transaction.status = statusNum;
    transaction.auditorComment = auditorComment || '';
    transaction.reviewedAt = new Date().toISOString();
    transaction.reviewTxHash = txHash;

    db.transactions[txId] = transaction;
    writeDB(db);

    res.json({
      success: true,
      txId,
      decision,
      txHash
    });
  } catch (error) {
    console.error('Error reviewing transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transactions for institution
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { institutionId } = req.user;
    const db = readDB();
    
    const institution = db.institutions[institutionId];
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Get transactions from blockchain
    const txIds = await ethereumService.getTxIdsForInstitution(institution.onchainId);
    const transactions = [];

    for (const txId of txIds) {
      try {
        const blockchainTx = await ethereumService.getTransaction(txId);
        
        // Merge with local data if available
        const localTx = db.transactions[txId];
        const transaction = {
          ...blockchainTx,
          deadline: localTx?.deadline,
          priority: localTx?.priority,
          reviewTxHash: localTx?.reviewTxHash
        };
        
        transactions.push(transaction);
      } catch (error) {
        console.error(`Error fetching transaction ${txId}:`, error);
      }
    }

    res.json({ transactions });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;