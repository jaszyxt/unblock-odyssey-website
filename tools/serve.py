#!/usr/bin/env python3
"""Local dev server for the website with cache disabled (fresh modules on every reload).

Usage:  python website/tools/serve.py [port]
"""

import functools
import http.server
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
ROOT = Path(__file__).resolve().parents[1]


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


handler = functools.partial(NoCacheHandler, directory=str(ROOT))
print(f"Serving {ROOT} at http://127.0.0.1:{PORT} (cache disabled)")
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler).serve_forever()
