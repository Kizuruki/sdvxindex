import { useState, useMemo, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const RADAR_KEYS = ["notes", "peak", "tsumami", "tricky", "handtrip", "onehand"];

const RADAR_COLORS = {
  notes:    "#00d5ca",
  peak:     "#f5003c",
  tsumami:  "#ff00ca",
  tricky:   "#f9ff00",
  handtrip: "#ba66ff",
  onehand:  "#00ff74",
  total:    "#ffffff",
};

const DIFF_COLORS = {
  novice:   "#914bc6",
  advanced: "#a8a307",
  exhaust:  "#943434",
  maximum:  "#707070",
  infinite: "#991551",
  gravity:  "#9e4200",
  heavenly: "#007fa6",
  vivid:    "#c959ad",
  exceed:   "#365191",
  ultimate: "#e4a300",
};

const DIFF_ABBR = {
  novice:   "NOV",
  advanced: "ADV",
  exhaust:  "EXH",
  maximum:  "MXM",
  infinite: "INF",
  gravity:  "GRV",
  heavenly: "HVN",
  vivid:    "VVD",
  exceed:   "XCD",
  ultimate: "ULT",
};

const ALL_SORT_CATS = [...RADAR_KEYS, "total"];
const ALL_DIFF_TYPES = Object.keys(DIFF_COLORS);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function radarTotal(radar) {
  return RADAR_KEYS.reduce((s, k) => s + (Number(radar?.[k]) || 0), 0);
}

function levelMatches(level, filterVal) {
  const lvl = Number(level);
  if (filterVal.includes(".")) {
    return Math.round(lvl * 10) === Math.round(parseFloat(filterVal) * 10);
  }
  return Math.floor(lvl) === parseInt(filterVal, 10);
}

function passesRadarFilter(radar, selectedCategories) {
  if (selectedCategories.length === 0) return true;
  if (!radar) return false;
  const vals = selectedCategories.map((k) => radar[k]).filter((v) => v !== undefined);
  if (vals.length !== selectedCategories.length) return false;
  const sorted = Object.keys(radar).sort((a, b) => radar[b] - radar[a]);
  const topN = sorted.slice(0, selectedCategories.length);
  const condA =
    JSON.stringify([...selectedCategories].sort()) === JSON.stringify([...topN].sort()) &&
    selectedCategories.every((k) => radar[k] > 100);
  const condB = vals.every((v) => v > 130);
  return condA || condB;
}

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9,
      letterSpacing: 3,
      color: "#444",
      fontWeight: 700,
      textTransform: "uppercase",
      marginBottom: 6,
      marginTop: 2,
      paddingBottom: 4,
      borderBottom: "1px solid #222",
    }}>
      {children}
    </div>
  );
}

