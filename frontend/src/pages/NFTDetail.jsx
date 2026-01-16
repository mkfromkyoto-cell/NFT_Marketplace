import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getReadContracts, getWriteContracts } from "../utils/getContracts";
import axios from "axios";


export default function NFTDetail() {
const { id } = useParams();
const [item, setItem] = useState(null);


useEffect(() => { load(); }, []);


async function load() {
const { marketplace, nft } = await getReadContracts();
const l = await marketplace.listings(id);
const uri = await nft.tokenURI(l.tokenId);
const meta = await axios.get(uri.replace('ipfs://','https://ipfs.io/ipfs/'));
setItem({
listingId: id,
price: Number(l.price) / 1e18,
image: meta.data.image.replace('ipfs://','https://ipfs.io/ipfs/'),
name: meta.data.name
});
}


async function buy() {
const { marketplace } = await getWriteContracts();
await marketplace.buyNFT(item.listingId, { value: BigInt(item.price * 1e18) });
}


if (!item) return null;


return (
<div className="max-w-5xl mx-auto px-10 py-10 grid grid-cols-2 gap-10">
<img src={item.image} className="rounded-2xl" />
<div>
<h1 className="text-4xl font-bold">{item.name}</h1>
<p className="text-2xl mt-6">{item.price} ETH</p>
<button onClick={buy} className="bg-primary px-6 py-3 rounded-xl mt-8">Buy Now</button>
</div>
</div>
);
}