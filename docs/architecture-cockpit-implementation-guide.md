# Architecture Cockpit — Implementation Guide

> Date: 2026-05-08  
> Route: `/dashboard/docs/cockpit`  
> A full-screen, interactive code-architecture visualizer built on HTML5 Canvas + D3 force simulation.

---

## What It Does

Three drill-down views, each rendered on a single `<canvas>`:

| View | What you see | How to reach it |
|---|---|---|
| **System** | Top-level folder bubbles + cross-folder import arcs | Default on load |
| **Folder** | File nodes + subfolder cards for one folder | Click any folder card |
| **Schema** | Database ER diagram — tables, columns, FK arrows | Press "DB" toggle |

Clicking a folder in System view drills into Folder view. Within Folder view, clicking a subfolder card pushes a `subPathStack` entry and re-renders one level deeper. The breadcrumb pill at the top tracks where you are.

---

## Architecture Map

```
Browser → /dashboard/docs/cockpit
  │
  └── page.tsx                              ← Client page ("use client", position: absolute inset-0)
        │  useCockpitData()                 ← all data fetching + view state
        └─→ <ArchitectureCockpit … />       ← canvas renderer + sidebar + mobile sheets

Data hook  (useCockpitData.ts)
  ├── mount: GET /api/manifest              → root manifest   { folders[], folderArcs[] }
  ├── mount: GET /api/manifest?schema=1     → schema manifest { tables[], functions[], enums[] }
  └── activeFolder change:
        GET /api/manifest?folder=<id>       → folder manifest { nodes[], internalLinks[], externalIngress[], externalEgress[] }

API Routes
  ├── app/api/manifest/route.ts
  │     ├── GET /api/manifest               → reads manifest.json           (root)
  │     ├── GET /api/manifest?schema=1      → reads manifests/schema.json
  │     └── GET /api/manifest?folder=<id>  → reads manifests/<folderName>.json
  │
  └── app/api/system-docs/route.ts
        └── GET /api/system-docs?filePath=<path>
              1. Strip cwd prefix + normalise slashes
              2. .ts/.tsx → .md, look in docs/<path>.md
              3. Fall back to manifest node.description
              4. Return "No documentation available." if neither found

Static manifest files  (generated offline, committed to repo)
  ├── manifest.json                         ← root: all folders + inter-folder arcs
  ├── manifests/schema.json                 ← DB schema: tables, columns, FK links
  └── manifests/<folderName>.json           ← per-folder: nodes, links, cross-folder portals

ArchitectureCockpit.tsx
  ├── Graph builders
  │     ├── buildFolderGraph(manifest, subPath)   → GraphNode[] + GraphLink[]
  │     ├── buildSchemaGraph(schema)              → GraphNode[] + GraphLink[]
  │     └── system view (inline useEffect)        → folder nodes + arc links
  │
  ├── runSimulation(nodes, links, w, h)     ← D3 forceSimulation, 300 pre-ticks, frozen
  │
  ├── Canvas render loop (rAF)
  │     ├── Background radial gradient + dot grid
  │     ├── Links: quadratic bezier, flow particles on hover, FK arrowheads
  │     ├── Folder cards   (260px, accent bar, child file list, "explore →" hint)
  │     ├── Table cards    (210px, column list, DB grid icon)
  │     ├── File nodes     (circle, colour by extension, label below)
  │     ├── Breadcrumb pill (folder view only)
  │     └── Minimap        (150×90px, bottom-right corner)
  │
  ├── Zoom  (d3-zoom, scale 0.04–12, fitView auto-triggered on node change)
  ├── Hit testing  (click + mousemove → hover/select)
  ├── Touch tap detection  (mobile: <14px movement, <350ms)
  │
  ├── Desktop layout  grid-cols: [248px sidebar | canvas | 360px right panel]
  └── Mobile layout   [canvas fills screen | 56px bottom action bar]
                      List sheet (62vh) and Details sheet (75vh) slide up on demand
```

