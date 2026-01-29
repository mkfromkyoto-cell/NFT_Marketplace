// src/pages/MyNFTs.jsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";

import FactoryABI from "../abis/CollectionFactory.json";
import GalleryABI from "../abis/GalleryNFT.json";
import MarketplaceABI from "../abis/GalleryMarketplace.json";
import NFTCard from "../components/NFTCard";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function MyNFTs() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = (await signer.getAddress()).toLowerCase();

      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        provider
      );

      const market = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        provider
      );

      /* =========================
         LOAD ALL COLLECTIONS
      ========================== */
      const collections = await factory.getAllCollections();
      const ownedNFTs = [];

      for (const collection of collections) {
        const nft = new ethers.Contract(
          collection,
          GalleryABI.abi,
          provider
        );

        let total;
        try {
          total = await nft.tokenCounter();
        } catch {
          continue;
        }

        for (let tokenId = 1; tokenId <= Number(total); tokenId++) {
          let owner;
          try {
            owner = (await nft.ownerOf(tokenId)).toLowerCase();
          } catch {
            continue;
          }

          const listing = await market.listings(collection, tokenId);

          let isOwnedByUser = false;

          // NFT in user's wallet
          if (owner === user) {
            isOwnedByUser = true;
          }

          // NFT in escrow AND still listed by user
          else if (
            owner === import.meta.env.VITE_MARKETPLACE_ADDRESS.toLowerCase() &&
            listing.price > 0n &&
            listing.seller.toLowerCase() === user
          ) {
            isOwnedByUser = true;
          }

          if (!isOwnedByUser) continue;

          /* Metadata */
          let meta = {};
          try {
            const uri = await nft.tokenURI(tokenId);
            const res = await fetch(ipfs(uri));
            const text = await res.text();
            if (!text.startsWith("<")) {
              meta = JSON.parse(text);
            }
          } catch {}

          ownedNFTs.push({
            collection,
            tokenId,
            image: meta.image ? ipfs(meta.image) : "",
            name: meta.name || `NFT #${tokenId}`,
            price: listing.price,
            listed: listing.price > 0n,
          });
        }
      }

      setNfts(ownedNFTs);
    } catch (err) {
      console.error("MyNFTs load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading your collection…
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        You don’t own any artworks yet
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      {/* HEADER */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
          Private Collection
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          My Artworks
        </h1>

        <p className="mt-6 max-w-2xl text-gray-300 leading-relaxed">
          A personal archive of artworks you own or have listed for exhibition.
        </p>
      </section>

      {/* GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
          {nfts.map((nft) => (
            <Link
              key={`${nft.collection}-${nft.tokenId}`}
              to={`/nft/${nft.collection}/${nft.tokenId}`}
              className="group"
            >
              <div className="space-y-4">
                <NFTCard
                  image={nft.image}
                  name={nft.name}
                  price={nft.price}
                  listed={nft.listed}
                />

                <p className="text-sm text-gray-500 group-hover:text-white transition">
                  View Artwork →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
