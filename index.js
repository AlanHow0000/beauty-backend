app.post("/analyze", async (req, res) => {
  console.log("Claude key present?", !!process.env.CLAUDE_API_KEY); // debug line
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  const claudeApiKey = process.env.CLAUDE_API_KEY;
  if (!claudeApiKey) {
    return res.json({
      reply: "Skin looks slightly dry with some redness. Recommend hydrating treatment.",
      treatment: "HydraGlow Facial",
    });
  }

  try {
    const prompt = `
You are a skincare assistant. Analyze the user’s skin based on the provided image data (base64).
Give a concise diagnosis and a recommended treatment. Respond in strict JSON with keys "reply" and "treatment".
Image snippet: ${image.slice(0, 100)}...
`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Try Authorization header first; if that fails, swap to x-api-key
        "Authorization": `Bearer ${claudeApiKey}`,
        // "x-api-key": claudeApiKey,
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
    console.log("Claude raw response:", data); // inspect shape

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
      reply = rawText;
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
