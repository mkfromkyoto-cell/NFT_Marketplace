import { useEffect, useState } from "react";
import { getReadContracts } from "../utils/getContracts";
import { connectWallet } from "../utils/connectWallet";
import NFTCard from "../components/NFTCard";

export default function MyNFTs() {
  const [items, setItems] = useState([]);

  useEffect(() => {
  async function load() {
    const account = await connectWallet();
    const { nft } = await getReadContracts();

    const total = await nft.tokenCounter();
    let results = [];

    for (let i = 1; i <= total; i++) {
      const owner = await nft.ownerOf(i);

      if (owner.toLowerCase() === account.toLowerCase()) {
        const uri = await nft.tokenURI(i);
        const meta = await fetch(
          uri.replace("ipfs://", "https://ipfs.io/ipfs/")
        ).then((r) => r.json());

        results.push({
          tokenId: i,
          name: meta.name,
          image: meta.image.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          ),
          price: "Owned",
        });
      }
    }

    setItems(results);
  }

  load();
}, []);


  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My NFTs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {items.map((nft) => (
          <NFTCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
    </div>
  );
}
