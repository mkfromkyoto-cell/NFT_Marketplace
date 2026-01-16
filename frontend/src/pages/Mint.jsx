import { useState } from "react";
import { ethers } from "ethers";
import { getWriteContracts } from "../utils/getContracts";
import {
  uploadImageToPinata,
  uploadMetadataToPinata,
} from "../utils/pinata";

export default function Mint() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMint() {
    if (!name || !description || !price || !imageFile) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      /* 1️⃣ Upload image */
      const imageURI = await uploadImageToPinata(imageFile);

      /* 2️⃣ Upload metadata */
      const metadata = {
        name,
        description,
        image: imageURI,
      };
      const tokenURI = await uploadMetadataToPinata(metadata);

      /* 3️⃣ Mint NFT (ANYONE can mint) */
      const { nft, marketplace } = await getWriteContracts();

      const mintTx = await nft.mint(tokenURI);
      const receipt = await mintTx.wait();

      const transferEvent = receipt.logs.find(
        (log) => log.fragment?.name === "Transfer"
      );
      const tokenId = transferEvent.args.tokenId;

      /* 4️⃣ Approve marketplace */
      const approveTx = await nft.approve(
        marketplace.target,
        tokenId
      );
      await approveTx.wait();

      /* 5️⃣ List NFT */
      const listTx = await marketplace.listItem(
        nft.target,
        tokenId,
        ethers.parseEther(price)
      );
      await listTx.wait();

      /* 6️⃣ Reset */
      setName("");
      setDescription("");
      setPrice("");
      setImageFile(null);

      alert("NFT minted and listed successfully!");
    } catch (err) {
      console.error(err);
      setError("Minting failed. See console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0f19]">
      <div className="w-full max-w-lg bg-[#121826] rounded-2xl p-8 shadow-xl border border-[#1f2937]">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Mint New NFT
        </h1>

        <label className="block mb-4">
          <span className="text-sm text-gray-400">NFT Name</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-400">Description</span>
          <textarea
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-400">Price (ETH)</span>
          <input
            type="number"
            step="0.001"
            className="mt-1 w-full p-3 rounded-xl bg-[#0b0f19] border border-[#273043]"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-gray-400">Image</span>
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
          className="w-full py-3 rounded-xl bg-blue-600 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Minting..." : "Mint & List NFT"}
        </button>
      </div>
    </div>
  );
}