---

## Step-by-Step Implementation

### Step 1 — Install Dependencies

```bash
npm install d3-force d3-zoom d3-selection
npm install -D @types/d3-force @types/d3-zoom @types/d3-selection
```

---

### Step 2 — TypeScript Types

**File:** `app/dashboard/docs/cockpit/types.ts`

| Interface | Fields | Purpose |
|---|---|---|
| `SystemFolder` | `id, name, nodeCount, linkCount` | Top-level folder bubble in system view |
| `SystemArc` | `source, target, weight` | Cross-folder import arc |
| `FolderNode` | `id, name, type, parent, depth, filePath, complexity, coupling, linesOfCode, exportCount` | A file or subfolder inside a folder manifest |
| `InternalLink` | `source, target` | Import between two files in the same folder |
| `ExternalIngress` | `sourceFile, sourceFolder, targetFile, targetId` | Import arriving from another folder |
| `ExternalEgress` | `sourceFile, sourceId, targetFile, targetFolder` | Import leaving to another folder |
| `FolderManifest` | `folder, folderPath, nodes[], internalLinks[], externalIngress[], externalEgress[]` | Full data for one folder |
| `SchemaColumn` | `name, type` | Single DB column |
| `SchemaForeignKey` | `column, referencedTable, referencedColumn` | FK constraint |
| `SchemaTable` | `id, name, columns[], foreignKeys[]` | One DB table |
| `SchemaManifest` | `tables[], functions[], enums[]` | Full DB schema |
| `CockpitView` | `'system' \| 'folder' \| 'schema'` | Active drill-down level |
| `CockpitState` | `view, activeFolder, transitionProgress` | Full cockpit state (for future animated transitions) |

---

### Step 3 — Generate Manifest Files

The cockpit reads **static JSON files** from the project root. Generate them with a script that walks your source tree, then commit them.

**`manifest.json`** — root level:
```json
{
  "folders": [
    { "id": "app",  "name": "app",  "nodeCount": 42, "linkCount": 18 },
    { "id": "lib",  "name": "lib",  "nodeCount": 31, "linkCount": 12 },
    { "id": "components", "name": "components", "nodeCount": 27, "linkCount": 9 }
  ],
  "folderArcs": [
    { "source": "app", "target": "lib",        "weight": 7 },
    { "source": "app", "target": "components", "weight": 14 }
  ]
}
```

**`manifests/<folderName>.json`** — per folder:
```json
{
  "folder": "app",
  "folderPath": "app",
  "nodes": [
    {
      "id": "app/page.tsx",
      "name": "page.tsx",
      "type": "source",
      "parent": "app",
      "depth": 1,
      "filePath": "app/page.tsx",
      "description": "Root layout page.",
      "complexity": 3,
      "coupling": 2,
      "linesOfCode": 48,
      "exportCount": 1
    },
    {
      "id": "app/dashboard",
      "name": "dashboard",
      "type": "folder",
      "parent": "app",
      "depth": 1
    }
  ],
  "internalLinks": [
    { "source": "app/page.tsx", "target": "app/layout.tsx" }
  ],
  "externalIngress": [
    {
      "sourceFile": "utils.ts",
      "sourceFolder": "lib",
      "targetFile": "page.tsx",
      "targetId": "app/page.tsx"
    }
  ],
  "externalEgress": [
    {
      "sourceFile": "page.tsx",
      "sourceId": "app/page.tsx",
      "targetFile": "utils.ts",
      "targetFolder": "lib"
    }
  ]
}
```

**`manifests/schema.json`** — database schema:
```json
{
  "tables": [
    {
      "id": "documents",
      "name": "documents",
      "columns": [
        { "name": "id",       "type": "uuid" },
        { "name": "org_id",   "type": "uuid" },
        { "name": "content",  "type": "text" }
      ],
      "foreignKeys": [
        { "column": "org_id", "referencedTable": "organisations", "referencedColumn": "id" }
      ]
    }
  ],
  "functions": [
    { "name": "match_chunks",       "returnType": "table" },
    { "name": "match_agent_chunks", "returnType": "table" }
  ],
  "enums": []
}
```

