import { useMemo, useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "./App.css";

// Fix for default Leaflet marker icons in Vite
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: shadow,
});

// Handles clicking on the map to add a marker
function ClickToAdd({ enabled, onAdd }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;

      const title = window.prompt("Name this place (ex: Chicago, Hyderabad, Lord's):");
      if (!title) return;

      const notes = window.prompt("Add a quick note (optional):") || "";

      onAdd({
        id: crypto.randomUUID(),
        title: title.trim(),
        notes: notes.trim(),
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        createdAt: Date.now(),
      });
    },
  });

  return null;
}

// Custom marker component so we can control popup behavior
function MarkerWithPopup({ place, showAllInfo, editPlace, deletePlace }) {
  const markerRef = useRef(null);

  // Opens or closes popup depending on screenshot mode
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (showAllInfo) {
      marker.openPopup();
    } else {
      marker.closePopup();
    }
  }, [showAllInfo]);

  return (
    <Marker ref={markerRef} position={[place.lat, place.lng]}>
      <Popup autoClose={!showAllInfo} closeOnClick={!showAllInfo}>
        <div className="popup">
          <strong>{place.title}</strong>
          <div className="popupCoords">
            {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
          </div>

          {place.notes ? (
            <p className="popupNotes">{place.notes}</p>
          ) : (
            <p className="popupNotes">No notes.</p>
          )}

          <div className="popupBtns">
            <button className="miniBtn" onClick={() => editPlace(place.id)}>
              Edit
            </button>
            <button className="miniBtn danger" onClick={() => deletePlace(place.id)}>
              Delete
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function App() {
  const [isDone, setIsDone] = useState(false); // hides side panel
  const [places, setPlaces] = useState([]); // all saved locations
  const [showAllInfo, setShowAllInfo] = useState(false); // screenshot mode

  // Default map center (Chicago)
  const center = useMemo(() => [41.8781, -87.6298], []);

  // Adds new place to state
  function handleAdd(place) {
    setPlaces((prev) => [place, ...prev]);
  }

  // Clears everything
  function handleReset() {
    setPlaces([]);
    setIsDone(false);
  }

  // Deletes a place
  function deletePlace(id) {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }

  // Edits title and notes
  function editPlace(id) {
    const place = places.find((p) => p.id === id);
    if (!place) return;

    const newTitle = window.prompt("Edit name:", place.title);
    if (newTitle === null) return;

    const newNotes = window.prompt("Edit notes:", place.notes);
    if (newNotes === null) return;

    const cleanedTitle = newTitle.trim();
    if (!cleanedTitle) return;

    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, title: cleanedTitle, notes: (newNotes || "").trim() }
          : p
      )
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1 className="title">My Places Map</h1>
          <p className="subtitle">
            Click anywhere on the map to add a marker. When you’re finished, hit Done.
          </p>
        </div>

        <div className="actions">
          {!isDone ? (
            <button
              className="btn primary"
              onClick={() => setIsDone(true)}
              disabled={places.length === 0}
            >
              Done
            </button>
          ) : (
            <button className="btn" onClick={() => setIsDone(false)}>
              Add more
            </button>
          )}

          {/* Toggle screenshot mode */}
          <button
            className="btn"
            onClick={() => setShowAllInfo(v => !v)}
            disabled={places.length === 0}
          >
            {showAllInfo ? "Hide info" : "Screenshot mode"}
          </button>

          <button className="btn danger" onClick={handleReset}>
            Reset
          </button>
        </div>
      </header>

      <main className={`layout ${isDone ? "done" : ""}`}>
        {!isDone && (
          <aside className="panel">
            <h2 className="panelTitle">Locations</h2>

            {places.length === 0 ? (
              <p className="muted">No places yet. Click on the map to add one.</p>
            ) : (
              <ul className="list">
                {places.map((p) => (
                  <li key={p.id} className="card">
                    <div className="cardTop">
                      <strong>{p.title}</strong>
                      <span className="coords">
                        {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                      </span>
                    </div>

                    {p.notes ? (
                      <div className="notes">{p.notes}</div>
                    ) : (
                      <div className="muted">No notes</div>
                    )}

                    <div className="cardActions">
                      <button className="miniBtn" onClick={() => editPlace(p.id)}>
                        Edit
                      </button>
                      <button className="miniBtn danger" onClick={() => deletePlace(p.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="hint">
              Tip: “Done” hides this list and stops prompts. Markers still work.
            </p>
          </aside>
        )}

        <section className="mapWrap">
          <MapContainer center={center} zoom={4} className="map">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Handles map click */}
            <ClickToAdd enabled={!isDone} onAdd={handleAdd} />

            {/* Render all saved markers */}
            {places.map((p) => (
              <MarkerWithPopup
                key={p.id}
                place={p}
                showAllInfo={showAllInfo}
                editPlace={editPlace}
                deletePlace={deletePlace}
              />
            ))}
          </MapContainer>
        </section>
      </main>

      <footer className="footer">Leaflet + OpenStreetMap • Lab 2</footer>
    </div>
  );
}