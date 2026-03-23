import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type SeatKey = `${string}-${number}`;

export interface Theatre3DSeat {
  rowLabel: string;
  number: number;
  isActive?: boolean;
}

export interface Theatre3DConfig {
  numRows: number;
  numCols: number;
  aisleColumns: number[]; // 1-based visual column indices to leave blank
}

export interface Theatre3DViewProps {
  config: Theatre3DConfig;
  seats: Theatre3DSeat[];
  selectedSeatKey?: SeatKey | null;
  selectedSeats?: Set<string>;
  reservedSeats?: Set<string>;
  onBackTo2D?: () => void;
  className?: string;
}

function seatNumberToVisualCol(seatNumber: number, aisleColumns: number[], totalVisualCols: number): number {
  let seatCounter = 0;
  for (let c = 1; c <= totalVisualCols; c++) {
    if (aisleColumns.includes(c)) continue;
    seatCounter += 1;
    if (seatCounter === seatNumber) return c;
  }
  return Math.max(1, Math.min(totalVisualCols, seatNumber));
}

function useSeatPositions(config: Theatre3DConfig, seats: Array<Theatre3DSeat & { y?: number }>) {
  return useMemo(() => {
    const activeSeats = (seats || []).filter((s) => s && s.isActive !== false);
    // Prefer actual saved seat Y positions (from persisted layout) to determine
    // front/back ordering. This fixes cases where VIP/Balcony rows use early letters
    // (e.g. A/B/C) but are physically at the back.
    const rowStats = new Map<string, { minY: number }>();
    for (const s of activeSeats as any[]) {
      const label = String(s?.rowLabel || '');
      if (!label) continue;
      const y = typeof s?.y === 'number' ? s.y : Number.NaN;
      const cur = rowStats.get(label);
      if (!cur) rowStats.set(label, { minY: Number.isFinite(y) ? y : Number.POSITIVE_INFINITY });
      else if (Number.isFinite(y)) cur.minY = Math.min(cur.minY, y);
    }

    const hasAnyY = Array.from(rowStats.values()).some((v) => Number.isFinite(v.minY) && v.minY !== Number.POSITIVE_INFINITY);

    const rowLabels = Array.from(new Set(activeSeats.map((s) => String(s.rowLabel))))
      .filter(Boolean)
      .sort((a, b) => {
        if (hasAnyY) {
          const ay = rowStats.get(a)?.minY ?? Number.POSITIVE_INFINITY;
          const by = rowStats.get(b)?.minY ?? Number.POSITIVE_INFINITY;
          if (Number.isFinite(ay) && Number.isFinite(by) && ay !== by) return ay - by; // top-to-bottom in 2D
        }
        return a.charCodeAt(0) - b.charCodeAt(0);
      });

    const rowIndexByLabel = new Map<string, number>();
    rowLabels.forEach((l, idx) => rowIndexByLabel.set(l, idx));

    const totalVisualCols = config.numCols + (config.aisleColumns?.length || 0);
    // Realistic physical spacing (meters-ish). This is critical when using a real GLB seat model.
    // Too-small row spacing is the main reason the backrest blocks the screen in first-person.
    const seatSpacingX = 0.65;
    const rowSpacingZ = 3.0;
    const rowRiseY = 0.3; // cinema riser height per row (0.25–0.35m)

    const width = (totalVisualCols - 1) * seatSpacingX;
    const rowCount = Math.max(1, rowLabels.length);
    const depth = (rowCount - 1) * rowSpacingZ;

    const positions = new Map<string, THREE.Vector3>();
    activeSeats.forEach((s) => {
      const rowIndex = rowIndexByLabel.get(String(s.rowLabel)) ?? 0;
      const visualCol = seatNumberToVisualCol(Number(s.number), config.aisleColumns || [], totalVisualCols);
      const x = (visualCol - 1) * seatSpacingX - width / 2;
      // Map 2D top rows to the back of the theatre (larger +z), and bottom rows to the front (near screen).
      const z = (rowCount - 1 - rowIndex) * rowSpacingZ - depth / 2;
      // Riser elevation: back rows are higher.
      const y = (rowCount - 1 - rowIndex) * rowRiseY;
      positions.set(`${s.rowLabel}-${s.number}`, new THREE.Vector3(x, 0, z));
      // Store Y in the vector itself (we'll read p.y everywhere).
      positions.get(`${s.rowLabel}-${s.number}`)!.y = y;
    });

    return { positions, width, depth, rowLabelsCount: rowLabels.length, seatSpacingX, rowSpacingZ, rowRiseY, rowCount };
  }, [config.aisleColumns, config.numCols, config.numRows, seats]);
}

