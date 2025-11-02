# RAGnarok

RAGnarok is a fully local retrieval-and-generation (RAG) showcase. The repository holds
the ingestion pipeline that turns the *Symphonic Prompting* manuscript into searchable
chunks, a FastAPI service for retrieval, and the cinematic React interface that guides
viewers through the experience.

---

## Watch in Action


---

## Backend Commands

The CLI examples below reference `nv-run.sh`, a local wrapper that binds Python to the
author's discrete GPU. Every command falls back to CPU execution when no
CUDA device is available.

- `nv-run.sh python -m app.ingest_pdf` – extract normalized text artifacts from the bundled PDF into `app/data/`.
- `nv-run.sh python -m app.chunking` – convert page JSONL records into retrieval chunks under `app/data/`.
- `nv-run.sh python -m app.build_index` – embed chunks with `intfloat/e5-large-v2` and build the FlatIP FAISS index under `app/index/`.
- `nv-run.sh python -m app.search --q "symphonic prompting" --k 5` – run a CLI search against the local index (add `--no-rerank` to bypass the cross-encoder).
- `nv-run.sh python -m app.api.server` – host the FastAPI retrieval service on `127.0.0.1:8000` for the UI to consume.

## Interface Commands

All UI work lives under `app/ui` (`cd app/ui && npm install`). The table outlines the
primary scripts for local exploration:

| Invocation | Description |
|------------|-------------|
| `npm run dev` | Launch the Vite dev server on `127.0.0.1:5173` with hot reloading and the cinematic awakening sequence. |
| `npm run build` | Produce the optimized production bundle under `app/ui/dist/`. |
| `npm run preview` | Serve the built assets on `127.0.0.1:4173` for release-ready verification. |

## Authorship and Use

RAGnarok is crafted by Kyle Huber as a narrative-first demonstration of his publication *Symphonic
Prompting*. Proprietary and nuanced aspects of the workflow have been omitted from source control. This build, as it stands, is meant to serve as a reference only.
