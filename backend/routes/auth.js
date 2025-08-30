const express = require('express');
const authService = require('../services/auth');
const { readDB, writeDB } = require('../services/database');
const { authLimiter, registerLimiter } = require('../middleware/validation');
const { ethers } = require('ethers');

const router = express.Router();

// Login auditor
router.post('/login-auditor', authLimiter, async (req, res) => {
  try {
    const { institutionId, password } = req.body;

    if (!institutionId || !password) {
      return res.status(400).json({ error: 'Institution ID and password required' });
    }

    const result = await authService.loginAuditor(institutionId, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Login associate
router.post('/login-associate', authLimiter, async (req, res) => {
  try {
    const { institutionId, username, password } = req.body;

    if (!institutionId || !username || !password) {
      return res.status(400).json({ error: 'Institution ID, username, and password required' });
    }

    const result = await authService.loginAssociate(institutionId, username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Create associate (auditor only)
router.post('/create-associate', authLimiter, async (req, res) => {
  try {
    const { institutionId, username, password, auditorPassword } = req.body;

    if (!institutionId || !username || !password || !auditorPassword) {
      return res.status(400).json({ error: 'Institution ID, username, password, and auditor password required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify auditor password
    const db = require('../services/database').readDB();
    const institution = db.institutions[institutionId];
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const auditor = db.auditors[institution.auditorId];
    if (!auditor) {
      return res.status(404).json({ error: 'Auditor not found' });
    }

    const isValidAuditorPassword = await authService.verifyPassword(auditorPassword, auditor.passwordHash);
    if (!isValidAuditorPassword) {
      return res.status(401).json({ error: 'Invalid auditor password' });
    }

    const result = await authService.createAssociate(institutionId, username, password, 'auditor');
    res.json(result);
  } catch (error) {
    if (error.message.includes('Maximum 2 associates')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Username already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete associate (auditor only)
router.delete('/delete-associate', authLimiter, async (req, res) => {
  try {
    const { institutionId, username, auditorPassword } = req.body;

    if (!institutionId || !username || !auditorPassword) {
      return res.status(400).json({ error: 'Institution ID, username, and auditor password required' });
    }

    const result = await authService.deleteAssociate(institutionId, username, auditorPassword);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Invalid auditor password')) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;