import { BrowserProvider } from "ethers";

export async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return null;
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}
