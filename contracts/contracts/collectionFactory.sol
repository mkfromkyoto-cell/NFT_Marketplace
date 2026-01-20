// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GalleryNFT.sol";

contract CollectionFactory {
    /* =========================
       STORAGE
    ========================== */
    address[] public allCollections;

    mapping(address => address[]) public collectionsByArtist;
    mapping(address => bool) public disabledCollections;

    /* =========================
       EVENTS
    ========================== */
    event CollectionCreated(
        address indexed artist,
        address indexed collection,
        string name,
        string symbol
    );

    event CollectionDisabled(address indexed collection);
    event CollectionEnabled(address indexed collection);

    /* =========================
       CREATE COLLECTION
    ========================== */
    function createCollection(
        string calldata name,
        string calldata symbol,
        string calldata collectionURI,
        uint96 royaltyFee,      // basis points (max 1000 = 10%)
        uint256 mintFee         // in wei
    ) external returns (address) {
        GalleryNFT collection = new GalleryNFT(
            name,
            symbol,
            collectionURI,
            msg.sender,      // creator / owner
            msg.sender,      // royalty receiver
            royaltyFee,
            mintFee
        );

        address collectionAddr = address(collection);

        allCollections.push(collectionAddr);
        collectionsByArtist[msg.sender].push(collectionAddr);

        emit CollectionCreated(
            msg.sender,
            collectionAddr,
            name,
            symbol
        );

        return collectionAddr;
    }

    /* =========================
       SOFT DISABLE / ENABLE
    ========================== */
    function disableCollection(address collection) external {
        require(
            GalleryNFT(collection).owner() == msg.sender,
            "Not collection owner"
        );

        disabledCollections[collection] = true;
        emit CollectionDisabled(collection);
    }

    function enableCollection(address collection) external {
        require(
            GalleryNFT(collection).owner() == msg.sender,
            "Not collection owner"
        );

        disabledCollections[collection] = false;
        emit CollectionEnabled(collection);
    }

    /* =========================
       READ HELPERS
    ========================== */
    function getAllCollections()
        external
        view
        returns (address[] memory)
    {
        return allCollections;
    }

    function getCollectionsByArtist(address artist)
        external
        view
        returns (address[] memory)
    {
        return collectionsByArtist[artist];
    }

    function isCollectionActive(address collection)
        external
        view
        returns (bool)
    {
        return !disabledCollections[collection];
    }
}
