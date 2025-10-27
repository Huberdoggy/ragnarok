import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import { useInterfaceReady } from "../hooks/useExperienceStore";
import { useSymphonicSearch } from "../hooks/useSymphonicSearch";
import { useRetrievalStatus } from "../hooks/useRetrievalStatus";
import type { RetrievalResult } from "../lib/retrieval";

interface ResultCardProps {
  result: RetrievalResult;
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const ariaLabel = `Result ${index + 1}, pages ${result.page_start} to ${result.page_end}`;
  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-3xl border px-6 py-5 transition duration-500",
        index === 0
          ? "border-accentGold/40 bg-glow/10 shadow-codex"
          : "border-accentGold/15 bg-white/60"
      )}
      aria-label={ariaLabel}
    >
      <div className="grain-overlay pointer-events-none absolute inset-0 opacity-60" />
      <header className="relative flex items-center justify-between">
        <span className="font-display text-sm uppercase tracking-[0.4em] text-ink/70">
          Sigil {result.id}
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-accentGold/80">
          {result.score.toFixed(3)}
        </span>
      </header>
      <div className="relative mt-4 space-y-3 text-sm leading-relaxed text-ink/80">
        <p>{result.preview}</p>
        <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
          Pages {result.page_start}
          {result.page_start !== result.page_end ? `–${result.page_end}` : ""}
        </p>
      </div>
    </article>
  );
};

const StatusRibbon: React.FC<{
  statuses: ReturnType<typeof useRetrievalStatus>;
  active: boolean;
}> = ({ statuses, active }) => (
  <ul className="flex flex-wrap gap-3">
    {statuses.stages.map((stage, idx) => {
      const isCurrent = active && idx === statuses.index;
      return (
        <li
          key={stage.key}
          className={clsx(
            "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em] transition",
            isCurrent
              ? "border-accentGold/70 bg-accentGold/20 text-ink"
              : "border-accentGold/20 text-ink/60"
          )}
        >
          {stage.label}
        </li>
      );
    })}
  </ul>
);

export const SymphonicInterface: React.FC = () => {
  const interfaceReady = useInterfaceReady();
  const { results, isLoading, error, lastQuery, search, clear } = useSymphonicSearch();
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [rerankEnabled, setRerankEnabled] = useState(true);

  const statuses = useRetrievalStatus(isLoading);

  const hasResults = results.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(query, { rerank: rerankEnabled, topK });
  };

  const handleClear = () => {
    setQuery("");
    clear();
  };

  const headline = useMemo(() => {
    if (isLoading) {
      return "Summoning the Chorus...";
    }
    if (hasResults) {
      return "Illuminated responses";
    }
    return "Symphonic Prompting interface";
  }, [isLoading, hasResults]);

  return (
    <section
      className={clsx(
        "relative flex flex-1 flex-col items-center px-6 py-12 transition-all duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
        interfaceReady
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-16 opacity-0"
      )}
    >
      <div className="grain-overlay relative w-full max-w-6xl rounded-[32px] border border-accentGold/20 bg-parchment/85 p-10 shadow-codex backdrop-blur">
        <header className="mb-8 flex flex-col gap-2 text-center md:text-left">
          <h1 className="font-display text-3xl uppercase tracking-[0.45em] text-ink md:text-4xl">
            {headline}
          </h1>
          <p className="text-sm uppercase tracking-[0.35em] text-ink/60">
            Whisper to the Tree, and the Chorus will answer.
          </p>
        </header>

        <form
          className="grid gap-6 rounded-3xl border border-accentGold/25 bg-white/60 p-6 backdrop-blur-sm md:grid-cols-[2fr,1fr]"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-4">
            <label className="text-xs uppercase tracking-[0.35em] text-ink/70">
              Whisper to the Tree
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What hymn shall the roots retrieve?"
                className="mt-3 w-full rounded-2xl border border-accentGold/25 bg-parchment px-5 py-3 font-serif text-base text-ink shadow-inner focus:border-accentGold/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold/50"
              />
            </label>
            {error ? (
              <p className="rounded-xl border border-red-300 bg-red-100/60 px-4 py-2 text-sm text-[#6b1b1b]">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-3 rounded-2xl border border-accentGold/20 bg-parchment/90 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-ink/70">
                <span>Reranker</span>
                <button
                  type="button"
                  onClick={() => setRerankEnabled((value) => !value)}
                  className={clsx(
                    "flex items-center gap-2 rounded-full border px-3 py-1 transition",
                    rerankEnabled
                      ? "border-accentGold bg-accentGold/20 text-ink"
                      : "border-accentGold/30 bg-transparent text-ink/50"
                  )}
                  aria-pressed={rerankEnabled}
                >
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      rerankEnabled ? "bg-accentGold" : "bg-ink/40"
                    )}
                  />
                  {rerankEnabled ? "Engaged" : "Muted"}
                </button>
              </div>

              <label className="block text-xs uppercase tracking-[0.25em] text-ink/70">
                Chorus breadth — top {topK}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={topK}
                  onChange={(event) => setTopK(Number(event.target.value))}
                  className="mt-2 w-full accent-accentGold"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-full border border-accentGold bg-accentGold px-6 py-3 text-sm uppercase tracking-[0.4em] text-ink shadow-md transition hover:bg-accentGold/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold/50"
                disabled={isLoading}
              >
                {isLoading ? "Summoning..." : "Invoke Chorus"}
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-accentGold/40 bg-transparent px-6 py-3 text-sm uppercase tracking-[0.4em] text-ink/70 transition hover:border-accentGold/60 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold/40"
                onClick={handleClear}
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          <StatusRibbon statuses={statuses} active={isLoading} />
          <div className="rounded-3xl border border-accentGold/20 bg-white/60 p-6">
            <h2 className="font-display text-xl uppercase tracking-[0.4em] text-ink/80">
              Chorus
            </h2>

            {!hasResults && !isLoading ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/70">
                Await the awakening of the Chorus by posing a query. The manuscript
                will respond with passages stitched from Symphonic Prompting once the
                retrieval index is forged.
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-4 animate-pulse text-sm text-ink/60">
                {statuses.current.description}
              </p>
            ) : null}

            {hasResults ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {results.map((result, index) => (
                  <ResultCard key={result.id} result={result} index={index} />
                ))}
              </div>
            ) : null}

            {lastQuery && !isLoading ? (
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ink/50">
                Manifested for: {lastQuery}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SymphonicInterface;
