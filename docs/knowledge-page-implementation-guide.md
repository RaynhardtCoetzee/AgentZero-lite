# Knowledge Page â€” Implementation Guide

> Date: 2026-05-08  
> Covers: RAG pipeline architecture + all UI upgrades shipped to the Knowledge page.  
> For the Architecture Cockpit visualizer, see [architecture-cockpit-implementation-guide.md](architecture-cockpit-implementation-guide.md).

---

## Architecture Map

```
Browser
  â”‚
  â”œâ”€â”€ app/dashboard/knowledge/page.tsx          â† Server Component (RSC)
  â”‚     â”‚  auth() â†’ orgId
  â”‚     â”‚  adminClient.from("documents").select()
  â”‚     â””â”€â†’ <KnowledgePageContent documents={â€¦} orgId={â€¦} />
  â”‚
  â”œâ”€â”€ app/dashboard/knowledge/_components/
  â”‚     â””â”€â”€ KnowledgePageContent.tsx            â† Client Component
  â”‚           â”œâ”€â”€ <UploadKnowledge />            â† drag-drop upload zone
  â”‚           â”œâ”€â”€ Document list (left pane)
  â”‚           â”œâ”€â”€ <DocumentPreview />            â† right pane (desktop)
  â”‚           â””â”€â”€ Mobile bottom drawer          â† <DocumentPreview /> clone
  â”‚
  â”œâ”€â”€ components/dashboard/UploadKnowledge.tsx  â† Client Component
  â”‚     â””â”€â”€ calls uploadDocument() server action
  â”‚
  â””â”€â”€ components/ui/markdown-renderer.tsx       â† Pure renderer (react-markdown)

Server Actions  (lib/actions/document-actions.ts)
  â”œâ”€â”€ uploadDocument(FormData)
  â”‚     1. auth()                               â† JWT session â†’ orgId, userId
  â”‚     2. Zod validate file (size, type)
  â”‚     3. Extract text (unpdf for PDF / file.text() for TXT/MD)
  â”‚     4. chunkText()                          â† 500-char chunks, 50-char overlap
  â”‚     5. generateEmbedding() Ã— N chunks       â† sequential, avoids rate limits
  â”‚     6. INSERT INTO documents                â† stores full content + metadata
  â”‚     7. storeChunks()                        â† INSERT INTO document_chunks
  â”‚           â””â”€â”€ rollback: DELETE document if chunks fail
  â”‚
  â”œâ”€â”€ getDocumentContent(documentId)            â† lazy-loaded in preview pane
  â””â”€â”€ listOrgDocuments()                        â† scoped to org_id

AI / Embedding Layer  (lib/ai/embeddings.ts)
  â”œâ”€â”€ generateEmbedding(text)   â†’ number[]      â† provider-aware
  â”œâ”€â”€ storeChunks(chunks, orgId, supabase)       â† batch INSERT document_chunks
  â”œâ”€â”€ semanticSearch(queryEmbedding, orgId, â€¦)  â† calls match_chunks RPC
  â””â”€â”€ semanticSearchForAgent(â€¦, agentId, â€¦)     â† calls match_agent_chunks RPC

Embedding Providers  (EMBEDDING_PROVIDER env var)
  â”œâ”€â”€ "openai"   â†’ text-embedding-3-small   (1536 dims) â† default
  â”œâ”€â”€ "cohere"   â†’ embed-english-v3.0       (1024 dims)
  â””â”€â”€ "nvidia"   â†’ nv-embed-qa-mistral-7b-v3 (1024 dims)

Supabase Tables
  â”œâ”€â”€ documents         { id, user_id, org_id, agent_id?, file_name, file_type, content, created_at }
  â””â”€â”€ document_chunks   { id, document_id, content, embedding (vector), created_at }

Supabase RPCs
  â”œâ”€â”€ match_chunks(query_embedding, match_threshold, match_count, filter_org_id)
  â””â”€â”€ match_agent_chunks(query_embedding, match_threshold, match_count, filter_agent_id)
```

---

## Step-by-Step Implementation Guide

### Step 1 â€” Supabase Schema

Create two tables and the pgvector RPCs. Run in the Supabase SQL editor.

