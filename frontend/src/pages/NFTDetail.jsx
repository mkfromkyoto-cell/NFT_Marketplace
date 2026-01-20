// src/pages/NFTDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import GalleryABI from "../abis/GalleryNFT.json";
import MarketplaceABI from "../abis/GalleryMarketplace.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function NFTDetail() {
  const { collection, tokenId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);
  const [artist, setArtist] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collection || !tokenId) return;
    load();
  }, [collection, tokenId]);

  async function load() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddr = (await signer.getAddress()).toLowerCase();
      setUser(userAddr);

      const nftContract = new ethers.Contract(
        collection,
        GalleryABI.abi,
        provider
      );

      const market = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        provider
      );

      const owner = (await nftContract.ownerOf(tokenId)).toLowerCase();
      const listingData = await market.listings(collection, tokenId);

      try {
        const [receiver] = await nftContract.royaltyInfo(
          tokenId,
          ethers.parseEther("1")
        );
        setArtist(receiver.toLowerCase());
      } catch {
        setArtist("");
      }

      const tokenURI = await nftContract.tokenURI(tokenId);
      let meta = {};
      try {
        const res = await fetch(ipfs(tokenURI));
        const text = await res.text();
        if (!text.startsWith("<")) meta = JSON.parse(text);
      } catch {}

      setNft({
        name: meta.name || `NFT #${tokenId}`,
        image: meta.image ? ipfs(meta.image) : "",
        description: meta.description || "",
        owner,
      });

      setListing(
        listingData.price > 0n
          ? {
              seller: listingData.seller.toLowerCase(),
              price: listingData.price,
            }
          : null
      );
    } catch (err) {
      console.error("NFT load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveAndList() {
    if (!price || Number(price) <= 0) {
      alert("Enter valid price");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const nftContract = new ethers.Contract(
        collection,
        GalleryABI.abi,
        signer
      );

      const market = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        signer
      );

      const approved = await nftContract.getApproved(tokenId);
      if (
        approved.toLowerCase() !==
        import.meta.env.VITE_MARKETPLACE_ADDRESS.toLowerCase()
      ) {
        const txApprove = await nftContract.approve(
          import.meta.env.VITE_MARKETPLACE_ADDRESS,
          tokenId
        );
        await txApprove.wait();
      }

      const tx = await market.listItem(
        collection,
        tokenId,
        ethers.parseEther(price)
      );
      await tx.wait();

      await load();
    } catch (err) {
      console.error("Listing failed:", err);
    }
  }

  async function handleBuy() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const market = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        signer
      );

      const tx = await market.buyItem(collection, tokenId, {
        value: listing.price,
      });
      await tx.wait();

      navigate("/mynfts");
    } catch (err) {
      console.error("Buy failed:", err);
    }
  }

  async function handleCancel() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const market = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        signer
      );

      const tx = await market.cancelListing(collection, tokenId);
      await tx.wait();

      await load();
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  }

  if (loading || !nft) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading artwork…
      </div>
    );
  }

  const isListed = !!listing;
  const isSeller = isListed && listing.seller === user;
  const isOwner = nft.owner === user;

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-20">

        {/* ARTWORK */}
        <div className="flex justify-center items-start">
          <div className="w-full max-w-xl">
            <div className="overflow-hidden rounded-3xl bg-[#111827] shadow-2xl">
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full object-contain"
                />
              ) : (
                <div className="aspect-square flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LABEL */}
        <div className="flex flex-col justify-start">

          <p className="text-xs uppercase tracking-widest text-gray-400">
            Artwork
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {nft.name}
          </h1>

          {artist && (
            <p className="mt-3 text-sm text-gray-400">
              Artist: {" "}
              <span
                onClick={() => navigate(`/artist/${artist}`)}
                className="cursor-pointer font-mono text-blue-400 hover:underline"
              >
                {artist.slice(0, 6)}…{artist.slice(-4)}
              </span>
            </p>
          )}

          <div className="mt-6 h-px w-20 bg-gray-700" />

          {nft.description && (
            <p className="mt-6 max-w-xl text-gray-300 leading-relaxed">
              {nft.description}
            </p>
          )}

          <div className="mt-8 space-y-1 text-sm text-gray-500">
            <p>Edition: 1 of 1</p>
            <p>Contract: {collection.slice(0, 6)}…</p>
          </div>

          {isListed && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Available
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {ethers.formatEther(listing.price)} ETH
              </p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-12 space-y-4 max-w-sm">

            {isListed && !isSeller && (
              <button
                onClick={handleBuy}
                className="w-full py-4 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition"
              >
                Collect Artwork
              </button>
            )}

            {isSeller && (
              <button
                onClick={handleCancel}
                className="w-full py-4 rounded-full border border-red-500 text-red-400 hover:bg-red-500/10 transition"
              >
                Remove from Exhibition
              </button>
            )}

            {!isListed && isOwner && (
              <div className="space-y-3">
                <input
                  placeholder="Price in ETH"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-white"
                />
                <button
                  onClick={handleApproveAndList}
                  className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700 transition"
                >
                  Exhibit for Collection
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
