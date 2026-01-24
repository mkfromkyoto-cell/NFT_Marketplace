const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollectionFactory", function () {
  let factory, artist;

  beforeEach(async () => {
    [, artist] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CollectionFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  it("creates a new collection", async () => {
    const tx = await factory
      .connect(artist)
      .createCollection(
        "Artist Gallery",
        "ART",
        "ipfs://collection-metadata", // baseURI
        500,                           // royaltyBps
        ethers.parseEther("0.01")      // mintFee
      );

    const receipt = await tx.wait();

    let collectionAddress;

    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed.name === "CollectionCreated") {
          collectionAddress = parsed.args.collection;
          break;
        }
      } catch {}
    }

    expect(collectionAddress).to.not.equal(undefined);

    const nft = await ethers.getContractAt(
      "GalleryNFT",
      collectionAddress
    );

    expect(await nft.name()).to.equal("Artist Gallery");
    expect(await nft.owner()).to.equal(artist.address);
  });

  it("tracks collections by artist", async () => {
    await factory
      .connect(artist)
      .createCollection(
        "Gallery One",
        "G1",
        "ipfs://meta",
        500,
        ethers.parseEther("0.01")
      );

    const collections =
      await factory.getCollectionsByArtist(artist.address);

    expect(collections.length).to.equal(1);
  });
});
