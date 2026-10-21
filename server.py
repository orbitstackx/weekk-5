"""Tiny dev server with SPA fallback: unknown paths return index.html so deep links work.
Run:  python3 server.py   then open http://localhost:8000"""
import http.server, os, socketserver

class SPA(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path.split('?')[0])
        if not os.path.isfile(path):
            self.path = '/index.html'
        return super().do_GET()

with socketserver.TCPServer(('', 8000), SPA) as s:
    print('Serving on http://localhost:8000'); s.serve_forever()
