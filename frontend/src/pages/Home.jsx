import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import FactoryABI from "../abis/CollectionFactory.json";
import GalleryABI from "../abis/GalleryNFT.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function Home() {
  const navigate = useNavigate();

  const [collections, setCollections] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
  }, []);

  async function loadHome() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        provider
      );

      const allCollections = await factory.getAllCollections();
      const featuredCollections = [];
      const artistSet = new Set();

      for (const addr of allCollections) {
        const active = await factory.isCollectionActive(addr);
        if (!active) continue;

        const nft = new ethers.Contract(
          addr,
          GalleryABI.abi,
          provider
        );

        let total;
        try {
          total = await nft.tokenCounter();
        } catch {
          continue;
        }

        if (Number(total) === 0) continue;

        /* Get first artwork as cover */
        let cover = "";
        let artist = "";

        try {
          const uri = await nft.tokenURI(1);
          const res = await fetch(ipfs(uri));
          const text = await res.text();
          if (!text.startsWith("<")) {
            const meta = JSON.parse(text);
            cover = meta.image ? ipfs(meta.image) : "";
          }

          const [receiver] = await nft.royaltyInfo(
            1,
            ethers.parseEther("1")
          );
          artist = receiver.toLowerCase();
          artistSet.add(artist);
        } catch {}

        const name = await nft.name();

        featuredCollections.push({
          address: addr,
          name,
          cover,
          count: Number(total),
          artist,
        });

        if (featuredCollections.length >= 3) break;
      }

      setCollections(featuredCollections);

      /* FEATURED ARTISTS */
      setArtists(Array.from(artistSet).slice(0, 3));
    } catch (err) {
      console.error("Home load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================== */
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      {/* ────────────────
          HERO
      ──────────────── */}
      <section className="relative min-h-[80vh] flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
              Current Exhibition
            </p>

            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
              A Digital Art
              <br />
              Exhibition Space
            </h1>

            <p className="mt-8 text-gray-300 max-w-xl leading-relaxed">
              Discover limited digital artworks curated on-chain.
              Each piece is unique, verifiable, and collected directly
              from the artist.
            </p>

            <div className="mt-10 flex gap-6">
              <button
                onClick={() => navigate("/collections")}
                className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition"
              >
                Enter Exhibition
              </button>

              <button
                onClick={() => navigate("/mint")}
                className="px-6 py-3 rounded-xl border border-gray-600 hover:border-white transition"
              >
                Mint Artwork
              </button>
            </div>
          </div>

          {/* Minimal visual block */}
          <div className="hidden lg:block">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#111827] to-[#020617] shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ────────────────
          FEATURED COLLECTIONS
      ──────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
            Curated
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Featured Collections
          </h2>
        </div>

        {loading && (
          <p className="text-gray-400">
            Loading exhibition…
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {collections.map((c) => (
            <div
              key={c.address}
              onClick={() =>
                navigate(`/collection/${c.address}`)
              }
              className="cursor-pointer group"
            >
              <div className="overflow-hidden rounded-2xl bg-[#111827]">
                {c.cover ? (
                  <img
                    src={c.cover}
                    className="w-full aspect-square object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="aspect-square flex items-center justify-center text-gray-500 text-sm">
                    No Preview
                  </div>
                )}
              </div>

              <div className="mt-6 px-1">
                <h3 className="text-xl font-medium">
                  {c.name}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {c.count} artworks
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────
          FEATURED ARTISTS
      ──────────────── */}
      <section className="bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
              Artists
            </p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Featured Artists
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {artists.map((addr) => (
              <div
                key={addr}
                onClick={() => navigate(`/artist/${addr}`)}
                className="cursor-pointer group"
              >
                <div className="rounded-2xl border border-[#1f2937] bg-[#0b0f19] p-8 hover:border-blue-500 transition">
                  <p className="text-sm font-mono text-gray-400">
                    {addr.slice(0, 6)}…{addr.slice(-4)}
                  </p>

                  <p className="mt-6 text-xs uppercase tracking-widest text-blue-400">
                    View Artist →
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
