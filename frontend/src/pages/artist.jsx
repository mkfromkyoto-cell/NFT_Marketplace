import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import FactoryABI from "../abis/CollectionFactory.json";
import GalleryABI from "../abis/GalleryNFT.json";

const ipfs = (u) =>
  u?.replace("ipfs://", "https://ipfs.io/ipfs/");

export default function Artist() {
  const { address } = useParams();
  const navigate = useNavigate();

  const [nfts, setNfts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    artworks: 0,
    collections: 0,
  });

  /* =========================
     LOAD CONNECTED USER
  ========================== */
  async function loadUser() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setUser(addr.toLowerCase());
    } catch {
      setUser(null);
    }
  }

  /* =========================
     LOAD ARTIST PROFILE
  ========================== */
  async function loadProfile() {
    try {
      const uri = localStorage.getItem(
        `artist-profile-${address.toLowerCase()}`
      );
      if (!uri) return;

      const res = await fetch(ipfs(uri));
      const data = await res.json();
      setProfile(data);
    } catch {
      console.warn("Profile load failed");
    }
  }

  /* =========================
     LOAD ARTIST NFTS
  ========================== */
  async function loadArtistNFTs() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const factory = new ethers.Contract(
        import.meta.env.VITE_FACTORY_ADDRESS,
        FactoryABI.abi,
        provider
      );

      const collections = await factory.getAllCollections();
      const found = [];

      for (const collectionAddr of collections) {
        const active = await factory.isCollectionActive(collectionAddr);
        if (!active) continue;

        const nft = new ethers.Contract(
          collectionAddr,
          GalleryABI.abi,
          provider
        );

        let total;
        try {
          total = await nft.tokenCounter();
        } catch {
          continue;
        }

        for (let i = 1; i <= Number(total); i++) {
          try {
            const [receiver] = await nft.royaltyInfo(
              i,
              ethers.parseEther("1")
            );

            if (
              receiver.toLowerCase() !== address.toLowerCase()
            )
              continue;

            const tokenURI = await nft.tokenURI(i);
            let meta = {};

            try {
              const res = await fetch(ipfs(tokenURI));
              const text = await res.text();
              if (!text.startsWith("<")) {
                meta = JSON.parse(text);
              }
            } catch {}

            found.push({
              collection: collectionAddr,
              tokenId: i,
              name: meta.name || `NFT #${i}`,
              image: meta.image ? ipfs(meta.image) : "",
            });
          } catch {}
        }
      }

      setNfts(found);

      /* ── ARTIST STATS ── */
      const uniqueCollections = new Set(
        found.map((n) => n.collection.toLowerCase())
      );

      setStats({
        artworks: found.length,
        collections: uniqueCollections.size,
      });
    } catch (err) {
      console.error("Artist load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    loadProfile();
    loadArtistNFTs();
  }, [address]);

  /* =========================
     UI
  ========================== */
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">

        {/* ────────────────
            ARTIST HEADER
        ──────────────── */}
        <section className="flex flex-col md:flex-row gap-10 mb-20">

          {/* Avatar */}
          <div>
            {profile?.avatar ? (
              <img
                src={ipfs(profile.avatar)}
                className="w-32 h-32 rounded-full object-cover border border-[#1f2937]"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#111827] flex items-center justify-center text-gray-500 text-sm">
                No Avatar
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight">
              {profile?.name || "Artist"}
            </h1>

            <p className="mt-2 text-sm font-mono text-gray-500">
              {address}
            </p>

            {profile?.bio && (
              <p className="mt-6 text-gray-300 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* STATS */}
            <div className="mt-8 flex gap-12">
              <div>
                <p className="text-2xl font-semibold">
                  {stats.artworks}
                </p>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Artworks
                </p>
              </div>

              <div>
                <p className="text-2xl font-semibold">
                  {stats.collections}
                </p>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Collections
                </p>
              </div>
            </div>

            {/* Edit */}
            {user === address.toLowerCase() && (
              <button
                onClick={() => navigate("/artist/edit/profile")}
                className="mt-8 inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-sm font-medium"
              >
                Edit Artist Profile
              </button>
            )}
          </div>
        </section>

        {/* ────────────────
            ARTWORK GRID
        ──────────────── */}
        {loading && (
          <p className="text-gray-400">Loading artworks…</p>
        )}

        {!loading && nfts.length === 0 && (
          <p className="text-gray-500">
            No artworks found
          </p>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20">
          {nfts.map((nft) => (
            <div
              key={`${nft.collection}-${nft.tokenId}`}
              onClick={() =>
                navigate(
                  `/nft/${nft.collection}/${nft.tokenId}`
                )
              }
              className="group cursor-pointer"
            >
              <div className="overflow-hidden rounded-2xl bg-[#111827]">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full aspect-square object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-square flex items-center justify-center text-gray-500 text-sm">
                    No Image
                  </div>
                )}
              </div>

              <div className="mt-6 px-1">
                <h3 className="text-lg font-medium">
                  {nft.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  #{nft.tokenId}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
