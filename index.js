// index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.options("/analyze", (req, res) => {
  res.sendStatus(204);
});

app.post("/analyze", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image provided" });
  }

  // Simulated AI analysis
  const reply = "Skin looks slightly dry with some redness. Recommend hydrating treatment.";
  const treatment = "HydraGlow Facial";

  res.json({ reply, treatment });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
