const hre = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  try {
    const [owner, receiver] = await hre.ethers.getSigners();
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
    const tx = await usdt.transfer(receiver.address, amount);
    await tx.wait();
    console.log(`✅ 成功转账 ${amount} USDT 给 ${receiver.address}`);
  } catch (error) {
    console.error("❌ 转账失败:", error);
    process.exitCode = 1;
  }
}

main();
