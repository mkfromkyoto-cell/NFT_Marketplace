// src/pages/CollectionDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";

import GalleryABI from "../abis/GalleryNFT.json";
import MarketplaceABI from "../abis/GalleryMarketplace.json";
import NFTCard from "../components/NFTCard";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function CollectionDetail({ mine = false }) {
  const { address } = useParams();

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    load();
  }, [address, mine]);

  async function load() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = (await signer.getAddress()).toLowerCase();

      const nft = new ethers.Contract(
        address,
        GalleryABI.abi,
        provider
      );

      const market = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        MarketplaceABI.abi,
        provider
      );

      const total = Number(await nft.tokenCounter());
      const items = [];

      for (let tokenId = 1; tokenId <= total; tokenId++) {
        let owner;
        try {
          owner = (await nft.ownerOf(tokenId)).toLowerCase();
        } catch {
          continue;
        }

        const listing = await market.listings(
          address,
          tokenId
        );

        // PUBLIC COLLECTION → only listed NFTs
        if (!mine && listing.price === 0n) continue;

        // MY COLLECTION → only NFTs still owned by user
        if (mine && owner !== user) continue;

        let meta = {};
        try {
          const uri = await nft.tokenURI(tokenId);
          meta = await fetch(ipfs(uri)).then((r) =>
            r.json()
          );
        } catch {}

        items.push({
          tokenId,
          image: meta.image ? ipfs(meta.image) : "",
          name: meta.name || `NFT #${tokenId}`,
          price: listing.price,
          listed: listing.price > 0n,
        });
      }

      setNfts(items);
    } catch (err) {
      console.error("Collection load failed:", err);
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
        Loading collection…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      {/* HEADER */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
          {mine ? "Artist Archive" : "Current Exhibition"}
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          {mine ? "My Collection" : "Collection"}
        </h1>

        <p className="mt-4 text-sm text-gray-500 font-mono">
          {address}
        </p>
      </section>

      {/* GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {nfts.length === 0 ? (
          <p className="text-gray-500">
            {mine
              ? "You don’t have any artworks here yet."
              : "No artworks are currently exhibited."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-24">
            {nfts.map((nft) => (
              <Link
                key={nft.tokenId}
                to={`/nft/${address}/${nft.tokenId}`}
                className="group"
              >
                <NFTCard {...nft} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
