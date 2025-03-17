const hre = require('hardhat');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  try {
    const MockUSDT = await hre.ethers.getContractFactory('MockUSDT');
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();
    const address = await usdt.getAddress();
    console.log(`MockUSDT deployed to: ${address}`);

    // 生成按网络和时间戳命名的文件
    const network = hre.network.name;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const deployedDir = path.join(__dirname, '..', 'deployed');

    // 确保deployed目录存在
    try {
      await fs.mkdir(deployedDir, { recursive: true });
      console.log(`✅ 确保deployed目录存在`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error(`❌ 创建目录失败:`, err);
      }
    }

    const filePath = path.join(deployedDir, `deployed-address-${network}-${timestamp}.json`);

    try {
      await fs.writeFile(filePath, JSON.stringify({ MockUSDT: address }, null, 2));
      console.log(`✅ 合约地址已保存到 ${filePath}`);
    } catch (error) {
      console.error(`❌ 保存合约地址失败:`, error);
      // 不抛出错误，继续执行
    }
  } catch (error) {
    console.error('❌ 部署失败:', error);
    process.exitCode = 1;
  }
}

main();
