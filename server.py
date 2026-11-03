#!/usr/bin/env python3
"""
Find Your Hydration Personality - Hardened Backend Server
Features:
- Zero external dependencies (Python standard library only)
- Constant-time credential authentication
- Cryptographically secure session tokens
- Brute-force rate limiting & lockout
- CSV injection (formula injection) defense
- Server-side authorization on all creator endpoints
"""

import os
import sys
import json
import sqlite3
import csv
import io
import time
import secrets
import hmac
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import tempfile

PORT = int(os.environ.get("PORT", 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Support serverless read-only filesystems (e.g., Vercel)
if os.environ.get("VERCEL"):
    DATA_DIR = os.path.join(tempfile.gettempdir(), "hydration_data")
else:
    DATA_DIR = os.path.join(BASE_DIR, "data")

JSON_STORE_PATH = os.path.join(DATA_DIR, "responses.json")
DB_PATH = os.path.join(DATA_DIR, "responses.db")

# Hardcoded Creator Credentials (configurable via env vars)
CREATOR_USERNAME = os.environ.get("CREATOR_USERNAME", "creator")
CREATOR_PASSWORD = os.environ.get("CREATOR_PASSWORD", "HydrateAdmin2026!")

# In-memory session store: token -> {"created": float, "expires": float, "ip": str}
ACTIVE_SESSIONS = {}
SESSION_LIFETIME_SECS = 4 * 3600  # 4 hours

# Rate limiting for login attempts: ip -> list of timestamps
FAILED_LOGIN_ATTEMPTS = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_PERIOD_SECS = 60

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)


# Initialize SQLite database
def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            id TEXT PRIMARY KEY,
            user_name TEXT,
            created_at TEXT,
            personality_id TEXT,
            personality_name TEXT,
            emoji TEXT,
            total_score REAL,
            q1_intake TEXT,
            trait_volume REAL,
            trait_consistency REAL,
            trait_timing REAL,
            trait_awareness REAL,
            trait_habit REAL,
            answers_json TEXT,
            metadata_json TEXT
        )
    """)
    try:
        cursor.execute("ALTER TABLE responses ADD COLUMN user_name TEXT")
    except Exception:
        pass
    conn.commit()
    conn.close()

    # Ensure JSON file exists
    if not os.path.exists(JSON_STORE_PATH):
        seed_source = os.path.join(BASE_DIR, "data", "responses.json")
        initial_data = []
        if os.path.exists(seed_source) and seed_source != JSON_STORE_PATH:
            try:
                with open(seed_source, "r", encoding="utf-8") as sf:
                    initial_data = json.load(sf)
            except Exception:
                initial_data = []
        with open(JSON_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(initial_data, f, indent=2)

init_db()


def read_all_responses():
    try:
        if os.path.exists(JSON_STORE_PATH):
            with open(JSON_STORE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading JSON responses: {e}")
    return []


def save_response(item):
    responses = read_all_responses()
    responses.insert(0, item)  # Latest first
    with open(JSON_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(responses, f, indent=2, ensure_ascii=False)

    # Save to SQLite
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        traits = item.get("traits", {})
        answers = item.get("answers", {})
        cursor.execute("""
            INSERT OR REPLACE INTO responses (
                id, user_name, created_at, personality_id, personality_name, emoji, total_score,
                q1_intake, trait_volume, trait_consistency, trait_timing,
                trait_awareness, trait_habit, answers_json, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item.get("id"),
            item.get("userName", "Anonymous"),
            item.get("createdAt", datetime.utcnow().isoformat()),
            item.get("personalityId"),
            item.get("personalityName"),
            item.get("emoji"),
            item.get("totalScore", 0),
            str(answers.get("q1", "")),
            traits.get("volume", 0),
            traits.get("consistency", 0),
            traits.get("timing", 0),
            traits.get("awareness", 0),
            traits.get("habit", 0),
            json.dumps(answers),
            json.dumps(item.get("metadata", {}))
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"SQLite save error: {e}")

    return item


def sanitize_csv_cell(val):
    """
    Defend against CSV Injection / Formula Injection in Excel and Google Sheets.
    If a string starts with =, +, -, @ or tab, prepend a single quote.
    """
    s = str(val if val is not None else "")
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    return s


