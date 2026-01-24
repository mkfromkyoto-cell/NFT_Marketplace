import { formatEther } from "ethers";

export default function NFTCard({
  image,
  name,
  price,
  listed,
  showBuy,
  onBuy,
}) {
  return (
    <div className="border rounded-xl overflow-hidden hover:shadow-lg transition">
      <img
        src={image}
        className="h-56 w-full object-cover"
        alt={name}
      />

      <div className="p-4">
        <h3 className="font-bold">{name}</h3>

        {listed && (
          <p className="mt-2 font-semibold">
            {formatEther(price)} ETH
          </p>
        )}

        {showBuy && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onBuy();
            }}
            className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Buy
          </button>
        )}
      </div>
    </div>
  );
}
