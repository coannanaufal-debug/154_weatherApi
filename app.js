require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
  const kota = "Bandung City";
  const apiKey = process.env.MAPTILER_API_KEY;
  const baseUrl = process.env.MAPTILER_BASE_URL;

  const url = `${baseUrl}/${kota}.json?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;