// src/pages/CreateCollection.jsx
import { useState } from "react";
import { ethers } from "ethers";
import FactoryABI from "../abis/CollectionFactory.json";
import {
  uploadToPinata,
  uploadJSONToPinata,
} from "../utils/pinata";

export default function CreateCollection() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [bannerFile, setBannerFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name || !symbol || !bannerFile) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      /* 1️⃣ Upload banner */
      const bannerURI = await uploadToPinata(bannerFile);

      /* 2️⃣ Upload collection metadata */
      const metadata = {
        name,
        description,
        banner: bannerURI,
      };

      const collectionURI = await uploadJSONToPinata(metadata);

      /* 3️⃣ Call factory */
      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        signer
      );

      const tx = await factory.createCollection(
        name,
        symbol,
        collectionURI
      );
      await tx.wait();

      alert("Collection created successfully!");

      setName("");
      setSymbol("");
      setDescription("");
      setBannerFile(null);
    } catch (err) {
      console.error(err);
      setError("Collection creation failed");
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
          Curatorial Setup
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          Create a Collection
        </h1>

        <p className="mt-6 max-w-2xl text-gray-300 leading-relaxed">
          A collection represents an exhibition space for your artworks.
          Choose its identity carefully — this will define how your art
          is presented to the world.
        </p>
      </section>

      {/* FORM */}
      <section className="max-w-3xl mx-auto px-6 pb-32">
        <div className="space-y-14">
          {/* NAME */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Collection Name
            </label>
            <input
              className="w-full bg-transparent border-b border-gray-700 py-3 text-lg focus:outline-none focus:border-white transition"
              placeholder="e.g. Modern Abstractions"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* SYMBOL */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Symbol
            </label>
            <input
              className="w-full bg-transparent border-b border-gray-700 py-3 text-lg uppercase tracking-widest focus:outline-none focus:border-white transition"
              placeholder="ART"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
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
              placeholder="Describe the concept and intention behind this collection…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* BANNER */}
          <div>
            <label className="block text-sm text-gray-400 mb-4">
              Collection Banner
            </label>

            <div className="relative border border-dashed border-gray-600 rounded-2xl p-10 text-center hover:border-gray-400 transition">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) =>
                  setBannerFile(e.target.files[0])
                }
              />

              <p className="text-gray-300">
                {bannerFile
                  ? bannerFile.name
                  : "Click to upload banner image"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Recommended: wide, minimal composition
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
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 rounded-full bg-white text-black font-medium text-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading
                ? "Creating Collection…"
                : "Create Collection"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
