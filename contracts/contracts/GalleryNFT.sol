// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GalleryNFT is ERC721, IERC2981, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    /* =========================
       COLLECTION METADATA
    ========================== */
    string public collectionURI;

    mapping(uint256 => string) private _tokenURIs;

    /* =========================
       MINT FEES
    ========================== */
    uint256 public mintFee;
    address public feeReceiver;

    /* =========================
       ROYALTIES (ERC-2981)
       fee in basis points
    ========================== */
    address private _royaltyReceiver;
    uint96 private _royaltyFee; // max 1000 = 10%

    constructor(
        string memory name_,
        string memory symbol_,
        string memory collectionURI_,
        address creator,
        address royaltyReceiver_,
        uint96 royaltyFee_,
        uint256 mintFee_
    ) ERC721(name_, symbol_) {
        require(royaltyFee_ <= 1000, "Max 10% royalty");

        collectionURI = collectionURI_;

        _royaltyReceiver = royaltyReceiver_;
        _royaltyFee = royaltyFee_;

        mintFee = mintFee_;
        feeReceiver = creator;

        _transferOwnership(creator);
    }

    /* =========================
       PUBLIC MINT (WITH FEE)
    ========================== */
    function mint(string calldata tokenURI)
        external
        payable
        returns (uint256)
    {
        require(msg.value == mintFee, "Incorrect mint fee");

        // pay mint fee
        (bool sent, ) = feeReceiver.call{value: msg.value}("");
        require(sent, "Fee transfer failed");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = tokenURI;

        return tokenId;
    }

    /* =========================
       ADMIN — MINT FEES
    ========================== */
    function setMintFee(uint256 fee) external onlyOwner {
        mintFee = fee;
    }

    function tokenCounter() external view returns (uint256) {
        return _tokenIds.current();
    }

    function setFeeReceiver(address receiver) external onlyOwner {
        feeReceiver = receiver;
    }

    /* =========================
       ADMIN — ROYALTIES
    ========================== */
    function setRoyalty(address receiver, uint96 fee)
        external
        onlyOwner
    {
        require(fee <= 1000, "Max 10%");
        _royaltyReceiver = receiver;
        _royaltyFee = fee;
    }

    /* =========================
       ERC-2981
    ========================== */
    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * _royaltyFee) / 10000;
        return (_royaltyReceiver, royaltyAmount);
    }

    /* =========================
       METADATA
    ========================== */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Nonexistent token");
        return _tokenURIs[tokenId];
    }

    function setCollectionURI(string calldata uri)
        external
        onlyOwner
    {
        collectionURI = uri;
    }

    /* =========================
       INTERFACE SUPPORT
    ========================== */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