```sql
-- Enable pgvector
create extension if not exists vector;

-- Documents table
create table documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  org_id      uuid not null,
  agent_id    uuid,
  file_name   text not null,
  file_type   text not null,
  content     text,
  created_at  timestamptz default now()
);

-- Chunks table â€” stores embeddings alongside text
create table document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content     text not null,
  embedding   vector(1536),  -- change to 1024 for cohere/nvidia
  created_at  timestamptz default now()
);

-- IVFFlat index (add once you have >3,000 rows)
-- create index on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Org-scoped semantic search RPC
create or replace function match_chunks(
  query_embedding   vector(1536),
  match_threshold   float,
  match_count       int,
  filter_org_id     uuid
)
returns table(content text, similarity float)
language sql stable as $$
  select dc.content,
         1 - (dc.embedding <=> query_embedding) as similarity
  from   document_chunks dc
  join   documents        d  on d.id = dc.document_id
  where  d.org_id = filter_org_id
    and  1 - (dc.embedding <=> query_embedding) > match_threshold
  order  by dc.embedding <=> query_embedding
  limit  match_count;
$$;

-- Agent-scoped variant
create or replace function match_agent_chunks(
  query_embedding   vector(1536),
  match_threshold   float,
  match_count       int,
  filter_agent_id   uuid
)
returns table(content text, similarity float)
language sql stable as $$
  select dc.content,
         1 - (dc.embedding <=> query_embedding) as similarity
  from   document_chunks dc
  join   documents        d  on d.id = dc.document_id
  where  d.agent_id = filter_agent_id
    and  1 - (dc.embedding <=> query_embedding) > match_threshold
  order  by dc.embedding <=> query_embedding
  limit  match_count;
$$;
```

---

### Step 2 â€” Environment Variables

Add to `.env.local`:

```env
EMBEDDING_PROVIDER=openai           # openai | cohere | nvidia

# OpenAI (default)
OPENAI_API_KEY=sk-...

# Cohere (alternative)
# COHERE_API_KEY=...

# NVIDIA NIMs (alternative)
# NVIDIA_NIMS_BASE_URL=https://integrate.api.nvidia.com/v1
# NVIDIA_NIMS_API_KEY=...
```

---

### Step 3 â€” Install Dependencies

```bash
npm install unpdf react-markdown ai @ai-sdk/openai @ai-sdk/cohere zod
```

- `unpdf` â€” serverless-safe PDF text extraction (no worker files)
- `react-markdown` â€” renders document content as styled markdown
- `ai` + `@ai-sdk/*` â€” Vercel AI SDK for embeddings

---

### Step 4 â€” Embedding Layer

**File:** `lib/ai/embeddings.ts`

Implements three exports used by the upload pipeline and the agent RAG tool:

| Export | Purpose |
|---|---|
| `generateEmbedding(text)` | Converts a string to a vector using the active provider |
| `storeChunks(chunks, orgId, supabase)` | Batch-inserts pre-computed chunks into `document_chunks` |
| `semanticSearch(queryEmbedding, orgId, supabase, â€¦)` | Org-scoped cosine search via `match_chunks` RPC |
| `semanticSearchForAgent(queryEmbedding, agentId, supabase, â€¦)` | Agent-scoped search via `match_agent_chunks` RPC |

Key design decisions:
- All inputs validated with Zod â€” never silently coerce
- Embeddings generated **sequentially** to avoid OpenAI rate-limit bursts on large documents
- Switching providers requires re-embedding all chunks and altering the vector column dimension

---

### Step 5 â€” Server Actions

**File:** `lib/actions/document-actions.ts`

#### `uploadDocument(formData)`

Full pipeline from `"use server"`:

1. `auth()` â€” reads `orgId` and `userId` from JWT session (zero extra DB calls)
2. Zod validates the file: size â‰¤ 10 MB, type in `[pdf, text/plain, text/markdown]`
3. Text extraction:
   - PDF â†’ `extractText(arrayBuffer, { mergePages: true })` via `unpdf`
   - TXT / MD â†’ `file.text()`
4. `chunkText(text, 500, 50)` â€” 500-char chunks with 50-char overlap
5. Embed each chunk sequentially with `generateEmbedding()`
6. `INSERT INTO documents` â€” stores full raw content alongside metadata
7. `storeChunks()` â€” batch inserts all chunks with embeddings
8. **Rollback**: if step 7 fails, deletes the document row to prevent orphans

#### `getDocumentContent(documentId)`

Lazily fetches `content` for the preview pane. Scoped to `org_id` for auth isolation.

#### `listOrgDocuments()`

Org-scoped document listing, used as a fallback if RSC data is stale.

---

### Step 6 â€” Upload Component

**File:** `components/dashboard/UploadKnowledge.tsx`

Client component. Features:

- **Drag-and-drop zone** â€” `onDrop`, `onDragOver`, `onDragLeave` handlers
- **Browse button** â€” triggers hidden `<input type="file" />`
- **Client-side validation** â€” mirrors server-side type/size checks for instant feedback
- **Upload state machine**: `idle â†’ uploading â†’ success | error`
- On success: shows chunk count, offers "Upload another" reset

Props: `{ agentId: string }` â€” passed to `uploadDocument()` to optionally scope uploads to a specific agent.

---

### Step 7 â€” Page Server Component

**File:** `app/dashboard/knowledge/page.tsx`

```tsx
export default async function KnowledgePage() {
  const session  = await auth();
  const orgId    = session?.user?.orgId ?? "";
  const documents = orgId
    ? await adminClient.from("documents").select("id,file_name,file_type,created_at").eq("org_id", orgId).order("created_at", { ascending: false })
    : { data: [] };

  return <KnowledgePageContent documents={documents.data ?? []} orgId={orgId} />;
}
```

