import { expect } from "chai";
import { defaultFactory } from "./utils/factory";
import {
  MoonMoonz__factory,
  TestERC20__factory,
  TestERC721__factory,
} from "../typechain-types";
import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";

describe("MoonMoonz", function () {
  it("can public mint", async function () {
    const recipient = (await ethers.getSigners())[1];
    const { owner, nft } = await defaultFactory();
    await nft.setPublicMintActive();

    const userNft = MoonMoonz__factory.connect(
      await nft.getAddress(),
      recipient
    );

    await userNft.publicMint(10, { value: parseEther("0.25") });

    expect(await userNft.balanceOf(recipient.address)).to.equal(10);
  });

  it("can erc20 mint", async function () {
    const recipient = (await ethers.getSigners())[1];
    const { owner, nft, testToken } = await defaultFactory();
    await nft.setHolderMintActive();
    await testToken.transfer(recipient.address, parseEther("1000"));

    const userNft = MoonMoonz__factory.connect(
      await nft.getAddress(),
      recipient
    );
    const userTestToken = TestERC20__factory.connect(
      await testToken.getAddress(),
      recipient
    );
    await userTestToken.approve(await nft.getAddress(), parseEther("1000"));
    await userNft.erc20Mint(10);

    expect(await userNft.balanceOf(recipient.address)).to.equal(10);
  });

  it("can claim", async function () {
    const recipient = (await ethers.getSigners())[1];
    const { nft, testNft } = await defaultFactory();
    await nft.setHolderMintActive();

    const userNft = MoonMoonz__factory.connect(
      await nft.getAddress(),
      recipient
    );
    const userTestNft = TestERC721__factory.connect(
      await testNft.getAddress(),
      recipient
    );
    await userTestNft.mint(recipient.address, 1);
    await userNft.claimMint(1, 1);

    expect(await userNft.balanceOf(recipient.address)).to.equal(1);
  });
});
