const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./services/database');
const ethereumService = require('./services/ethereum');

// Import routes
const authRoutes = require('./routes/auth');
const institutionRoutes = require('./routes/institutions');
const transactionRoutes = require('./routes/transactions');
const configRoutes = require('./routes/config');

require('dotenv').config();

// Initialize database on startup
initializeDatabase();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});
app.use(globalLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/institutions', institutionRoutes);
app.use('/transactions', transactionRoutes);
app.use('/config', configRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    blockchain: !!ethereumService.contract
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log('Backend running on port', PORT));
