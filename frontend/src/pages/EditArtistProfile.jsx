// src/pages/EditArtistProfile.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  uploadToPinata,
  uploadJSONToPinata,
} from "../utils/pinata";

export default function EditArtistProfile() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = (await signer.getAddress()).toLowerCase();

    const saved = localStorage.getItem(
      `artist-profile-${address}`
    );
    if (!saved) return;

    try {
      const res = await fetch(
        saved.replace("ipfs://", "https://ipfs.io/ipfs/")
      );
      const data = await res.json();
      setName(data.name || "");
      setBio(data.bio || "");
    } catch {}
  }

  async function handleSave() {
    if (!name) {
      alert("Name required");
      return;
    }

    try {
      setLoading(true);

      let avatarURI = "";
      if (avatarFile) {
        avatarURI = await uploadToPinata(avatarFile);
      }

      const profile = {
        name,
        bio,
        avatar: avatarURI,
      };

      const profileURI = await uploadJSONToPinata(profile);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = (await signer.getAddress()).toLowerCase();

      localStorage.setItem(
        `artist-profile-${address}`,
        profileURI
      );

      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================== */

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      {/* HEADER */}
      <section className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
          Artist Identity
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          Edit Artist Profile
        </h1>

        <p className="mt-6 max-w-2xl text-gray-300 leading-relaxed">
          This profile represents you across the gallery. It appears
          alongside your artworks and collections.
        </p>
      </section>

      {/* FORM */}
      <section className="max-w-2xl mx-auto px-6 pb-32">
        <div className="space-y-14">

          {/* AVATAR */}
          <div>
            <label className="block text-sm text-gray-400 mb-4">
              Artist Portrait
            </label>

            <div className="relative border border-dashed border-gray-600 rounded-2xl p-10 text-center hover:border-gray-400 transition">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) =>
                  setAvatarFile(e.target.files[0])
                }
              />

              <p className="text-gray-300">
                {avatarFile
                  ? avatarFile.name
                  : "Click to upload portrait image"}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Square image recommended
              </p>
            </div>
          </div>

          {/* NAME */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Artist Name
            </label>
            <input
              className="w-full bg-transparent border-b border-gray-700 py-3 text-lg focus:outline-none focus:border-white transition"
              placeholder="Your public artist name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* BIO */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">
              Artist Statement
            </label>
            <textarea
              rows={5}
              className="w-full bg-transparent border border-gray-700 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-white transition"
              placeholder="Write a short artist statement or biography…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* ACTION */}
          <div className="pt-10">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 rounded-full bg-white text-black font-medium text-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Saving Profile…" : "Save Profile"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
