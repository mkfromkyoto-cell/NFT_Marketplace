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

  /* =========================
     UI
  ========================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading exhibitions…
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No exhibitions available
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      {/* HEADER */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
          Current Exhibitions
        </p>

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Explore Curated Collections
        </h1>

        <p className="mt-6 max-w-2xl text-gray-300 leading-relaxed">
          Each collection is an exhibition space curated by its artist.
          Discover artworks thoughtfully presented — never overcrowded.
        </p>
      </section>

      {/* EXHIBITION GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
          {collections.map((c) => (
            <Link
              key={c.address}
              to={`/collection/${c.address}`}
              className="group"
            >
              <div className="overflow-hidden rounded-2xl bg-[#111827]">
                {/* BANNER */}
                {c.banner ? (
                  <img
                    src={c.banner}
                    alt={c.name}
                    className="w-full h-56 object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-56 bg-[#1f2937] flex items-center justify-center text-gray-500 text-sm">
                    No Banner
                  </div>
                )}

                {/* INFO */}
                <div className="p-6">
                  <h2 className="text-xl font-medium">
                    {c.name}
                  </h2>

                  {c.description && (
                    <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">
                      {c.description}
                    </p>
                  )}

                  <p className="mt-6 text-sm text-gray-500 group-hover:text-white transition">
                    View Exhibition →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
