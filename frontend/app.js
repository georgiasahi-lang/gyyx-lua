"use strict";

// ── Sakura ────────────────────────────────────────────────────────────────────
const sakuraWrap = document.getElementById("sakuraWrap");
function spawnSakura() {
  const p = ["🌸","🌺","✿","❀","🌷"];
  const el = document.createElement("div");
  el.className = "sakura";
  el.textContent = p[Math.floor(Math.random() * p.length)];
  el.style.left = Math.random() * 100 + "vw";
  el.style.animationDuration = (6 + Math.random() * 8) + "s";
  el.style.animationDelay = (Math.random() * 3) + "s";
  el.style.fontSize = (10 + Math.random() * 12) + "px";
  sakuraWrap.appendChild(el);
  setTimeout(() => el.remove(), 18000);
}
setInterval(spawnSakura, 1400);
for (let i = 0; i < 5; i++) setTimeout(spawnSakura, i * 300);

// ── Toast ─────────────────────────────────────────────────────────────────────
const toastWrap = document.getElementById("toastWrap");
function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  toastWrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = "tOut 0.3s ease forwards";
    el.addEventListener("animationend", () => el.remove());
  }, 3200);
}

// ── Tab Switch ────────────────────────────────────────────────────────────────
document.getElementById("tabObf").addEventListener("click", () => {
  document.getElementById("tabObf").classList.add("active");
  document.getElementById("tabEnc").classList.remove("active");
  document.getElementById("panelObf").style.display = "";
  document.getElementById("panelEnc").style.display = "none";
});

document.getElementById("tabEnc").addEventListener("click", () => {
  document.getElementById("tabEnc").classList.add("active");
  document.getElementById("tabObf").classList.remove("active");
  document.getElementById("panelEnc").style.display = "";
  document.getElementById("panelObf").style.display = "none";
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function updateLineNums(ta, el) {
  const n = (ta.value.match(/\n/g) || []).length + 1;
  let s = "";
  for (let i = 1; i <= n; i++) s += i + "\n";
  el.textContent = s;
}

function updateInfo(ta, info, nums) {
  const lines = (ta.value.match(/\n/g) || []).length + 1;
  info.textContent = `${lines} baris · ${ta.value.length} karakter`;
  updateLineNums(ta, nums);
}

function readFile(file, cb) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["lua","txt","luau"].includes(ext)) { toast("Format harus .lua / .txt / .luau", "pink"); return; }
  if (file.size > 2 * 1024 * 1024) { toast("File terlalu besar — maks 2MB", "pink"); return; }
  const r = new FileReader();
  r.onload = e => { cb(e.target.result); toast("✓ File dimuat: " + file.name, "green"); };
  r.onerror = () => toast("Gagal baca file", "pink");
  r.readAsText(file);
}

function genKey() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let k = "Gyyx_";
  for (let i = 0; i < 12; i++) k += c[Math.floor(Math.random() * c.length)];
  return k;
}

// ── Progress ──────────────────────────────────────────────────────────────────
function animProgress(fillEl, textEl, wrapEl, steps, msgs, cb) {
  wrapEl.style.display = "block";
  fillEl.style.width = "0%";
  let i = 0;
  function tick() {
    if (i >= steps) {
      fillEl.style.width = "100%";
      textEl.textContent = "Selesai!";
      setTimeout(() => { wrapEl.style.display = "none"; cb(); }, 300);
      return;
    }
    fillEl.style.width = Math.round(((i+1)/steps)*100) + "%";
    textEl.textContent = msgs[i] || "Memproses...";
    i++;
    setTimeout(tick, 220 + Math.random() * 180);
  }
  tick();
}

// ══════════════════════════════════════════════════════════════════════════════
// MODE 1: OBFUSCATE via Proxy → Prometheus
// ══════════════════════════════════════════════════════════════════════════════

const obfInput      = $("obfInput");
const obfLineNums   = $("obfLineNums");
const obfInputInfo  = $("obfInputInfo");
const obfOutput     = $("obfOutput");
const obfOutputNums = $("obfOutputNums");
const obfOutputInfo = $("obfOutputInfo");
const obfStats      = $("obfStats");
const obfOutputCard = $("obfOutputCard");
const obfProgress   = $("obfProgress");
const obfFill       = $("obfFill");
const obfProgText   = $("obfProgText");
const obfBtn        = $("obfBtn");
const obfBtnLabel   = $("obfBtnLabel");

obfInput.addEventListener("input", () => updateInfo(obfInput, obfInputInfo, obfLineNums));
obfInput.addEventListener("scroll", () => { obfLineNums.scrollTop = obfInput.scrollTop; });
obfOutput.addEventListener("scroll", () => { obfOutputNums.scrollTop = obfOutput.scrollTop; });

