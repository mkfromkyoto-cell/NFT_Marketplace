// src/pages/MintNFT.jsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";

import FactoryABI from "../abis/CollectionFactory.json";
import GalleryABI from "../abis/GalleryNFT.json";
import {
  uploadToPinata,
  uploadJSONToPinata,
} from "../utils/pinata";

export default function MintNFT() {
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     LOAD PUBLIC COLLECTIONS
  ========================== */
  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        provider
      );

      const addresses = await factory.getAllCollections();

      const data = await Promise.all(
        addresses.map(async (addr) => {
          const active = await factory.isCollectionActive(addr);
          if (!active) return null;

          const nft = new ethers.Contract(
            addr,
            GalleryABI.abi,
            provider
          );

          const name = await nft.name();

          return {
            address: addr,
            name,
            active,
          };
        })
      );

      setCollections(data.filter(Boolean));
    } catch (err) {
      console.error("Load collections failed:", err);
    }
  }

  /* =========================
     MINT NFT
  ========================== */
  async function handleMint() {
    if (!selected || !name || !description || !imageFile) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      /* Upload image */
      const imageURI = await uploadToPinata(imageFile);

      /* Upload metadata */
      const metadata = {
        name,
        description,
        image: imageURI,
      };

      const tokenURI = await uploadJSONToPinata(metadata);

      /* Mint into selected collection */
      const nft = new ethers.Contract(
        selected,
        GalleryABI.abi,
        signer
      );

      const mintFee = await nft.mintFee();

      const tx = await nft.mint(tokenURI, {
        value: mintFee.toString(),
      });
      await tx.wait();

      /* Reset form */
      setName("");
      setDescription("");
      setImageFile(null);
      setSelected("");

      alert("NFT minted successfully!");
    } catch (err) {
      console.error(err);
      setError("Mint failed. See console.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================== */
  return (
    <div className="min-h-screen bg-[#0b0f19] flex justify-center px-6 py-12">
      <div className="w-full max-w-xl bg-[#121826] rounded-2xl p-8 border border-[#1f2937]">
        <h1 className="text-3xl font-bold text-center mb-8">
          Mint NFT
        </h1>

        {/* COLLECTION SELECT */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400">
            Select Collection
          </span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
          >
            <option value="">Choose collection</option>
            {collections.map((c) => (
              <option key={c.address} value={c.address}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* NAME */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400">
            NFT Name
          </span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {/* DESCRIPTION */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400">
            Description
          </span>
          <textarea
            rows={4}
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {/* IMAGE */}
        <label className="block mb-6">
          <span className="text-sm text-gray-400">
            Image
          </span>
          <input
            type="file"
            accept="image/*"
            className="mt-2 text-sm"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </label>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleMint}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Minting..." : "Mint NFT"}
        </button>
      </div>
    </div>
  );
}
