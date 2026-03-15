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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function applyTransform() {
  world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function resetView() {
  scale = 1;
  tx = 0;
  ty = 0;
  applyTransform();
}

function rgbToRgba(rgbString, alpha) {
  const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!match) return `rgba(100,160,255,${alpha})`;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function polygonCentroid(points) {
  if (!Array.isArray(points) || points.length === 0) return [0, 0];

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const f = x1 * y2 - x2 * y1;
    area += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }

  area *= 0.5;

  if (area === 0) return points[0];

  cx /= 6 * area;
  cy /= 6 * area;

  return [Math.round(cx), Math.round(cy)];
}

async function loadTerritories() {
  const res = await fetch("./data/territories.json");
  territories = await res.json();

  territories = territories.map((t, index) => {
    const fallbackColor = "rgb(100,160,255)";
    const centroid =
      Array.isArray(t.centroid) && t.centroid.length === 2
        ? t.centroid
        : polygonCentroid(t.points || []);

    return {
      id: t.id || `territory-${index + 1}`,
      name: t.name || `Territory ${index + 1}`,
      type: t.type || "Territory",
      owner: t.owner || "",
      description: t.description || "",
      color: t.color || fallbackColor,
      points: Array.isArray(t.points) ? t.points : [],
      centroid
    };
  });

  drawRegions();
}

function drawRegions() {
  overlay.innerHTML = "";

  for (const t of territories) {
    if (!Array.isArray(t.points) || t.points.length < 3) continue;

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute(
      "points",
      t.points.map(([x, y]) => `${x},${y}`).join(" ")
    );
    poly.setAttribute("class", "region");
    poly.dataset.id = t.id;

    poly.style.fill = rgbToRgba(t.color, 0.22);
    poly.style.stroke = t.color;
    poly.style.strokeWidth = "2";

    poly.addEventListener("click", (e) => {
      e.stopPropagation();
      selectTerritory(t.id);
    });

    overlay.appendChild(poly);
  }
}

function updatePolygonStyles() {
  overlay.querySelectorAll(".region").forEach((el) => {
    const territory = territories.find((t) => t.id === el.dataset.id);
    if (!territory) return;

    const isSelected = territory.id === selectedId;
    el.classList.toggle("selected", isSelected);
    el.style.fill = rgbToRgba(territory.color, isSelected ? 0.42 : 0.22);
    el.style.stroke = territory.color;
    el.style.strokeWidth = isSelected ? "3" : "2";
  });
}

function selectTerritory(id) {
  selectedId = id;

  const t = territories.find((x) => x.id === id);
  if (!t) return;

  updatePolygonStyles();

  titleEl.textContent = t.name;
  metaEl.textContent = [t.type, t.owner ? `Owner: ${t.owner}` : ""]
    .filter(Boolean)
    .join(" • ");
  descEl.textContent = t.description || "";
}

function clearSelection() {
  selectedId = null;
  updatePolygonStyles();
  titleEl.textContent = "Click a territory";
  metaEl.textContent = "";
  descEl.textContent = "Territory information will appear here.";
}

function centerOnTerritory(t) {
  if (!t || !Array.isArray(t.centroid)) return;
  const [x, y] = t.centroid;
  const rect = stage.getBoundingClientRect();
  tx = rect.width / 2 - x * scale;
  ty = rect.height / 2 - y * scale;
  applyTransform();
}

mapImage.addEventListener("load", () => {
  overlay.setAttribute("width", mapImage.naturalWidth);
  overlay.setAttribute("height", mapImage.naturalHeight);
  overlay.setAttribute(
    "viewBox",
    `0 0 ${mapImage.naturalWidth} ${mapImage.naturalHeight}`
  );

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

stage.addEventListener(
  "wheel",
  (e) => {
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
  },
  { passive: false }
);

stage.addEventListener("click", () => {
  clearSelection();
});

resetBtn.addEventListener("click", () => {
  resetView();
  clearSelection();
  resultsEl.innerHTML = "";
  searchEl.value = "";
});

searchEl.addEventListener("input", () => {
  const q = searchEl.value.trim().toLowerCase();
  resultsEl.innerHTML = "";

  if (!q) return;

  const matches = territories.filter((t) => {
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.owner || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q) ||
      (t.id || "").toLowerCase().includes(q)
    );
  });

  for (const t of matches) {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = t.name;

    div.onclick = () => {
      selectTerritory(t.id);
      centerOnTerritory(t);
    };

    resultsEl.appendChild(div);
  }
});
