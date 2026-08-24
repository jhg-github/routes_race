const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const mapUpload = document.getElementById('mapUpload');
const mapInfo = document.getElementById('mapInfo');
const trLatInput = document.getElementById('trLat');
const trLonInput = document.getElementById('trLon');
const blLatInput = document.getElementById('blLat');
const blLonInput = document.getElementById('blLon');
const gpxUpload = document.getElementById('gpxUpload');
const runsList = document.getElementById('runsList');
const btnPlay = document.getElementById('btnPlay');
const btnReset = document.getElementById('btnReset');
const speedSelect = document.getElementById('speedSelect');
const timeline = document.getElementById('timeline');
const timeDisplay = document.getElementById('timeDisplay');

let mapImage = null;

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
}

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
