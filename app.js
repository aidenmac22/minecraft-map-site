const stage = document.getElementById("stage");
const world = document.getElementById("world");
const mapImage = document.getElementById("mapImage");
const overlay = document.getElementById("overlay");

const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const descEl = document.getElementById("description");

let territories = [];

let drawMode = true;
let currentPoints = [];
let previewPoly = null;

function getMousePos(evt) {
  const rect = overlay.getBoundingClientRect();

  const x = (evt.clientX - rect.left) * (mapImage.naturalWidth / rect.width);
  const y = (evt.clientY - rect.top) * (mapImage.naturalHeight / rect.height);

  return [Math.round(x), Math.round(y)];
}

function drawPreview() {
  if (!previewPoly) {
    previewPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    previewPoly.style.fill = "rgba(255,255,255,0.1)";
    previewPoly.style.stroke = "white";
    previewPoly.style.strokeWidth = "2";
    overlay.appendChild(previewPoly);
  }

  previewPoly.setAttribute(
    "points",
    currentPoints.map(p => p.join(",")).join(" ")
  );
}

function finishPolygon() {

  if (currentPoints.length < 3) {
    alert("Need at least 3 points");
    return;
  }

  const name = prompt("Territory name:");

  const territory = {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name: name,
    type: "Territory",
    owner: "",
    description: "",
    color: "rgb(255,255,255)",
    points: currentPoints
  };

  territories.push(territory);

  drawTerritory(territory);

  currentPoints = [];

  if (previewPoly) {
    previewPoly.remove();
    previewPoly = null;
  }

  console.log("Saved territory", territory);
}

function drawTerritory(t) {

  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

  poly.setAttribute(
    "points",
    t.points.map(p => p.join(",")).join(" ")
  );

  poly.style.fill = "rgba(100,160,255,0.25)";
  poly.style.stroke = "white";
  poly.style.strokeWidth = "2";

  poly.addEventListener("click", e => {
    e.stopPropagation();

    titleEl.textContent = t.name;
    metaEl.textContent = t.type;
    descEl.textContent = t.description || "";
  });

  overlay.appendChild(poly);
}

function exportJSON() {

  const json = JSON.stringify(territories, null, 2);

  const blob = new Blob([json], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "territories.json";
  a.click();

  URL.revokeObjectURL(url);
}

overlay.addEventListener("click", e => {

  if (!drawMode) return;

  const point = getMousePos(e);

  currentPoints.push(point);

  drawPreview();
});

window.addEventListener("keydown", e => {

  if (e.key === "Enter") finishPolygon();

  if (e.key === "Backspace") {
    currentPoints.pop();
    drawPreview();
  }

  if (e.key === "e") exportJSON();
});

mapImage.onload = () => {

  overlay.setAttribute("width", mapImage.naturalWidth);
  overlay.setAttribute("height", mapImage.naturalHeight);

  overlay.setAttribute(
    "viewBox",
    `0 0 ${mapImage.naturalWidth} ${mapImage.naturalHeight}`
  );
};