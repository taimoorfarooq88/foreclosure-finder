# Deploy Guide — website ko kahin bhi live karein (FREE)

Is project ke do hisse alag-alag deploy hote hain:

| Hissa | Platform | Free URL milega |
|-------|----------|-----------------|
| Backend (FastAPI) | **Render** | `https://foreclosure-api.onrender.com` |
| Frontend (Next.js) | **Vercel** | `https://your-app.vercel.app` |

Dono free. Koi credit card nahi chahiye. Custom `.com` naam baad mein add kar sakte hain.

---

## STEP 0 — Code ko GitHub par daalein (ek hi baar)

Render aur Vercel dono GitHub se connect hote hain.

1. https://github.com par account banayein (agar nahi hai).
2. Naya **empty** repo banayein, naam `foreclosure-finder` (README/license kuch add NA karein).
3. Apne PC par, project folder mein ye chalayein (GitHub username apna daalein):

   ```powershell
   cd 'c:\Users\taimo\Buying House Website'
   git remote add origin https://github.com/<your-username>/foreclosure-finder.git
   git branch -M main
   git push -u origin main
   ```

   (Git init + pehla commit pehle se ho chuka hai — sirf push karna hai.)

---

## STEP 1 — Backend deploy (Render)

1. https://render.com par "Get Started" → GitHub se sign in.
2. Dashboard → **New +** → **Blueprint**.
3. Apna `foreclosure-finder` repo select karein → **Connect**.
4. Render khud `render.yaml` parh lega aur `foreclosure-api` service bana dega.
   **Apply** dabayein.
5. Build hone dein (~3–5 min). Ho jaane par URL milega, jaise:
   `https://foreclosure-api.onrender.com`
6. Test: browser mein kholें → `https://foreclosure-api.onrender.com/health`
   → `{"status":"ok"}` dikhe to backend live hai. ✅
   - `/api/properties` par ja kar listings bhi check kar sakte hain.

> **Note:** Free tier 15 min inactivity ke baad "soeta" hai. Pehli request thodi
> slow (~50 sec) hoti hai, phir fast. Data startup par khud seed ho jaata hai.

---

## STEP 2 — Frontend deploy (Vercel)

1. https://vercel.com par GitHub se sign in.
2. **Add New** → **Project** → `foreclosure-finder` repo import karein.
3. **Root Directory** mein `frontend` chunें (Edit dabाकर). Ye zaroori hai.
4. Framework apne aap **Next.js** detect hoga.
5. **Environment Variables** mein ye add karein:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: STEP 1 wala Render URL, jaise `https://foreclosure-api.onrender.com`
     (URL ke aakhir mein slash `/` NA dalein)
6. **Deploy** dabayein. ~2 min mein live URL mil jayega:
   `https://your-app.vercel.app` 🎉

---

## STEP 3 — Verify

- Vercel URL kholें → search/filters chala kar dekhein listings aati hain.
- Agar listings na aayein: Vercel env var ka URL theek hai? Backend `/health` chal raha hai?
  Env var badalne ke baad Vercel par **Redeploy** karna padta hai.

---

## Baad mein: Custom domain (optional, ~$10/saal)

- Namecheap / Cloudflare se `.com` khareedein.
- Vercel → Project → Settings → Domains mein add karein (free SSL milega).

## Baad mein: Data permanent rakhna (jab real scrapers chaleंge)

Abhi sample data startup par seed hota hai (ephemeral SQLite — restart par reset, lekin
phir se seed ho jaata hai, to website kabhi khaali nahi dikhti). Jab asli scraped data
aaye to use permanent rakhne ke liye free Postgres lein (Neon ya Supabase) aur Render mein
`DATABASE_URL` env var set kar dein — code already isko support karta hai.
