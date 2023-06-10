// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {OperatorFilterer} from "operator-filter-registry/src/OperatorFilterer.sol";
import {CANONICAL_CORI_SUBSCRIPTION} from "operator-filter-registry/src/lib/Constants.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MoonMoonz is
    ERC721A,
    ERC721AQueryable,
    Ownable,
    Pausable,
    OperatorFilterer
{
    uint16 constant MAX_SUPPLY = 10000;

    bool public holderMintActive = false;
    bool public publicMintActive = false;

    IERC20 public erc20MintableAddress;
    IERC721 public erc721ClaimableAddress;

    uint256 public erc20MintCost = 100 ether;
    uint256 public ethMintCost = 0.025 ether;

    string public baseURI;
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction;
    }
    RoyaltyInfo public defaultRoyaltyInfo;

    constructor(
        address _erc20MintableAddress,
        address _erc721ClaimableAddress,
        string memory __baseURI
    )
        ERC721A("MoonMoonz", "MOONMOONZ")
        OperatorFilterer(CANONICAL_CORI_SUBSCRIPTION, true)
    {
        erc20MintableAddress = IERC20(_erc20MintableAddress);
        erc721ClaimableAddress = IERC721(_erc721ClaimableAddress);
        baseURI = __baseURI;
    }

    error HolderMintNotActive();
    error PublicMintNotActive();
    error InsufficientBalance(uint256 balance, uint256 required);
    error MaxSupplyReached();

    function claimMint(uint16 tokenId, uint8 count) public whenNotPaused {
        if (!holderMintActive) {
            revert HolderMintNotActive();
        }
        if (tokenId > MAX_SUPPLY) {
            revert MaxSupplyReached();
        }

        setTokenClaimed(tokenId, count);

        _mint(msg.sender, uint256(count));
    }

    function erc20Mint(uint8 count) public whenNotPaused {
        if (!holderMintActive) {
            revert HolderMintNotActive();
        }
        if (totalSupply() + count > MAX_SUPPLY) {
            revert MaxSupplyReached();
        }
        uint256 balance = erc20MintableAddress.balanceOf(msg.sender);
        uint256 mintCost = count * erc20MintCost;
        if (balance < mintCost) {
            revert InsufficientBalance(balance, mintCost);
        }

        erc20MintableAddress.transferFrom(msg.sender, address(this), mintCost);
        _mint(msg.sender, uint256(count));
    }

    function publicMint(uint8 count) public payable whenNotPaused {
        if (!publicMintActive) {
            revert PublicMintNotActive();
        }
        if (totalSupply() + count > MAX_SUPPLY) {
            revert MaxSupplyReached();
        }

        if (msg.value < count * ethMintCost) {
            revert InsufficientBalance(msg.value, count * ethMintCost);
        }
        _mint(msg.sender, uint256(count));
    }

    function setBaseURI(string memory __baseURI) public onlyOwner {
        baseURI = __baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setHolderMintActive() public onlyOwner {
        holderMintActive = true;
        publicMintActive = false;
    }

    function setPublicMintActive() public onlyOwner {
        holderMintActive = false;
        publicMintActive = true;
    }

    function updateErc20MintCost(uint256 _erc20MintCost) public onlyOwner {
        erc20MintCost = _erc20MintCost;
    }

    function updateEthMintCost(uint256 _ethMintCost) public onlyOwner {
        ethMintCost = _ethMintCost;
    }

    // pack 2 bits per tokenId for all erc721 claims
    mapping(uint256 => uint256) packedClaim;

    error TokenClaimOverflow(uint16 tokenId);

    function setTokenClaimed(uint16 tokenId, uint8 count) internal {
        uint256 index = tokenId / 128; // 128 * 2 bits = 256 bits = 1 uint256
        uint256 pos = (tokenId % 128) * 2; // position in uint256

        uint256 mask = 3 << pos; // mask for this tokenId
        uint256 currentClaim = (packedClaim[index] & mask) >> pos; // get the current claim

        if (currentClaim + count > 3) {
            revert TokenClaimOverflow(tokenId);
        }

        // clear the existing entry
        packedClaim[index] &= ~mask;

        // update the entry
        packedClaim[index] |= ((currentClaim + count) << pos);
    }

    function getTokenClaimedCount(uint16 tokenId) public view returns (uint8) {
        uint256 index = tokenId / 128; // 128 * 2 bits = 256 bits = 1 uint256
        uint256 pos = (tokenId % 128) * 2; // position in uint256

        uint256 mask = 3 << pos; // mask for this tokenId
        return uint8((packedClaim[index] & mask) >> pos); // return the claim
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    error WithdrawFailed();

    function withdraw() public onlyOwner {
        address royaltyReceiver = defaultRoyaltyInfo.receiver;
        (bool sent, ) = payable(royaltyReceiver).call{
            value: address(this).balance
        }("");
        if (!sent) revert WithdrawFailed();
    }

    function withdrawERC20() public onlyOwner {
        address royaltyReceiver = defaultRoyaltyInfo.receiver;
        uint256 balance = erc20MintableAddress.balanceOf(address(this));
        erc20MintableAddress.transfer(royaltyReceiver, balance);
    }

    error MulticallFailed(uint256 index, bytes response);

    function multicall(
        bytes[] calldata data
    ) external payable returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            (bool success, bytes memory response) = address(this).call{
                value: msg.value
            }(data[i]);
            if (!success) revert MulticallFailed(i, response);
            results[i] = response;
        }
        return results;
    }

    /**
     * @dev Returns how much royalty is owed and to whom, based on a sale price that may be denominated in any unit of
     * exchange. The royalty amount is denominated and should be paid in that same unit of exchange.
     */
    function royaltyInfo(
        uint256,
        uint256 _salePrice
    ) public view returns (address, uint256 royaltyAmount) {
        royaltyAmount =
            (_salePrice * defaultRoyaltyInfo.royaltyFraction) /
            10000;

        return (defaultRoyaltyInfo.receiver, royaltyAmount);
    }

    /**
     * @dev Updates the EIP2981 Royalty info
     *
     * @param receiver The receiver of royalties
     * @param feeNumerator The royalty percent in basis points so 500 = 5%
     */
    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        defaultRoyaltyInfo = RoyaltyInfo(receiver, feeNumerator);
    }

    /**
     * @dev Tests if the contract supports an interface
     *
     * @param interfaceId the interface to test
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721A, IERC721A) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == bytes4(0x49064906) ||
            super.supportsInterface(interfaceId);
    }
}
