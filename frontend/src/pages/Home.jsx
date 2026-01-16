import { useEffect, useState } from "react";
import { getReadContracts } from "../utils/getContracts";
import NFTCard from "../components/NFTCard";

export default function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const { marketplace, nft } = await getReadContracts();

      // naive loop for demo (local dev)
      let results = [];
      for (let i = 1; i <= 50; i++) {
        try {
          const listing = await marketplace.getListing(
            nft.target,
            i
          );
          if (listing.price > 0n) {
            const uri = await nft.tokenURI(i);
            const meta = await fetch(
              uri.replace("ipfs://", "https://ipfs.io/ipfs/")
            ).then((r) => r.json());

            results.push({
              tokenId: i,
              price: Number(listing.price) / 1e18,
              image: meta.image.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              ),
              name: meta.name,
            });
          }
        } catch {}
      }
      setItems(results);
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">NFT Marketplace</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((nft) => (
          <NFTCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
    </div>
  );
}
