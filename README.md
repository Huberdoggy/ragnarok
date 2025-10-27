## Symphonic Prompting Backend Commands

Run these via the provided CUDA wrapper once the repository dependencies are installed:

- `nv-run.sh python -m app.ingest_pdf` – extract normalized text artifacts from the bundled PDF into `app/data/`.
- `nv-run.sh python -m app.build_index` – embed chunks with `intfloat/e5-large-v2` and build the FlatIP FAISS index under `app/index/`.
- `nv-run.sh python -m app.search --q "symphonic prompting" --k 5` – query the index and print JSON results (add `--no-rerank` to disable the CrossEncoder pass).
- `nv-run.sh python -m app.api.server` – host the FastAPI retrieval service on `127.0.0.1:8000` for the UI to consume.

## Symphonic Interface (Localhost Only)

All interface work lives under `app/ui`. Install dependencies locally (`cd app/ui && npm install`) and start the orchestrated dev server on localhost:

- `npm run dev` – launches the Vite dev server bound to `127.0.0.1:5173` with the cinematic awakening sequence and retrieval console.
- `npm run build` – produces the production bundle.
- `npm run preview` – serves the built assets on `127.0.0.1:4173` for a final verification pass.
