// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";


contract GalleryMarketplace is
    ReentrancyGuard,
    IERC721Receiver,
    Ownable
{
    uint256 public marketplaceFee; // basis points
    uint256 public constant MAX_FEE = 1000;

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    constructor(uint256 _fee) {
        require(_fee <= MAX_FEE, "Fee too high");
        marketplaceFee = _fee;
    }

    /* =========================
       LIST (ESCROW)
    ========================== */
    function listItem(
        address nft,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price zero");
        require(listings[nft][tokenId].price == 0, "Already listed");

        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not owner");

        // 👉 TRANSFER NFT INTO ESCROW
        token.safeTransferFrom(msg.sender, address(this), tokenId);

        listings[nft][tokenId] = Listing(msg.sender, price);
    }

    /* =========================
       BUY
    ========================== */
    function buyItem(
        address nft,
        uint256 tokenId
    ) external payable nonReentrant {
        Listing memory listing = listings[nft][tokenId];
        require(listing.price > 0, "Not listed");
        require(msg.value == listing.price, "Wrong ETH");

        delete listings[nft][tokenId];

        uint256 marketCut = (msg.value * marketplaceFee) / 10_000;
        uint256 remaining = msg.value - marketCut;

        uint256 royaltyAmount;
        address royaltyReceiver;

        if (IERC165(nft).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) =
                IERC2981(nft).royaltyInfo(tokenId, msg.value);
        }

        uint256 sellerAmount = remaining - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(royaltyReceiver).transfer(royaltyAmount);
        }

        payable(listing.seller).transfer(sellerAmount);
        payable(owner()).transfer(marketCut);

        // 👉 TRANSFER FROM ESCROW TO BUYER
        IERC721(nft).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );
    }

    /* =========================
       CANCEL
    ========================== */
    function cancelListing(
        address nft,
        uint256 tokenId
    ) external nonReentrant {
        Listing memory listing = listings[nft][tokenId];
        require(listing.seller == msg.sender, "Not seller");

        delete listings[nft][tokenId];

        IERC721(nft).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );
    }

    /* =========================
       ERC721 RECEIVER
    ========================== */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