---

### Step 4 — API Routes

#### `/api/manifest/route.ts`

Single `GET` handler, three branches:

```ts
// ?schema=1  → read manifests/schema.json
// ?folder=X  → read manifests/<X-last-segment>.json
// (none)     → read manifest.json (root)
// All branches: return empty structure if file not found — never 404/500
```

Key detail: when reading a folder manifest, strip the full path down to just the last path segment so `?folder=app/dashboard` reads `manifests/dashboard.json`.

#### `/api/system-docs/route.ts`

```ts
// GET ?filePath=<absolute-or-relative>
// 1. Strip process.cwd() prefix if present
// 2. Replace backslashes with forward slashes, remove leading /
// 3. Replace .ts/.tsx/.js/.jsx → .md
// 4. Try:  docs/<normalized>.md          (hand-written docs)
// 5. Else: manifests/<folder>.json → find node where name matches, return node.description
// 6. Else: return 'No documentation available for this file.'
```

---

### Step 5 — Data Hook

**File:** `app/dashboard/docs/cockpit/useCockpitData.ts`

```
State managed:
  root            RootManifest | null     — top-level folders + arcs
  folderManifest  FolderManifest | null   — data for the active folder
  schemaManifest  SchemaManifest | null   — DB schema (fetched once on mount)
  activeFolder    string | null
  loading         boolean                 — initial dual-fetch
  folderLoading   boolean                 — per-folder drill-in
  view            CockpitView             — 'system' | 'folder' | 'schema'

On mount:
  Promise.all([
    GET /api/manifest,
    GET /api/manifest?schema=1,
  ]).then(([root, schema]) => { setRoot; setSchemaManifest; setLoading(false); setView('system') })

On activeFolder change (non-null):
  GET /api/manifest?folder=<activeFolder>
  → setFolderManifest, setFolderLoading(false)

setActiveFolder(id):
  setActiveFolderState(id)
  setView('folder')

backToSystem():
  setActiveFolderState(null)
  setFolderManifest(null)
  setView('system')
```

---

### Step 6 — ArchitectureCockpit Component

**File:** `app/dashboard/docs/cockpit/ArchitectureCockpit.tsx`

This is the largest file. Build it in the following sections:

#### 6a. Constants + Colour Helpers

```ts
const FOLDER_BORDER = '#10B981';   // green
const FOLDER_GLOW   = '#065F46';
const TABLE_BORDER  = '#F59E0B';   // amber
const EXT_COL       = '#3B82F6';   // blue (external portal links)

// Maps file extension → { border, glow, fill }
function fileColor(label: string) {
  // tsx/jsx → indigo  (#818CF8)
  // ts/mts  → cyan    (#22D3EE)
  // css     → yellow  (#FCD34D)
  // json    → orange  (#FB923C)
  // md/mdx  → purple  (#C084FC)
  // sql     → green   (#34D399)
  // images  → pink    (#F472B6)
  // default → slate   (#64748B)
}

// Appends a two-hex-digit alpha to a 6-digit hex colour
function hexOpacity(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}
```

#### 6b. GraphNode / GraphLink interfaces

```ts
interface GraphNode {
  id: string; label: string; type: 'folder' | 'file' | 'table';
  x: number; y: number;
  // folder-specific
  children?: string[]; nodeCount?: number; linkCount?: number; parent?: string; folderId?: string;
  // file-specific
  filePath?: string; complexity?: number; coupling?: number; linesOfCode?: number; exportCount?: number;
  // table-specific
  columns?: string[]; foreignKeys?: any[];
}

interface GraphLink {
  source: string; target: string;
  type: 'internal' | 'cross-folder' | 'foreign-key';
  weight?: number;
  crossFolderSource?: string; crossFolderTarget?: string;
}
```

#### 6c. Graph Builders

