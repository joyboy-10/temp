# Ledger Knight - Complete Setup Instructions

## Overview
This is a complete blockchain-based ledger application for Ethereum Sepolia testnet with enhanced security, proper authentication, and a clean architecture.

## Architecture
- **Blockchain**: Solidity smart contracts deployed on Sepolia testnet
- **Backend**: Node.js + Express with JWT authentication and JSON database
- **Frontend**: React with minimal UI for API integration testing

## Setup Steps

### 1. Blockchain Setup
```bash
cd blockchain
cp .env.example .env
# Edit .env with your Sepolia RPC URL and private key
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
# Copy the deployed contract address
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with:
# - RPC_URL (same as blockchain)
# - PRIVATE_KEY (backend wallet with Sepolia ETH)
# - CONTRACT_ADDRESS (from step 1)
# - JWT_SECRET (random string)
npm install
node index.js
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with backend URL if different from localhost:4000
npm install
npm start
```

## Key Features

### Enhanced Security
- JWT-based authentication with role-based access control
- Password hashing with bcrypt (12 rounds)
- Rate limiting on authentication and registration endpoints
- Helmet.js for security headers
- Input validation and sanitization

### Database Architecture
- JSON-based local storage with atomic writes
- In-memory indices for O(1) lookups
- Constraint verification on startup
- Separate files for different entity types

### Blockchain Integration
- Ethers v6 for modern blockchain interaction
- Proper event parsing and transaction verification
- Error handling for blockchain operations
- Support for both server-side and client-side signing

### API Endpoints
- `POST /institutions/register` - Register new institution
- `POST /auth/login-auditor` - Auditor login
- `POST /auth/login-associate` - Associate login
- `POST /auth/create-associate` - Create new associate (auditor only)
- `GET /institutions/:id/summary` - Institution overview
- `GET /institutions/:id/history` - Transaction history
- `POST /transactions` - Create transaction (associate only)
- `POST /transactions/:id/review` - Review transaction (auditor only)
- `GET /transactions` - Get user's transactions
- `GET /config/theme` - Get theme configuration
- `POST /config/theme` - Update theme (auditor only)

## Business Logic Constraints
- Maximum 2 associates per institution
- Unique 8-digit institution IDs
- Transactions editable only in Pending/Review status
- Role-based permissions enforced at API level
- Institution balance validation before transaction approval

## Testing
1. Register a new institution (creates auditor automatically)
2. Login as auditor and create associates
3. Login as associate and create transactions
4. Login as auditor to review and approve/decline transactions
5. Verify blockchain state matches application state

## Production Considerations
- Set strong JWT_SECRET in production
- Use environment-specific RPC URLs
- Implement proper logging and monitoring
- Consider database backup strategies
- Add comprehensive error tracking