type GLTFResult = any;

type SeatModelMetrics = {
  height: number; // Y size
  depth: number; // Z size
  width: number; // X size
  center: THREE.Vector3;
};

function computeFocusCameraPose(args: {
  seat: THREE.Vector3;
  seatModelMetrics?: SeatModelMetrics | null;
  seatModelScale?: number;
  rowSpacingZ?: number;
}) {
  const { seat, seatModelMetrics, seatModelScale = 1, rowSpacingZ } = args;
  const modelH = (seatModelMetrics?.height ?? 0) * seatModelScale;
  const modelD = (seatModelMetrics?.depth ?? 0) * seatModelScale;

  // Eye height: scale up a bit for tall GLB seats so we don't stare into the backrest.
  // Target realistic seated eye level: ~1.3–1.4m.
  const eyeHeight = THREE.MathUtils.clamp(modelH ? Math.max(1.35, modelH * 0.78) : 1.35, 1.3, 1.85);

  // Forward offset (towards screen): use more of the model depth so we land in front of the backrest,
  // and allow a bit more than rowSpacingZ so the "eye point" isn't trapped behind the next-row backrest.
  // Place eyes ~0.8–1.0m in front of backrest; clamp so we never jump into next row.
  const forwardBase = THREE.MathUtils.clamp(modelD ? Math.max(0.9, modelD * 0.55) : 0.9, 0.8, 1.0);
  const forwardMax = rowSpacingZ ? Math.max(1.0, rowSpacingZ * 0.45) : 1.0;
  const forward = Math.min(forwardBase, forwardMax);

  return {
    // Add the row riser height (seat.y) so the viewer rises with the row.
    cameraPos: new THREE.Vector3(seat.x, seat.y + eyeHeight, seat.z - forward),
    eyeHeight,
    forward
  };
}

function useSeatModelMetrics(): SeatModelMetrics | null {
  const gltf = useGLTF('/models/cinema-seat.glb') as GLTFResult;
  return useMemo(() => {
    const scene = gltf?.scene as THREE.Object3D | undefined;
    if (!scene) return null;
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || !Number.isFinite(size.z)) return null;
    // Guard against empty/degenerate bounds
    if (size.x <= 0 || size.y <= 0 || size.z <= 0) return null;
    return { width: size.x, height: size.y, depth: size.z, center };
  }, [gltf]);
}

class ThreeCanvasErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean; message?: string }> {
  state: { hasError: boolean; message?: string } = { hasError: false };
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: err?.message || String(err) };
  }
  componentDidCatch() {}
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function SeatFallbackField({
  config,
  seats,
  selectedSeatKey,
  selectedSeats,
  reservedSeats
}: {
  config: Theatre3DConfig;
  seats: Theatre3DSeat[];
  selectedSeatKey?: SeatKey | null;
  selectedSeats: Set<string>;
  reservedSeats: Set<string>;
}) {
  const { positions } = useSeatPositions(config, seats);
  const seatKeys = useMemo(() => Array.from(positions.keys()).sort(), [positions]);
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorAvailable = useMemo(() => new THREE.Color('#1f8a4c'), []);
  const colorSelected = useMemo(() => new THREE.Color('#fbbf24'), []);
  const colorFocused = useMemo(() => new THREE.Color('#60a5fa'), []);
  const colorReserved = useMemo(() => new THREE.Color('#6b7280'), []);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < seatKeys.length; i++) {
      const key = seatKeys[i];
      const p = positions.get(key);
      if (!p) continue;
      dummy.position.copy(p);
      dummy.position.y = p.y + 0.18;
      dummy.rotation.set(0, Math.PI, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const isReserved = reservedSeats.has(key);
      const isSelected = selectedSeats.has(key);
      const isFocused = selectedSeatKey === key;
      const c = isReserved ? colorReserved : isFocused ? colorFocused : isSelected ? colorSelected : colorAvailable;
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [
    colorAvailable,
    colorFocused,
    colorReserved,
    colorSelected,
    dummy,
    positions,
    reservedSeats,
    seatKeys,
    selectedSeatKey,
    selectedSeats
  ]);

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, seatKeys.length]} castShadow receiveShadow>
      <boxGeometry args={[0.42, 0.42, 0.42]} />
      <meshStandardMaterial vertexColors metalness={0.1} roughness={0.85} />
    </instancedMesh>
  );
}

