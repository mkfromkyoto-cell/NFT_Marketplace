const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  /* =========================
     MARKETPLACE
  ========================== */

  const Marketplace = await hre.ethers.getContractFactory(
    "GalleryMarketplace"
  );

  // 250 = 2.5% marketplace fee
  const marketplace = await Marketplace.deploy(250);
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log("GalleryMarketplace deployed to:", marketplaceAddress);

  /* =========================
     AUCTION
  ========================== */

  const Auction = await hre.ethers.getContractFactory(
    "GalleryAuction"
  );

  // 250 = 2.5% auction marketplace fee
  const auction = await Auction.deploy(250);
  await auction.waitForDeployment();

  const auctionAddress = await auction.getAddress();
  console.log("GalleryAuction deployed to:", auctionAddress);

  /* =========================
     COLLECTION FACTORY
  ========================== */

  const Factory = await hre.ethers.getContractFactory(
    "CollectionFactory"
  );

  // Platform = deployer (receives mint fees)
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("CollectionFactory deployed to:", factoryAddress);

  /* =========================
     SUMMARY
  ========================== */

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Marketplace:", marketplaceAddress);
  console.log("Auction:    ", auctionAddress);
  console.log("Factory:    ", factoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
