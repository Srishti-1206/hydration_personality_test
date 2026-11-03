#!/usr/bin/env python3
"""
Vercel Serverless Function entry point for Find Your Hydration Personality API.
Directs requests from /api/* to the HydrationAppHandler.
"""
import os
import sys

# Ensure root directory is on the import path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Force serverless mode
os.environ["VERCEL"] = "1"

from server import HydrationAppHandler

# Vercel looks specifically for a class or callable named `handler`
class handler(HydrationAppHandler):
    pass
