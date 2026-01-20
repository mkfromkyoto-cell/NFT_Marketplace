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
    load();
  }, [address, mine]);

  async function load() {
    setLoading(true);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const user = (await signer.getAddress()).toLowerCase();

    const nft = new ethers.Contract(address, GalleryABI.abi, provider);
    const market = new ethers.Contract(
      import.meta.env.VITE_MARKETPLACE_ADDRESS,
      MarketplaceABI.abi,
      provider
    );

    const total = Number(await nft.tokenCounter());
    const items = [];

    for (let tokenId = 1; tokenId <= total; tokenId++) {
      const owner = (await nft.ownerOf(tokenId)).toLowerCase();
      const listing = await market.listings(address, tokenId);

      // PUBLIC COLLECTION → only listed
      if (!mine && listing.price === 0n) continue;

      // MY COLLECTION → only NFTs still owned by artist
      if (mine && owner !== user) continue;

      const uri = await nft.tokenURI(tokenId);
      let meta = {};
      try {
        meta = await fetch(ipfs(uri)).then((r) => r.json());
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
    setLoading(false);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <Link
          key={nft.tokenId}
          to={`/nft/${address}/${nft.tokenId}`}
        >
          <NFTCard {...nft} />
        </Link>
      ))}
    </div>
  );
}
