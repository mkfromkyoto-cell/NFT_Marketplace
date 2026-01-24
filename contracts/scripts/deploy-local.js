const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  /* Marketplace */
  const Marketplace = await hre.ethers.getContractFactory("GalleryMarketplace");
  const marketplace = await Marketplace.deploy(250); // 2.5%
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await marketplace.getAddress());

  /* Factory */
  const Factory = await hre.ethers.getContractFactory("CollectionFactory");
  const factory = await Factory.deploy(deployer.address); // ✅ FIX
  await factory.waitForDeployment();
  console.log("Factory deployed to:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});