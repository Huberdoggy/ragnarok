# Smithing Objectives

Implement a local-only ingestion + retrieval pipeline for Symphonic Prompting with no
external paid API calls. Deliverables: PDF → chunks → embeddings → FAISS index (+
metadata), optional local reranker, and a tiny CLI for testing retrieval. Follow the repo
rules in **[AGENTS.md](../../AGENTS.md)**.

---

## Additional Constraints

- No OpenAI API usage. Use local models via sentence-transformers / PyTorch.
- Target corpus size is small; optimize for clarity over complexity.

---

### Task Plan

---

#### Ingestion:

Create module:
**`app/ingest_pdf.py`**
- Extract text from the PDF (prefer pdfminer.six or pypdf), preserve page
numbers.
- Normalize whitespace; keep paragraph breaks.
- Write app/data/symphonic_raw.txt and app/data/symphonic_pages.jsonl
(one record per page: {page, text}).

#### Chunker:

Create module:
- **`app/chunking.py`** with:

  - Sentence/paragraph aware spli#ng (regex fallback is fine), then sliding window merge.
  - Defaults: chunk ~700–1000 tokens (approx 1200–1600 chars) with 10–15% overlap.
  - Output **`app/data/symphonic_chunks.jsonl`** with:
  ```
  {“id”: “sym-000123”, “page_start”: 12, “page_end”: 13, “start_char”: 250,
  “end_char”: 1580, “text”: “...”}
  ```

#### Embeddings (local):

- Model: intfloat/e5-large-v2 (Sentence Transformers).
- Normalize vectors to unit length (Inner Product ≈ cosine).
- Write NumPy float32 matrix to app/index/embeddings.npy and mirrored ids.json.
- Save model to local cache (app/models/ if needed).

#### Vector index (FAISS):

- Index type: FlatIP (simple & perfect for small corpora).
- Build & persist to app/index/faiss.index.
- Provide a builder script: app/build_index.py that:
  1. Loads symphonic_chunks.jsonl
  2. Embeds → saves embeddings.npy
  3. Builds FAISS → saves faiss.index
  4. Writes meta.json (paths, dims, build time, model name)

#### Reranker (optional but preferred):

- Cross-encoder: BAAI/bge-reranker-base via sentence-transformers CrossEncoder.
- At query time: retrieve top 50 from FAISS, then rerank to top 5.
- No training; inference only.

#### Search CLI:

Create module:
- **`app/search.py`** with:
  - search(query: str, top_k: int=5) returns a JSON list:
  ```
  [{“id”:“sym-000123”,“score”:0.84,
  “page_start”:12,“page_end”:13,
  “preview”:"..."}, ...]
  ```
  - Print pretty JSON to stdout.
- Entry point: *nv-run.sh python -m app.search --q “What is Symphonic Prompting?” --k 5*
- Include a *--no-rerank* flag for ablation testing.

#### Quality gates:

- Determinism: fixed random seeds in any sampling step (if used).
- Text fidelity: ensure chunk boundaries don’t split mid-word; avoid duplicated chunks.

#### Repo hygiene:

- Add minimal docstrings and type hints in public functions.
- Write a tiny smoke test: **`app/tests/test_search_smoke.py`** that asserts ≥1 hit for a
known keyword.

#### Outputs for UI (later):

- Provide **`app/api/retrieval_service.py`** with a function retrieve(query)->List[Result] so the UI can import it. Keep it simple and pure.
- Don’t implement a server yet; this is just a callable.

#### Acceptance Criteria:

- No network calls to api.openai.com.
- flake8 passes (no errors), black applied.
- Add to **[README.md](../../README.md)** describing the three commands below.
- **`IMPORTANT`** -> Do not attempt the following commands in the sandbox. I will run these myself:
  - *nv-run.sh python -m app.ingest_pdf* → creates **`app/data/symphonic_raw.txt`** & **...pages.jsonl**
  - *nv-run.sh python -m app.build_index* → creates **`app/index/faiss.index`**, **embeddings.npy**, **ids.json**, **meta.json**
  - *nv-run.sh python -m app.search --q “symphonic prompting” --k 5* → prints JSON with valid citations (ids + page spans)


#### Branch & PR:

- Branch: feature/ingest-index-cli
- Open a PR when done with a short checklist in the description:
  - PDF → text + pages.jsonl
  - chunks.jsonl
  - embeddings.npy + ids.json
  - faiss.index + meta.json
  - optional reranker
  - search CLI
  - lint/format pass
- Inform me upon completion of your checklist. I will run the commands specificed above as validation before merge.