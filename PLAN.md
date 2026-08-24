# Implementation Plan - Routes Race

- [x] **Step 1: Basic Web Page Setup**
  - Create `PLAN.md` to track progress.
  - Create `index.html`, `style.css`, and `app.js`.
  - Build UI layout with sidebar controls and main canvas area for the map.

- [x] **Step 2: Photo Upload & Canvas Display**
  - Implement photo upload handler.
  - Draw image on HTML5 Canvas maintaining aspect ratio and using max viewport space.
  - Handle window resize events dynamically.

- [ ] **Step 3: Map Calibration (Corner Coordinates)**
  - Add input fields for Top-Right (lat, lon) and Bottom-Left (lat, lon).
  - Implement coordinate projection (Lat/Lon to Canvas X/Y).
  - Render corner calibration indicators on canvas.

- [ ] **Step 4: GPX File Parser**
  - Parse GPX trackpoints (`lat`, `lon`, `time`).
  - Normalize timestamps so all runs start at relative time $t = 0$.

- [ ] **Step 5: Animation Engine & Playback Controls**
  - Add Play/Pause, Reset, Speed selector (1x, 2x, 5x, 10x, 20x), and Timeline slider.
  - Implement requestAnimationFrame loop with position interpolation between trackpoints.

- [ ] **Step 6: Runner Rendering & Overlay**
  - Render colored circles for each active runner on the canvas.
  - Render digital timestamp/clock overlay.
  - Render path trails behind runners.

- [ ] **Step 7: Multi-Runner Race Support & Multi-File Upload**
  - Support uploading multiple GPX files.
  - Assign distinct colors for each runner and sync playback from $t=0$.
