import { ethers } from "ethers";
import { getChainContract } from "./config/chains.js";

async function testTransfer() {
  try {
    // 连接到本地 Hardhat 节点
    const provider = new ethers.WebSocketProvider("ws://127.0.0.1:8545");

    // 使用第一个账户作为发送者
    const signer = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );

    // 获取合约实例
    const contract = await getChainContract(31337);
    const contractWithSigner = contract.connect(signer);

    // 转账金额：150 ETH
    const amount = ethers.parseEther("150");

    // 发送转账交易
    console.log("开始转账...");
    const tx = await contractWithSigner.transfer(
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // 接收地址
      amount,
      { gasLimit: 100000 }
    );

    console.log("交易已发送:", tx.hash);
    console.log("等待交易确认...");

    // 等待交易确认
    const receipt = await tx.wait();
    console.log("交易已确认！");
    console.log("区块号:", receipt.blockNumber);
    console.log("Gas 使用量:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("转账失败:", error);
  }
}

// 执行测试
testTransfer();