**`buildFolderGraph(manifest, subPath)`**
- Active folder node placed at canvas centre
- File children placed on outer ring: radius = `min(cw,ch) × 0.34`
- Subfolder children placed on inner ring: radius = `min(cw,ch) × 0.22`
- Angles evenly distributed: `(i / n) × 2π − π/2` (starts at top)
- External ingress/egress become `external:<folder>:<file>` virtual nodes

**`buildSchemaGraph(schema)`**
- Tables placed evenly on a circle: radius = `min(cw,ch) × 0.32`
- FK relationships become `foreign-key` links between table nodes

**System view** (inside `useEffect`):
- Folders placed evenly on a circle: radius = `min(cw,ch) × 0.30`
- `folderArcs` become `cross-folder` links

#### 6d. D3 Force Simulation

```ts
function runSimulation(gNodes, gLinks, w, h): GraphNode[] {
  const sim = forceSimulation(simNodes)
    .force('link',    forceLink(simLinks).id(d => d.id).distance(d => {
      // folder–folder: 300,  folder–file: 150,  table–table: 240,  file–file: 100
    }).strength(0.5))
    .force('charge',  forceManyBody().strength(d => d.type === 'folder' || d.type === 'table' ? -900 : -280))
    .force('collide', forceCollide().radius(d => d.type === 'folder' ? 145 : d.type === 'table' ? 115 : 50).strength(0.8))
    .force('center',  forceCenter(w/2, h/2).strength(0.15))
    .alphaDecay(0.022).alphaMin(0.001);

  for (let i = 0; i < 300; i++) sim.tick(); // pre-tick synchronously (no animation)
  sim.stop();
  return simNodes; // positions are now stable
}
```

Triggered in a `useEffect` that watches `[view, folderManifest, schemaManifest, root, subPathStack]`.

#### 6e. Canvas Render Loop

```ts
useEffect(() => {
  let running = true;
  const render = () => {
    if (!running) return;
    timeRef.current += 0.016;
    // 1. Resize canvas to clientWidth/clientHeight
    // 2. Draw radial gradient background (#080808 → #030303)
    // 3. Draw dot grid (38px × zoom, skip if gridSize < 7px)
    // 4. ctx.save() → ctx.translate(t.x, t.y) → ctx.scale(t.k, t.k)
    // 5. Compute neighborIds for hover/select dimming
    // 6. Draw links (see below)
    // 7. Draw nodes (see below)
    // 8. Draw breadcrumb pill (folder view) / schema label
    // 9. ctx.restore()
    // 10. Draw minimap
    rafRef.current = requestAnimationFrame(render);
  };
  rafRef.current = requestAnimationFrame(render);
  return () => { running = false; cancelAnimationFrame(rafRef.current); };
}, [nodes, links, hoveredNode, selectedId, view, folderManifest, subPathStack, searchQuery, filteredNodeIds]);
```

**Links:**
- Quadratic bezier: control point offset = `−dist × 0.12` perpendicular to the midpoint
- Gradient from source colour at full opacity → 25% opacity at target
- Cross-folder links: dashed when not active
- FK links: dashed when not active, arrowhead on active
- Flow particles (3 per active link): travel along the bezier at `timeRef × 0.38`, alpha follows `sin(pt × π)`
- External portal nodes: dashed animated offset (`lineDashOffset = −time × 28`), small circle marker + folder label

**Folder card** (260px wide):
- Rounded rect, left accent gradient bar, header gradient strip
- Folder icon (custom path), title, node-count badge
- Separator line, child file list (up to 6 items, coloured dots)
- `+N` overflow indicator if > 6 children
- `"explore →"` hint at bottom (hidden on root node in folder view)

**Table card** (210px wide):
- Rounded rect, amber left accent bar, amber header gradient
- DB grid icon (2×2 stroked rect), table name, column count badge
- Separator, column list (up to 8 items)