function SeatInstancedField({
  config,
  seats,
  selectedSeatKey,
  selectedSeats,
  reservedSeats,
  seatModelMetrics,
  seatModelScale,
  screenCenter,
  rowSpacingZ
}: {
  config: Theatre3DConfig;
  seats: Theatre3DSeat[];
  selectedSeatKey?: SeatKey | null;
  selectedSeats: Set<string>;
  reservedSeats: Set<string>;
  seatModelMetrics?: SeatModelMetrics | null;
  seatModelScale: number;
  screenCenter: THREE.Vector3;
  rowSpacingZ: number;
}) {
  // You must provide this model at: frontend/public/models/cinema-seat.glb
  const gltf = useGLTF('/models/cinema-seat.glb') as GLTFResult;
  const { positions, seatSpacingX } = useSeatPositions(config, seats);

  const bakedParts = useMemo(() => {
    const parts: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material }> = [];
    const scene = gltf?.scene as THREE.Object3D | undefined;
    if (!scene) return parts;

    // Ensure world matrices are up to date so we can bake transforms.
    scene.updateMatrixWorld(true);

    scene.traverse((obj: any) => {
      if (!obj || !obj.isMesh) return;
      const mesh = obj as THREE.Mesh;
      const geom = mesh.geometry;
      if (!geom) return;

      // Bake the mesh's world transform into the geometry so instancing reproduces the full model shape.
      const baked = geom.clone();
      baked.applyMatrix4(mesh.matrixWorld);

      const baseMaterial = (mesh.material as THREE.Material) || new THREE.MeshStandardMaterial();
      const material = (baseMaterial as any).clone ? (baseMaterial as any).clone() : baseMaterial;
      if ((material as any).vertexColors === undefined) (material as any).vertexColors = true;
      (material as any).metalness = (material as any).metalness ?? 0.2;
      (material as any).roughness = (material as any).roughness ?? 0.75;

      parts.push({ geometry: baked, material });
    });

    return parts;
  }, [gltf]);

  const seatKeys = useMemo(() => Array.from(positions.keys()).sort(), [positions]);

  const instancedRefs = useRef<Array<THREE.InstancedMesh | null>>([]);
  instancedRefs.current = bakedParts.map((_, idx) => instancedRefs.current[idx] ?? null);

  const colorAvailable = useMemo(() => new THREE.Color('#1f8a4c'), []);
  const colorSelected = useMemo(() => new THREE.Color('#fbbf24'), []);
  const colorFocused = useMemo(() => new THREE.Color('#60a5fa'), []);
  const colorReserved = useMemo(() => new THREE.Color('#6b7280'), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const occluderKeys = useMemo(() => {
    if (!selectedSeatKey) return new Set<string>();
    const seatPos = positions.get(selectedSeatKey);
    if (!seatPos) return new Set<string>();

    // Compute the actual focused camera position (must match CameraDirector).
    const { cameraPos } = computeFocusCameraPose({ seat: seatPos, seatModelMetrics, rowSpacingZ });

    // Hide only seats that intersect the line-of-sight from camera to screen center.
    // Use the GLB seat width to decide how "thick" the occlusion tube is.
    const modelWidth = (seatModelMetrics?.width ?? 0) * (seatModelScale || 1);
    const radius = Math.max(seatSpacingX * 0.9, modelWidth > 0 ? modelWidth * 0.55 : 0);
    const a = cameraPos;
    const b = screenCenter;
    const ab = new THREE.Vector3().subVectors(b, a);
    const abLen2 = ab.lengthSq();
    if (abLen2 <= 1e-6) return new Set<string>();

    const ap = new THREE.Vector3();
    const scaled = new THREE.Vector3();
    const closest = new THREE.Vector3();

    const set = new Set<string>();
    for (const [key, p] of positions.entries()) {
      if (key === selectedSeatKey) continue;

      // Only consider seats between camera and screen (roughly)
      // Project point onto segment AB and check distance to segment.
      ap.subVectors(p, a);
      const t = THREE.MathUtils.clamp(ap.dot(ab) / abLen2, 0, 1);
      // IMPORTANT: don't mutate `ab` inside the loop (it breaks subsequent iterations)
      scaled.copy(ab).multiplyScalar(t);
      closest.copy(a).add(scaled);
      const dist = closest.distanceTo(p);

      // Additionally ensure the seat is in front of camera (towards screen)
      if (p.z >= a.z) continue;
      if (dist <= radius) set.add(key);
    }
    return set;
  }, [positions, rowSpacingZ, seatModelMetrics, screenCenter, seatSpacingX, selectedSeatKey]);

  useEffect(() => {
    // Apply matrices + colors after instanced meshes mount/update
    instancedRefs.current.forEach((m) => {
      if (!m) return;
      for (let i = 0; i < seatKeys.length; i++) {
        const key = seatKeys[i];
        const p = positions.get(key);
        if (!p) continue;
        // When focusing a seat in first-person, hide that seat mesh so the camera
        // isn't blocked by the seat-back (common with arbitrary GLB origins/scales).
        if ((selectedSeatKey && key === selectedSeatKey) || occluderKeys.has(key)) {
          dummy.position.set(0, -999, 0);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          m.setMatrixAt(i, dummy.matrix);
          // Still set a color to keep instanceColor arrays consistent
          m.setColorAt(i, colorFocused);
          continue;
        }

        dummy.position.copy(p);
        dummy.rotation.set(0, Math.PI, 0); // face screen
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);

        const isReserved = reservedSeats.has(key);
        const isSelected = selectedSeats.has(key);
        const isFocused = selectedSeatKey === key;
        const c = isReserved ? colorReserved : isFocused ? colorFocused : isSelected ? colorSelected : colorAvailable;
        m.setColorAt(i, c);
      }
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
  }, [
    colorAvailable,
    colorFocused,
    colorReserved,
    colorSelected,
    dummy,
    positions,
    occluderKeys,
    reservedSeats,
    seatKeys,
    selectedSeatKey,
    selectedSeats
  ]);

  // Render one instanced mesh per mesh-part in the GLTF seat model.
  return (
    <group scale={seatModelScale} position={[0, 0, 0]}>
      {bakedParts.map((part, meshIdx) => {
        return (
          <instancedMesh
            key={meshIdx}
            ref={(r) => {
              instancedRefs.current[meshIdx] = r;
            }}
            args={[part.geometry, part.material, seatKeys.length]}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
}

function ScreenPlane({
  screenWidth,
  screenHeight,
  screenCenter
}: {
  screenWidth: number;
  screenHeight: number;
  screenCenter: THREE.Vector3;
}) {
  return (
    <group position={[screenCenter.x, screenCenter.y, screenCenter.z]}>
      <mesh receiveShadow>
        <planeGeometry args={[screenWidth, screenHeight]} />
        <meshStandardMaterial color="#e5e7eb" emissive="#bcd7ff" emissiveIntensity={1.15} roughness={0.35} metalness={0.0} />
      </mesh>
    </group>
  );
}

function ScreenStage({
  screenWidth,
  screenCenter,
  stageTopY
}: {
  screenWidth: number;
  screenCenter: THREE.Vector3;
  stageTopY: number;
}) {
  const stageHeight = 0.45;
  const stageDepth = 2.4;
  return (
    <group>
      <mesh
        position={[screenCenter.x, stageTopY - stageHeight / 2, screenCenter.z + stageDepth / 2 + 0.25]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[Math.max(6, screenWidth * 0.85), stageHeight, stageDepth]} />
        <meshStandardMaterial color="#0b1220" roughness={0.92} metalness={0.06} />
      </mesh>
    </group>
  );
}

function TheatreLighting({ depth }: { depth: number }) {
  const screenZ = -depth / 2 - 4.0;
  return (
    <>
      {/* soft global ambience */}
      <ambientLight intensity={0.25} color="#cbd5e1" />

      {/* key light from above/back */}
      <spotLight
        position={[0, 10, depth / 2 + 8]}
        intensity={2.2}
        angle={0.45}
        penumbra={0.65}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00008}
      />

      {/* fill light */}
      <directionalLight position={[-8, 7, 6]} intensity={0.65} color="#b9d6ff" />

      {/* screen glow */}
      <pointLight position={[0, 1.2, screenZ + 0.8]} intensity={28} distance={18} color="#8ab4ff" />
    </>
  );
}

function TheatreWalls({
  width,
  depth,
  seatModelMetrics,
  seatModelScale
}: {
  width: number;
  depth: number;
  seatModelMetrics?: SeatModelMetrics | null;
  seatModelScale: number;
}) {
  // Dimensions roughly in meters-ish (matching the seat field scale).
  const wallHeight = 4.2;
  const wallThickness = 0.35;
  // Place walls immediately next to edge seats (no empty space).
  // Edge seat centers are at approximately +/- width/2.
  // Add half the (scaled) seat width + a tiny clearance so walls don't intersect geometry.
  const scaledSeatWidth = (seatModelMetrics?.width ?? 0) * (seatModelScale || 1);
  const clearance = 0.12;
  const halfW = width / 2 + (scaledSeatWidth > 0 ? scaledSeatWidth / 2 : 0.45) + clearance;
  const wallLen = depth + 10;
  const centerZ = 0;
  const wallLightColor = '#fbbf77';

  return (
    <group>
      {/* Left wall */}
      <mesh position={[-halfW - wallThickness / 2, wallHeight / 2, centerZ]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallLen]} />
        <meshStandardMaterial color="#0a0e18" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfW + wallThickness / 2, wallHeight / 2, centerZ]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallLen]} />
        <meshStandardMaterial color="#0a0e18" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Rear wall (helps edge seats feel enclosed) */}
      <mesh position={[0, wallHeight / 2, depth / 2 + 3.5]} receiveShadow castShadow>
        <boxGeometry args={[halfW * 2 + wallThickness, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#070b12" roughness={0.98} metalness={0.03} />
      </mesh>

      {/* Subtle wall wash lights */}
      {/* Warm side sconces every ~5m along both side walls */}
      {Array.from({ length: Math.max(3, Math.floor(wallLen / 5)) }).map((_, i) => {
        const t = (i + 0.5) / Math.max(3, Math.floor(wallLen / 5));
        const z = (t - 0.5) * wallLen * 0.8;
        return (
          <group key={i}>
            <pointLight
              position={[-halfW + 0.1, 2.0, z]}
              intensity={0.9}
              distance={7}
              color={wallLightColor}
            />
            <pointLight
              position={[halfW - 0.1, 2.0, z]}
              intensity={0.9}
              distance={7}
              color={wallLightColor}
            />
          </group>
        );
      })}
    </group>
  );
}

function CeilingLights({
  width,
  depth,
  rowCount
}: {
  width: number;
  depth: number;
  rowCount: number;
}) {
  const rows = Math.max(2, rowCount);
  const cols = 3;
  const startZ = -depth / 2 + 1.5;
  const endZ = depth / 2 - 1.5;
  const ceilingY = 4.8;

  const lights: any[] = [];
  for (let r = 0; r < rows; r++) {
    const z = rows === 1 ? 0 : startZ + ((endZ - startZ) * r) / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const x = ((c - (cols - 1) / 2) * width) / 3;
      lights.push(
        <pointLight
          key={`ceil-${r}-${c}`}
          position={[x, ceilingY, z]}
          intensity={0.5}
          distance={10}
          color="#ffe2b8"
        />
      );
    }
  }

  return <group>{lights}</group>;
}

function SteppedFloor({
  width,
  depth,
  rowCount,
  rowSpacingZ,
  rowRiseY,
  seatModelScale,
  seatModelMetrics
}: {
  width: number;
  depth: number;
  rowCount: number;
  rowSpacingZ: number;
  rowRiseY: number;
  seatModelScale?: number;
  seatModelMetrics?: SeatModelMetrics | null;
}) {
  const scaledSeatWidth = (seatModelMetrics?.width ?? 0) * (seatModelScale || 1);
  const clearance = 0.12;
  const halfW = width / 2 + (scaledSeatWidth > 0 ? scaledSeatWidth / 2 : 0.45) + clearance;
  
  const platforms = [];
  
  for (let r = 1; r < rowCount; r++) {
    const y_r = r * rowRiseY;
    const z_r = r * rowSpacingZ - depth / 2;
    const isLast = r === rowCount - 1;
    const pDepth = isLast ? rowSpacingZ + 4.0 : rowSpacingZ;
    const pCenterZ = isLast ? z_r - rowSpacingZ / 2 + pDepth / 2 : z_r;
    
    platforms.push(
      <mesh key={`tier-${r}`} position={[0, y_r / 2, pCenterZ]} receiveShadow castShadow>
        <boxGeometry args={[halfW * 2, y_r, pDepth]} />
        <meshStandardMaterial color="#070b12" roughness={0.98} metalness={0.02} />
      </mesh>
    );
  }

  return (
    <group>
      {/* Base floor covering the whole room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[Math.max(60, halfW * 2 + 10), Math.max(60, depth + 20)]} />
        <meshStandardMaterial color="#070b12" roughness={0.98} metalness={0.02} />
      </mesh>
      {platforms}
    </group>
  );
}

function CameraDirector({
  targetSeatKey,
  seatPositions,
  screenCenter,
  depth,
  seatModelMetrics,
  seatModelScale,
  rowSpacingZ
}: {
  targetSeatKey?: SeatKey | null;
  seatPositions: Map<string, THREE.Vector3>;
  screenCenter: THREE.Vector3;
  depth: number;
  seatModelMetrics?: SeatModelMetrics | null;
  seatModelScale?: number;
  rowSpacingZ?: number;
}) {
  const { gl } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const dragAngles = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    dragAngles.current = { x: 0, y: 0 };
  }, [targetSeatKey]);

  useEffect(() => {
    const el = gl.domElement;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!targetSeatKey) return;
      isDragging.current = true;
      previousPointer.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - previousPointer.current.x;
      const dy = e.clientY - previousPointer.current.y;
      previousPointer.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.005;
      dragAngles.current.x -= dx * sensitivity;
      dragAngles.current.y -= dy * sensitivity;

      const maxTilt = Math.PI / 4;
      dragAngles.current.y = THREE.MathUtils.clamp(dragAngles.current.y, -maxTilt, maxTilt);
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [gl.domElement, targetSeatKey]);

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const hasTarget = !!(targetSeatKey && seatPositions.has(targetSeatKey));
    if (hasTarget) {
      const seat = seatPositions.get(targetSeatKey!)!;
      // First-person "from the seat" view:
      // - eye height ~1.2m
      // - 0.7–0.9m in front of the seat backrest (towards screen)
      // - always look at the actual screen center (dynamic)
      // If GLB has a different origin/scale, derive offsets from the model bounds.
      const pose = computeFocusCameraPose({ seat, seatModelMetrics, seatModelScale, rowSpacingZ });
      targetPos.copy(pose.cameraPos);

      const baseTarget = tmp.copy(screenCenter);
      baseTarget.y += 0.06;
      const baseLook = new THREE.Vector3().subVectors(baseTarget, pose.cameraPos);

      const spherical = new THREE.Spherical().setFromVector3(baseLook);
      spherical.theta += dragAngles.current.x;
      spherical.phi += dragAngles.current.y;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.1, Math.PI - 0.1);

      const finalLookOffset = new THREE.Vector3().setFromSpherical(spherical);
      targetLook.copy(pose.cameraPos).add(finalLookOffset);

      // Dynamic FOV: closer seats feel wider, back seats slightly narrower (32–65°)
      const d = targetPos.distanceTo(screenCenter);
      const nearD = 6; // front-row-ish distance
      const farD = 22; // back-row-ish distance
      const t = THREE.MathUtils.clamp((d - nearD) / (farD - nearD), 0, 1);
      // Keep a realistic range (40–60 requested; still allow a bit of variation)
      const targetFov = THREE.MathUtils.clamp(THREE.MathUtils.lerp(60, 40, t), 40, 60);
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4.5, delta);
    } else {
      targetPos.set(0, 6.0, depth / 2 + 7.0);
      targetLook.copy(screenCenter);

      const targetFov = 42;
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4.5, delta);
    }

    const damp = (current: number, target: number, lambda: number) => THREE.MathUtils.damp(current, target, lambda, delta);
    camera.position.set(
      damp(camera.position.x, targetPos.x, 5.0),
      damp(camera.position.y, targetPos.y, 5.0),
      damp(camera.position.z, targetPos.z, 5.0)
    );

    // Use a stable lookAt target with damping via a temp vector
    const lookTarget = (camera as any).__lookTarget || new THREE.Vector3();
    (camera as any).__lookTarget = lookTarget;
    lookTarget.set(
      damp(lookTarget.x, targetLook.x, 10.0),
      damp(lookTarget.y, targetLook.y, 10.0),
      damp(lookTarget.z, targetLook.z, 10.0)
    );
    camera.lookAt(lookTarget);
    // Avoid near-clip artifacts when close to geometry
    camera.near = THREE.MathUtils.damp(camera.near, hasTarget ? 0.25 : 0.1, 8.0, delta);
    camera.updateProjectionMatrix();
  });

  return null;
}

export default function Theatre3DView({
  config,
  seats,
  selectedSeatKey,
  selectedSeats = new Set(),
  reservedSeats = new Set(),
  onBackTo2D,
  className
}: Theatre3DViewProps) {
  const { positions, depth, width, rowSpacingZ, rowRiseY, rowCount } = useSeatPositions(config, seats);
  const seatModelMetrics = useSeatModelMetrics();

  // Normalize the GLB to a realistic cinema seat footprint so spacing + camera offsets behave.
  // Targets (roughly meters): width ~0.65–0.75, height ~1.1–1.3, depth ~0.9–1.2
  const seatModelScale = useMemo(() => {
    if (!seatModelMetrics) return 1;
    const targetW = 0.72;
    const targetH = 1.2;
    const targetD = 1.05;
    const sx = targetW / seatModelMetrics.width;
    const sy = targetH / seatModelMetrics.height;
    const sz = targetD / seatModelMetrics.depth;
    const s = Math.min(sx, sy, sz);
    return THREE.MathUtils.clamp(s, 0.15, 2.5);
  }, [seatModelMetrics]);

  const screenWidth = useMemo(() => THREE.MathUtils.clamp(width * 0.9, 9, 16), [width]);
  const screenHeight = useMemo(() => THREE.MathUtils.clamp(screenWidth / 2.6, 3.2, 6.5), [screenWidth]);
  const screenBottomY = 1.75; // raise bottom edge above floor (real cinema feel)
  const screenCenter = useMemo(() => {
    // Place screen a bit in front of the first row; derived from seat field depth (dynamic per layout)
    // Raise the screen so the bottom is above floor level.
    const centerY = screenBottomY + screenHeight / 2;
    return new THREE.Vector3(0, centerY, -depth / 2 - 2.5);
  }, [depth, screenBottomY, screenHeight]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-white font-semibold">3D Theatre View</div>
        <div className="flex items-center gap-2">
          {selectedSeatKey ? (
            <div className="text-xs text-gray-300">Focused: <span className="text-white font-bold">{selectedSeatKey.replace('-', '')}</span></div>
          ) : (
            <div className="text-xs text-gray-400">Click a seat in 2D to focus</div>
          )}
          {onBackTo2D && (
            <button
              onClick={onBackTo2D}
              className="bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10"
            >
              Back to 2D
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-[520px] rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance', shadowMapType: THREE.PCFShadowMap } as any}
          camera={{ fov: 42, near: 0.1, far: 200, position: [0, 4.6, depth / 2 + 9.5] }}
          onCreated={({ gl, camera }) => {
            (gl as any).physicallyCorrectLights = true;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
            (gl as any).outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFShadowMap;
            camera.lookAt(0, 1.1, -depth / 2 - 4.5);
          }}
        >
          <TheatreLighting depth={depth} />

          <ThreeCanvasErrorBoundary
            fallback={
              <>
                <ScreenPlane screenWidth={screenWidth} screenHeight={screenHeight} screenCenter={screenCenter} />
                <SeatFallbackField
                  config={config}
                  seats={seats}
                  selectedSeatKey={selectedSeatKey}
                  selectedSeats={selectedSeats}
                  reservedSeats={reservedSeats}
                />
              </>
            }
          >
            <Suspense fallback={null}>
              <Environment preset="city" />
              <CeilingLights width={width} depth={depth} rowCount={rowCount} />
              <ScreenPlane screenWidth={screenWidth} screenHeight={screenHeight} screenCenter={screenCenter} />
              <ScreenStage screenWidth={screenWidth} screenCenter={screenCenter} stageTopY={screenBottomY} />
              <TheatreWalls width={width} depth={depth} seatModelMetrics={seatModelMetrics} seatModelScale={seatModelScale} />
              <SeatInstancedField
                config={config}
                seats={seats}
                selectedSeatKey={selectedSeatKey}
                selectedSeats={selectedSeats}
                reservedSeats={reservedSeats}
                seatModelMetrics={seatModelMetrics}
                seatModelScale={seatModelScale}
                screenCenter={screenCenter}
                rowSpacingZ={rowSpacingZ}
              />
            </Suspense>
          </ThreeCanvasErrorBoundary>

          {/* Floor */}
          <SteppedFloor
            width={width}
            depth={depth}
            rowCount={rowCount}
            rowSpacingZ={rowSpacingZ}
            rowRiseY={rowRiseY}
            seatModelMetrics={seatModelMetrics}
            seatModelScale={seatModelScale}
          />

          <CameraDirector
            targetSeatKey={selectedSeatKey}
            seatPositions={positions}
            screenCenter={screenCenter}
            depth={depth}
            seatModelMetrics={seatModelMetrics}
            seatModelScale={seatModelScale}
            rowSpacingZ={rowSpacingZ}
          />

          {/* Disable user control when focusing a seat for realism; keep very limited orbit otherwise */}
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={3}
            maxDistance={18}
            enabled={!selectedSeatKey}
          />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload('/models/cinema-seat.glb');

