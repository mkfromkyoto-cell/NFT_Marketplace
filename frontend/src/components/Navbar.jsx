import { Link } from "react-router-dom";
import { connectWallet } from "../utils/connectWallet";
import { useState } from "react";

export default function Navbar() {
  const [account, setAccount] = useState(null);

  async function handleConnect() {
    const acc = await connectWallet();
    setAccount(acc);
  }

  return (
    <nav className="w-full px-6 py-4 bg-[#0b0f19] border-b border-[#1f2937] flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">
        NFT Marketplace
      </Link>

      <div className="flex gap-6 items-center">
        <Link to="/">Marketplace</Link>
        <Link to="/my-nfts">My NFTs</Link>
        <Link to="/mint">Mint</Link>

        <button
          onClick={handleConnect}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          {account
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect"}
        </button>
      </div>
    </nav>
  );
}
