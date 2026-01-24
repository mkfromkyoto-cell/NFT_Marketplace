const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GalleryNFT", function () {
  let nft, artist;

  beforeEach(async () => {
    [artist] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("GalleryNFT");
    nft = await NFT.deploy(
      "Test Collection",
      "TEST",
      "ipfs://collection",          // baseURI ✅
      artist.address,               // artist ✅
      500,                           // royaltyBps (5%) ✅
      ethers.parseEther("0.01")      // mintFee ✅
    );

    await nft.waitForDeployment();
  });

  it("allows artist to mint", async () => {
    await nft.connect(artist).mint("ipfs://token");

    expect(await nft.tokenCounter()).to.equal(1);
    expect(await nft.ownerOf(1)).to.equal(artist.address);
  });

  it("returns correct royalty info", async () => {
    const salePrice = ethers.parseEther("1");
    const [receiver, amount] = await nft.royaltyInfo(1, salePrice);

    expect(receiver).to.equal(artist.address);
    expect(amount).to.equal(ethers.parseEther("0.05"));
  });
});
