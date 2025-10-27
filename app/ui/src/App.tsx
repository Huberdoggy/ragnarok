import SymphonicCanvas from "./components/SymphonicCanvas";
import CinematicPrelude from "./components/CinematicPrelude";
import SymphonicInterface from "./components/SymphonicInterface";

export const App: React.FC = () => (
  <div className="relative min-h-screen overflow-hidden bg-parchment text-ink">
    <SymphonicCanvas />
    <CinematicPrelude />
    <SymphonicInterface />
  </div>
);

export default App;
