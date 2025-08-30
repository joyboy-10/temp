const express = require('express');
const { readDB, writeDB } = require('../services/database');
const ethereumService = require('../services/ethereum');
const authService = require('../services/auth');
const { registerLimiter, validateInstitutionRegistration } = require('../middleware/validation');
const { authenticateToken, requireRole, requireInstitutionAccess } = require('../middleware/auth');
const { ethers } = require('ethers');

const router = express.Router();

// Register new institution
router.post('/register', registerLimiter, validateInstitutionRegistration, async (req, res) => {
  try {
    const { name, location, auditorPassword } = req.body;
    const db = readDB();

    // Check for duplicate institution name
    const existingInstitution = Object.values(db.institutions).find(
      inst => inst.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingInstitution) {
      return res.status(409).json({ error: 'Institution name already exists' });
    }

    // Generate unique 8-digit institution ID
    let institutionId;
    do {
      institutionId = Math.floor(10000000 + Math.random() * 90000000).toString();
    } while (db.institutions[institutionId]);

    // Create auditor wallet
    const auditorWallet = ethers.Wallet.createRandom();
    
    // Register institution on blockchain
    const onchainId = await ethereumService.registerInstitution(
      name, 
      location, 
      auditorWallet.address
    );

    // Generate auditor ID
    let auditorId;
    do {
      auditorId = `AUD${Math.floor(1000 + Math.random() * 9000)}`;
    } while (db.auditors[auditorId]);

    // Hash password
    const passwordHash = await authService.hashPassword(auditorPassword);

    // Create institution record
    const institution = {
      id: institutionId,
      name: name.trim(),
      location: location.trim(),
      auditorId,
      onchainId,
      createdAt: new Date().toISOString()
    };

    // Create auditor record
    const auditor = {
      id: auditorId,
      institutionId,
      walletAddress: auditorWallet.address,
      privateKey: auditorWallet.privateKey,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    // Save to database
    db.institutions[institutionId] = institution;
    db.auditors[auditorId] = auditor;
    writeDB(db);

    res.json({
      success: true,
      institutionId,
      auditorId,
      auditorAddress: auditorWallet.address,
      onchainId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institution summary
router.get('/:institutionId/summary', authenticateToken, requireInstitutionAccess, async (req, res) => {
  try {
    const { institutionId } = req.params;
    const db = readDB();
    
    const institution = db.institutions[institutionId];
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const balance = await ethereumService.getInstitutionBalance(institution.onchainId);
    
    // Get associates
    const associates = Object.values(db.associates).filter(
      a => a.institutionId === institutionId
    );

    // Get transaction metrics
    const transactions = Object.values(db.transactions).filter(
      t => t.institutionId === institutionId
    );

    const approvedTransactions = transactions.filter(t => t.status === 1);
    const totalSpent = approvedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pendingCount = transactions.filter(t => t.status === 0).length;

    res.json({
      institution: {
        id: institution.id,
        name: institution.name,
        location: institution.location,
        onchainId: institution.onchainId
      },
      balance,
      associates: associates.map(a => ({
        id: a.id,
        username: a.username,
        address: a.walletAddress
      })),
      metrics: {
        totalTransactions: transactions.length,
        totalSpent: totalSpent.toFixed(4),
        pendingTransactions: pendingCount,
        avgTransaction: approvedTransactions.length > 0 ? (totalSpent / approvedTransactions.length).toFixed(4) : '0'
      }
    });
  } catch (error) {
    console.error('Error getting institution summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institution transaction history
router.get('/:institutionId/history', authenticateToken, requireInstitutionAccess, async (req, res) => {
  try {
    const { institutionId } = req.params;
    const db = readDB();
    
    const institution = db.institutions[institutionId];
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Get blockchain transaction IDs
    const txIds = await ethereumService.getTxIdsForInstitution(institution.onchainId);
    const transactions = [];

    // Fetch transaction details from blockchain
    for (const txId of txIds) {
      try {
        const tx = await ethereumService.getTransaction(txId);
        transactions.push(tx);
      } catch (error) {
        console.error(`Error fetching transaction ${txId}:`, error);
      }
    }

    res.json({ transactions });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;