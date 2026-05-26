import http.server
import socketserver
import os
import sys

PORT = 3000

class SPAServer(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Clean path and check if file exists
        translated_path = self.translate_path(self.path)
        
        # If the requested path is not a file or directory on disk, serve index.html for SPA router
        if not os.path.exists(translated_path):
            self.path = '/index.html'
            
        return super().do_GET()

# Ensure standard MIME types are supported for JavaScript on Windows
SPAServer.extensions_map.update({
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
})

with socketserver.TCPServer(("", PORT), SPAServer) as httpd:
    print(f"==================================================")
    print(f" Sentix Dev Server running on http://localhost:{PORT}")
    print(f" To run tests: http://localhost:{PORT}/test_runner.html")
    print(f" Press Ctrl+C to stop the server")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        sys.exit(0)