**File node** (circle, radius 13/15px):
- Glow halo on hover/select
- Border + fill from `fileColor()`
- Type dot 6px below circle
- Label below type dot

**Minimap** (150×90px, bottom-right):
- Clipped rounded rect
- One dot per node (2.5px folders/tables, 1.5px files), coloured by type
- Viewport rect: `strokeRect` at inverse-transformed position

#### 6f. Zoom Setup

```ts
useEffect(() => {
  if (zoomInitRef.current) return;
  zoomInitRef.current = true;
  const z = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.04, 12])
    .on('zoom', e => { transformRef.current = e.transform; });
  select(canvasRef.current).call(z);
  zoomRef.current = z;
}, [canvasRef.current]);
```

**`fitView()`** — called automatically after nodes are set:
- Compute bounding box of all nodes (pad by node size)
- `k = min(cw/dx, ch/dy, 1.8)` (max 1.8× zoom)
- `tx/ty` to centre the bounding box
- Animate via `select(canvas).transition().duration(700).call(zoomRef.current.transform, zoomIdentity.translate(tx,ty).scale(k))`

#### 6g. Hit Testing

```ts
// getNodeHit(node) → { w, h } for folder/table, null for file (circle)

// handleCanvasClick / handleCanvasMouseMove:
//   const mx = (clientX - rect.left - t.x) / t.k
//   const my = (clientY - rect.top  - t.y) / t.k
//   for each node:
//     if folder/table → AABB check with getNodeHit dimensions
//     if file         → circle check (radius 14)
//     if external:*   → circle check (radius 12)
```

Node click behaviour:
- `system` view, folder node → `onFolderSelect(id)` (load folder manifest)
- `folder` view, non-root folder → `setSubPathStack(s => [...s, id])`
- `folder` view, file node → `setSelectedId(id)` + `fetchDoc(filePath)`
- `schema` view, table node → `setSelectedId(id)` (shows columns in right panel)
- External portal → find matching root folder and call `onFolderSelect`

#### 6h. Touch Support

```ts
const handleTouchStart = (e) => {
  if (e.touches.length === 1)
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
};

const handleTouchEnd = (e) => {
  const dx = t.clientX - start.x, dy = t.clientY - start.y;
  if (Math.sqrt(dx*dx + dy*dy) < 14 && Date.now() - start.time < 350)
    handleCanvasClick({ clientX: t.clientX, clientY: t.clientY });
};
```

---

### Step 7 — Right Panel: MetricCard

A small helper component rendered in the right panel when a **file** node is selected:

```tsx
function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: `${color}0D`, border: `1px solid ${color}22` }} className="rounded-lg p-2.5">
      <div style={{ color: `${color}80` }} className="font-mono text-[8px] uppercase tracking-[0.14em] mb-0.5">{label}</div>
      <div style={{ color }} className="font-mono text-xl font-bold tabular-nums leading-none">{value}</div>
    </div>
  );
}
```

Four metrics shown: **Lines**, **Exports** (indigo), **Complexity** (amber), **Coupling** (cyan).

---

### Step 8 — Canvas Helper Functions

Two small pure functions used inside the render loop:

```ts
function roundRect(ctx, x, y, w, h, r) {
  // Draws a rounded rectangle path (beginPath through closePath)
  // Used for folder cards, table cards, minimap background, breadcrumb pill
}

function drawFolderIcon(ctx, x, y, size) {
  // Draws a simple folder tab shape using ctx.beginPath/lineTo/closePath
  // Filled with the current fillStyle (set before calling)
}
```

---

### Step 9 — Layout & Mobile Sheets

**Desktop** (≥ 768px):
```
┌──────────────────┬─────────────────────────────┬──────────────────┐
│  248px sidebar   │       canvas (flex-1)        │  360px panel     │
│  ─────────────   │  ┌─────────────────────────┐ │  ─────────────   │
│  node list       │  │  search bar (top-centre) │ │  selected node  │
│  + file legend   │  │  Fit + DB toggle (tr)    │ │  metric cards   │
│                  │  │  canvas drawing          │ │  + markdown doc │
│                  │  │  minimap (br)            │ │                 │
│                  │  └─────────────────────────┘ │                 │
└──────────────────┴─────────────────────────────┴──────────────────┘
```

