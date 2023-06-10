import { ethers } from "hardhat";
import { TestERC20, TestERC721, MoonMoonz } from "../../typechain-types";

export async function defaultFactory() {
  const [owner] = await ethers.getSigners();

  const TestNFT = await ethers.getContractFactory("TestERC721");
  const testNft = await TestNFT.deploy();
  const TestToken = await ethers.getContractFactory("TestERC20");
  const testToken = await TestToken.deploy();

  // wrapped NFT
  const NFT = await ethers.getContractFactory("MoonMoonz");
  const nft = await NFT.deploy(
    await testToken.getAddress(),
    await testNft.getAddress(),
    ""
  );

  return {
    owner,
    testNft: testNft as TestERC721,
    testToken: testToken as TestERC20,
    nft: nft as MoonMoonz,
  };
}
