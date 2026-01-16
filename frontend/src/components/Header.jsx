import { Link } from "react-router-dom";
import WalletButton from "./WalletButton";

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-[#0b0b0f] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          NFMarket
        </Link>

        <nav className="flex gap-6 text-gray-300">
          <Link to="/" className="hover:text-white">Marketplace</Link>
          <Link to="/mint" className="hover:text-white">Mint</Link>
          <Link to="/my-nfts" className="hover:text-white">My NFTs</Link>
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}

