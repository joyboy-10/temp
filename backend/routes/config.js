const express = require('express');
const { readDB, writeDB } = require('../services/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get theme configuration
router.get('/theme', (req, res) => {
  try {
    const db = readDB();
    res.json({ theme: db.config.theme || 'default' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get theme configuration' });
  }
});

// Update theme configuration (auditors only)
router.post('/theme', authenticateToken, requireRole('auditor'), (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme || !['default', 'dark', 'light'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme. Must be: default, dark, or light' });
    }

    const db = readDB();
    db.config.theme = theme;
    db.config.lastUpdated = new Date().toISOString();
    writeDB(db);

    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update theme configuration' });
  }
});

module.exports = router;