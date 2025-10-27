import { useCallback, useRef, useState } from "react";
import { querySymphonic, RetrievalResult } from "../lib/retrieval";

export interface SearchOptions {
  rerank: boolean;
  topK?: number;
}

export interface SearchState {
  results: RetrievalResult[];
  isLoading: boolean;
  error: string | null;
  lastQuery: string;
  search: (query: string, options: SearchOptions) => Promise<void>;
  clear: () => void;
}

export function useSymphonicSearch(): SearchState {
  const [results, setResults] = useState<RetrievalResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, options: SearchOptions) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Speak a query to the Tree before invoking the Chorus.");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setLastQuery(trimmed);

    try {
      const data = await querySymphonic(trimmed, {
        rerank: options.rerank,
        topK: options.topK ?? 5,
        signal: controller.signal
      });
      setResults(data);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "The Chorus fell silent. Try again.";
      setError(message);
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setResults([]);
    setError(null);
    setLastQuery("");
  }, []);

  return {
    results,
    isLoading,
    error,
    lastQuery,
    search,
    clear
  };
}

export default useSymphonicSearch;
