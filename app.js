const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const mapUpload = document.getElementById('mapUpload');
const mapInfo = document.getElementById('mapInfo');
const trCoordInput = document.getElementById('trCoord');
const blCoordInput = document.getElementById('blCoord');
const gpxUpload = document.getElementById('gpxUpload');
const runsList = document.getElementById('runsList');
const btnPlay = document.getElementById('btnPlay');
const btnReset = document.getElementById('btnReset');
const speedSelect = document.getElementById('speedSelect');
const timeline = document.getElementById('timeline');
const timeDisplay = document.getElementById('timeDisplay');

let mapImage = null;
let runs = [];

let playing = false;
let currentTime = 0;
let speed = 5;
let lastFrameTime = null;
let animFrameId = null;

function parseCoord(str) {
  const parts = str.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lon: parts[1] };
  }
  return null;
}

function getCornerCoords() {
  const tr = parseCoord(trCoordInput.value);
  const bl = parseCoord(blCoordInput.value);
  return {
    trLat: tr ? tr.lat : NaN,
    trLon: tr ? tr.lon : NaN,
    blLat: bl ? bl.lat : NaN,
    blLon: bl ? bl.lon : NaN
  };
}

function isCalibrationValid() {
  const c = getCornerCoords();
  return !isNaN(c.trLat) && !isNaN(c.trLon) && !isNaN(c.blLat) && !isNaN(c.blLon) &&
         c.trLat !== c.blLat && c.trLon !== c.blLon;
}

function latLonToCanvas(lat, lon) {
  const c = getCornerCoords();
  const x = (lon - c.blLon) / (c.trLon - c.blLon) * canvas.width;
  const y = (c.trLat - lat) / (c.trLat - c.blLat) * canvas.height;
  return { x, y };
}

function canvasToLatLon(x, y) {
  const c = getCornerCoords();
  const lon = (x / canvas.width) * (c.trLon - c.blLon) + c.blLon;
  const lat = c.trLat - (y / canvas.height) * (c.trLat - c.blLat);
  return { lat, lon };
}

function resizeCanvas() {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth - 40;
  const containerHeight = container.clientHeight - 40;

  if (mapImage) {
    const imgAspect = mapImage.width / mapImage.height;
    let w = containerWidth;
    let h = containerWidth / imgAspect;

    if (h > containerHeight) {
      h = containerHeight;
      w = containerHeight * imgAspect;
    }

    canvas.width = w;
    canvas.height = h;
  } else {
    canvas.width = Math.max(300, containerWidth);
    canvas.height = Math.max(200, containerHeight);
  }

  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mapImage) {
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Upload a map photo to begin', canvas.width / 2, canvas.height / 2);
  }

  if (mapImage && isCalibrationValid()) {
    drawCornerIndicators();
  }

  if (isCalibrationValid() && runs.length > 0) {
    drawTrails();
    drawRunners();
    drawTimestamp();
  }
}

function drawCornerIndicators() {
  const size = 12;
  const corners = [
    { x: 0, y: 0, label: 'TL' },
    { x: canvas.width, y: 0, label: 'TR' },
    { x: 0, y: canvas.height, label: 'BL' },
    { x: canvas.width, y: canvas.height, label: 'BR' }
  ];

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00ff00';
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';

  corners.forEach(({ x, y, label }) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    const textX = x === 0 ? x + size + 14 : x - size - 14;
    const textY = y === 0 ? y + 4 : y - size;
    ctx.fillText(label, textX, textY);
  });
}