$("obfFileUp").addEventListener("change", function() {
  if (this.files[0]) readFile(this.files[0], t => { obfInput.value = t; updateInfo(obfInput, obfInputInfo, obfLineNums); });
  this.value = "";
});

$("obfClearBtn").addEventListener("click", () => {
  obfInput.value = "";
  updateInfo(obfInput, obfInputInfo, obfLineNums);
  obfOutputCard.style.display = "none";
  toast("Editor dibersihkan", "yellow");
});

obfBtn.addEventListener("click", async () => {
  const code = obfInput.value.trim();
  if (!code) { toast("❌ Kode tidak boleh kosong!", "pink"); return; }

  obfBtn.disabled = true;
  obfBtnLabel.textContent = "Memproses...";
  obfOutputCard.style.display = "none";

  const msgs = [
    "Mengirim ke Prometheus engine...",
    "Transformasi AST...",
    "Menerima hasil...",
  ];

  animProgress(obfFill, obfProgText, obfProgress, 3, msgs, async () => {
    let result;
    try {
      const res = await fetch("/api/obfuscate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: code }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Server error " + res.status);
      }

      result = data.obfuscated;
      if (!result) throw new Error("Hasil obfuscate kosong.");

    } catch (err) {
      toast("❌ " + err.message, "pink");
      obfBtn.disabled = false;
      obfBtnLabel.textContent = "Obfuscate Sekarang";
      return;
    }

    obfOutput.value = result;
    updateLineNums(obfOutput, obfOutputNums);

    const origSize   = new Blob([code]).size;
    const resultSize = new Blob([result]).size;
    const lines      = (result.match(/\n/g) || []).length + 1;

    obfOutputInfo.textContent = `${lines} baris · ${resultSize.toLocaleString()} bytes`;
    obfStats.innerHTML =
      `<span>${origSize}B → ${resultSize}B</span>` +
      `<span style="color:var(--yellow)">${((resultSize/origSize)*100).toFixed(0)}%</span>`;

    obfOutputCard.style.display = "";
    setTimeout(() => obfOutputCard.scrollIntoView({ behavior:"smooth", block:"nearest" }), 100);
    toast("✨ Obfuscate berhasil!", "green");
    spawnSakura(); spawnSakura(); spawnSakura();

    obfBtn.disabled = false;
    obfBtnLabel.textContent = "Obfuscate Sekarang";
  });
});

$("obfCopyBtn").addEventListener("click", async () => {
  const t = obfOutput.value;
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
    toast("✓ Disalin!", "green");
    $("obfCopyBtn").textContent = "✓ Disalin!";
    setTimeout(() => ($("obfCopyBtn").textContent = "📋 Copy"), 2000);
  } catch { toast("Gagal — salin manual", "pink"); }
});

$("obfDownBtn").addEventListener("click", () => {
  const t = obfOutput.value;
  if (!t) return;
  const fname = "gyyx_" + Date.now() + ".lua";
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([t], { type: "text/plain" })),
    download: fname,
  });
  a.click();
  URL.revokeObjectURL(a.href);
  toast("⬇ Downloaded: " + fname, "yellow");
});

// ══════════════════════════════════════════════════════════════════════════════
// MODE 2: ENCRYPT + GIST
// ══════════════════════════════════════════════════════════════════════════════

const ghToken     = $("ghToken");
const toggleToken = $("toggleToken");
const encInput    = $("encInput");
const encLineNums = $("encLineNums");
const encInputInfo= $("encInputInfo");
const encKey      = $("encKey");
const encCustomId = $("encCustomId");
const encBtn      = $("encBtn");
const encBtnLabel = $("encBtnLabel");
const encProgress = $("encProgress");
const encFill     = $("encFill");
const encProgText = $("encProgText");
const encOutputCard=$("encOutputCard");
const encResult   = $("encResult");
const gistInfo    = $("gistInfo");
const gistUrl     = $("gistUrl");
const gistKey     = $("gistKey");
const tokenStatus = $("tokenStatus");

const TOKEN_KEY = "gyyx_ghtoken_v3";

// Load saved token
(function() {
  const t = sessionStorage.getItem(TOKEN_KEY);
  if (t) { ghToken.value = t; checkToken(t); }
})();

function checkToken(val) {
  if (!tokenStatus) return;
  if (val && val.startsWith("ghp_") && val.length >= 40) {
    tokenStatus.textContent = "✓ Token valid";
    tokenStatus.style.color = "var(--green)";
  } else if (val && val.length > 5) {
    tokenStatus.textContent = "⚠ Format tidak dikenal — harus diawali ghp_";
    tokenStatus.style.color = "var(--yellow)";
  } else {
    tokenStatus.textContent = "";
  }
}

ghToken.addEventListener("input", () => {
  const v = ghToken.value.trim();
  v ? sessionStorage.setItem(TOKEN_KEY, v) : sessionStorage.removeItem(TOKEN_KEY);
  checkToken(v);
});

