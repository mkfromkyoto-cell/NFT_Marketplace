// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Collections from "./pages/Collections";
import CreateCollection from "./pages/CreateCollection";
import MyNFTs from "./pages/MyNFTs";
import CollectionDetail from "./pages/CollectionDetail";
import NFTDetail from "./pages/NFTDetail";
import MintNFT from "./pages/MintNFT";


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <div className="p-20 text-center text-4xl font-bold">
              Welcome to Art Gallery
            </div>
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
