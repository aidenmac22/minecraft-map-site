const stage = document.getElementById("stage");
const world = document.getElementById("world");
const mapImage = document.getElementById("mapImage");
const overlay = document.getElementById("overlay");

const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const descEl = document.getElementById("description");
const searchEl = document.getElementById("search");
const resultsEl = document.getElementById("results");
const resetBtn = document.getElementById("resetView");

let territories = [];
let scale = 1;
let tx = 0;
let ty = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;
let selectedId = null;

function applyTransform() {
  world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function resetView() {
  scale = 1;
  tx = 0;
  ty = 0;
  applyTransform();
}

async function loadTerritories() {
  const res = await fetch("./data/territories.json");
  territories = await res.json();
  drawRegions();
}

function drawRegions() {
  overlay.innerHTML = "";

  for (const t of territories) {
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", t.points.map(([x, y]) => `${x},${y}`).join(" "));
    poly.setAttribute("class", "region");
    poly.dataset.id = t.id;

    poly.addEventListener("click", (e) => {
      e.stopPropagation();
      selectTerritory(t.id);
    });

    overlay.appendChild(poly);
  }
}

function selectTerritory(id) {
  selectedId = id;
  const t = territories.find(x => x.id === id);
  if (!t) return;

  overlay.querySelectorAll(".region").forEach(el => {
    el.classList.toggle("selected", el.dataset.id === id);
  });

  titleEl.textContent = t.name;
  metaEl.textContent = [t.type, t.owner ? `Owner: ${t.owner}` : ""].filter(Boolean).join(" • ");
  descEl.textContent = t.description || "";
}

mapImage.addEventListener("load", () => {
  overlay.setAttribute("width", mapImage.naturalWidth);
  overlay.setAttribute("height", mapImage.naturalHeight);
  overlay.setAttribute("viewBox", `0 0 ${mapImage.naturalWidth} ${mapImage.naturalHeight}`);
  loadTerritories();
});

if (mapImage.complete) {
  mapImage.dispatchEvent(new Event("load"));
}

stage.addEventListener("mousedown", (e) => {
  dragging = true;
  stage.classList.add("grabbing");
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mouseup", () => {
  dragging = false;
  stage.classList.remove("grabbing");
});

window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  tx += dx;
  ty += dy;
  lastX = e.clientX;
  lastY = e.clientY;
  applyTransform();
});

stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = stage.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const oldScale = scale;
  scale = clamp(scale * (1 - e.deltaY * 0.0015), 0.25, 6);

  const wx = (cx - tx) / oldScale;
  const wy = (cy - ty) / oldScale;

  tx = cx - wx * scale;
  ty = cy - wy * scale;
  applyTransform();
}, { passive: false });

stage.addEventListener("click", () => {
  selectedId = null;
  overlay.querySelectorAll(".region").forEach(el => el.classList.remove("selected"));
  titleEl.textContent = "Click a territory";
  metaEl.textContent = "";
  descEl.textContent = "Territory information will appear here.";
});

resetBtn.addEventListener("click", resetView);

searchEl.addEventListener("input", () => {
  const q = searchEl.value.trim().toLowerCase();
  resultsEl.innerHTML = "";
  if (!q) return;

  const matches = territories.filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.owner || "").toLowerCase().includes(q) ||
    (t.type || "").toLowerCase().includes(q)
  );

  for (const t of matches) {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = t.name;
    div.onclick = () => selectTerritory(t.id);
    resultsEl.appendChild(div);
  }
});