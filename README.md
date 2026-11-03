# 💧 Find Your Hydration Personality

> A short, shareable personality quiz web application that turns your daily water intake into a fun personality, an emoji, a 5-trait radar chart, and relaxed, no-guilt advice — **with automated collection, storage, and analytics of all participant responses**.

Built strictly following the PRD specifications.

---

## 🌟 Key Features

### 1. 7-Question Fluid Quiz Flow (Mobile-First)
- **Question 1 (Intake - Heavy 50% Weight)**: Big tappable choice cards with a toggle between **Glasses (250ml)** and **Litres (L)**.
- **Questions 2 to 7 (Behavioral Nuances)**: 16Personalities-style **7-circle Agree / Disagree scale** (circles expand toward each end, color-coded per side).
- **Progress bar** with retro striped fill.
- **Back navigation** to review or update answers.
- **Inter-question hydration facts** ("💡 Did you know? Mild dehydration can affect cognitive alertness...").

### 2. Retro Pixel Loading Moment
- 1–2 second retro pixel kit window (`HYDRATION_ANALYZER_V1.EXE`).
- Animated pixel striped loading bar with playful status messages: *"Measuring daily sip patterns..."*, *"Consulting water deities..."*.

### 3. Rich, Shareable Results Screen
- **Mascot ("Droplet")**: Animated cute water-blob character with blushing cheeks that morphs into a custom pose/expression for each personality!
- **5 Quirky Personalities**:
  1. 🌵 **The Cactus** (0–2 glasses) — *"Runs on vibes and occasional chai"*
  2. 🐈 **The Casual Sipper** (3–4 glasses) — *"Drinks when reminded"*
  3. 🐢 **The Steady Turtle** (5–6 glasses) — *"Slow, consistent, unbothered"*
  4. 🐬 **The Happy Dolphin** (7–8 glasses) — *"Hydrated and thriving"*
  5. 🐋 **The Water Whale** (9+ glasses) — *"Basically a walking reservoir"*
- **5-Trait Radar Chart**: Volume, Consistency, Timing, Awareness, and Habit scored as percentages.
- **Superpower Card**: Highlights the respondent's highest trait with cheeky praise.
- **Growth Area Card**: Highlights the lowest trait with a gentle, encouraging nudge.
- **Chill Tip Card**: Relaxed, practical, no-guilt advice.
- **"Your Water Twin" line**: Celebrity-free quirky character trait.
- **Image Share Card**: Built-in canvas generator that exports a high-res shareable image card (`.png`).
- **Direct Link Sharing**: Reopen any result directly with `#result=steady_turtle`, etc.

---

## 🔐 Creator Portal & Access Control (Security Architecture)

To ensure privacy and prevent public respondents from viewing other participants' data:

1. **Hidden from Public Users**:
   - The top navigation bar and quiz results contain **no public link or button** to the responses dashboard.
   - Regular users only take the quiz and receive their own personality results.
2. **Accessing the Creator Portal**:
   - Click the discreet **"🔒 Creator Access"** button at the bottom of the footer, OR
   - Press the keyboard shortcut: **`Ctrl + Shift + C`**, OR
   - Visit: **`http://localhost:8080/#creator`**
3. **Creator Credentials**:
   - **Username**: `creator`
   - **Password**: `HydrateAdmin2026!`
   *(You can customize these anytime via `CREATOR_USERNAME` and `CREATOR_PASSWORD` environment variables or directly in `server.py`)*.
4. **Vulnerability Defense**:
   - **Timing-Attack Resistance**: Compares credentials using `hmac.compare_digest`.
   - **Brute-Force Rate Limiting**: Enforces an IP-level lockout after 5 consecutive failed attempts.
   - **Cryptographic Session Tokens**: Generates 256-bit random tokens (`secrets.token_hex(32)`) expiring after 4 hours.
   - **Server-Side Enforcement**: API endpoints (`/api/responses`, `/api/export-csv`, `/api/seed`, `/api/clear`) reject any unauthenticated requests with `401 Unauthorized`.
   - **CSV / Formula Injection Defense**: Sanitizes user inputs in spreadsheet exports to prevent malicious formula execution in Excel / Google Sheets.
   - **XSS & SQL Injection Defense**: HTML escaping on all rendered fields and parameterized SQLite queries.

---

## 🚀 How to Run the Website

### Option 1: Double-Click `start.bat`
Simply double-click `start.bat` in the project root folder.

### Option 2: Run via Terminal
```bash
python server.py
```
*(Or specify the Python 3.11 path)*:
```powershell
& "C:\Users\sai_s\AppData\Local\Programs\Python\Python311\python.exe" server.py
```

Then open your browser to:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## ☁️ Deploying to Render (Free Cloud Hosting)

The repository is already configured for one-click deployment on [Render](https://render.com):

1. **Push your code to GitHub / GitLab**.
2. **On Render Dashboard**:
   - Click **New +** -> **Web Service**.
   - Connect your repository.
   - Render will automatically detect the settings from `render.yaml`, or fill them manually:
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python server.py`
3. **Environment Variables** (in Render Dashboard -> Environment):
   - `CREATOR_USERNAME`: `creator` (or your chosen username)
   - `CREATOR_PASSWORD`: `HydrateAdmin2026!` (or your chosen secure password)
4. Click **Deploy Web Service**. Your app will be live on a public `https://your-app.onrender.com` URL with free SSL!

---

## 📁 Project Architecture

```
c:\UHV\
├── server.py                  # Python HTTP & REST API server
├── render.yaml                # Render deployment configuration
├── requirements.txt           # Python dependency file for Render
├── runtime.txt                # Python runtime definition (3.11)
├── Procfile                   # Process file for cloud hosts
├── start.bat                  # One-click Windows launcher
├── data\
│   ├── responses.json         # Persisted collection of responses
│   └── responses.db           # SQLite database for durable storage
└── static\
    ├── index.html             # Single-page web app (mobile-first)
    ├── css\
    │   └── style.css          # Pastel teal/cream theme, 7-circle scale, dark mode
    ├── js\
    │   ├── app.js             # State machine, scoring logic, radar chart, share card
    │   ├── mascot.js          # SVG droplet mascot & personality poses
    │   └── dashboard.js       # Responses collection viewer, table & CSV export
    └── data\
        └── quiz_data.json     # Questions, scoring weights & personality profiles
```
