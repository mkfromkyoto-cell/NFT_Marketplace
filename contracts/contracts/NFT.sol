// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    event Minted(
        address indexed minter,
        uint256 indexed tokenId,
        string tokenURI
    );

    constructor() ERC721("Beginner NFT", "BNFT") {}

    function mint(string calldata tokenURI)
        external
        returns (uint256)
    {
        uint256 tokenId;

        unchecked {
            tokenId = ++tokenCounter;
        }

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit Minted(msg.sender, tokenId, tokenURI);

        return tokenId;
    }
}
