import { Link } from "react-router-dom";

export default function NFTCard({ nft }) {
  return (
    <Link
      to={`/item/${nft.tokenId}`}
      className="bg-[#121826] border border-[#273043] rounded-2xl overflow-hidden hover:scale-[1.02] transition"
    >
      <img
        src={nft.image}
        alt=""
        className="h-56 w-full object-cover"
      />

      <div className="p-4">
        <h3 className="font-semibold">{nft.name}</h3>
        <p className="text-sm text-gray-400">
          {nft.price} ETH
        </p>
      </div>
    </Link>
  );
}
