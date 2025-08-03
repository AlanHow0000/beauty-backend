// index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Explicit CORS config including OPTIONS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    preflightContinue: false,
  })
);

app.use(bodyParser.json({ limit: "10mb" }));

// You can remove the custom app.options if you keep cors above,
// but to be explicit:
app.options("/analyze", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.sendStatus(204);
});

app.post("/analyze", (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  res.json({
    reply: "Skin looks slightly dry with some redness. Recommend hydrating treatment.",
    treatment: "HydraGlow Facial",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
