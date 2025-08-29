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
    const { institutionId, empId, password } = req.body;

    if (!institutionId || !empId || !password) {
      return res.status(400).json({ error: 'Institution ID, employee ID, and password required' });
    }

    const result = await authService.loginAssociate(institutionId, empId, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Create associate (auditor only)
router.post('/create-associate', authLimiter, async (req, res) => {
  try {
    const { institutionId, password } = req.body;

    if (!institutionId || !password) {
      return res.status(400).json({ error: 'Institution ID and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await authService.createAssociate(institutionId, password, 'system');
    res.json(result);
  } catch (error) {
    if (error.message.includes('Maximum 2 associates')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;