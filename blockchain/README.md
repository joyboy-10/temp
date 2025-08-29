Blockchain folder instructions
1. Copy .env.example to .env and set SEPOLIA_RPC_URL and PRIVATE_KEY (deployer funded on Sepolia).
2. Install deps:
   npm install
3. Compile:
   npx hardhat compile
4. Deploy:
   npx hardhat run scripts/deploy.js --network sepolia
