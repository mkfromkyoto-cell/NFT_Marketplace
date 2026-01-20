const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mint fees + ERC2981 royalties", function () {
  let factory, marketplace;
  let collection;
  let owner, artist, minter, buyer;

  const ROYALTY_BPS = 500; // 5%
  const MINT_FEE = ethers.parseEther("0.01");
  const PRICE = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, artist, minter, buyer] = await ethers.getSigners();

    /* =========================
       DEPLOY FACTORY
    ========================== */
    const Factory = await ethers.getContractFactory("CollectionFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    /* =========================
       DEPLOY MARKETPLACE
    ========================== */
    const Marketplace =
      await ethers.getContractFactory("GalleryMarketplace");
    marketplace = await Marketplace.deploy(250); // 2.5%
    await marketplace.waitForDeployment();

    /* =========================
       CREATE COLLECTION
    ========================== */
    const tx = await factory.connect(artist).createCollection(
      "Art",
      "ART",
      "ipfs://collection",
      ROYALTY_BPS,
      MINT_FEE
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(l => l.fragment?.name === "CollectionCreated");
    const collectionAddr = event.args.collection;

    collection = await ethers.getContractAt(
      "GalleryNFT",
      collectionAddr
    );
  });

  /* =========================
     MINT FEE
  ========================== */
  it("requires mint fee", async function () {
    await expect(
      collection.connect(minter).mint("ipfs://token")
    ).to.be.revertedWith("Incorrect mint fee");
  });

  it("sends mint fee to artist", async function () {
    const before = await ethers.provider.getBalance(artist.address);

    await collection.connect(minter).mint(
      "ipfs://token",
      { value: MINT_FEE }
    );

    const after = await ethers.provider.getBalance(artist.address);
    expect(after - before).to.equal(MINT_FEE);
  });

  /* =========================
     ERC2981
  ========================== */
  it("returns correct royalty info", async function () {
    await collection.connect(minter).mint(
      "ipfs://token",
      { value: MINT_FEE }
    );

    const [receiver, amount] =
      await collection.royaltyInfo(1, PRICE);

    expect(receiver).to.equal(artist.address);
    expect(amount).to.equal(
      PRICE * BigInt(ROYALTY_BPS) / 10_000n
    );
  });

  /* =========================
     SALE + ROYALTIES
  ========================== */
  it("pays seller, artist royalty, and marketplace fee", async function () {
    /* Mint */
    await collection.connect(minter).mint(
      "ipfs://token",
      { value: MINT_FEE }
    );

    /* Approve + list */
    await collection.connect(minter).approve(
      marketplace.target,
      1
    );

    await marketplace.connect(minter).listItem(
      collection.target,
      1,
      PRICE
    );

    const artistBefore =
      await ethers.provider.getBalance(artist.address);
    const sellerBefore =
      await ethers.provider.getBalance(minter.address);

    /* Buy */
    await marketplace.connect(buyer).buyItem(
      collection.target,
      1,
      { value: PRICE }
    );

    const artistAfter =
      await ethers.provider.getBalance(artist.address);
    const sellerAfter =
      await ethers.provider.getBalance(minter.address);

    const royalty =
      PRICE * BigInt(ROYALTY_BPS) / 10_000n;
    const marketFee =
      PRICE * 250n / 10_000n;
    const sellerAmount =
      PRICE - royalty - marketFee;

    expect(artistAfter - artistBefore).to.equal(royalty);
    expect(sellerAfter - sellerBefore).to.equal(sellerAmount);

    expect(await collection.ownerOf(1))
      .to.equal(buyer.address);
  });
});
