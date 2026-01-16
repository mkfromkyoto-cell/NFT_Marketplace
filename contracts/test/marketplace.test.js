const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", function () {
  let nft;
  let marketplace;
  let owner;
  let seller;
  let buyer;

  const PRICE = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    /* Deploy NFT */
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    /* Deploy Marketplace (2.5%) */
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(250);
    await marketplace.waitForDeployment();
  });

  it("Anyone can mint NFT", async function () {
    await nft.connect(seller).mint("ipfs://token-uri");

    expect(await nft.ownerOf(1)).to.equal(seller.address);
  });

  it("Seller can list NFT", async function () {
    await nft.connect(seller).mint("ipfs://token-uri");

    await nft
      .connect(seller)
      .approve(marketplace.target, 1);

    await marketplace
      .connect(seller)
      .listItem(nft.target, 1, PRICE);

    const listing = await marketplace.getListing(nft.target, 1);
    expect(listing.price).to.equal(PRICE);
    expect(listing.seller).to.equal(seller.address);
  });

  it("Buyer can buy NFT and seller gets paid", async function () {
    await nft.connect(seller).mint("ipfs://token-uri");

    await nft
      .connect(seller)
      .approve(marketplace.target, 1);

    await marketplace
      .connect(seller)
      .listItem(nft.target, 1, PRICE);

    const sellerBalanceBefore =
      await ethers.provider.getBalance(seller.address);

    await marketplace
      .connect(buyer)
      .buyItem(nft.target, 1, { value: PRICE });

    const sellerBalanceAfter =
      await ethers.provider.getBalance(seller.address);

    /* Seller receives 97.5% */
    expect(sellerBalanceAfter).to.be.gt(
      sellerBalanceBefore + ethers.parseEther("0.97")
    );

    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("Marketplace owner receives fee", async function () {
    await nft.connect(seller).mint("ipfs://token-uri");

    await nft
      .connect(seller)
      .approve(marketplace.target, 1);

    await marketplace
      .connect(seller)
      .listItem(nft.target, 1, PRICE);

    const ownerBalanceBefore =
      await ethers.provider.getBalance(owner.address);

    await marketplace
      .connect(buyer)
      .buyItem(nft.target, 1, { value: PRICE });

    const ownerBalanceAfter =
      await ethers.provider.getBalance(owner.address);

    expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
  });

  it("Seller can cancel listing", async function () {
    await nft.connect(seller).mint("ipfs://token-uri");

    await nft
      .connect(seller)
      .approve(marketplace.target, 1);

    await marketplace
      .connect(seller)
      .listItem(nft.target, 1, PRICE);

    await marketplace
      .connect(seller)
      .cancelListing(nft.target, 1);

    await expect(
      marketplace.getListing(nft.target, 1)
    ).to.not.be.reverted;

    expect(await nft.ownerOf(1)).to.equal(seller.address);
  });
});
