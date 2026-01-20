// src/utils/contracts.js
import { ethers } from "ethers";
import FactoryABI from "../../../contracts/artifacts/contracts/collectionFactory.sol/CollectionFactory.json";
import GalleryNFTABI from "../../../contracts/artifacts/contracts/GalleryNFT.sol/GalleryNFT.json";

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

export function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export function getFactoryContract(signerOrProvider) {
  return new ethers.Contract(
    FACTORY_ADDRESS,
    FactoryABI.abi,
    signerOrProvider
  );
}

export function getGalleryNFT(address, provider) {
  return new ethers.Contract(
    address,
    GalleryNFTABI.abi,
    provider
  );
}
