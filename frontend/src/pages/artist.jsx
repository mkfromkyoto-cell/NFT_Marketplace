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
 
    /* =========================
      Load Connected Wallet
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
    } catch (err) {
      console.warn("Profile load failed");
    }
  }

  /* =========================
     LOAD ARTIST NFTS
  ========================== */
  useEffect(() => {
    loadProfile();
    loadArtistNFTs();
    loadUser();
  }, [address]);

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

        const total = await nft.tokenCounter();

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
    } catch (err) {
      console.error("Artist load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================== */
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* ARTIST PROFILE */}
      <div className="flex items-center gap-6 mb-10">
        {profile?.avatar ? (
          <img
            src={ipfs(profile.avatar)}
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
            No Avatar
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold">
            {profile?.name || "Artist"}
          </h1>

          <p className="text-gray-400 font-mono text-sm">
            {address}
          </p>

          {profile?.bio && (
            <p className="mt-2 text-gray-300 max-w-xl">
              {profile.bio}
            </p>
          )}

          {user === address.toLowerCase() && (
            <button
                onClick={() => navigate("/artist/edit/profile")}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
            >
                Edit Profile
            </button>
            )}
        </div>
      </div>

      {/* NFT GRID */}
      {loading && <p>Loading artworks...</p>}

      {!loading && nfts.length === 0 && (
        <p className="text-gray-400">No artworks found</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <div
            key={`${nft.collection}-${nft.tokenId}`}
            onClick={() =>
              navigate(
                `/nft/${nft.collection}/${nft.tokenId}`
              )
            }
            className="cursor-pointer bg-[#121826] border border-[#1f2937] rounded-xl overflow-hidden hover:scale-[1.02] transition"
          >
            {nft.image && (
              <img
                src={nft.image}
                className="w-full h-64 object-cover"
                alt={nft.name}
              />
            )}

            <div className="p-4">
              <h3 className="font-semibold">{nft.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                #{nft.tokenId}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
