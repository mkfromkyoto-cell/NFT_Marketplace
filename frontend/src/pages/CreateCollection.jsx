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
        collectionURI,
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

  return (
    <div className="min-h-screen flex justify-center px-4 bg-[#0b0f19]">
      <div className="w-full max-w-xl bg-[#121826] mt-12 rounded-2xl p-8 border border-[#1f2937]">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Collection
        </h1>

        <label className="block mb-4">
          <span className="text-sm text-gray-400">Collection Name</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-400">Symbol</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </label>

        
        <label className="block mb-4">
          <span className="text-sm text-gray-400">Description</span>
          <textarea
            rows={3}
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-gray-400">Banner Image</span>
          <input
            type="file"
            accept="image/*"
            className="mt-2 text-sm"
            onChange={(e) => setBannerFile(e.target.files[0])}
          />
        </label>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Collection"}
        </button>
      </div>
    </div>
  );
}
