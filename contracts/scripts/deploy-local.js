const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  /* ============================
     DEPLOY MARKETPLACE
  ============================ */
  const Marketplace = await hre.ethers.getContractFactory(
    "GalleryMarketplace"
  );
  const marketplace = await Marketplace.deploy(250); // 2.5% fee
  await marketplace.waitForDeployment();

  console.log(
    "Marketplace deployed to:",
    marketplace.target
  );

  /* ============================
     DEPLOY COLLECTION FACTORY
  ============================ */
  const Factory = await hre.ethers.getContractFactory(
    "CollectionFactory"
  );
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  console.log(
    "CollectionFactory deployed to:",
    factory.target
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
