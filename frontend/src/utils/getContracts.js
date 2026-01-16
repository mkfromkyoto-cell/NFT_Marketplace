import { ethers } from "ethers";
import NFTAbi from "../../../contracts/artifacts/contracts/NFT.sol/NFT.json";
import MarketplaceAbi from "../../../contracts/artifacts/contracts/Marketplace.sol/Marketplace.json";
const NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS;
const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

/* ============================
   PROVIDER
============================ */
function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/* ============================
   READ-ONLY CONTRACTS
============================ */
export async function getReadContracts() {
  const provider = getProvider();

  const nft = new ethers.Contract(
    NFT_ADDRESS,
    NFTAbi.abi,
    provider
  );

  const marketplace = new ethers.Contract(
    MARKETPLACE_ADDRESS,
    MarketplaceAbi.abi,
    provider
  );

  return { nft, marketplace };
}

/* ============================
   WRITE CONTRACTS (SIGNER)
============================ */
export async function getWriteContracts() {
  const provider = getProvider();
  const signer = await provider.getSigner();

  const nft = new ethers.Contract(
    NFT_ADDRESS,
    NFTAbi.abi,
    signer
  );

  const marketplace = new ethers.Contract(
    MARKETPLACE_ADDRESS,
    MarketplaceAbi.abi,
    signer
  );

  return { nft, marketplace, signer };
}
