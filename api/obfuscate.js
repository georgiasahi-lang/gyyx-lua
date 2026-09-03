export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { script } = req.body || {};

  if (!script || !script.trim())
    return res.status(400).json({ error: "Script tidak boleh kosong." });

  if (script.length > 500000)
    return res.status(400).json({ error: "Script terlalu panjang (maks 500KB)." });

  let result;
  try {
    const upstream = await fetch("https://wearedevs.net/api/obfuscate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://wearedevs.net",
        "Referer": "https://wearedevs.net/obfuscator",
        "User-Agent": "Mozilla/5.0 (compatible)",
      },
      body: JSON.stringify({ script }),
    });

    const text = await upstream.text();

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ error: "Response WeAreDev tidak valid: " + text.slice(0, 100) }); }

    if (!upstream.ok || data.error)
      return res.status(upstream.status || 500).json({ error: data.error || "Obfuscation gagal di server WeAreDev." });

    if (!data.obfuscated)
      return res.status(502).json({ error: "Hasil obfuscate kosong dari WeAreDev." });

    result = data.obfuscated;

  } catch (err) {
    return res.status(502).json({ error: "Gagal terhubung ke WeAreDev: " + err.message });
  }

  return res.status(200).json({ obfuscated: result });
}
