import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getReadContracts, getWriteContracts } from "../utils/getContracts";
import { ethers } from "ethers";

export default function Item() {
  const { id } = useParams();
  const [nftData, setNftData] = useState(null);

  useEffect(() => {
    async function load() {
      const { nft, marketplace } = await getReadContracts();
      const uri = await nft.tokenURI(id);
      const meta = await fetch(
        uri.replace("ipfs://", "https://ipfs.io/ipfs/")
      ).then((r) => r.json());

      const listing = await marketplace.getListing(
        nft.target,
        id
      );

      setNftData({
        image: meta.image.replace(
          "ipfs://",
          "https://ipfs.io/ipfs/"
        ),
        name: meta.name,
        description: meta.description,
        price: Number(listing.price) / 1e18,
      });
    }
    load();
  }, [id]);

  async function buy() {
    const { marketplace, nft } = await getWriteContracts();
    await marketplace.buyItem(nft.target, id, {
      value: ethers.parseEther(nftData.price.toString()),
    });
    alert("Purchased!");
  }

  if (!nftData) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
      <img
        src={nftData.image}
        className="rounded-2xl border border-[#273043]"
      />

      <div>
        <h1 className="text-3xl font-bold">{nftData.name}</h1>
        <p className="text-gray-400 mt-4">
          {nftData.description}
        </p>

        <p className="text-xl font-semibold mt-6">
          {nftData.price} ETH
        </p>

        <button
          onClick={buy}
          className="mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
