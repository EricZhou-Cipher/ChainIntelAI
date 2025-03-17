const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MockUSDT', function () {
  let mockUSDT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // 获取合约工厂
    const MockUSDT = await ethers.getContractFactory('MockUSDT');

    // 部署合约
    mockUSDT = await MockUSDT.deploy();

    // 获取签名者
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe('部署', function () {
    it('应该设置正确的名称和符号', async function () {
      expect(await mockUSDT.name()).to.equal('Mock USDT');
      expect(await mockUSDT.symbol()).to.equal('USDT');
    });

    it('应该将所有代币分配给部署者', async function () {
      const ownerBalance = await mockUSDT.balanceOf(owner.address);
      expect(await mockUSDT.totalSupply()).to.equal(ownerBalance);
    });

    it('应该设置正确的小数位数', async function () {
      expect(await mockUSDT.decimals()).to.equal(6);
    });
  });

  describe('交易', function () {
    it('应该能够转账代币', async function () {
      // 从owner转给addr1 50个代币
      await mockUSDT.transfer(addr1.address, 50);
      const addr1Balance = await mockUSDT.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);
    });

    it('应该在转账后更新余额', async function () {
      const initialOwnerBalance = await mockUSDT.balanceOf(owner.address);

      // 从owner转给addr1 100个代币
      await mockUSDT.transfer(addr1.address, 100);

      // 从addr1转给addr2 50个代币
      await mockUSDT.connect(addr1).transfer(addr2.address, 50);

      // 检查最终余额
      const finalOwnerBalance = await mockUSDT.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 100n);

      const addr1Balance = await mockUSDT.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      const addr2Balance = await mockUSDT.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });
});
