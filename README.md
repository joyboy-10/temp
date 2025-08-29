Ledger-Knight - Full project (Blockchain + Backend + Minimal Frontend)

Steps after extracting:
1. Configure blockchain/.env with your ALCHEMY/SEPOLIA URL and PRIVATE_KEY (deployer with Sepolia ETH).
2. In blockchain/: npm install && npx hardhat compile
3. Deploy: npx hardhat run scripts/deploy.js --network sepolia
   Copy the deployed contract address.
4. Configure backend/.env with SEPOLIA_URL, BACKEND_WALLET_PRIVATE_KEY (funded) and CONTRACT_ADDRESS
5. Start backend:
   cd backend
   npm install
   node index.js
6. Start frontend:
   cd frontend
   npm install
   npm start

This package uses Hardhat v2 and ethers v5 for maximum compatibility.