toggleToken.addEventListener("click", () => {
  ghToken.type = ghToken.type === "password" ? "text" : "password";
  toggleToken.textContent = ghToken.type === "password" ? "👁" : "🙈";
});

encInput.addEventListener("input", () => updateInfo(encInput, encInputInfo, encLineNums));
encInput.addEventListener("scroll", () => { encLineNums.scrollTop = encInput.scrollTop; });

$("encFileUp").addEventListener("change", function() {
  if (this.files[0]) readFile(this.files[0], t => { encInput.value = t; updateInfo(encInput, encInputInfo, encLineNums); });
  this.value = "";
});

$("encClearBtn").addEventListener("click", () => {
  encInput.value = "";
  updateInfo(encInput, encInputInfo, encLineNums);
  encOutputCard.style.display = "none";
  toast("Editor dibersihkan", "yellow");
});

$("encGenKey").addEventListener("click", () => { encKey.value = genKey(); toast("🎲 Key digenerate!", "yellow"); });

async function uploadGist(token, filename, content, desc) {
  let res;
  try {
    res = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        "Authorization": "token " + token,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        description: desc || "GyyxLua Protected Script",
        public: false,
        files: { [filename]: { content } },
      }),
    });
  } catch (e) {
    throw new Error("Tidak bisa terhubung ke GitHub. Cek koneksi internet.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) throw new Error("Token tidak valid atau expired.");
    if (res.status === 403) throw new Error("Token tidak punya permission gist.");
    throw new Error(data.message || "GitHub error " + res.status);
  }

  const fileData = data.files?.[filename];
  if (!fileData?.raw_url) throw new Error("Raw URL tidak ada di response GitHub.");

  return { rawUrl: fileData.raw_url, htmlUrl: data.html_url };
}

encBtn.addEventListener("click", async () => {
  const token    = ghToken.value.trim();
  const code     = encInput.value.trim();
  const key      = encKey.value.trim();
  const customId = encCustomId.value.trim() || ("gyyx_" + Date.now());

  if (!token) { toast("❌ GitHub Token wajib diisi!", "pink"); ghToken.focus(); return; }
  if (!code)  { toast("❌ Kode tidak boleh kosong!", "pink"); return; }
  if (!key)   { toast("❌ Access Key wajib diisi!", "pink"); encKey.focus(); return; }

  encBtn.disabled = true;
  encBtnLabel.textContent = "Mengenkripsi...";
  encOutputCard.style.display = "none";

  const msgs = [
    "Mengenkripsi kode...",
    "Membangun decoder Lua...",
    "Mengupload ke GitHub Gist...",
    "Membangun loadstring link...",
  ];

  animProgress(encFill, encProgText, encProgress, 4, msgs, async () => {
    let encrypted;
    try {
      encrypted = GyyxEngine.encryptForGist(code, key);
    } catch (e) {
      toast("❌ Enkripsi gagal: " + e.message, "pink");
      encBtn.disabled = false;
      encBtnLabel.textContent = "Encrypt & Upload ke Gist";
      return;
    }

    let gist;
    try {
      const safeId = customId.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 50);
      gist = await uploadGist(token, safeId + ".lua", encrypted, "GyyxLua — " + safeId);
    } catch (e) {
      toast("❌ " + e.message, "pink");
      encBtn.disabled = false;
      encBtnLabel.textContent = "Encrypt & Upload ke Gist";
      return;
    }

    const loadstr = `loadstring(game:HttpGet("${gist.rawUrl}"))("${key}")`;

    encResult.textContent  = loadstr;
    gistUrl.href           = gist.htmlUrl;
    gistUrl.textContent    = gist.htmlUrl;
    gistKey.textContent    = key;
    gistInfo.style.display = "";
    encOutputCard.style.display = "";

    setTimeout(() => encOutputCard.scrollIntoView({ behavior:"smooth", block:"nearest" }), 100);
    toast("🎉 Berhasil dienkripsi & diupload!", "purple");
    spawnSakura(); spawnSakura(); spawnSakura();

    encBtn.disabled = false;
    encBtnLabel.textContent = "Encrypt & Upload ke Gist";
  });
});

$("encCopyBtn").addEventListener("click", async () => {
  const t = encResult.textContent;
  if (!t || t === "—") return;
  try {
    await navigator.clipboard.writeText(t);
    toast("✓ Link disalin!", "green");
    $("encCopyBtn").textContent = "✓ Disalin!";
    setTimeout(() => ($("encCopyBtn").textContent = "📋 Copy"), 2000);
  } catch { toast("Gagal — salin manual", "pink"); }
});

// ── Init ──────────────────────────────────────────────────────────────────────
updateInfo(obfInput, obfInputInfo, obfLineNums);
updateInfo(encInput, encInputInfo, encLineNums);
