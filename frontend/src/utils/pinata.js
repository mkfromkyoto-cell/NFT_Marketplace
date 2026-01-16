import axios from "axios";

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET = import.meta.env.VITE_PINATA_SECRET_API_KEY;

export async function uploadImageToPinata(file) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  let formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(url, formData, {
    maxBodyLength: "Infinity",
    headers: {
      "Content-Type": "multipart/form-data",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
  });

  return `ipfs://${res.data.IpfsHash}`;
}

export async function uploadMetadataToPinata(metadata) {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  const res = await axios.post(url, metadata, {
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
  });

  return `ipfs://${res.data.IpfsHash}`;
}
