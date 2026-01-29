// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GalleryAuction is
    ReentrancyGuard,
    IERC721Receiver,
    Ownable,
    Pausable
{
    /* =========================
       CONFIG
    ========================== */

    uint256 public marketplaceFee; // basis points
    uint256 public constant MAX_FEE = 1000; // 10%

    /* =========================
       AUCTION STORAGE
    ========================== */

    struct Auction {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 startPrice;
        uint256 highestBid;
        address highestBidder;
        uint64 endTime;
        bool settled;
    }

    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;

    // Prevent same NFT being auctioned twice
    mapping(address => mapping(uint256 => bool)) public nftInAuction;

    // Withdraw (pull-payment) pattern
    mapping(address => uint256) public pendingReturns;

    /* =========================
       EVENTS
    ========================== */

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nft,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionSettled(
        uint256 indexed auctionId,
        address winner,
        uint256 amount
    );

    event AuctionCanceled(uint256 indexed auctionId);
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    event Withdrawal(address indexed user, uint256 amount);

    /* =========================
       CONSTRUCTOR
    ========================== */

    constructor(uint256 _marketplaceFee) {
        require(_marketplaceFee <= MAX_FEE, "Fee too high");
        marketplaceFee = _marketplaceFee;
    }

    /* =========================
       ADMIN
    ========================== */

    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        uint256 old = marketplaceFee;
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(old, newFee);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /* =========================
       CREATE AUCTION
    ========================== */

    function createAuction(
        address nft,
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) external whenNotPaused nonReentrant {
        require(startPrice > 0, "Start price zero");
        require(duration >= 1 hours, "Duration too short");
        require(!nftInAuction[nft][tokenId], "NFT already auctioned");

        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not owner");

        // Escrow NFT
        token.safeTransferFrom(msg.sender, address(this), tokenId);

        auctionCounter++;
        uint256 auctionId = auctionCounter;

        auctions[auctionId] = Auction({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: uint64(block.timestamp + duration),
            settled: false
        });

        nftInAuction[nft][tokenId] = true;

        emit AuctionCreated(
            auctionId,
            msg.sender,
            nft,
            tokenId,
            startPrice,
            block.timestamp + duration
        );
    }

    /* =========================
       BID
    ========================== */

    function bid(uint256 auctionId)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        Auction storage a = auctions[auctionId];

        require(block.timestamp < a.endTime, "Auction ended");
        require(!a.settled, "Already settled");

        uint256 minIncrement = a.highestBid / 20; // 5%
        if (minIncrement == 0) minIncrement = 1;

        uint256 minBid = a.highestBid == 0
            ? a.startPrice
            : a.highestBid + minIncrement;

        require(msg.value >= minBid, "Bid too low");

        if (a.highestBidder != address(0)) {
            pendingReturns[a.highestBidder] += a.highestBid;
        }

        a.highestBid = msg.value;
        a.highestBidder = msg.sender;

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    /* =========================
       WITHDRAW (OUTBID / PAYOUTS)
    ========================== */

    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingReturns[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    /* =========================
       SETTLE AUCTION
    ========================== */

    function settleAuction(uint256 auctionId)
        external
        whenNotPaused
        nonReentrant
    {
        Auction storage a = auctions[auctionId];

        require(!a.settled, "Already settled");
        require(block.timestamp >= a.endTime, "Auction not ended");

        a.settled = true;
        nftInAuction[a.nft][a.tokenId] = false;

        // No bids → return NFT
        if (a.highestBidder == address(0)) {
            IERC721(a.nft).safeTransferFrom(
                address(this),
                a.seller,
                a.tokenId
            );
            emit AuctionCanceled(auctionId);
            return;
        }

        uint256 total = a.highestBid;
        uint256 marketCut = (total * marketplaceFee) / 10_000;
        uint256 remaining = total - marketCut;

        uint256 royaltyAmount;
        address royaltyReceiver;

        if (IERC165(a.nft).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) =
                IERC2981(a.nft).royaltyInfo(a.tokenId, total);

            require(
                royaltyReceiver != address(0),
                "Invalid royalty receiver"
            );
            require(royaltyAmount <= remaining, "Royalty too high");

            pendingReturns[royaltyReceiver] += royaltyAmount;
            remaining -= royaltyAmount;
        }

        pendingReturns[a.seller] += remaining;
        pendingReturns[owner()] += marketCut;

        IERC721(a.nft).safeTransferFrom(
            address(this),
            a.highestBidder,
            a.tokenId
        );

        emit AuctionSettled(
            auctionId,
            a.highestBidder,
            a.highestBid
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