function drawRunners() {
  const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffaa00', '#ff44ff', '#44ffff'];

  runs.forEach((run, i) => {
    const pos = interpolatePosition(run.points, currentTime);
    if (!pos) return;

    const canvasPos = latLonToCanvas(pos.lat, pos.lon);
    const color = colors[i % colors.length];

    ctx.beginPath();
    ctx.arc(canvasPos.x, canvasPos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawTrails() {
  const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffaa00', '#ff44ff', '#44ffff'];

  runs.forEach((run, i) => {
    const color = colors[i % colors.length];
    const points = run.points;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;

    let started = false;
    for (let j = 0; j < points.length; j++) {
      if (points[j].time > currentTime) break;
      const pos = latLonToCanvas(points[j].lat, points[j].lon);
      if (!started) {
        ctx.moveTo(pos.x, pos.y);
        started = true;
      } else {
        ctx.lineTo(pos.x, pos.y);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  });
}

function drawTimestamp() {
  const text = formatDuration(currentTime);
  const fontSize = Math.max(16, Math.floor(canvas.width / 25));
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const padding = 10;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(padding, padding, textWidth + 16, textHeight + 12);

  ctx.fillStyle = '#00ff00';
  ctx.fillText(text, padding + 8, padding + 6);
}

function parseGPX(xmlText, filename) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    console.error('GPX parse error:', parseError.textContent);
    return null;
  }

  const trackpoints = [];
  const trkpts = xml.querySelectorAll('trkpt');
  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    const timeEl = pt.querySelector('time');
    if (!isNaN(lat) && !isNaN(lon) && timeEl) {
      trackpoints.push({
        lat,
        lon,
        time: new Date(timeEl.textContent).getTime()
      });
    }
  });

  if (trackpoints.length === 0) return null;

  trackpoints.sort((a, b) => a.time - b.time);

  const startTime = trackpoints[0].time;
  const normalizedPoints = trackpoints.map(pt => ({
    lat: pt.lat,
    lon: pt.lon,
    time: (pt.time - startTime) / 1000
  }));

  const totalTime = normalizedPoints[normalizedPoints.length - 1].time;

  return {
    filename,
    points: normalizedPoints,
    duration: totalTime
  };
}

function interpolatePosition(points, time) {
  if (points.length === 0) return null;
  if (time <= points[0].time) return { lat: points[0].lat, lon: points[0].lon };
  if (time >= points[points.length - 1].time) {
    const last = points[points.length - 1];
    return { lat: last.lat, lon: last.lon };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (b.time - a.time) === 0 ? 0 : (time - a.time) / (b.time - a.time);
      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lon: a.lon + (b.lon - a.lon) * t
      };
    }
  }

  const last = points[points.length - 1];
  return { lat: last.lat, lon: last.lon };
}

function getMaxDuration() {
  if (runs.length === 0) return 0;
  return Math.max(...runs.map(r => r.duration));
}

function updateTimelineUI() {
  const maxDur = getMaxDuration();
  timeline.max = maxDur;
  timeline.value = currentTime;
  timeDisplay.textContent = formatDuration(currentTime);
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function updateRunsList() {
  const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffaa00', '#ff44ff', '#44ffff'];
  runsList.innerHTML = '';
  runs.forEach((run, i) => {
    const item = document.createElement('div');
    item.className = 'run-item';

    const badge = document.createElement('span');
    badge.className = 'run-badge';
    badge.style.backgroundColor = colors[i % colors.length];

    const label = document.createElement('span');
    label.textContent = `${run.filename} (${formatDuration(run.duration)})`;

    item.appendChild(badge);
    item.appendChild(label);
    runsList.appendChild(item);
  });
  updateTimelineUI();
}

function animationLoop(timestamp) {
  if (!playing) return;

  if (lastFrameTime !== null) {
    const delta = (timestamp - lastFrameTime) / 1000;
    currentTime += delta * speed;

    const maxDur = getMaxDuration();
    if (currentTime >= maxDur) {
      currentTime = maxDur;
      playing = false;
      btnPlay.textContent = 'Play';
    }
  }

  lastFrameTime = timestamp;
  updateTimelineUI();
  render();

  if (playing) {
    animFrameId = requestAnimationFrame(animationLoop);
  }
}

btnPlay.addEventListener('click', () => {
  if (runs.length === 0) return;

  if (playing) {
    playing = false;
    btnPlay.textContent = 'Play';
    lastFrameTime = null;
    if (animFrameId) cancelAnimationFrame(animFrameId);
  } else {
    const maxDur = getMaxDuration();
    if (currentTime >= maxDur) {
      currentTime = 0;
    }
    playing = true;
    btnPlay.textContent = 'Pause';
    lastFrameTime = null;
    animFrameId = requestAnimationFrame(animationLoop);
  }
});

btnReset.addEventListener('click', () => {
  playing = false;
  btnPlay.textContent = 'Play';
  currentTime = 0;
  lastFrameTime = null;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  updateTimelineUI();
  render();
});

speedSelect.addEventListener('change', () => {
  speed = parseFloat(speedSelect.value);
});

timeline.addEventListener('input', () => {
  currentTime = parseFloat(timeline.value);
  timeDisplay.textContent = formatDuration(currentTime);
  render();
});

gpxUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const run = parseGPX(event.target.result, file.name);
      if (run) {
        runs.push(run);
        updateRunsList();
      }
    };
    reader.readAsText(file);
  });
  e.target.value = '';
});

mapUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      mapImage = img;
      mapInfo.textContent = `${file.name} (${img.width}x${img.height}px)`;
      resizeCanvas();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

[trCoordInput, blCoordInput].forEach(input => {
  input.addEventListener('input', render);
});
