// backend/storage.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ---------------------------
// ON-CHAIN SETUP
// ---------------------------

// Load ABI
const contractPath = path.resolve(
  __dirname,
  "../blockchain/artifacts/contracts/BudgetLedger.sol/BudgetLedger.json"
);

if (!fs.existsSync(contractPath)) {
  throw new Error("❌ Contract artifact not found. Did you run `npx hardhat compile`?");
}
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const abi = contractJson.abi;

// Connect provider
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Wallet signer
if (!process.env.PRIVATE_KEY) throw new Error("❌ PRIVATE_KEY missing in .env");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract
if (!process.env.CONTRACT_ADDRESS) throw new Error("❌ CONTRACT_ADDRESS missing in .env");
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// ---------------------------
// LOCAL JSON DATABASE SETUP
// ---------------------------

const dbPath = path.join(__dirname, "data", "db.json");

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, "data"))) fs.mkdirSync(path.join(__dirname, "data"));

// Initialize DB if not exists
if (!fs.existsSync(dbPath)) {
  const initData = {
    institutions: {}, // stores all institutions
    nextEmpId: 1      // for generating employee IDs
  };
  fs.writeFileSync(dbPath, JSON.stringify(initData, null, 2));
}

// Read DB
function readDB() {
  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw);
}

// Write DB
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ---------------------------
// ON-CHAIN WRAPPERS
// ---------------------------

async function registerInstitution(name, location, auditor) {
  const tx = await contract.registerInstitution(name, location, auditor);
  const receipt = await tx.wait();
  return receipt.events.find(e => e.event === "InstitutionRegistered").args.onchainId.toString();
}

async function depositForInstitution(instId, amountEth) {
  const tx = await contract.depositForInstitution(instId, {
    value: ethers.utils.parseEther(amountEth)
  });
  await tx.wait();
  return "Deposit successful";
}

async function createTransaction(instId, receiver, amountEth, purpose, comment) {
  const tx = await contract.createTransaction(
    instId,
    receiver,
    ethers.utils.parseEther(amountEth),
    purpose,
    comment
  );
  const receipt = await tx.wait();
  return receipt.events.find(e => e.event === "TransactionCreated").args.txId.toString();
}

async function reviewTransaction(txId, status, auditorComment) {
  const tx = await contract.reviewTransaction(txId, status, auditorComment);
  await tx.wait();
  return "Transaction reviewed";
}

async function getInstitutionBalance(instId) {
  const balance = await contract.getInstitutionBalance(instId);
  return ethers.utils.formatEther(balance);
}

async function getTxIdsForInstitution(instId) {
  return await contract.getTxIdsForInstitution(instId);
}

// ---------------------------
// EXPORTS
// ---------------------------

module.exports = {
  // JSON DB
  readDB,
  writeDB,

  // On-chain
  registerInstitution,
  depositForInstitution,
  createTransaction,
  reviewTransaction,
  getInstitutionBalance,
  getTxIdsForInstitution
};
