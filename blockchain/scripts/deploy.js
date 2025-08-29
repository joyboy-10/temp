const hre = require("hardhat");

async function main() {
  console.log("Deploying BudgetLedger...");
  const Ledger = await hre.ethers.getContractFactory("BudgetLedger");
  const ledger = await Ledger.deploy();
  await ledger.deployed();
  console.log("BudgetLedger deployed to:", ledger.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
