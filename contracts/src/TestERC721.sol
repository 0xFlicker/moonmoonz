// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";

contract TestERC721 is ERC721A {
  constructor() ERC721A("TestERC721", "TEST") {
    _mint(msg.sender, 1);
  }

  function mint(address to, uint256 count) public {
    _mint(to, count);
  }
}
