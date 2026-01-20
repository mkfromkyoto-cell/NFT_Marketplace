// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";

import Collections from "./pages/Collections";
import CreateCollection from "./pages/CreateCollection";
import MyNFTs from "./pages/MyNFTs";
import CollectionDetail from "./pages/CollectionDetail";
import NFTDetail from "./pages/NFTDetail";
import MintNFT from "./pages/MintNFT";
import Artist from "./pages/artist";
import EditArtistProfile from "./pages/EditArtistProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <Home />
          }
        />

        {/* CREATE COLLECTION */}
        <Route path="/create" element={<CreateCollection />} />

        {/* COLLECTION LISTS */}
        <Route path="/collections" element={<Collections />} />
        <Route path="/mynfts" element={<MyNFTs />} />

        {/* COLLECTION DETAIL */}
        <Route
          path="/collection/:address"
          element={<CollectionDetail />}
        />

          {/* Artist Profile */}
        <Route path="/artist/:address" element={<Artist />} />
        <Route path="/artist/edit/profile" element={<EditArtistProfile />} />
        
        {/* NFT DETAIL */}
        <Route
          path="/nft/:collection/:tokenId"
          element={<NFTDetail />}
        />

        {/* MINT */}
        <Route path="/mint" element={<MintNFT />} />
      </Routes>
    </BrowserRouter>
  );
}
