## Symphonic Prompting Backend Commands

Run these via the provided CUDA wrapper once the repository dependencies are installed:

- `nv-run.sh python -m app.ingest_pdf` – extract normalized text artifacts from the bundled PDF into `app/data/`.
- `nv-run.sh python -m app.build_index` – embed chunks with `intfloat/e5-large-v2` and build the FlatIP FAISS index under `app/index/`.
- `nv-run.sh python -m app.search --q "symphonic prompting" --k 5` – query the index and print JSON results (add `--no-rerank` to disable the CrossEncoder pass).
