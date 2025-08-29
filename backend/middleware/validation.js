const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for registration endpoints
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: { error: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware for institution registration
function validateInstitutionRegistration(req, res, next) {
  const { name, location, auditorPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Institution name must be at least 2 characters' });
  }

  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    return res.status(400).json({ error: 'Location must be at least 2 characters' });
  }

  if (!auditorPassword || typeof auditorPassword !== 'string' || auditorPassword.length < 6) {
    return res.status(400).json({ error: 'Auditor password must be at least 6 characters' });
  }

  req.body.name = name.trim();
  req.body.location = location.trim();
  next();
}

// Validation middleware for transaction creation
function validateTransactionCreation(req, res, next) {
  const { receiver, amountEther, purpose } = req.body;

  if (!receiver || !ethers.isAddress(receiver)) {
    return res.status(400).json({ error: 'Valid receiver address required' });
  }

  const amount = parseFloat(amountEther);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 2) {
    return res.status(400).json({ error: 'Purpose must be at least 2 characters' });
  }

  next();
}

module.exports = {
  authLimiter,
  registerLimiter,
  validateInstitutionRegistration,
  validateTransactionCreation
};