function Chip({ label, active, color = "#555", onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 9px",
        fontSize: 11,
        background: active ? color + "1a" : "transparent",
        border: `1px solid ${active ? color : "#2a2a2a"}`,
        color: active ? color : "#4a4a4a",
        borderRadius: 3,
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: 0.5,
        textAlign: "left",
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function RadarBar({ label, value, maxVal, color, highlight }) {
  const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 56,
        fontSize: 9.5,
        fontWeight: highlight ? 700 : 400,
        color: highlight ? color : "#3a3a3a",
        letterSpacing: 0.8,
        flexShrink: 0,
        textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        height: 8,
        background: "#111",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${pct}%`,
          background: highlight ? color : "#2c2c2c",
          borderRadius: 2,
        }} />
      </div>
      <div style={{
        width: 32,
        fontSize: 11,
        textAlign: "right",
        fontWeight: highlight ? 700 : 400,
        color: highlight ? color : "#404040",
        flexShrink: 0,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({ song, diff, total, sortCat, maxSingle, rank }) {
  const type = diff.type.toLowerCase();
  const diffColor = DIFF_COLORS[type] || "#555";
  const abbr = DIFF_ABBR[type] || type.toUpperCase();

  return (
    <div style={{
      background: "#161616",
      border: "1px solid #1e1e1e",
      borderTop: `2px solid ${diffColor}`,
      borderRadius: 5,
      padding: "10px 12px 12px",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      {/* rank */}
      <span style={{
        position: "absolute",
        top: 7,
        right: 9,
        fontSize: 9,
        color: "#2e2e2e",
        fontWeight: 700,
        letterSpacing: 1,
      }}>
        #{rank}
      </span>

      {/* song info */}
      <div style={{ paddingRight: 28 }}>
        <div style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "#d0d0d0",
          lineHeight: 1.35,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {song.title}
        </div>
        <div style={{ fontSize: 10.5, color: "#444", marginTop: 1 }}>
          {song.artist}
        </div>
      </div>

      {/* diff + level + bpm */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: diffColor,
          background: diffColor + "1a",
          padding: "2px 7px",
          borderRadius: 3,
          letterSpacing: 1.2,
        }}>
          {abbr}
        </span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#e8e8e8", letterSpacing: -0.5 }}>
          {diff.level}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#333", letterSpacing: 0.5 }}>
          {song.bpm} BPM
        </span>
      </div>

      {/* radar bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
        {RADAR_KEYS.map((key) => (
          <RadarBar
            key={key}
            label={key}
            value={Number(diff.radar?.[key]) || 0}
            maxVal={maxSingle}
            color={RADAR_COLORS[key]}
            highlight={sortCat === key}
          />
        ))}

        {/* total */}
        <div style={{ marginTop: 4, paddingTop: 5, borderTop: "1px solid #1e1e1e" }}>
          <RadarBar
            label="total"
            value={total}
            maxVal={maxSingle * 6}
            color="#ffffff"
            highlight={sortCat === "total"}
          />
        </div>
      </div>

      {/* chain / exscore footer */}
      <div style={{
        display: "flex",
        gap: 10,
        fontSize: 9.5,
        color: "#333",
        letterSpacing: 0.5,
        marginTop: 2,
        paddingTop: 6,
        borderTop: "1px solid #1a1a1a",
      }}>
        <span>⛓ {diff.max_chain}</span>
        <span>EX {diff.max_exscore}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SDVXRadarExplorer() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [levelFilters, setLevelFilters] = useState([]);
  const [diffFilters, setDiffFilters] = useState([]);
  const [radarFilters, setRadarFilters] = useState([]);
  const [sortCat, setSortCat] = useState("total");
  const [sortDir, setSortDir] = useState("high-low");

  // ── File load ──────────────────────────────────────────────────────────────

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setSongs(Array.isArray(data) ? data : []);
        setLevelFilters([]);
        setDiffFilters([]);
        setRadarFilters([]);
        setSearch("");
      } catch {
        alert("Could not parse JSON — make sure it's the songsv1.3.3.json file.");
      }
    };
    reader.readAsText(file);
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────

  const allLevels = useMemo(() => {
    const s = new Set();
    songs.forEach((song) => song.difficulties?.forEach((d) => s.add(String(d.level))));
    return [...s].sort((a, b) => parseFloat(b) - parseFloat(a));
  }, [songs]);

  const presentDiffTypes = useMemo(() => {
    const s = new Set();
    songs.forEach((song) => song.difficulties?.forEach((d) => s.add(d.type.toLowerCase())));
    return ALL_DIFF_TYPES.filter((t) => s.has(t));
  }, [songs]);

  // Flatten into cards
  const allCards = useMemo(() =>
    songs.flatMap((song) =>
      (song.difficulties || []).map((diff) => ({
        song,
        diff,
        total: radarTotal(diff.radar),
      }))
    ),
    [songs]
  );

  // Max single-axis value across whole dataset (for bar scaling)
  const maxSingle = useMemo(() => {
    let m = 1;
    allCards.forEach(({ diff }) =>
      RADAR_KEYS.forEach((k) => { if ((diff.radar?.[k] || 0) > m) m = diff.radar[k]; })
    );
    return m;
  }, [allCards]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let result = allCards.filter(({ song, diff }) => {
      if (q && !song.title?.toLowerCase().includes(q) && !song.artist?.toLowerCase().includes(q)) return false;
      if (levelFilters.length && !levelFilters.some((f) => levelMatches(diff.level, f))) return false;
      if (diffFilters.length && !diffFilters.includes(diff.type.toLowerCase())) return false;
      if (!passesRadarFilter(diff.radar, radarFilters)) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      const getVal = ({ diff, total }) =>
        sortCat === "total" ? total : Number(diff.radar?.[sortCat]) || 0;
      return sortDir === "high-low" ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
    });

    return result;
  }, [allCards, search, levelFilters, diffFilters, radarFilters, sortCat, sortDir]);

  // ── UI ─────────────────────────────────────────────────────────────────────

  const hasFilters = levelFilters.length || diffFilters.length || radarFilters.length || search;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#0e0e0e",
      color: "#ccc",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        background: "#111",
        borderBottom: "1px solid #1e1e1e",
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: 17,
          letterSpacing: 5,
          color: "#00d5ca",
          flexShrink: 0,
          textShadow: "0 0 16px #00d5ca55",
        }}>
          SDVX·RADAR
        </div>

        <input
          type="text"
          placeholder="Search title / artist…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            maxWidth: 400,
            padding: "5px 11px",
            background: "#161616",
            border: "1px solid #2a2a2a",
            borderRadius: 4,
            color: "#ccc",
            fontFamily: "inherit",
            fontSize: 12,
            outline: "none",
          }}
        />

        <label style={{
          padding: "5px 13px",
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 11,
          letterSpacing: 1,
          color: "#888",
          flexShrink: 0,
        }}>
          LOAD JSON
          <input type="file" accept=".json" onChange={handleFile} style={{ display: "none" }} />
        </label>

        <div style={{ marginLeft: "auto", fontSize: 11, color: "#333", letterSpacing: 1 }}>
          {filtered.length.toLocaleString()} CHARTS
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: 210,
          flexShrink: 0,
          background: "#111",
          borderRight: "1px solid #1a1a1a",
          overflowY: "auto",
          padding: "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          {/* Sort category */}
          <div>
            <SectionLabel>SORT BY</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {ALL_SORT_CATS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSortCat(cat)}
                  style={{
                    padding: "5px 10px",
                    background: sortCat === cat ? RADAR_COLORS[cat] + "18" : "transparent",
                    border: `1px solid ${sortCat === cat ? RADAR_COLORS[cat] : "#222"}`,
                    borderRadius: 3,
                    color: sortCat === cat ? RADAR_COLORS[cat] : "#3a3a3a",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 11,
                    textAlign: "left",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontWeight: sortCat === cat ? 700 : 400,
                    transition: "all 0.1s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Direction */}
            <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
              {[
                { val: "high-low", label: "↓ HIGH→LOW" },
                { val: "low-high", label: "↑ LOW→HIGH" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setSortDir(val)}
                  style={{
                    flex: 1,
                    padding: "4px 4px",
                    fontSize: 9,
                    letterSpacing: 0.5,
                    background: sortDir === val ? "#00d5ca15" : "transparent",
                    border: `1px solid ${sortDir === val ? "#00d5ca" : "#222"}`,
                    color: sortDir === val ? "#00d5ca" : "#3a3a3a",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Radar filter */}
          <div>
            <SectionLabel>RADAR FILTER</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {RADAR_KEYS.map((k) => (
                <Chip
                  key={k}
                  label={k.toUpperCase()}
                  active={radarFilters.includes(k)}
                  color={RADAR_COLORS[k]}
                  onClick={() => setRadarFilters((f) => toggle(f, k))}
                />
              ))}
            </div>
            {radarFilters.length > 0 && (
              <div style={{ fontSize: 9, color: "#333", marginTop: 5, lineHeight: 1.5 }}>
                Shows charts where these<br/>axes are dominant (site logic)
              </div>
            )}
          </div>

          {/* Difficulty filter */}
          <div>
            <SectionLabel>DIFFICULTY</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {presentDiffTypes.map((t) => (
                <Chip
                  key={t}
                  label={`${DIFF_ABBR[t] || t.toUpperCase()}  ${t}`}
                  active={diffFilters.includes(t)}
                  color={DIFF_COLORS[t]}
                  onClick={() => setDiffFilters((f) => toggle(f, t))}
                />
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div>
            <SectionLabel>LEVEL</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {allLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilters((f) => toggle(f, lvl))}
                  style={{
                    padding: "3px 6px",
                    fontSize: 10.5,
                    background: levelFilters.includes(lvl) ? "#ffffff15" : "transparent",
                    border: `1px solid ${levelFilters.includes(lvl) ? "#888" : "#222"}`,
                    color: levelFilters.includes(lvl) ? "#ccc" : "#3a3a3a",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={() => {
                setLevelFilters([]);
                setDiffFilters([]);
                setRadarFilters([]);
                setSearch("");
              }}
              style={{
                padding: "6px",
                background: "transparent",
                border: "1px solid #2a2a2a",
                color: "#444",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 10,
                letterSpacing: 1,
                marginTop: "auto",
              }}
            >
              RESET ALL FILTERS
            </button>
          )}
        </aside>

        {/* ── Main grid ── */}
        <main style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {songs.length === 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: "#2a2a2a",
            }}>
              <div style={{ fontSize: 40 }}>◈</div>
              <div style={{ fontSize: 14, letterSpacing: 5 }}>LOAD SONGS JSON</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#1e1e1e" }}>
                songsv1.3.3.json · sdvxindex.com
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#2a2a2a",
              fontSize: 12,
              letterSpacing: 3,
            }}>
              NO MATCHING CHARTS
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 8,
            }}>
              {filtered.map(({ song, diff, total }, i) => (
                <ChartCard
                  key={`${song.songid}-${diff.type}`}
                  song={song}
                  diff={diff}
                  total={total}
                  sortCat={sortCat}
                  maxSingle={maxSingle}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
