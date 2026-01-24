// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GalleryNFT.sol";

contract CollectionFactory {
    address public platform;
    address[] public allCollections;
    mapping(address => bool) public disabledCollections;

    constructor(address platform_) {
        platform = platform_;
    }

    function createCollection(
        string calldata name,
        string calldata symbol,
        string calldata collectionURI
    ) external returns (address) {
        GalleryNFT collection = new GalleryNFT(
            name,
            symbol,
            collectionURI,
            500,          // fixed 5% royalty
            0.01 ether,   // fixed mint fee
            platform
        );

        allCollections.push(address(collection));
        return address(collection);
    }

    function getAllCollections()
        external
        view
        returns (address[] memory)
    {
        return allCollections;
    }

    function isCollectionActive(address collection)
        external
        view
        returns (bool)
    {
        return !disabledCollections[collection];
    }
}
