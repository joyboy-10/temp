const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const {
  readDB,
  writeDB,
  registerInstitution,
  depositForInstitution,
  createTransaction,
  reviewTransaction,
  getInstitutionBalance,
  getTxIdsForInstitution
} = require('./storage');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------------------------
// UTILITIES
// ---------------------------

// Save auditor or associate keystore
async function saveKeystore(wallet, password, filepath) {
  const json = await wallet.encrypt(password);
  fs.writeFileSync(filepath, json);
}

// Generate unique 8-digit institution ID
function generateInstitutionId(db) {
  let id;
  do {
    id = Math.floor(10000000 + Math.random() * 90000000).toString();
  } while (db.institutions[id]);
  return id;
}

// ---------------------------
// ROUTES
// ---------------------------

// Register Institution
app.post('/registerInstitution', async (req, res) => {
  try {
    const { name, location, auditorPassword } = req.body;
    if (!name || !location || !auditorPassword)
      return res.status(400).json({ error: 'missing fields' });

    const db = readDB();
    db.institutions = db.institutions || {};
    db.nextEmpId = db.nextEmpId || 1;

    const institutionId = generateInstitutionId(db);

    // create auditor wallet and keystore
    const auditorWallet = ethers.Wallet.createRandom();
    const keystorePath = path.join(__dirname, 'data', `${institutionId}-auditor.json`);
    await saveKeystore(auditorWallet, auditorPassword, keystorePath);

    // register on-chain via contract
    const onchainId = await registerInstitution(name, location, auditorWallet.address);

    db.institutions[institutionId] = {
      name,
      location,
      auditorAddress: auditorWallet.address,
      auditorKeystore: keystorePath,
      onchainId,
      associates: {}
    };
    writeDB(db);

    res.json({ success: true, institutionId, auditorAddress: auditorWallet.address, onchainId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Create Associate
app.post('/createAssociate', async (req, res) => {
  try {
    const { institutionId, password } = req.body;
    if (!institutionId || !password)
      return res.status(400).json({ error: 'missing fields' });

    const db = readDB();
    db.institutions = db.institutions || {};
    db.nextEmpId = db.nextEmpId || 1;

    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const assocCount = Object.keys(inst.associates || {}).length;
    if (assocCount >= 2) return res.status(400).json({ error: 'max 2 associates allowed' });

    const wallet = ethers.Wallet.createRandom();
    const empId = 'EMP' + db.nextEmpId;
    db.nextEmpId++;

    const keystorePath = path.join(__dirname, 'data', `${institutionId}-${empId}.json`);
    await saveKeystore(wallet, password, keystorePath);

    inst.associates[empId] = { address: wallet.address, keystore: keystorePath };
    writeDB(db);

    res.json({ success: true, empId, address: wallet.address });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Login Auditor
app.post('/loginAuditor', async (req, res) => {
  try {
    const { institutionId, password } = req.body;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const keystore = fs.readFileSync(inst.auditorKeystore, 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, password);
    res.json({ success: true, address: wallet.address });
  } catch (e) {
    res.status(401).json({ error: 'invalid password or keystore' });
  }
});

// Login Associate
app.post('/loginAssociate', async (req, res) => {
  try {
    const { institutionId, empId, password } = req.body;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const assoc = inst.associates[empId];
    if (!assoc) return res.status(404).json({ error: 'associate not found' });

    const keystore = fs.readFileSync(assoc.keystore, 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, password);
    res.json({ success: true, address: wallet.address });
  } catch (e) {
    res.status(401).json({ error: 'invalid password or keystore' });
  }
});

// Deposit funds (auditor-signed)
app.post('/depositInstitution', async (req, res) => {
  try {
    const { institutionId, auditorPassword, valueEther } = req.body;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const keystore = fs.readFileSync(inst.auditorKeystore, 'utf8');
    const auditorWallet = await ethers.Wallet.fromEncryptedJson(keystore, auditorPassword);
    const connected = auditorWallet.connect(provider);

    const result = await depositForInstitution(inst.onchainId, String(valueEther || '0'));
    res.json({ success: true, message: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Create Transaction (associate)
app.post('/createTransaction', async (req, res) => {
  try {
    const { institutionId, empId, password, receiver, amountEther, purpose, comment } = req.body;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const assoc = inst.associates[empId];
    if (!assoc) return res.status(404).json({ error: 'associate not found' });

    const keystore = fs.readFileSync(assoc.keystore, 'utf8');
    const assocWallet = await ethers.Wallet.fromEncryptedJson(keystore, password);
    const w = assocWallet.connect(provider);

    const txId = await createTransaction(inst.onchainId, receiver, String(amountEther), purpose || '', comment || '');
    res.json({ success: true, txId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Review transaction (auditor)
app.post('/reviewTransaction', async (req, res) => {
  try {
    const { institutionId, auditorPassword, txId, decision, auditorComment } = req.body;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const keystore = fs.readFileSync(inst.auditorKeystore, 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, auditorPassword);

    let statusNum;
    if (decision === 'Approved') statusNum = 1;
    else if (decision === 'Declined') statusNum = 2;
    else if (decision === 'Review') statusNum = 3;
    else return res.status(400).json({ error: 'invalid decision' });

    const result = await reviewTransaction(txId, statusNum, auditorComment || '');
    res.json({ success: true, message: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Institution details
app.get('/institution/:institutionId', async (req, res) => {
  try {
    const institutionId = req.params.institutionId;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const balance = await getInstitutionBalance(inst.onchainId);
    res.json({
      success: true,
      institution: {
        name: inst.name,
        location: inst.location,
        auditorAddress: inst.auditorAddress,
        onchainId: inst.onchainId,
        associates: inst.associates
      },
      balance
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get transactions
app.get('/transactions/:institutionId', async (req, res) => {
  try {
    const institutionId = req.params.institutionId;
    const db = readDB();
    const inst = db.institutions[institutionId];
    if (!inst) return res.status(404).json({ error: 'institution not found' });

    const txIds = await getTxIdsForInstitution(inst.onchainId);
    const result = [];

    for (let i = 0; i < txIds.length; i++) {
      const id = Number(txIds[i]);
      const t = await contract.transactions(id);
      result.push({
        id: Number(t.id || t[0]),
        onchainInstId: Number(t.institutionOnchainId || t[1]),
        creator: t.creator || t[2],
        receiver: t.receiver || t[3],
        amountWei: (t.amount || t[4]).toString(),
        purpose: t.purpose || t[5],
        comment: t.comment || t[6],
        status: Number(t.status || t[7]),
        createdAt: Number(t.createdAt || t[8]),
        auditorComment: t.auditorComment || t[9]
      });
    }

    res.json({ success: true, txs: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log('Backend running on port', PORT));
