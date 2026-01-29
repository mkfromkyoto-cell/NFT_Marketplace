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

      /* Reset */
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
    <main className="min-h-screen bg-[#0b0f19] text-white">
      {/* HEADER */}
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
          Artist Studio
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          Mint New Artwork
        </h1>

        <p className="mt-6 max-w-2xl text-gray-300 leading-relaxed">
          Create a new artwork and place it into one of the active
          collections. Each mint permanently records your work on-chain.
        </p>
      </section>

      {/* FORM */}
      <section className="max-w-3xl mx-auto px-6 pb-32">
        <div className="space-y-14">
          {/* COLLECTION */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Select Collection
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full bg-transparent border-b border-gray-700 py-3 text-lg focus:outline-none focus:border-white transition"
            >
              <option value="">Choose collection</option>
              {collections.map((c) => (
                <option
                  key={c.address}
                  value={c.address}
                  className="bg-[#0b0f19]"
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* NAME */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Artwork Title
            </label>
            <input
              className="w-full bg-transparent border-b border-gray-700 py-3 text-lg focus:outline-none focus:border-white transition"
              placeholder="Untitled No. 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full bg-transparent border border-gray-700 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-white transition"
              placeholder="Concept, medium, or artistic intention…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* IMAGE */}
          <div>
            <label className="block text-sm text-gray-400 mb-4">
              Artwork Image
            </label>

            <div className="relative border border-dashed border-gray-600 rounded-2xl p-10 text-center hover:border-gray-400 transition">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) =>
                  setImageFile(e.target.files[0])
                }
              />

              <p className="text-gray-300">
                {imageFile
                  ? imageFile.name
                  : "Click to upload artwork image"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                High-resolution, square format recommended
              </p>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          {/* ACTION */}
          <div className="pt-10">
            <button
              onClick={handleMint}
              disabled={loading}
              className="w-full py-4 rounded-full bg-white text-black font-medium text-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Minting Artwork…" : "Mint Artwork"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
