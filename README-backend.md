# Hazel AI — Backend + App install guide

Is folder me sab kuch hai jo public app ke liye chahiye:
- `hazel-backend.js` — chhota server (Node.js, koi extra package nahi). API key yahan chhupi rehti hai.
- `sarvam-pro-chat.html` — aapka app.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — app ki tarah install (PWA) ke liye.

---

## 1) Credit ka jawab (ye zaroori hai)

Haan — jab aapki API key se sab log chalayenge, to **har message ka kharcha aapki key par hoga**. Jitne zyada dost use karenge, utni tezi se credits khatam honge. Ye asli risk hai.

Isliye backend me **rate-limit** daala hai (default: ek user ko 60 requests per hour). Isse ek banda poori key udaa nahi sakta. Chaho to `RATE_MAX` badal kar kam/zyada kar sakte ho.

Bachav ke tarike:
- **Rate limit kam karo** (jaise 20/hour) — `RATE_MAX=20`.
- **Login/accounts** add karo — sirf allow kiye hue log use karein.
- **Spending cap** apne provider dashboard me set karo (agar available ho).
- **BYOK (Bring Your Own Key)** — user apni key daale, tab kharcha uska hoga.
- **Usage dekhte raho** — `/api/admin/stats` se.

---

## 2) Backend chalana (local test)

1. Node 18+ install hona chahiye (`node -v`).
2. Is folder me terminal kholo aur chalao:
   ```
   SARVAM_API_KEY="sk_xxxx" ADMIN_PASS="mera-password" node hazel-backend.js
   ```
3. Browser me kholo: **http://localhost:3000**

Bas. App backend ke through chalta hai, aur key browser me nahi aati.

---

## 3) Backend ko internet par deploy karna (Render)

1. Files ko ek GitHub repo me daalo: `sarvam-pro-chat.html`, `hazel-backend.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`.
2. Render.com → New → **Web Service** → repo chuno.
3. **Start command:** `node hazel-backend.js`
4. **Environment variables** (ye sabse zaroori hai — inke bina app chalega nahi):
   - `SARVAM_API_KEY` = aapki key
   - `ADMIN_PASS` = apna admin password
   - `RATE_MAX` = 60 (ya jo chaho)
5. Deploy → jo URL mile (jaise `https://hazel.onrender.com`) wahi aapka app link hai.

> Free hosting par app thodi der "so" sakti hai (pehla load slow). Theek hai.

---

## 4) App backend se judna — ab AUTOMATIC hai

Ab kuch set karne ki zaroorat nahi. App khud check karta hai:
- Agar app kisi backend se serve ho raha hai (jo `/api/health` deta hai), to app **khud backend mode** me chala jayega — key ki zaroorat nahi.
- Agar backend nahi chal raha (sirf HTML host kiya hai), to app **direct mode** me chalega aur Settings me API key maangega — tab key daal do (ya backend deploy karo).

Bas itna dhyan rakho: **Render par service chal rahi ho aur usme `SARVAM_API_KEY` env set ho.** Agar env var nahi daala, to backend ke paas key nahi hogi aur messages fail honge.

Agar app alag host par hai (jaise Netlify) aur backend alag (Render), to app file me sabse upar:
```js
const BACKEND_URL="https://hazel.onrender.com";
```
daal do. Agar backend hi app serve kar raha hai, to `BACKEND_URL=""` (khaali) rehne do.

---

## 5) App ki tarah install karna (PWA)

App ko https par kholne ke baad (backend URL ya Netlify link):

**Android (Chrome):**
1. Link kholo → upar right **3 dots (⋮)** → **"Install app"** / **"Add to Home screen"**.
2. Naam Hazel AI dikhega → **Install**.

**iPhone (Safari):**
1. Link kholo → neeche **Share** (box me teer) → **"Add to Home Screen"** → **Add**.

Bas — phone par app ki tarah install ho jayegi (browser bar ke bina).

---

## 6) Admin usage dekhna

```
https://<aapka-backend>/api/admin/stats
```
Header ke saath: `x-admin-pass: mera-password`
(Postman/curl se.) Ye batayega: total requests, kitne users active, per-user count — isse pata chalega credits kitni tezi se ja rahe hain.

---

## Yaad rakhne wali baatein
- Render par `SARVAM_API_KEY` env var **zaroor** set karo, warna kuch kaam nahi karega.
- Public app ke liye: **backend + rate limit (+ login)** = best.
- Icons/manifest ko app ke saath hi host karo, warna install icon nahi aayega.
- `ADMIN_PASS` strong rakho, default `admin` na chhodo.
- Files ka naam badla ho to backend ki `sarvam-pro-chat.html` wali line bhi update karo.