**Mobile** (< 768px):
```
┌─────────────────────────────────────────┐
│  canvas (fills remaining height)        │
│  search bar floating top-centre         │
├─────────────────────────────────────────┤
│  56px bottom action bar                 │
│  [Home] [Back] [breadcrumb] [Fit] [DB]  │
│                          [List] [Info]  │
└─────────────────────────────────────────┘

List sheet  (62vh, slides up over bottom bar):
  drag handle → sidebar content (node list + legend)

Details sheet (75vh, slides up over bottom bar):
  drag handle → header with node name → right panel content
```

Both sheets use a backdrop (`rgba(0,0,0,0.55) + blur(6px)`) that dismisses on tap.

---

### Step 10 — Inline Animations

Injected via `<style>` inside the component (avoids polluting globals):

```css
@keyframes shimmer {
  0%   { background-position: -200px 0; }
  100% { background-position:  200px 0; }
}
.skeleton {
  height: 10px;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.06) 0%,
    rgba(255,255,255,0.14) 50%,
    rgba(255,255,255,0.06) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes sheetUp {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.sheet-enter {
  animation: sheetUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

`skeleton` — used as loading placeholders in the right panel while `fetchDoc` is in flight.
`sheet-enter` — applied to both mobile bottom sheets on render.

---

### Step 11 — Page Entry Point

**File:** `app/dashboard/docs/cockpit/page.tsx`

The page is a thin wrapper. The key detail is `position: absolute; inset: 0` — this escapes the dashboard layout's scroll container so the cockpit fills the full viewport.

```tsx
'use client';

import { useCockpitData } from './useCockpitData';
import ArchitectureCockpit from './ArchitectureCockpit';

export default function CockpitPage() {
  const data = useCockpitData();

  if (data.loading) {
    return (
      <div style={{ position: 'absolute', inset: 0 }} className="flex items-center justify-center bg-[#080808]">
        <div className="font-mono text-white/40 text-sm">Loading architecture map...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ArchitectureCockpit
        root={data.root || { folders: [], folderArcs: [] }}
        folderManifest={data.folderManifest}
        schemaManifest={data.schemaManifest}
        activeFolder={data.activeFolder}
        folderLoading={data.folderLoading}
        view={data.view}
        onViewChange={data.setView}
        onFolderSelect={data.setActiveFolder}
        onBackToSystem={data.backToSystem}
      />
    </div>
  );
}
```

---

## File Reference

| File | Role |
|---|---|
| [app/dashboard/docs/cockpit/page.tsx](app/dashboard/docs/cockpit/page.tsx) | Entry point — full-screen wrapper, loading gate |
| [app/dashboard/docs/cockpit/ArchitectureCockpit.tsx](app/dashboard/docs/cockpit/ArchitectureCockpit.tsx) | Canvas renderer, zoom, hit-testing, sidebar, mobile sheets |
| [app/dashboard/docs/cockpit/useCockpitData.ts](app/dashboard/docs/cockpit/useCockpitData.ts) | Data hook — manifest fetching + view/folder state |
| [app/dashboard/docs/cockpit/types.ts](app/dashboard/docs/cockpit/types.ts) | All TypeScript interfaces |
| [app/api/manifest/route.ts](app/api/manifest/route.ts) | Serves root / folder / schema manifests from disk |
| [app/api/system-docs/route.ts](app/api/system-docs/route.ts) | Serves per-file docs (docs/*.md or manifest description) |
| `manifest.json` | Root manifest — top-level folders + cross-folder arcs |
| `manifests/<folder>.json` | Per-folder manifest — file nodes, links, cross-folder portals |
| `manifests/schema.json` | Database schema — tables, columns, foreign keys, RPCs |
