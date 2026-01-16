import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Mint from "./pages/Mint";
import Item from "./pages/Item";
import MyNFTs from "./pages/MyNFTs";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0f19] text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/item/:id" element={<Item />} />
          <Route path="/my-nfts" element={<MyNFTs />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
