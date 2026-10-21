# LearnHub - SPA Simulation
Vanilla HTML/CSS/JS single page application with History API routing.

## Run
Open `index.html` in a browser (double-click, VS Code Live Server, or any static host). URLs look like `index.html#/courses`.
Optional: `python3 server.py` -> http://localhost:8000

## Structure
index.html - shell | assets/css/style.css - styles | assets/js/app.js - router, views, state | server.py - dev server with SPA fallback

## Try
`#/courses/3` (detail), `#/nope` (404), `#/courses?fail` (simulated error + retry)
