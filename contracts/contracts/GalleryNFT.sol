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
       METADATA
    ========================== */
    string public collectionURI;
    mapping(uint256 => string) private _tokenURIs;

    /* =========================
       FEES
    ========================== */
    uint256 public mintFee;
    address public platform; // deployer

    /* =========================
       ROYALTY (PER TOKEN ARTIST)
    ========================== */
    uint96 public royaltyFee; // basis points
    mapping(uint256 => address) private _artist;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory collectionURI_,
        uint96 royaltyFee_,
        uint256 mintFee_,
        address platform_
    ) ERC721(name_, symbol_) {
        require(royaltyFee_ <= 1000, "Max 10%");

        collectionURI = collectionURI_;
        royaltyFee = royaltyFee_;
        mintFee = mintFee_;
        platform = platform_;

        _transferOwnership(msg.sender);
    }

    /* =========================
       MINT
    ========================== */
    function mint(string calldata tokenURI)
        external
        payable
        returns (uint256)
    {
        require(msg.value == mintFee, "Wrong mint fee");

        (bool sent, ) = platform.call{value: msg.value}("");
        require(sent, "Fee transfer failed");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = tokenURI;
        _artist[tokenId] = msg.sender;

        return tokenId;
    }

    function tokenCounter() external view returns (uint256) {
        return _tokenIds.current();
    }

    /* =========================
       ERC-2981
    ========================== */
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        uint256 amount = (salePrice * royaltyFee) / 10000;
        return (_artist[tokenId], amount);
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
