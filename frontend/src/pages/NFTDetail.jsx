// src/pages/NFTDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import GalleryABI from "../abis/GalleryNFT.json";
import MarketplaceABI from "../abis/GalleryMarketplace.json";
import AuctionABI from "../abis/GalleryAuction.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

function AuctionTimer({ endTime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const diff = endTime * 1000 - now;
  if (diff <= 0) return <span className="text-red-400">Auction ended</span>;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <span className="text-sm text-gray-400">
      Ends in {h}h {m}m {s}s
    </span>
  );
}

export default function NFTDetail() {
  const { collection, tokenId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);
  const [artist, setArtist] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  const [auction, setAuction] = useState(null);
  const [startPrice, setStartPrice] = useState("");
  const [duration, setDuration] = useState("24");
  const [bidAmount, setBidAmount] = useState("");


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

      const auctionContract = new ethers.Contract(
        import.meta.env.VITE_AUCTION_ADDRESS,
        AuctionABI.abi,
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
      // 🔹 find auction
      let found = null;
      const total = await auctionContract.auctionCounter();
      for (let i = 1; i <= Number(total); i++) {
        const a = await auctionContract.auctions(i);
        if (
          a.nft.toLowerCase() === collection.toLowerCase() &&
          Number(a.tokenId) === Number(tokenId) &&
          !a.settled
        ) {
          found = { id: i, ...a };
          break;
        }
      }
      setAuction(found);
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

  /* =========================
     AUCTION
  ========================== */

  async function handleCreateAuction() {
    if (!startPrice || Number(startPrice) <= 0) return alert("Invalid price");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const nftContract = new ethers.Contract(collection, GalleryABI.abi, signer);
    const auctionContract = new ethers.Contract(
      import.meta.env.VITE_AUCTION_ADDRESS,
      AuctionABI.abi,
      signer
    );

    const approved = await nftContract.getApproved(tokenId);
    if (
      approved.toLowerCase() !==
      import.meta.env.VITE_AUCTION_ADDRESS.toLowerCase()
    ) {
      const tx = await nftContract.approve(
        import.meta.env.VITE_AUCTION_ADDRESS,
        tokenId
      );
      await tx.wait();
    }

    const tx = await auctionContract.createAuction(
      collection,
      tokenId,
      ethers.parseEther(startPrice),
      Number(duration) * 3600
    );
    await tx.wait();

    await load();
  }

  async function handleBid() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const auctionContract = new ethers.Contract(
      import.meta.env.VITE_AUCTION_ADDRESS,
      AuctionABI.abi,
      signer
    );

    const tx = await auctionContract.bid(auction.id, {
      value: ethers.parseEther(bidAmount),
    });
    await tx.wait();

    setBidAmount("");
    await load();
  }

  async function handleSettle() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const auctionContract = new ethers.Contract(
      import.meta.env.VITE_AUCTION_ADDRESS,
      AuctionABI.abi,
      signer
    );

    const tx = await auctionContract.settleAuction(auction.id);
    await tx.wait();

    await load();
  }

  async function handleWithdraw() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const auctionContract = new ethers.Contract(
      import.meta.env.VITE_AUCTION_ADDRESS,
      AuctionABI.abi,
      signer
    );

    const tx = await auctionContract.withdraw();
    await tx.wait();
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
  const canList = !isListed && !auction && isOwner;

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
             {auction && (
            <div className="mt-8 p-6 rounded-2xl border border-gray-700 space-y-3">
              <AuctionTimer endTime={Number(auction.endTime)} />
              <p className="text-lg">
                Highest bid:{" "}
                {auction.highestBid > 0n
                  ? `${ethers.formatEther(auction.highestBid)} ETH`
                  : "No bids"}
              </p>

              {Date.now() / 1000 < auction.endTime && (
                <>
                  <input
                    placeholder="Bid ETH"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-transparent border rounded-xl px-4 py-3"
                  />
                  <button
                    onClick={handleBid}
                    className="w-full py-3 rounded-full bg-white text-black"
                  >
                    Place Bid
                  </button>
                </>
              )}

              {Date.now() / 1000 >= auction.endTime && (
                <button
                  onClick={handleSettle}
                  className="w-full py-3 rounded-full border"
                >
                  Settle Auction
                </button>
              )}

              <button
                onClick={handleWithdraw}
                className="text-sm text-gray-400"
              >
                Withdraw ETH
              </button>
            </div>
          )}

          {canList && (
            <div className="mt-8 space-y-3">
              

              <div className="pt-4 border-t border-gray-700 space-y-3">
                <input
                  placeholder="Auction start price (ETH)"
                  value={startPrice}
                  onChange={(e) => setStartPrice(e.target.value)}
                  className="w-full bg-transparent border rounded-xl px-4 py-3"
                />

                <input
                  placeholder="Duration (hours)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-transparent border rounded-xl px-4 py-3"
                />

                <button
                  onClick={handleCreateAuction}
                  className="w-full py-3 rounded-full border"
                >
                  Start Auction
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>
    </main>
  );
}
