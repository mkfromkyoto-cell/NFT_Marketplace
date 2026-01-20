// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

export default function Navbar() {
  const [account, setAccount] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    if (!window.ethereum) return;

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  }

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "text-white"
      : "text-gray-400 hover:text-white";

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-[#0b0f19]/80 border-b border-[#1f2937]">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-wide hover:opacity-80 transition"
        >
          Art Gallery
        </Link>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-10 text-sm">
          <Link to="/collections" className={isActive("/collections")}>
            Exhibitions
          </Link>

          <Link to="/mynfts" className={isActive("/mynfts")}>
            My Artworks
          </Link>

          <Link to="/create" className={isActive("/create")}>
            Create Exhibition
          </Link>

          <Link to="/mint" className={isActive("/mint")}>
            Mint
          </Link>
        </div>

        {/* WALLET */}
        <div className="flex items-center gap-4">
          {account ? (
            <Link
              to={`/artist/${account}`}
              className="px-4 py-2 rounded-xl border border-[#1f2937] text-sm font-mono text-gray-300 hover:border-gray-500 transition"
            >
              {account.slice(0, 6)}…{account.slice(-4)}
            </Link>
          ) : (
            <button
              onClick={connectWallet}
              className="px-6 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-200 transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
