# AeroMusic - Neumorphic Audio System (v1.0.0-beta)

A premium **Tactile Neumorphic (Soft UI)** Music Application built with vanilla HTML5, CSS3, and JavaScript, integrated directly with **YouTube Music** via a multi-threaded Python backend stream proxy.

![AeroMusic Interface]

## Features
- **Tactile Neumorphic (Soft UI) Styling:** Sleek charcoal theme (`#1e222b`) with beveled physical deck key controls, rocker-switch panel tabs, and custom seek bar grooves.
- **YouTube Music API Integration:** Live search queries with category filters: **Songs**, **Videos**, and **Albums**.
- **Multi-Threaded Proxy Streaming:** Prevents browser CORS blocks by piping YouTube audio chunks dynamically through concurrent background threads.
- **HTTP Range Requests support:** Restores seamless seek timeline dragging and instant media buffering ("in a blink").
- **Album Playback Support:** Toggling an album search card automatically fetches all album tracks, populates the **Play Queue**, and plays immediately.
- **Visualizer Gauge:** Circular pink visualizer bouncing dynamically to the active audio track frequency.
- **Live Retrieved Lyrics:** Fetches and scrolls synced song lyrics from YouTube Music in the right sidebar.

---

## Requirements

The application runs locally on **Python 3.7+** and requires the following libraries:
- `ytmusicapi` - For YouTube Music API data (searches, metadata, lyrics, albums)
- `yt-dlp` - For YouTube streaming source extraction

To install these requirements, run:
```bash
pip install ytmusicapi yt-dlp
```

---

## How to Run

1. Clone or download the files on this branch.
2. Open your terminal in the directory and start the concurrent Python server:
   ```bash
   python serve.py
   ```
3. Open your browser and navigate to:
   👉 **[http://localhost:8080/](http://localhost:8080/)**
4. Enjoy listening to live tracks, albums, and videos!
