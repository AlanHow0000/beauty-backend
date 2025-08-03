// index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(bodyParser.json({ limit: "10mb" }));

// Explicit OPTIONS handler (safe redundancy)
app.options("/analyze", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.sendStatus(204);
});

app.post("/analyze", async (req, res) => {
  console.log("Claude key present?", !!process.env.CLAUDE_API_KEY);
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  const claudeApiKey = process.env.CLAUDE_API_KEY;
  if (!claudeApiKey) {
    // fallback demo
    return res.json({
      reply: "Skin looks slightly dry with some redness. Recommend hydrating treatment.",
      treatment: "HydraGlow Facial",
    });
  }

  try {
    const prompt = `
You are a skincare assistant. Analyze the user's skin from the provided image data (base64).
Give a concise diagnosis and a recommended treatment. Respond in strict JSON with keys "reply" and "treatment".
Image snippet: ${image.slice(0, 100)}...
`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${claudeApiKey}`, // if this doesn't work, switch to "x-api-key": claudeApiKey
      },
      body: JSON.stringify({
        model: "claude-2",
        prompt: prompt,
        max_tokens_to_sample: 300,
        temperature: 0.7,
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errText);
      throw new Error("Claude API failed");
    }

    const data = await claudeResponse.json();
    console.log("Claude raw response:", data);

    let rawText = "";
    if (data.completion) {
      rawText = data.completion;
    } else if (data.output?.[0]?.content) {
      rawText = data.output[0].content;
    } else if (typeof data === "string") {
      rawText = data;
    } else {
      rawText = JSON.stringify(data);
    }

    let reply = "Could not parse analysis.";
    let treatment = "HydraGlow Facial";

    try {
      const parsed = JSON.parse(rawText);
      reply = parsed.reply || reply;
      treatment = parsed.treatment || treatment;
    } catch {
      reply = rawText; // fallback to raw text
    }

    return res.json({ reply, treatment });
  } catch (err) {
    console.error("Analyze error:", err);
    return res.json({
      reply: "Skin looks slightly dry with some redness. Recommend hydrating treatment.",
      treatment: "HydraGlow Facial",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
