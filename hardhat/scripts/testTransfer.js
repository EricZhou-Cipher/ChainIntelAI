const hre = require("hardhat");

async function main() {
  // 获取合约实例
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.attach(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );

  // 获取测试账户
  const [owner, addr1] = await hre.ethers.getSigners();

  // 发送大额转账（200 ETH）
  const amount = hre.ethers.parseEther("200");
  console.log("开始转账...");
  const tx = await token.transfer(addr1.address, amount);
  await tx.wait();
  console.log("转账完成！");
  console.log("交易哈希:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
