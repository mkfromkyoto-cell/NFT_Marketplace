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
    <article className="group space-y-6">
      {/* ARTWORK */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111827]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full aspect-square object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-square flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* LABEL */}
      <div className="px-1 space-y-2">
        <h3 className="text-lg font-medium tracking-tight text-white">
          {name}
        </h3>

        {listed && (
          <p className="text-sm text-gray-400">
            {formatEther(price)} ETH
          </p>
        )}

        {showBuy && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onBuy();
            }}
            className="mt-4 w-full py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition"
          >
            Collect
          </button>
        )}
      </div>
    </article>
  );
}
