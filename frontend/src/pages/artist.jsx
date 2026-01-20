import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import FactoryABI from "../abis/CollectionFactory.json";
import GalleryABI from "../abis/GalleryNFT.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function Artist() {
  const { address } = useParams();
  const navigate = useNavigate();

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtistNFTs();
  }, [address]);

  async function loadArtistNFTs() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        provider
      );

      const collections = await factory.getAllCollections();

      const found = [];

      for (const collectionAddr of collections) {
        const active = await factory.isCollectionActive(collectionAddr);
        if (!active) continue;

        const nft = new ethers.Contract(
          collectionAddr,
          GalleryABI.abi,
          provider
        );

        const total = await nft.tokenCounter();

        for (let i = 1; i <= Number(total); i++) {
          try {
            const [receiver] = await nft.royaltyInfo(
              i,
              ethers.parseEther("1")
            );

            if (receiver.toLowerCase() !== address.toLowerCase()) continue;

            const tokenURI = await nft.tokenURI(i);
            let meta = {};

            try {
              const res = await fetch(ipfs(tokenURI));
              const text = await res.text();
              if (!text.startsWith("<")) {
                meta = JSON.parse(text);
              }
            } catch {}

            found.push({
              collection: collectionAddr,
              tokenId: i,
              name: meta.name || `NFT #${i}`,
              image: meta.image ? ipfs(meta.image) : "",
            });
          } catch {}
        }
      }

      setNfts(found);
    } catch (err) {
      console.error("Artist load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Artist</h1>
      <p className="text-gray-500 font-mono mb-8">
        {address}
      </p>

      {loading && <p>Loading artworks...</p>}

      {!loading && nfts.length === 0 && (
        <p className="text-gray-400">No artworks found</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <div
            key={`${nft.collection}-${nft.tokenId}`}
            onClick={() =>
              navigate(
                `/nft/${nft.collection}/${nft.tokenId}`
              )
            }
            className="cursor-pointer bg-[#121826] border border-[#1f2937] rounded-xl overflow-hidden hover:scale-[1.02] transition"
          >
            {nft.image && (
              <img
                src={nft.image}
                className="w-full h-64 object-cover"
                alt={nft.name}
              />
            )}

            <div className="p-4">
              <h3 className="font-semibold">{nft.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                #{nft.tokenId}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
