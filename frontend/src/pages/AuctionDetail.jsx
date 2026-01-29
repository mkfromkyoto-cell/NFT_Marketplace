import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import AuctionABI from "../abis/GalleryAuction.json";
import GalleryABI from "../abis/GalleryNFT.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

/* ---------- SAFE FORMATTER ---------- */
const formatETH = (value) => {
  if (value === null || value === undefined) return "0";
  try {
    return ethers.formatEther(value);
  } catch {
    return "0";
  }
};

export default function AuctionDetail() {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [nft, setNft] = useState(null);
  const [user, setUser] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD AUCTION ---------- */
  useEffect(() => {
    if (!auctionId) return;
    load();
  }, [auctionId]);

  /* ---------- COUNTDOWN ---------- */
  useEffect(() => {
    if (!auction) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(auction.endTime - now, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  async function load() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddr = (await signer.getAddress()).toLowerCase();
      setUser(userAddr);

      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_ADDRESS,
        AuctionABI.abi,
        provider
      );

      const a = await auctionContract.auctions(auctionId);

      if (!a || a.seller === ethers.ZeroAddress) {
        navigate("/auctions");
        return;
      }

      /* ---------- NORMALIZE AUCTION ---------- */
      const normalizedAuction = {
        auctionId,
        seller: a.seller.toLowerCase(),
        nft: a.nft,
        tokenId: a.tokenId,
        startPrice: BigInt(a.startPrice ?? 0),
        highestBid: BigInt(a.highestBid ?? 0),
        highestBidder: a.highestBidder
          ? a.highestBidder.toLowerCase()
          : ethers.ZeroAddress,
        endTime: Number(a.endTime),
        settled: a.settled,
      };

      setAuction(normalizedAuction);

      /* ---------- LOAD NFT ---------- */
      const nftContract = new ethers.Contract(
        a.nft,
        GalleryABI.abi,
        provider
      );

      let meta = {};
      try {
        const uri = await nftContract.tokenURI(a.tokenId);
        const res = await fetch(ipfs(uri));
        const text = await res.text();
        if (!text.startsWith("<")) meta = JSON.parse(text);
      } catch {}

      setNft({
        name: meta.name || `NFT #${a.tokenId}`,
        image: meta.image ? ipfs(meta.image) : "",
        description: meta.description || "",
      });
    } catch (err) {
      console.error("Auction load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- ACTIONS ---------- */
  async function placeBid() {
    if (!bidAmount || Number(bidAmount) <= 0) {
      alert("Enter valid bid amount");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_ADDRESS,
        AuctionABI.abi,
        signer
      );

      const tx = await auctionContract.bid(auctionId, {
        value: ethers.parseEther(bidAmount),
      });

      await tx.wait();
      setBidAmount("");
      await load();
    } catch (err) {
      console.error("Bid failed:", err);
      alert("Bid failed");
    }
  }

  async function settle() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_ADDRESS,
        AuctionABI.abi,
        signer
      );

      const tx = await auctionContract.settleAuction(auctionId);
      await tx.wait();

      navigate("/auctions");
    } catch (err) {
      console.error("Settle failed:", err);
    }
  }

  async function withdraw() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_ADDRESS,
        AuctionABI.abi,
        signer
      );

      const tx = await auctionContract.withdraw();
      await tx.wait();

      alert("Withdraw successful");
    } catch (err) {
      console.error("Withdraw failed:", err);
    }
  }

  /* ---------- STATES ---------- */
  if (loading || !auction || !nft) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading auction…
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const ended = now >= auction.endTime;
  const isSeller = auction.seller === user;

  const displayPrice =
    auction.highestBid > 0n
      ? auction.highestBid
      : auction.startPrice;

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <section className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* IMAGE */}
        <div className="rounded-3xl overflow-hidden bg-[#111827]">
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

        {/* INFO */}
        <div>
          <h1 className="text-4xl font-semibold">
            {nft.name}
          </h1>

          {nft.description && (
            <p className="mt-6 text-gray-300">
              {nft.description}
            </p>
          )}

          <div className="mt-10">
            <p className="text-sm text-gray-400">
              Highest Bid
            </p>
            <p className="text-3xl font-semibold">
              {formatETH(displayPrice)} ETH
            </p>
          </div>

          <div className="mt-6 text-sm text-gray-400">
            {ended ? (
              <span className="text-red-400">
                Auction ended
              </span>
            ) : (
              <span>
                Ends in{" "}
                <strong>
                  {Math.floor(timeLeft / 3600)}h{" "}
                  {Math.floor((timeLeft % 3600) / 60)}m{" "}
                  {timeLeft % 60}s
                </strong>
              </span>
            )}
          </div>

          {/* ACTIONS */}
          <div className="mt-10 space-y-4 max-w-sm">

            {!ended && (
              <>
                <input
                  placeholder="Bid amount (ETH)"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full bg-transparent border border-gray-700 rounded-xl px-4 py-3"
                />

                <button
                  onClick={placeBid}
                  className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700"
                >
                  Place Bid
                </button>
              </>
            )}

            {ended && isSeller && !auction.settled && (
              <button
                onClick={settle}
                className="w-full py-4 rounded-full bg-green-600 hover:bg-green-700"
              >
                Settle Auction
              </button>
            )}

            <button
              onClick={withdraw}
              className="w-full py-3 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-700/20"
            >
              Withdraw Balance
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
