// src/pages/Navbar.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

export default function Navbar() {
  const [account, setAccount] = useState(null);

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

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold">
        Art Gallery
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <Link to="/collections" className="hover:underline">
          Collections
        </Link>

        <Link to="/mynfts" className="hover:underline">
          My NFTs
        </Link>

        <Link to="/create" className="hover:underline">
          Create Collection
        </Link>

        <Link to="/mint" className="hover:underline">
          Mint NFT
        </Link>

        {/* Wallet */}
        {account ? (
          <span className="px-4 py-2 border rounded text-sm">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
