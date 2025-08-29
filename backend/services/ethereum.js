const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class EthereumService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.wallet = null;
    this.initialize();
  }

  initialize() {
    try {
      // Setup provider
      if (!process.env.RPC_URL) {
        throw new Error('RPC_URL not configured');
      }
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

      // Setup wallet
      if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not configured');
      }
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // Setup contract
      if (!process.env.CONTRACT_ADDRESS) {
        throw new Error('CONTRACT_ADDRESS not configured');
      }

      const contractPath = path.resolve(
        __dirname,
        '../../blockchain/artifacts/contracts/BudgetLedger.sol/BudgetLedger.json'
      );

      if (!fs.existsSync(contractPath)) {
        throw new Error('Contract artifact not found. Run: npx hardhat compile');
      }

      const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contractJson.abi,
        this.wallet
      );

      console.log('Ethereum service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Ethereum service:', error.message);
      throw error;
    }
  }

  // Get institution balance from blockchain
  async getInstitutionBalance(onchainId) {
    try {
      const balance = await this.contract.getInstitutionBalance(onchainId);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting institution balance:', error);
      throw new Error('Failed to get institution balance');
    }
  }

  // Register institution on blockchain
  async registerInstitution(name, location, auditorAddress) {
    try {
      const tx = await this.contract.registerInstitution(name, location, auditorAddress);
      const receipt = await tx.wait();
      
      // Find the registration event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'InstitutionRegistered';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        return parsed.args.onchainId.toString();
      }
      
      throw new Error('Registration event not found');
    } catch (error) {
      console.error('Error registering institution:', error);
      throw new Error('Failed to register institution on blockchain');
    }
  }

  // Deposit funds for institution
  async depositForInstitution(onchainId, amountEth) {
    try {
      const tx = await this.contract.depositForInstitution(onchainId, {
        value: ethers.parseEther(amountEth.toString())
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error depositing funds:', error);
      throw new Error('Failed to deposit funds');
    }
  }

  // Create transaction on blockchain
  async createTransaction(onchainId, receiver, amountEth, purpose, comment) {
    try {
      const tx = await this.contract.createTransaction(
        onchainId,
        receiver,
        ethers.parseEther(amountEth.toString()),
        purpose,
        comment
      );
      const receipt = await tx.wait();
      
      // Find the transaction created event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'TransactionCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        return {
          txId: parsed.args.txId.toString(),
          txHash: tx.hash
        };
      }
      
      throw new Error('Transaction creation event not found');
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction on blockchain');
    }
  }

  // Review transaction on blockchain
  async reviewTransaction(txId, status, auditorComment) {
    try {
      const tx = await this.contract.reviewTransaction(txId, status, auditorComment);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error reviewing transaction:', error);
      throw new Error('Failed to review transaction on blockchain');
    }
  }

  // Get transaction IDs for institution
  async getTxIdsForInstitution(onchainId) {
    try {
      const txIds = await this.contract.getTxIdsForInstitution(onchainId);
      return txIds.map(id => id.toString());
    } catch (error) {
      console.error('Error getting transaction IDs:', error);
      throw new Error('Failed to get transaction IDs');
    }
  }

  // Get transaction details from blockchain
  async getTransaction(txId) {
    try {
      const tx = await this.contract.transactions(txId);
      return {
        id: tx.id.toString(),
        institutionOnchainId: tx.institutionOnchainId.toString(),
        creator: tx.creator,
        receiver: tx.receiver,
        amount: tx.amount.toString(),
        purpose: tx.purpose,
        comment: tx.comment,
        status: Number(tx.status),
        createdAt: tx.createdAt.toString(),
        auditorComment: tx.auditorComment
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw new Error('Failed to get transaction details');
    }
  }

  // Verify transaction is mined
  async verifyTxMined(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt && receipt.status === 1;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }
}

module.exports = new EthereumService();