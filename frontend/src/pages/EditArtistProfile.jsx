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

    const saved = localStorage.getItem(`artist-profile-${address}`);
    if (!saved) return;

    try {
      const res = await fetch(saved.replace("ipfs://", "https://ipfs.io/ipfs/"));
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

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Artist Profile</h1>

      <label className="block mb-4">
        <span>Name</span>
        <input
          className="w-full p-3 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block mb-4">
        <span>Bio</span>
        <textarea
          rows={4}
          className="w-full p-3 border rounded"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </label>

      <label className="block mb-6">
        <span>Avatar</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files[0])}
        />
      </label>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