Pre-fetches document list (without `content`) so the list renders instantly. Content is loaded lazily when a document is selected.

---

### Step 8 â€” KnowledgePageContent (Client Component)

**File:** `app/dashboard/knowledge/_components/KnowledgePageContent.tsx`

#### Layout

```
Desktop (lg+)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Indexed Files  â”‚  Preview Pane                â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  [PDF] file.pdf â”‚  â”‚ File hero + StatusBadge  â”‚ â”‚
â”‚  [TXT] notes.md â”‚  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚ â”‚
â”‚                 â”‚  â”‚ MetaCell Ã— 3             â”‚ â”‚
â”‚                 â”‚  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚ â”‚
â”‚                 â”‚  â”‚ Content (MarkdownRendererâ”‚ â”‚
â”‚                 â”‚  â”‚  scrollable, 4k preview) â”‚ â”‚
â”‚                 â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Mobile (< lg)
Selecting a document opens a bottom drawer (88dvh, slide-up animation)
with a backdrop overlay. Body scroll is locked while drawer is open.
```

#### Key Components

**`StatusBadge`**
Renders one of three states with pulse animations:
- `indexed` â€” green pulse (`status-pulse-green` CSS animation)
- `processing` â€” amber, spinning `Loader2` icon
- `failed` â€” red pulse (`status-pulse-red`)

**`MetaCell`**
Three-column metadata strip pinned below the file hero:
- Upload date (formatted)
- Document ID (first 7 chars, highlighted in primary colour)
- Chunk count (shows `â€”` until wired to DB)

**`DocumentPreview`**
- Lazy-fetches content via `getDocumentContent()` on `doc.id` change
- Shows a loading spinner while fetching
- Renders content through `<MarkdownRenderer />` â€” first 4,000 chars in the side panel
- If content exceeds 4,000 chars, shows a `+N more chars` footer
- **Fullscreen expand** â€” `Maximize2` button opens a fixed modal (`z-[80]`) with:
  - File icon + name + size in chars in the header
  - Full content (no truncation) in a scrollable `max-w-3xl` column

**`PreviewEmpty`**
Placeholder shown on desktop when no document is selected.

---

### Step 9 â€” Markdown Renderer

**File:** `components/ui/markdown-renderer.tsx`

Wraps `react-markdown` with styled components that match the app's dark glass aesthetic.

| Element | Treatment |
|---|---|
| `h1` | Large, bold, left primary border, bottom border |
| `h2` | Medium bold, left primary border (thinner) |
| `h3` | Small uppercase, primary colour |
| `code` (inline) | Primary-tinted bg, monospace, border |
| `pre` (block) | Dark bg, gradient top border, overflow scroll |
| `ul` | Custom primary dot bullets |
| `blockquote` | Left primary border, faint primary bg tint |
| `table` | Bordered, monospace headers, hover-friendly |
| `hr` | Decorative: lines + primary dot |

---

### Step 10 â€” CSS Animations

Add to your global CSS (`app/globals.css` or equivalent):

```css
@keyframes status-pulse-green {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50%       { opacity: 0.7; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
}

@keyframes status-pulse-red {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50%       { opacity: 0.7; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
}

@keyframes anim-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.anim-fade-up {
  animation: anim-fade-up 280ms ease both;
}
```

---

### Step 11 â€” Wire Up Semantic Search in the Agent

When an agent receives a message, call `semanticSearch` (or `semanticSearchForAgent`) before passing context to the LLM:

```ts
import { generateEmbedding, semanticSearch } from "@/lib/ai/embeddings";
import { adminClient } from "@/lib/supabase/admin";

const queryEmbedding = await generateEmbedding(userMessage);
const chunks = await semanticSearch(queryEmbedding, orgId, adminClient, 5, 0.7);

const context = chunks.map((c) => c.content).join("\n\n---\n\n");
// Prepend context to the system prompt or user message before calling the LLM.
```

---

## File Reference â€” Knowledge Page

| File | Role |
|---|---|
| [app/dashboard/knowledge/page.tsx](app/dashboard/knowledge/page.tsx) | RSC â€” auth + data fetch |
| [app/dashboard/knowledge/_components/KnowledgePageContent.tsx](app/dashboard/knowledge/_components/KnowledgePageContent.tsx) | Client layout, split pane, mobile drawer |
| [components/dashboard/UploadKnowledge.tsx](components/dashboard/UploadKnowledge.tsx) | Drag-drop upload zone |
| [components/ui/markdown-renderer.tsx](components/ui/markdown-renderer.tsx) | Styled markdown renderer |
| [lib/actions/document-actions.ts](lib/actions/document-actions.ts) | Upload pipeline + lazy content fetch |
| [lib/ai/embeddings.ts](lib/ai/embeddings.ts) | Embed, store, search utilities |

