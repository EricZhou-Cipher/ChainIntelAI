const hre = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  try {
    const [owner] = await hre.ethers.getSigners();
    const deployedData = JSON.parse(
      await fs.readFile(
        path.join(__dirname, "..", "deployed", "deployed-address-hardhat.json"),
        "utf8"
      )
    );
    const usdt = await hre.ethers.getContractAt(
      "MockUSDT",
      deployedData.MockUSDT
    );
    const amount = hre.ethers.parseUnits(process.env.THRESHOLD || "1000000", 6);
    const accounts = JSON.parse(
      await fs.readFile(
        path.join(__dirname, "..", "..", "config", "accounts.json"),
        "utf8"
      )
    );
    const receivers = accounts.watchlist || [];

    for (const receiver of receivers) {
      const tx = await usdt.transfer(receiver, amount);
      await tx.wait();
      console.log(`Transferred ${amount} USDT to: ${receiver}`);
    }
  } catch (error) {
    console.error("❌ 批量转账失败:", error);
    process.exitCode = 1;
  }
}

main();
