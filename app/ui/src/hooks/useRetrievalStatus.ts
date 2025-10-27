import { useEffect, useMemo, useState } from "react";

export interface RetrievalStage {
  key: string;
  label: string;
  description: string;
}

const STAGES: RetrievalStage[] = [
  {
    key: "embedding",
    label: "Embedding whispers",
    description: "Encoding your query and the chorus for resonance.",
  },
  {
    key: "reranking",
    label: "Reranking harmonics",
    description: "Balancing passages to match the cadence you seek.",
  },
  {
    key: "composing",
    label: "Composing reply",
    description: "Stitching citations and excerpts into illuminated prose.",
  },
];

export interface RetrievalStatus {
  current: RetrievalStage;
  stages: RetrievalStage[];
  index: number;
}

export function useRetrievalStatus(active: boolean): RetrievalStatus {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }

    setIndex(0);
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % STAGES.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, [active]);

  return useMemo(
    () => ({
      current: STAGES[index],
      stages: STAGES,
      index,
    }),
    [index]
  );
}

export default useRetrievalStatus;
