"""
QTRF v1.273 - Local Development Server
Serves the Quantum Geometric Viewer
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8273  # κ ≈ 1.273

class QTRFHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with CORS and proper MIME types."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def log_message(self, format, *args):
        print(f"[QTRF] {args[0]}")


def main():
    os.chdir(Path(__file__).parent)
    
    print("=" * 60)
    print("  🌀 QTRF v1.273 - Quantum Geometric Viewer")
    print("=" * 60)
    print(f"\n  Starting server on port {PORT}...")
    print(f"\n  Open: http://localhost:{PORT}")
    print(f"\n  κ = 4/π ≈ 1.2732395447")
    print("\n  Press Ctrl+C to stop\n")
    print("=" * 60)
    
    with socketserver.TCPServer(("", PORT), QTRFHandler) as httpd:
        # Open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n  Server stopped. 🌀")


if __name__ == '__main__':
    main()
