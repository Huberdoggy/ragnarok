import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Points, PointLight } from "three";
import { Color } from "three";
import { useInterfaceReady } from "../hooks/useExperienceStore";

type WebGLStatus = "checking" | "ready" | "fallback" | "error";

const detectWebGLSupport = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      desynchronized: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      failIfMajorPerformanceCaveat: false,
    };

    const context =
      (canvas.getContext("webgl2", attributes) as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl", attributes) as WebGLRenderingContext | null);

    if (!context) {
      return false;
    }

    const loseContext = (context as unknown as { getExtension?: Function }).getExtension?.(
      "WEBGL_lose_context"
    );
    loseContext?.loseContext?.();
    return true;
  } catch (error) {
    console.warn("SymphonicCanvas: WebGL capability detection failed.", error);
    return false;
  }
};

interface CanvasBoundaryProps {
  onError: () => void;
  children: React.ReactNode;
}

class CanvasBoundary extends Component<
  CanvasBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("SymphonicCanvas WebGL initialization error:", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const Backdrop: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0d0906] via-[#120c08] to-[#1a100c]"
    aria-hidden="true"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(248,222,126,0.25),_transparent_60%)]" />
  </div>
);

const ParticleField: React.FC = () => {
  const count = 240;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = Math.random() * 3.2 + 1.2;
      const angle = Math.random() * Math.PI * 2;
      const y = Math.random() * 2 - 1;
      arr[i * 3 + 0] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = y * 0.8;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, [count]);

  const pointsRef = useRef<Points>(null);

  useFrame(({ clock }) => {
    if (!pointsRef.current) {
      return;
    }
    const elapsed = clock.getElapsedTime();
    pointsRef.current.rotation.y = elapsed * 0.05;
    pointsRef.current.rotation.x = Math.sin(elapsed * 0.1) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={new Color("#F8DE7E")}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.22}
      />
    </points>
  );
};

const ChorusLight: React.FC<{ awakened: boolean }> = ({ awakened }) => {
  const lightRef = useRef<PointLight>(null);
  useFrame(() => {
    if (!lightRef.current) {
      return;
    }
    const target = awakened ? 2.2 : 1.0;
    lightRef.current.intensity += (target - lightRef.current.intensity) * 0.02;
  });
  return (
    <pointLight
      ref={lightRef}
      position={[0, 1.6, 2.4]}
      intensity={awakened ? 2.2 : 1.0}
      color={new Color("#F8DE7E")}
    />
  );
};

const logFallbackHint = () => {
  console.warn(
    "SymphonicCanvas: Rendering static parchment backdrop because WebGL initialization failed. Append '?forceWebGL=1' to the dev URL to retry with the animated field."
  );
};

export const SymphonicCanvas: React.FC = () => {
  const awakened = useInterfaceReady();
  const [status, setStatus] = useState<WebGLStatus>("checking");
  const [generation, setGeneration] = useState(0);

  const forceWebGL =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("forceWebGL") === "1";

  useEffect(() => {
    if (forceWebGL) {
      setStatus("ready");
      return;
    }
    const supported = detectWebGLSupport();
    setStatus(supported ? "ready" : "fallback");
    if (!supported) {
      logFallbackHint();
    }
  }, [forceWebGL, generation]);

  if (!forceWebGL && status === "fallback") {
    return <Backdrop />;
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {status === "error" ? (
        <Backdrop />
      ) : (
        <CanvasBoundary
          key={generation}
          onError={() => {
            setStatus("error");
            logFallbackHint();
          }}
        >
          <Canvas
            camera={{ position: [0, 0.4, 5], fov: 36 }}
            onCreated={({ gl }) => {
              gl.setClearColor(new Color("#0d0906"));
            }}
            gl={{
              alpha: true,
              antialias: true,
              depth: true,
              stencil: false,
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false,
              preserveDrawingBuffer: false,
              premultipliedAlpha: true,
            }}
          >
            <color attach="background" args={["#0d0906"]} />
            <ambientLight intensity={0.32} />
            <ChorusLight awakened={awakened} />
            <Suspense fallback={null}>
              <ParticleField />
            </Suspense>
          </Canvas>
        </CanvasBoundary>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#120c08]/60 to-[#120c08]/85" />
    </div>
  );
};

export default SymphonicCanvas;
