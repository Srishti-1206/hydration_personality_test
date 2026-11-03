#!/usr/bin/env python3
"""
Vercel Serverless Function entry point for Find Your Hydration Personality API.
Directs requests from /api/* to the HydrationAppHandler.
"""
import os
import sys
from urllib.parse import urlparse, parse_qs

# Ensure root directory is on the import path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Force serverless mode
os.environ["VERCEL"] = "1"

from server import HydrationAppHandler

class handler(HydrationAppHandler):
    def resolve_actual_path(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        if "_route" in qs:
            route = qs["_route"][0].lstrip("/")
            return f"/api/{route}"
        matched = self.headers.get("x-matched-path", "")
        if matched.startswith("/api/"):
            return matched.split("?")[0]
        if parsed.path.startswith("/api/"):
            return parsed.path
        return parsed.path

    def do_GET(self):
        actual_path = self.resolve_actual_path()
        original_path = self.path
        self.path = actual_path
        try:
            if actual_path == "/api/creator/check":
                if self.verify_auth_token():
                    self.send_json(200, {"authenticated": True})
                else:
                    self.send_json(401, {"authenticated": False, "error": "Unauthorized"})
                return
            elif actual_path == "/api/responses":
                return super().do_GET()
            elif actual_path == "/api/export-csv":
                return super().do_GET()
            else:
                self.send_json(404, {"success": False, "error": f"API endpoint not found: {actual_path}"})
                return
        finally:
            self.path = original_path

    def do_POST(self):
        actual_path = self.resolve_actual_path()
        original_path = self.path
        self.path = actual_path
        try:
            if actual_path in [
                "/api/responses",
                "/api/creator/login",
                "/api/creator/logout",
                "/api/seed",
                "/api/clear"
            ]:
                return super().do_POST()
            else:
                self.send_json(404, {"success": False, "error": f"API endpoint not found: {actual_path}"})
                return
        finally:
            self.path = original_path

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_security_headers()
        self.end_headers()