def generate_csv_data():
    responses = read_all_responses()
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Participant Name",
        "Submission ID",
        "Timestamp",
        "Personality ID",
        "Personality Name",
        "Emoji",
        "Total Score",
        "Q1 Intake Option",
        "Volume (%)",
        "Consistency (%)",
        "Timing (%)",
        "Awareness (%)",
        "Habit (%)",
        "Q2 Morning (1-7)",
        "Q3 Bottle (1-7)",
        "Q4 Thirst (1-7)",
        "Q5 Meals (1-7)",
        "Q6 Busy Day (1-7)",
        "Q7 Friends (1-7)",
        "Unit Toggle"
    ])

    for r in responses:
        answers = r.get("answers", {})
        traits = r.get("traits", {})
        metadata = r.get("metadata", {})
        writer.writerow([
            sanitize_csv_cell(r.get("userName", "Anonymous")),
            sanitize_csv_cell(r.get("id", "")),
            sanitize_csv_cell(r.get("createdAt", "")),
            sanitize_csv_cell(r.get("personalityId", "")),
            sanitize_csv_cell(r.get("personalityName", "")),
            r.get("emoji", ""),
            r.get("totalScore", ""),
            sanitize_csv_cell(answers.get("q1", "")),
            traits.get("volume", ""),
            traits.get("consistency", ""),
            traits.get("timing", ""),
            traits.get("awareness", ""),
            traits.get("habit", ""),
            answers.get("q2", ""),
            answers.get("q3", ""),
            answers.get("q4", ""),
            answers.get("q5", ""),
            answers.get("q6", ""),
            answers.get("q7", ""),
            sanitize_csv_cell(metadata.get("unitMode", "glasses"))
        ])

    return output.getvalue()


def seed_sample_responses():
    samples = [
        {
            "id": "resp_sample_01",
            "userName": "Alex Kim",
            "createdAt": "2026-11-03T09:14:22Z",
            "personalityId": "cactus",
            "personalityName": "The Cactus",
            "emoji": "🌵",
            "totalScore": 1.4,
            "traits": {"volume": 20, "consistency": 25, "timing": 18, "awareness": 30, "habit": 22},
            "answers": {"q1": "0-2", "q2": 1, "q3": 2, "q4": 3, "q5": 2, "q6": 2, "q7": 1},
            "metadata": {"unitMode": "glasses", "timeTakenSec": 48}
        },
        {
            "id": "resp_sample_02",
            "userName": "Maya Patel",
            "createdAt": "2026-11-03T10:05:10Z",
            "personalityId": "casual_sipper",
            "personalityName": "The Casual Sipper",
            "emoji": "🐈",
            "totalScore": 3.6,
            "traits": {"volume": 42, "consistency": 46, "timing": 38, "awareness": 52, "habit": 44},
            "answers": {"q1": "3-4", "q2": 3, "q3": 4, "q4": 5, "q5": 4, "q6": 3, "q7": 3},
            "metadata": {"unitMode": "glasses", "timeTakenSec": 62}
        },
        {
            "id": "resp_sample_03",
            "userName": "Liam Chen",
            "createdAt": "2026-11-03T11:20:45Z",
            "personalityId": "steady_turtle",
            "personalityName": "The Steady Turtle",
            "emoji": "🐢",
            "totalScore": 5.8,
            "traits": {"volume": 68, "consistency": 76, "timing": 64, "awareness": 70, "habit": 72},
            "answers": {"q1": "5-6", "q2": 5, "q3": 6, "q4": 6, "q5": 5, "q6": 5, "q7": 5},
            "metadata": {"unitMode": "glasses", "timeTakenSec": 75}
        },
        {
            "id": "resp_sample_04",
            "userName": "Sophia Garcia",
            "createdAt": "2026-11-03T11:58:30Z",
            "personalityId": "happy_dolphin",
            "personalityName": "The Happy Dolphin",
            "emoji": "🐬",
            "totalScore": 7.8,
            "traits": {"volume": 88, "consistency": 85, "timing": 82, "awareness": 90, "habit": 86},
            "answers": {"q1": "7-8", "q2": 6, "q3": 7, "q4": 6, "q5": 6, "q6": 6, "q7": 6},
            "metadata": {"unitMode": "litres", "timeTakenSec": 58}
        },
        {
            "id": "resp_sample_05",
            "userName": "Jordan Taylor",
            "createdAt": "2026-11-03T12:35:12Z",
            "personalityId": "water_whale",
            "personalityName": "The Water Whale",
            "emoji": "🐋",
            "totalScore": 9.4,
            "traits": {"volume": 98, "consistency": 95, "timing": 92, "awareness": 94, "habit": 96},
            "answers": {"q1": "9+", "q2": 7, "q3": 7, "q4": 7, "q5": 7, "q6": 6, "q7": 7},
            "metadata": {"unitMode": "glasses", "timeTakenSec": 52}
        }
    ]
    for sample in reversed(samples):
        save_response(sample)
    return len(samples)


