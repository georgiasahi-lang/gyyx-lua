// GyyxLua Engine — Mode 2 Only (Encrypt for Gist)
// Mode 1 pakai WeAreDev Prometheus via backend proxy

const GyyxEngine = (() => {

  function uid(len = 7) {
    const c = "abcdefghijklmnopqrstuvwxyz";
    let s = c[Math.floor(Math.random() * c.length)];
    const a = c + "0123456789";
    for (let i = 1; i < len; i++) s += a[Math.floor(Math.random() * a.length)];
    return "_" + s;
  }

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  // Encode seluruh kode sebagai byte array XOR
  // Pendekatan ini tidak menyentuh syntax Lua sama sekali
  function buildWrapper(code, keyCheck) {
    const xorKey = [];
    for (let i = 0; i < 8; i++) xorKey.push(randInt(15, 110));

    const bytes = [];
    for (let i = 0; i < code.length; i++) {
      bytes.push(code.charCodeAt(i) ^ xorKey[i % xorKey.length]);
    }

    const vB = uid(), vK = uid(), vS = uid(), vI = uid(), vR = uid();

    const decoder =
`local ${vB}={${bytes.join(",")}}
local ${vK}={${xorKey.join(",")}}
local ${vS}=""
for ${vI}=1,#${vB} do
  ${vS}=${vS}..string.char(${vB}[${vI}]~${vK}[(${vI}-1)%#${vK}+1])
end
${keyCheck ? keyCheck + "\n" : ""}local ${vR}=loadstring(${vS})
if ${vR} then ${vR}(...) end`;

    return decoder;
  }

  // Mode 2: Encrypt untuk Gist — dengan key protection
  function encryptForGist(code, key) {
    if (!code || !code.trim()) throw new Error("Kode tidak boleh kosong.");
    if (!key || !key.trim()) throw new Error("Key wajib diisi untuk mode Encrypt.");

    const vArg = uid();
    const keyCheck =
`local ${vArg}=select(1,...) or ""
if tostring(${vArg})~="${key.trim()}" then error("GyyxLua: Access Denied — Invalid Key") return end`;

    return buildWrapper(code, keyCheck);
  }

  return { encryptForGist };
})();

if (typeof module !== "undefined") module.exports = GyyxEngine;
