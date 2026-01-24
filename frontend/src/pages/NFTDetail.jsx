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

      /* Owner */
      const owner = (await nftContract.ownerOf(tokenId)).toLowerCase();

      /* Listing */
      const listingData = await market.listings(collection, tokenId);

      /* 🎨 Artist (ERC-2981 royalty receiver) */
      try {
        const [receiver] = await nftContract.royaltyInfo(
          tokenId,
          ethers.parseEther("1")
        );
        setArtist(receiver.toLowerCase());
      } catch {
        setArtist("");
      }

      /* Metadata */
      const tokenURI = await nftContract.tokenURI(tokenId);
      let meta = {};
      try {
        const res = await fetch(ipfs(tokenURI));
        const text = await res.text();
        if (!text.startsWith("<")) {
          meta = JSON.parse(text);
        }
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
    return <div className="p-12 text-center">Loading...</div>;
  }

  const isListed = !!listing;
  const isSeller = isListed && listing.seller === user;
  const isOwner = nft.owner === user;

  return (
    <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
      <img
        src={nft.image}
        className="w-full rounded-xl"
        alt={nft.name}
      />

      <div>
        <h1 className="text-3xl font-bold">{nft.name}</h1>

        {/* 🎨 ARTIST */}
        {artist && (
          <p className="mt-2 text-sm text-gray-500">
            Artist:{" "}
            <span
              onClick={() => navigate(`/artist/${artist}`)}
              className="font-mono cursor-pointer text-blue-500 hover:underline"
            >
              {artist.slice(0, 6)}...{artist.slice(-4)}
            </span>
          </p>
        )}  

        {nft.description && (
          <p className="mt-4 text-gray-400">{nft.description}</p>
        )}

        {isListed && (
          <p className="mt-6 text-xl font-semibold">
            {ethers.formatEther(listing.price)} ETH
          </p>
        )}

        {isListed && !isSeller && (
          <button
            onClick={handleBuy}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg"
          >
            Buy NFT
          </button>
        )}

        {isSeller && (
          <button
            onClick={handleCancel}
            className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg"
          >
            Cancel Listing
          </button>
        )}

        {!isListed && isOwner && (
          <div className="mt-6">
            <input
              placeholder="Price in ETH"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border p-3 rounded mb-3"
            />
            <button
              onClick={handleApproveAndList}
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
              List NFT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
