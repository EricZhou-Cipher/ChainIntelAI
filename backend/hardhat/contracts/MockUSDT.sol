// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract MockUSDT is ERC20, Ownable {
  // 铸造事件
  event Minted(address indexed to, uint256 amount);
  // 销毁事件
  event Burned(address indexed from, uint256 amount);

  constructor() ERC20('Mock USDT', 'USDT') Ownable(msg.sender) {
    _mint(msg.sender, 1000000000 * 10 ** 6); // 铸造 1000亿 USDT，精度为 6
  }

  // 覆盖 decimals 函数，返回 6
  function decimals() public pure override returns (uint8) {
    return 6;
  }

  // 铸造代币（仅所有者）
  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
    emit Minted(to, amount);
  }

  // 销毁代币
  function burn(uint256 amount) public {
    _burn(msg.sender, amount);
    emit Burned(msg.sender, amount);
  }

  // 从指定地址销毁代币（仅所有者）
  function burnFrom(address account, uint256 amount) public onlyOwner {
    _burn(account, amount);
    emit Burned(account, amount);
  }
}
