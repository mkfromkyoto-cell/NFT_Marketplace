// src/pages/AuctionList.jsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";

import FactoryABI from "../abis/CollectionFactory.json";
import AuctionABI from "../abis/GalleryAuction.json";
import GalleryABI from "../abis/GalleryNFT.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function AuctionList() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuctions();
  }, []);

  async function loadAuctions() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_ADDRESS,
        AuctionABI.abi,
        provider
      );

      const auctionCount = Number(
        await auctionContract.auctionCounter()
      );

      const now = Math.floor(Date.now() / 1000);
      const items = [];

      for (let auctionId = 1; auctionId <= auctionCount; auctionId++) {
        let a;
        try {
          a = await auctionContract.auctions(auctionId);
        } catch {
          continue;
        }

        if (a.settled) continue;
        if (Number(a.endTime) <= now) continue;

        // Load NFT metadata
        const nft = new ethers.Contract(
          a.nft,
          GalleryABI.abi,
          provider
        );

        let meta = {};
        try {
          const uri = await nft.tokenURI(a.tokenId);
          const res = await fetch(ipfs(uri));
          const text = await res.text();
          if (!text.startsWith("<")) meta = JSON.parse(text);
        } catch {}

        items.push({
          auctionId,
          nft: a.nft,
          tokenId: Number(a.tokenId),
          name: meta.name || `NFT #${a.tokenId}`,
          image: meta.image ? ipfs(meta.image) : "",
          highestBid: a.highestBid,
          startPrice: a.startPrice,
          endTime: Number(a.endTime),
        });
      }

      setAuctions(items);
    } catch (err) {
      console.error("Failed to load auctions:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading auctions…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-semibold mb-12">
          Live Auctions
        </h1>

        {auctions.length === 0 && (
          <p className="text-gray-500">No active auctions</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {auctions.map((a) => {
            const price =
              a.highestBid > 0n ? a.highestBid : a.startPrice;

            return (
              <div
                key={a.auctionId}
                onClick={() =>
                  navigate(
                    `/auction/${a.auctionId}`
                  )
                }
                className="cursor-pointer bg-[#111827] rounded-2xl overflow-hidden hover:scale-[1.02] transition"
              >
                <div className="aspect-square bg-black">
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-medium truncate">
                    {a.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-400">
                    Highest Bid
                  </p>

                  <p className="text-xl font-semibold">
                    {ethers.formatEther(price)} ETH
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Ends at{" "}
                    {new Date(
                      a.endTime * 1000
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
