// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ReentrancyGuard, ERC721Holder, Ownable {
    uint256 public marketplaceFee;
    uint256 public constant MAX_FEE = 1000;

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    event ItemListed(
        address indexed seller,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemSold(
        address indexed buyer,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 price,
        uint256 fee
    );

    event ListingCanceled(
        address indexed seller,
        address indexed nft,
        uint256 indexed tokenId
    );

    event MarketplaceFeeUpdated(uint256 newFee);

    constructor(uint256 _marketplaceFee) {
        require(_marketplaceFee <= MAX_FEE, "Fee too high");
        marketplaceFee = _marketplaceFee;
    }

    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(newFee);
    }

    function listItem(
        address nft,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be > 0");
        require(listings[nft][tokenId].price == 0, "Already listed");

        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not owner");

        token.safeTransferFrom(msg.sender, address(this), tokenId);

        listings[nft][tokenId] = Listing(msg.sender, price);

        emit ItemListed(msg.sender, nft, tokenId, price);
    }

    function buyItem(
        address nft,
        uint256 tokenId
    ) external payable nonReentrant {
        Listing memory listing = listings[nft][tokenId];
        require(listing.price > 0, "Not listed");
        require(msg.value == listing.price, "Incorrect ETH");

        delete listings[nft][tokenId];

        uint256 fee = (listing.price * marketplaceFee) / 10_000;
        uint256 sellerAmount = listing.price - fee;

        (bool sellerPaid, ) = payable(listing.seller).call{
            value: sellerAmount
        }("");
        require(sellerPaid, "Seller payment failed");

        if (fee > 0) {
            (bool feePaid, ) = payable(owner()).call{ value: fee }("");
            require(feePaid, "Fee payment failed");
        }

        IERC721(nft).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );

        emit ItemSold(msg.sender, nft, tokenId, listing.price, fee);
    }

    function cancelListing(
        address nft,
        uint256 tokenId
    ) external nonReentrant {
        Listing memory listing = listings[nft][tokenId];
        require(listing.price > 0, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[nft][tokenId];

        IERC721(nft).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );

        emit ListingCanceled(msg.sender, nft, tokenId);
    }

    function getListing(
        address nft,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return listings[nft][tokenId];
    }
}