def clean_expired_sessions():
    now = time.time()
    expired = [t for t, s in ACTIVE_SESSIONS.items() if s["expires"] < now]
    for t in expired:
        del ACTIVE_SESSIONS[t]


class HydrationAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def send_security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_security_headers()
        self.end_headers()

    def get_client_ip(self):
        return self.client_address[0] if self.client_address else "127.0.0.1"

    def is_rate_limited(self):
        ip = self.get_client_ip()
        now = time.time()
        attempts = FAILED_LOGIN_ATTEMPTS.get(ip, [])
        # Keep only attempts in lockout window
        recent = [t for t in attempts if now - t < LOCKOUT_PERIOD_SECS]
        FAILED_LOGIN_ATTEMPTS[ip] = recent
        return len(recent) >= MAX_FAILED_ATTEMPTS

    def record_failed_attempt(self):
        ip = self.get_client_ip()
        now = time.time()
        if ip not in FAILED_LOGIN_ATTEMPTS:
            FAILED_LOGIN_ATTEMPTS[ip] = []
        FAILED_LOGIN_ATTEMPTS[ip].append(now)

    def clear_failed_attempts(self):
        ip = self.get_client_ip()
        if ip in FAILED_LOGIN_ATTEMPTS:
            del FAILED_LOGIN_ATTEMPTS[ip]

    def verify_auth_token(self):
        """
        Extract and verify Bearer token from Authorization header or URL query parameter.
        Uses timing-safe comparison and checks expiry.
        """
        clean_expired_sessions()
        token = None

        # Check Authorization: Bearer <token>
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

        # Fallback to ?token= query parameter (for direct file downloads)
        if not token:
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            if "token" in query:
                token = query["token"][0].strip()

        if not token or token not in ACTIVE_SESSIONS:
            return False

        session = ACTIVE_SESSIONS[token]
        if time.time() > session["expires"]:
            del ACTIVE_SESSIONS[token]
            return False

        return True

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_security_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # -------------------------------------------------------------
        # 1. Creator Session Validation Endpoint
        # -------------------------------------------------------------
        if path == "/api/creator/check":
            if self.verify_auth_token():
                self.send_json(200, {"authenticated": True})
            else:
                self.send_json(401, {"authenticated": False, "error": "Unauthorized"})
            return

        # -------------------------------------------------------------
        # 2. Protected API: Get All Responses & Analytics (Creator Only)
        # -------------------------------------------------------------
        elif path == "/api/responses":
            if not self.verify_auth_token():
                self.send_json(401, {
                    "success": False,
                    "error": "Authentication required. Creator login required to access responses."
                })
                return

            responses = read_all_responses()
            total = len(responses)
            counts = {"cactus": 0, "casual_sipper": 0, "steady_turtle": 0, "happy_dolphin": 0, "water_whale": 0}
            avg_traits = {"volume": 0, "consistency": 0, "timing": 0, "awareness": 0, "habit": 0}

            for r in responses:
                p_id = r.get("personalityId", "")
                if p_id in counts:
                    counts[p_id] += 1
                traits = r.get("traits", {})
                for k in avg_traits:
                    avg_traits[k] += traits.get(k, 50)

            if total > 0:
                for k in avg_traits:
                    avg_traits[k] = round(avg_traits[k] / total, 1)

            payload = {
                "success": True,
                "total": total,
                "counts": counts,
                "avgTraits": avg_traits,
                "responses": responses
            }
            self.send_json(200, payload)
            return

        # -------------------------------------------------------------
        # 3. Protected API: Export CSV (Creator Only)
        # -------------------------------------------------------------
        elif path == "/api/export-csv":
            if not self.verify_auth_token():
                self.send_json(401, {
                    "success": False,
                    "error": "Authentication required to export response data."
                })
                return

            csv_content = generate_csv_data()
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="hydration_quiz_responses.csv"')
            self.send_header("Cache-Control", "no-store")
            self.send_security_headers()
            self.end_headers()
            self.wfile.write(csv_content.encode("utf-8"))
            return

        # -------------------------------------------------------------
        # 4. Route Shortcuts -> Serve index.html
        # -------------------------------------------------------------
        elif path in ["/responses", "/admin", "/creator", "/result"]:
            self.path = "/index.html"
            return super().do_GET()

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # -------------------------------------------------------------
        # 1. Creator Login Authentication Endpoint
        # -------------------------------------------------------------
        if path == "/api/creator/login":
            if self.is_rate_limited():
                self.send_json(429, {
                    "success": False,
                    "error": f"Too many failed login attempts. Please wait {LOCKOUT_PERIOD_SECS} seconds."
                })
                return

            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 4096:
                self.send_json(413, {"success": False, "error": "Payload too large"})
                return

            try:
                body = self.rfile.read(content_length)
                data = json.loads(body.decode("utf-8"))
                user = str(data.get("username", "")).strip()
                pwd = str(data.get("password", "")).strip()

                # Timing-attack safe comparisons using hmac.compare_digest
                user_match = hmac.compare_digest(user, CREATOR_USERNAME)
                pass_match = hmac.compare_digest(pwd, CREATOR_PASSWORD)

                if user_match and pass_match:
                    self.clear_failed_attempts()
                    clean_expired_sessions()
                    # Cryptographically secure 256-bit token
                    token = secrets.token_hex(32)
                    now = time.time()
                    ACTIVE_SESSIONS[token] = {
                        "created": now,
                        "expires": now + SESSION_LIFETIME_SECS,
                        "ip": self.get_client_ip()
                    }
                    self.send_json(200, {
                        "success": True,
                        "token": token,
                        "expiresIn": SESSION_LIFETIME_SECS,
                        "message": "Creator authenticated successfully"
                    })
                    return
                else:
                    time.sleep(0.3)  # Small defensive delay against automated crackers
                    self.record_failed_attempt()
                    self.send_json(401, {
                        "success": False,
                        "error": "Invalid creator credentials."
                    })
                    return
            except Exception as e:
                self.send_json(400, {"success": False, "error": "Invalid request"})
                return

        # -------------------------------------------------------------
        # 2. Creator Logout Endpoint
        # -------------------------------------------------------------
        elif path == "/api/creator/logout":
            auth_header = self.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()
                if token in ACTIVE_SESSIONS:
                    del ACTIVE_SESSIONS[token]
            self.send_json(200, {"success": True, "message": "Logged out successfully"})
            return

        # -------------------------------------------------------------
        # 3. Public Quiz Submission (Participants Submit Answers)
        # -------------------------------------------------------------
        elif path == "/api/responses":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 16384:
                self.send_json(413, {"success": False, "error": "Payload too large"})
                return

            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode("utf-8"))
                submission_id = data.get("id") or f"resp_{int(time.time() * 1000)}"
                raw_name = str(data.get("userName") or "").strip()[:50]  # Cap length to 50 chars

                record = {
                    "id": submission_id,
                    "userName": raw_name or "Anonymous",
                    "createdAt": datetime.utcnow().isoformat() + "Z",
                    "personalityId": str(data.get("personalityId", "steady_turtle")),
                    "personalityName": str(data.get("personalityName", "The Steady Turtle")),
                    "emoji": str(data.get("emoji", "🐢")),
                    "totalScore": round(float(data.get("totalScore", 0)), 2),
                    "traits": data.get("traits", {}),
                    "answers": data.get("answers", {}),
                    "metadata": data.get("metadata", {})
                }
                save_response(record)

                # Return clean confirmation without revealing other participants' records
                self.send_json(201, {
                    "success": True,
                    "id": submission_id,
                    "message": "Hydration response successfully submitted!"
                })
            except Exception as e:
                self.send_json(400, {"success": False, "error": "Malformed submission payload"})
            return

        # -------------------------------------------------------------
        # 4. Protected API: Seed Sample Data (Creator Only)
        # -------------------------------------------------------------
        elif path == "/api/seed":
            if not self.verify_auth_token():
                self.send_json(401, {"success": False, "error": "Unauthorized"})
                return
            count = seed_sample_responses()
            self.send_json(200, {"success": True, "seeded": count})
            return

        # -------------------------------------------------------------
        # 5. Protected API: Clear Responses (Creator Only)
        # -------------------------------------------------------------
        elif path == "/api/clear":
            if not self.verify_auth_token():
                self.send_json(401, {"success": False, "error": "Unauthorized"})
                return
            with open(JSON_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump([], f)
            conn = sqlite3.connect(DB_PATH)
            conn.cursor().execute("DELETE FROM responses")
            conn.commit()
            conn.close()
            self.send_json(200, {"success": True, "message": "All responses cleared"})
            return

        self.send_response(404)
        self.end_headers()


def run():
    existing = read_all_responses()
    if not existing:
        print("[Hydration Server] Populating initial demo responses for dashboard...")
        seed_sample_responses()

    server = HTTPServer(("0.0.0.0", PORT), HydrationAppHandler)
    print("================================================================")
    print(f"[Hydration App] Server running at http://localhost:{PORT}")
    print(f"🔒 Creator Access protected with Username & Password")
    print("================================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()

if __name__ == "__main__":
    run()
