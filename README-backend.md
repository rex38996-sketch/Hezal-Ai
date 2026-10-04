# Hazel AI — Backend + App install guide

Is folder me sab kuch hai jo public app ke liye chahiye:
- `hazel-backend.js` — chhota server (Node.js, koi extra package nahi). API key yahan chhupi rehti hai.
- `sarvam-pro-chat.html` — aapka app.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — app ki tarah install (PWA) ke liye.

---

## 1) Credit ka jawab (ye zaroori hai)

Haan — jab aapki API key se sab log chalayenge, to **har message ka kharcha aapki key par hoga**. Jitne zyada dost use karenge, utni tezi se credits khatam honge. Ye asli risk hai.

Isliye backend me maine **rate-limit** daal diya hai (default: ek user ko 60 requests per hour). Isse ek banda poori key udaa nahi sakta. Aap chaho to `RATE_MAX` badal kar kam/zyada kar sakte ho.

Aur bachav ke tarike:
- **Rate limit kam karo** (jaise 20/hour) — `RATE_MAX=20`.
- **Login/accounts** add karo — sirf jinhe aap allow karo wahi use karein.
- **Spending cap** apne provider dashboard me set karo (agar available ho).
- **BYOK (Bring Your Own Key)** — user apni key daale, tab kharcha uska hoga. (Iske liye app ka "direct mode" use karo.)
- **Usage dekhte raho** — `/api/admin/stats` endpoint se.

Sabse surakshit: backend + login + rate limit.

---

## 2) Backend chalana (local test)

1. Node 18+ install hona chahiye (`node -v` se check karo).
2. Is folder me terminal kholo aur chalao:
   ```
   SARVAM_API_KEY="sk_xxxx" ADMIN_PASS="mera-password" node hazel-backend.js
   ```
3. Browser me kholo: **http://localhost:3000**
   (App khud khul jayega — isi folder ki `sarvam-pro-chat.html` serve hoti hai.)

Bas. Ab aapka app backend ke through chalta hai, aur key browser me nahi aati.

---

## 3) Backend ko internet par deploy karna (public ke liye)

Free options:

**Option A — Render.com (recommended)**
1. In files ko ek GitHub repo me daalo (sarvam-pro-chat.html, hazel-backend.js, manifest.webmanifest, icons).
2. Render.com par → New → **Web Service** → apna repo chuno.
3. Start command: `node hazel-backend.js`
4. Environment variables set karo:
   - `SARVAM_API_KEY` = aapki key
   - `ADMIN_PASS` = apna admin password
   - `RATE_MAX` = 60 (ya jo chaho)
5. Deploy. Jo URL mile (jaise `https://hazel.onrender.com`) — wahi aapka app link hai.

**Option B — Replit / Glitch**: files paste karo, run command `node hazel-backend.js`, env vars set karo. Wahan se bhi URL milta hai.

> Note: free hosting par app thodi der "so" sakti hai (pehla load slow). Theek hai.

---

## 4) App ko backend se jodna

App file me sabse upar ye lines hain:

```js
const USE_BACKEND=false;
const BACKEND_URL="https://your-backend.example.com";
```

- **Agar backend hi app serve kar raha hai** (upar wala Render URL): ye karo —
  ```js
  const USE_BACKEND=true;
  const BACKEND_URL="";
  ```
  (khaali = same origin, matlab wahi backend URL)

- **Agar app alag host par hai** (jaise Netlify) aur backend alag: 
  ```js
  const USE_BACKEND=true;
  const BACKEND_URL="https://hazel.onrender.com";
  ```

Iske baad Settings me API key dene ki zaroorat nahi — key server par hai.

---

## 5) App ki tarah install karna (PWA)

App ko https par kholne ke baad (backend URL ya Netlify link):

**Android (Chrome):**
1. Link kholo → upar right ke **3 dots (⋮)** menu par tap karo.
2. **"Install app"** ya **"Add to Home screen"** chuno.
3. Naam Hazel AI dikhega → **Install**. Ab home screen par icon aa jayega, full-screen khulega.

**iPhone (Safari):**
1. Link kholo → neeche **Share** button (box me teer) dabao.
2. **"Add to Home Screen"** chuno → **Add**.

Bas — phone par app ki tarah install ho jayegi (browser bar ke bina).

---

## 6) Admin usage dekhna

Browser me kholo (URL apne backend ka):
```
https://<aapka-backend>/api/admin/stats
```
Par ye password maangega. Isliye header ke saath dekho (ya Postman/curl se):
```
x-admin-pass: mera-password
```
Ye batayega: total requests, kitne users active, aur per-user count. Isse pata chalega ki credits kitni tezi se ja rahe hain.

---

## Yaad rakhne wali baatein
- Backend ke bina key browser me hoti hai — sirf personal use ke liye theek.
- Public app ke liye: **backend + rate limit (+ login)** = best.
- Icons/manifest ko app ke saath hi host karo, warna install icon nahi aayega.
- `ADMIN_PASS` ko strong rakho, default `admin` na chhodo.
