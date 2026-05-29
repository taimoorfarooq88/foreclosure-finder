# Foreclosure Finder — USA Foreclosed Home Deals

USA bhar ke foreclosed homes ek hi jagah par — HUD, Fannie Mae, Freddie Mac, VA, USDA, aur Auction.com se daily aggregate.
State ya ZIP code se search karein. Har property ke saath photos, full details, **aur listing agent ka phone number**.

---

## What's inside

```
Buying House Website/
├── backend/                 Python — FastAPI + SQLite + scrapers
│   ├── api/                 REST endpoints (/api/properties, /api/stats)
│   ├── db/                  SQLAlchemy models, repository
│   ├── scrapers/            base.py + hud.py (more sources to add)
│   ├── data/                SQLite DB lives here (gitignored)
│   ├── seed_data.py         Sample data loader for instant testing
│   ├── scheduler.py         Daily 02:00 cron-style scraper runner
│   ├── run_api.py           uvicorn launcher
│   └── requirements.txt
├── frontend/                Next.js 14 + Tailwind
│   ├── app/                 page.tsx, property/[id], stats
│   ├── components/          SearchFilters, PropertyCard, Pagination
│   └── lib/                 api.ts, constants.ts (US states list)
├── .env.example
└── .gitignore
```

---

## Setup (Windows PowerShell)

Aap ke paas Python 3.10+, Node.js 18+, aur Git installed hain (confirmed). Pehli baar yeh sab kuch ek hi
baar karna hai:

### 1. Backend setup

```powershell
cd 'c:\Users\taimo\Buying House Website\backend'

# Virtual environment banao
python -m venv venv
.\venv\Scripts\Activate.ps1

# Dependencies install karo
pip install -r requirements.txt

# Playwright ka Chromium browser install karo (HUD scraper ke liye)
python -m playwright install chromium

# .env file banao (optional — defaults work)
Copy-Item ..\.env.example .env

# Sample data load karo taa-ke UI fauran kuch dikhaye
python seed_data.py
```

### 2. Backend API chalao

```powershell
# venv activated rakho, phir:
python run_api.py
```

API ab http://127.0.0.1:8765 par chalti hai. Test karo:

- http://127.0.0.1:8765/health → `{"status":"ok"}`
- http://127.0.0.1:8765/api/properties → JSON listings
- http://127.0.0.1:8765/docs → interactive Swagger UI

### 3. Frontend setup (alag PowerShell window mein)

```powershell
cd 'c:\Users\taimo\Buying House Website\frontend'

npm install

# .env.local file banao
Copy-Item .env.local.example .env.local

npm run dev
```

Browser kholo: **http://localhost:3000**

Aap ko 8 sample foreclosure listings dikhni chahiyen (TX, FL, CA, GA, NC, AZ, OH, NV), har ek mein
photo, price, beds/baths, aur sab se important — **agent ka phone number jo click kar ke directly call kar
sakte hain** (mobile par).

---

## Daily auto-refresh (real data)

Sample data se kaam nahi chalega — aap ko HUD/Fannie/Freddie se actual fresh listings chahiyen. Iske
liye scraper run karo:

### Manual one-shot (single state se shuru karein, e.g. Texas):

```powershell
cd 'c:\Users\taimo\Buying House Website\backend'
.\venv\Scripts\Activate.ps1
python scheduler.py now TX
```

Yeh HUD Home Store se Texas ki sab foreclosure listings scrape kar ke DB mein save karega.

### Sab states ek saath:

```powershell
python scheduler.py now
```

> ⚠️ **Note:** Sab 50 states ka scrape pehli baar 1–3 ghante le sakta hai (rate-limit ke saath). Aaram se ek state se shuru karein, working confirm karein, phir expand karein.

### Daily cron (machine chalu rehne par 02:00 AM roz auto-run):

```powershell
python scheduler.py
```

Yeh script background mein chalti rahegi. Permanent setup ke liye Windows Task Scheduler use karein —
ek task banaiye jo `python scheduler.py now` ko roz subah chalaye.

---

## Adding more data sources (Phase 2+)

Aaj sirf HUD scraper enabled hai. Aagey ke sources:

| Source | File to create | Status |
|---|---|---|
| Fannie Mae HomePath | `backend/scrapers/fannie_mae.py` | TODO |
| Freddie Mac HomeSteps | `backend/scrapers/freddie_mac.py` | TODO |
| Auction.com | `backend/scrapers/auction_com.py` | TODO |
| VA (VRM Properties) | `backend/scrapers/va.py` | TODO |
| USDA Resales | `backend/scrapers/usda.py` | TODO |

Har naye scraper ke liye:
1. `BaseScraper` extend karein (file: `backend/scrapers/base.py`)
2. `source` attribute set karein (e.g. `"fannie_mae"`)
3. `iter_properties()` implement karein jo `ScrapedProperty` yield kare
4. `backend/scrapers/__init__.py` ke `ALL_SCRAPERS` list mein add karein

---

## Important — agar HUD scraper kaam na kare

HUD Home Store ka layout time se time pe change hota hai. Agar scraper khali results de:

```powershell
# Debug screenshots enable karein:
$env:DEBUG = "1"
python scheduler.py now TX
```

`backend/data/` mein screenshots save honge jo dikhayenge page ne kaisa render kiya. Phir
`backend/scrapers/hud.py` ke selectors update karein (HTML structure ke hisaab se).

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'fastapi'`**
→ Virtual env activate nahi hai. `.\venv\Scripts\Activate.ps1` chalao.

**Frontend "Could not reach API" error**
→ Backend nahi chal raha. Pehle `python run_api.py` chalao alag window mein.

**`playwright._impl._errors.Error: Executable doesn't exist`**
→ `python -m playwright install chromium` run karo.

**SQLite locked**
→ Sirf ek hi process DB ko write karna chahiye. API aur scheduler agar dono chal rahe hain, scheduler
   ko thodi der ke liye band karein.

**`[WinError 10013] An attempt was made to access a socket...` (port 8000)**
→ Windows Hyper-V kuch ports reserve karta hai. Default port 8765 hai (config.py mein), lekin agar
   wo bhi blocked ho to `.env` file mein koi aur port set karein, jaise:
   ```
   API_PORT=9999
   ```
   Aur frontend ki `.env.local` mein bhi same port match karein:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:9999
   ```
   Reserved ports dekhne ke liye: `netsh interface ipv4 show excludedportrange protocol=tcp`

**Activate.ps1 par "execution policy" error**
→ Ek baar PowerShell mein run karein (admin nahi chahiye):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

---

## Legal / disclaimer

Yeh tool sirf **public government aur GSE sources** se data aggregate karta hai jo aam logon ke liye
publicly browsable hain (HUD.gov, HomePath, HomeSteps, etc.). Zillow/Realtor.com/Redfin jaisi sites ko
scrape **nahi** karta — wo unki ToS ke khilaaf hai.

Property kharidne se pehle hamesha listing agent se direct verify karein. Yeh tool sirf **discovery
ke liye** hai, transaction ke liye nahi.

---

## Deploy (optional, jab ready ho)

- **Frontend**: Vercel — `vercel --prod` (free tier)
- **Backend**: Railway ya Render — Dockerfile add karke `pip install -r requirements.txt && python run_api.py`
- **DB**: Production ke liye Postgres (Supabase free tier) — `DATABASE_URL` env var change karein
