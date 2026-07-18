import http.server
import socketserver
import json
import urllib.parse
import os
import sys
import yt_dlp
from ytmusicapi import YTMusic

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Initialize YTMusic anonymously for public searches and metadata
try:
    ytmusic = YTMusic()
except Exception as e:
    print("Warning: Failed to initialize YTMusic anonymously:", e)
    ytmusic = None

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
}

class NeumorphicPlayerHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Route API requests
        if path.startswith('/api/'):
            self.handle_api(path, query)
        else:
            self.handle_static(path)

    def handle_static(self, path):
        # Normalize and resolve file path
        if path == '/':
            path = '/index.html'
        
        file_path = os.path.normpath(os.path.join(DIRECTORY, path.lstrip('/')))
        
        # Security check to prevent directory traversal
        if not file_path.startswith(DIRECTORY):
            self.send_error_response(403, "Forbidden")
            return

        if os.path.exists(file_path) and os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            mime = MIME_TYPES.get(ext, 'application/octet-stream')
            
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                self.send_response(200)
                self.send_header('Content-Type', mime)
                self.send_header('Content-Length', len(content))
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_error_response(500, f"Internal Server Error: {str(e)}")
        else:
            self.send_error_response(404, "Not Found")

    def handle_api(self, path, query):
        if not ytmusic:
            self.send_api_json({"status": 500, "message": "YouTube Music API client not initialized"}, 500)
            return

        # 1. SEARCH ENDPOINT: /api/search?q={query}&filter={songs|videos|albums}
        if path == '/api/search':
            q_list = query.get('q')
            filter_list = query.get('filter')
            
            if not q_list or not q_list[0].strip():
                self.send_api_json({"status": 400, "message": "Missing search query parameter 'q'"}, 400)
                return
                
            q = q_list[0].strip()
            # Mapping filter (songs, videos, albums)
            search_filter = filter_list[0].strip() if filter_list else "songs"
            if search_filter not in ["songs", "videos", "albums"]:
                search_filter = "songs"
                
            try:
                print(f"[API] Searching YouTube Music for: '{q}' [filter={search_filter}]")
                results = ytmusic.search(q, filter=search_filter)
                
                formatted_response = []
                for item in results:
                    # Parse standard identifiers depending on the result type
                    video_id = item.get('videoId')
                    # For albums, ytmusic returns albumId
                    item_id = video_id if video_id else item.get('browseId')
                    
                    if not item_id:
                        continue
                        
                    title = item.get('title', 'Unknown')
                    
                    # Artists list parser
                    artists_list = item.get('artists', [])
                    artist_name = "Unknown Artist"
                    if isinstance(artists_list, list) and len(artists_list) > 0:
                        artist_name = ", ".join([a.get('name', 'Unknown') for a in artists_list if a.get('name')])
                    elif isinstance(item.get('artists'), str):
                        artist_name = item.get('artists')
                        
                    # Thumbnails parser (pick the highest resolution thumbnail, which is usually last)
                    thumbnails = item.get('thumbnails', [])
                    img_url = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=150&h=150&fit=crop"
                    if isinstance(thumbnails, list) and len(thumbnails) > 0:
                        img_url = thumbnails[-1].get('url', img_url)

                    formatted_response.append({
                        "id": item_id,
                        "title": title,
                        "artist": artist_name,
                        "img": img_url,
                        "type": search_filter
                    })
                
                self.send_api_json({
                    "status": 200,
                    "response": formatted_response,
                    "message": "success"
                })
            except Exception as e:
                print(f"[API Error] Search failed: {e}")
                self.send_api_json({"status": 500, "message": f"Search failed: {str(e)}"}, 500)

        # 2. PROXY STREAM ENDPOINT: /api/stream?id={videoId}
        elif path == '/api/stream':
            id_list = query.get('id')
            if not id_list or not id_list[0].strip():
                self.send_error_response(400, "Missing video ID parameter 'id'")
                return
                
            video_id = id_list[0].strip()
            print(f"[API] Proxy streaming for Video ID: '{video_id}'")
            
            try:
                # Setup optimized yt-dlp options for streaming
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'quiet': True,
                    'no_warnings': True,
                    'skip_download': True,
                    'nocheckcertificate': True,
                }
                
                # Fetch audio stream link directly from YouTube
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
                    if not info or 'url' not in info:
                        info = ydl.extract_info(f"https://music.youtube.com/watch?v={video_id}", download=False)
                    
                    if info and 'url' in info:
                        stream_url = info['url']
                        
                        # Open connection to the actual stream URL forwarding client's Range header
                        range_header = self.headers.get('Range')
                        headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                        if range_header:
                            headers['Range'] = range_header
                            print(f"[API] Client requested byte range: {range_header}")
                            
                        import urllib.request
                        req = urllib.request.Request(stream_url, headers=headers)
                        
                        try:
                            with urllib.request.urlopen(req) as response_stream:
                                content_type = response_stream.headers.get('Content-Type', 'audio/mpeg')
                                content_length = response_stream.headers.get('Content-Length')
                                content_range = response_stream.headers.get('Content-Range')
                                status_code = response_stream.getcode()
                                
                                self.send_response(status_code)
                                self.send_header('Content-Type', content_type)
                                if content_length:
                                    self.send_header('Content-Length', content_length)
                                if content_range:
                                    self.send_header('Content-Range', content_range)
                                self.send_header('Access-Control-Allow-Origin', '*')
                                self.send_header('Accept-Ranges', 'bytes')
                                self.end_headers()
                                
                                # Pipe stream bytes to client in chunks
                                chunk_size = 64 * 1024 # 64KB chunks
                                try:
                                    while True:
                                        chunk = response_stream.read(chunk_size)
                                        if not chunk:
                                            break
                                        self.wfile.write(chunk)
                                except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, OSError):
                                    # Client disconnected or paused, finish silently
                                    pass
                        except Exception as stream_err:
                            print(f"[API Error] Proxy stream connection failed: {stream_err}")
                            self.send_error_response(502, f"Proxy Connection Error: {str(stream_err)}")
                    else:
                        self.send_error_response(404, "Stream URL not found")
            except Exception as e:
                print(f"[API Error] Stream proxying failed: {e}")
                self.send_error_response(500, f"Stream proxying failed: {str(e)}")

        # 3. ALBUM TRACKS ENDPOINT: /api/album?id={browseId}
        elif path == '/api/album':
            id_list = query.get('id')
            if not id_list or not id_list[0].strip():
                self.send_api_json({"status": 400, "message": "Missing browse ID parameter 'id'"}, 400)
                return
                
            browse_id = id_list[0].strip()
            print(f"[API] Fetching album details for Album ID: '{browse_id}'")
            
            try:
                album_details = ytmusic.get_album(browse_id)
                tracks = album_details.get('tracks', [])
                
                formatted_response = []
                # Check for cover image
                thumbnails = album_details.get('thumbnails', [])
                img_url = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=150&h=150&fit=crop"
                if isinstance(thumbnails, list) and len(thumbnails) > 0:
                    img_url = thumbnails[-1].get('url', img_url)

                for item in tracks:
                    video_id = item.get('videoId')
                    if not video_id:
                        continue
                        
                    title = item.get('title', 'Unknown')
                    
                    # Artists list parser
                    artists_list = item.get('artists', [])
                    artist_name = album_details.get('artist', 'Unknown Artist')
                    if isinstance(artists_list, list) and len(artists_list) > 0:
                        artist_name = ", ".join([a.get('name', 'Unknown') for a in artists_list if a.get('name')])
                    elif isinstance(item.get('artists'), str):
                        artist_name = item.get('artists')

                    formatted_response.append({
                        "id": video_id,
                        "title": title,
                        "artist": artist_name,
                        "img": img_url,
                        "type": "songs"
                    })
                
                self.send_api_json({
                    "status": 200,
                    "response": formatted_response,
                    "message": "success"
                })
            except Exception as e:
                print(f"[API Error] Album fetch failed for ID {browse_id}: {e}")
                self.send_api_json({"status": 500, "message": f"Album fetch failed: {str(e)}"}, 500)

        # 4. LYRICS ENDPOINT: /api/lyrics?id={videoId}
        elif path == '/api/lyrics':
            id_list = query.get('id')
            if not id_list or not id_list[0].strip():
                self.send_api_json({"status": 400, "message": "Missing ID parameter 'id'"}, 400)
                return
                
            video_id = id_list[0].strip()
            print(f"[API] Fetching lyrics for Video ID: '{video_id}'")
            
            try:
                # get watch playlist to retrieve lyrics token
                playlist = ytmusic.get_watch_playlist(videoId=video_id)
                lyrics_token = playlist.get('lyrics')
                
                if lyrics_token:
                    # retrieve lyrics data
                    lyrics_data = ytmusic.get_lyrics(lyrics_token)
                    lyrics_text = lyrics_data.get('lyrics', '')
                    
                    if lyrics_text:
                        # Format newlines into HTML paragraphs for the frontend scroll container
                        lyrics_html = "".join([f"<p>{line.strip()}</p>" for line in lyrics_text.split("\n") if line.strip()])
                        self.send_api_json({
                            "status": 200,
                            "response": lyrics_html,
                            "message": "success"
                        })
                        return
                
                self.send_api_json({"status": 404, "message": "Lyrics not available for this song"}, 404)
            except Exception as e:
                print(f"[API Error] Lyrics fetch failed for ID {video_id}: {e}")
                self.send_api_json({"status": 500, "message": f"Lyrics fetch failed: {str(e)}"}, 500)
                
        else:
            self.send_error_response(404, "API Endpoint Not Found")

    def send_api_json(self, data, status_code=200):
        response_bytes = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(response_bytes))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response_bytes)

    def send_error_response(self, code, message):
        response_bytes = f"{code} {message}".encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', len(response_bytes))
        self.end_headers()
        self.wfile.write(response_bytes)

def run():
    # Use ThreadingHTTPServer to handle requests concurrently in background threads
    handler = NeumorphicPlayerHandler
    with http.server.ThreadingHTTPServer(("", PORT), handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"==================================================")
        print(f" AeroMusic Python Server Started Successfully!     ")
        print(f" Integrated with YouTube Music (ytmusicapi & yt_dlp)")
        print(f" Serving UI at: http://localhost:{PORT}/           ")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)

if __name__ == '__main__':
    run()
