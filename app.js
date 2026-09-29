require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
  const query = req.query.query || "Kasihan";
  const apiKey = process.env.MAPTILER_API_KEY;

  if (!apiKey) {
    console.error("❌ ERROR: MAPTILER_API_KEY belum diisi di file .env!");
    return res.status(500).json({ message: "API Key MapTiler belum diisi di .env" });
  }

 const baseUrl = "https://api.maptiler.com/geocoding";
 const url = `${baseUrl}/${encodeURIComponent(query)}.json?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const features = response.data?.features;

    if (!features || features.length === 0) {
      return res.status(404).json({ message: "Lokasi tidak ditemukan" });
    }

    const feature = features[0];

    // Variabel penampung hierarki administratif
    let negara = "-";
    let provinsi = "-";
    let kabupatenKota = "-";
    let kecamatan = "-";

    // 1. Ekstrak dari konteks parent wilayah (Array 'context')
    if (Array.isArray(feature.context)) {
      feature.context.forEach((item) => {
        const id = item.id || "";
        if (id.startsWith("country")) negara = item.text;
        if (id.startsWith("region") || id.startsWith("province")) provinsi = item.text;
        if (id.startsWith("district") || id.startsWith("county")) kabupatenKota = item.text;
        
        // Deteksi Kecamatan / Kelurahan / Locality
        if (
          id.startsWith("subdistrict") ||
          id.startsWith("locality") ||
          id.startsWith("neighborhood") ||
          id.startsWith("municipality")
        ) {
          kecamatan = item.text;
        }
      });
    }

    // 2. Jika pencarian langsung menunjuk ke tipe wilayah spesifik
    if (Array.isArray(feature.place_type)) {
      if (feature.place_type.includes("country")) negara = feature.text;
      if (feature.place_type.includes("region")) provinsi = feature.text;
      if (feature.place_type.includes("district")) kabupatenKota = feature.text;
      if (
        feature.place_type.includes("subdistrict") ||
        feature.place_type.includes("locality") ||
        feature.place_type.includes("municipality")
      ) {
        kecamatan = feature.text;
      }
    }

    // Fallback: Jika kecamatan masih belum terdeteksi, gunakan nama tempat utama
    if (kecamatan === "-" && feature.text) {
      kecamatan = feature.text;
    }

    // 3. Gabungkan menjadi satu string 'Detail Lokasi Lengkap'
    const detailLengkap = [kecamatan, kabupatenKota, provinsi, negara]
      .filter((item) => item !== "-")
      .join(", ");

    const longitude = feature.geometry?.coordinates?.[0] ?? "-";
    const latitude = feature.geometry?.coordinates?.[1] ?? "-";

    // Kirim respons JSON ke Frontend
    res.json({
      lokasi_input: query,
      detail_lokasi: detailLengkap || feature.place_name || feature.text,
      kecamatan: kecamatan,
      kabupaten_kota: kabupatenKota,
      provinsi: provinsi,
      negara: negara,
      longitude: longitude,
      latitude: latitude,
    });
  } catch (error) {
    console.error("❌ Error MapTiler API:", error.response?.data || error.message);
    res.status(500).json({
      message: error.response?.data?.message || "Gagal mengambil data lokasi dari MapTiler",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});