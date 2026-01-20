// src/pages/Collections.jsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import FactoryABI from "../abis/CollectionFactory.json";
import GalleryABI from "../abis/GalleryNFT.json";
import { Link } from "react-router-dom";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        provider
      );

      const addresses = await factory.getAllCollections();

      const data = await Promise.all(
        addresses.map(async (addr) => {
          const disabled =
            await factory.disabledCollections(addr);

          // 🚫 HIDE DELETED COLLECTIONS
          if (disabled) return null;

          const nft = new ethers.Contract(
            addr,
            GalleryABI.abi,
            provider
          );

          const [name, uri] = await Promise.all([
            nft.name(),
            nft.collectionURI(),
          ]);

          let meta = {};
          if (uri) {
            try {
              meta = await fetch(ipfs(uri)).then((r) =>
                r.json()
              );
            } catch {}
          }

          return {
            address: addr,
            name,
            banner: meta.banner
              ? ipfs(meta.banner)
              : "",
            description: meta.description || "",
          };
        })
      );

      setCollections(data.filter(Boolean));
    } catch (err) {
      console.error("Collections load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading collections...</div>;
  }

  if (collections.length === 0) {
    return (
      <div className="p-8 text-gray-500">
        No collections available
      </div>
    );
  }

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {collections.map((c) => (
        <Link
          key={c.address}
          to={`/collection/${c.address}`}
          className="border rounded-xl overflow-hidden hover:shadow-lg transition"
        >
          {c.banner ? (
            <img
              src={c.banner}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="h-40 bg-gray-200 flex items-center justify-center">
              No Banner
            </div>
          )}

          <div className="p-4">
            <h2 className="font-bold text-lg">{c.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {c.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
