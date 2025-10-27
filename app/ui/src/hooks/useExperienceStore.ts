import { create } from "zustand";

export type ExperienceStage =
  | "intro"
  | "approach"
  | "encounter"
  | "awakening"
  | "interface";

interface ExperienceState {
  stage: ExperienceStage;
  interfaceReady: boolean;
  setStage: (stage: ExperienceStage) => void;
  markInterfaceReady: () => void;
  skipCinematic: () => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  stage: "intro",
  interfaceReady: false,
  setStage: (stage) => set({ stage }),
  markInterfaceReady: () => set({ stage: "interface", interfaceReady: true }),
  skipCinematic: () => set({ stage: "interface", interfaceReady: true }),
}));

export const useInterfaceReady = (): boolean =>
  useExperienceStore((state) => state.interfaceReady);

export const useStage = (): ExperienceStage =>
  useExperienceStore((state) => state.stage);

export default useExperienceStore;
