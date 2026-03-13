async function loadJSON(path) {
  const res = await fetch(path);
  return await res.json();
}

async function main() {
  const config = await loadJSON("./data/config.json");
  const territories = await loadJSON("./data/territories.json");

  const bounds = [[0, 0], [config.imageHeight, config.imageWidth]];

  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    zoomControl: true
  });

  L.tileLayer(config.tilePath, {
    noWrap: true,
    bounds: bounds,
    tileSize: 256,
    maxZoom: config.maxZoom
  }).addTo(map);

  map.fitBounds(bounds);

  const title = document.getElementById("title");
  const meta = document.getElementById("meta");
  const description = document.getElementById("description");
  const search = document.getElementById("search");
  const results = document.getElementById("results");

  const layers = [];

  function toLatLngs(points) {
    return points.map(([x, y]) => [y, x]);
  }

  function showInfo(t) {
    title.textContent = t.name;
    meta.textContent = [t.type, t.owner ? `Owner: ${t.owner}` : ""].filter(Boolean).join(" • ");
    description.textContent = t.description || "";
  }

  territories.forEach(t => {
    const layer = L.polygon(toLatLngs(t.points), {
      weight: 2
    }).addTo(map);

    layer.on("click", () => showInfo(t));
    layers.push({ territory: t, layer });
  });

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    results.innerHTML = "";

    if (!q) return;

    const matches = territories.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.owner || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q)
    );

    matches.forEach(t => {
      const div = document.createElement("div");
      div.className = "result-item";
      div.textContent = t.name;
      div.onclick = () => {
        showInfo(t);
        const layerObj = layers.find(x => x.territory.id === t.id);
        if (layerObj) map.fitBounds(layerObj.layer.getBounds());
      };
      results.appendChild(div);
    });
  });
}

main();