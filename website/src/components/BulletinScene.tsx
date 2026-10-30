"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import {
  NOTE_H,
  NOTE_W,
  ROW_PITCH,
  type PlacedNote,
} from "@/components/bulletin/board/layout";
import type { BulletinPalette } from "@/components/BulletinPalette";
import { noteTone } from "@/components/BulletinPalette";

/**
 * The 3D stuck-note board.
 *
 * Deliberately restrained: notes are pinned pieces of paper with a small
 * deterministic tilt, drawn in the site's own tokens. There is no orbit
 * spin, no floating, no CDN skybox, no gradients and no glass. It is loaded
 * on demand with next/dynamic so the three.js bundle is only fetched when a
 * reader opens the board view at a desktop width.
 */

const BOARD_HALF_W = 2.8;
const BOARD_SCALING = 1.9;

function BoardPlane({
  rows,
  palette,
}: {
  rows: number;
  palette: BulletinPalette;
}) {
  const height = Math.max(rows, 1) * ROW_PITCH + 1.3;
  const width = BOARD_HALF_W * BOARD_SCALING;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.05]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color={palette.surfaceRaised} roughness={0.9} metalness={0} />
    </mesh>
  );
}

function Note({
  note,
  palette,
  onSelect,
}: {
  note: PlacedNote;
  palette: BulletinPalette;
  onSelect: (item: PlacedNote["item"]) => void;
}) {
  const color = noteTone(note.item, palette);
  const [hover, setHover] = useState(false);
  const group = useRef<THREE.Group>(null);

  // A short damped lift on hover, nothing else. The board never animates on
  // its own, so reduced-motion readers are not excluded from it.
  useFrame((_, delta) => {
    if (!group.current) return;
    const pullY = hover ? 0.12 : 0;
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      pullY,
      8,
      delta
    );
    const pullZ = hover ? 0.16 : 0;
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      pullZ,
      8,
      delta
    );
  });

  const title = note.item.title || "Update";
  const kind = note.item.kind;
  const whenText = note.item.startsAt
    ? new Date(note.item.startsAt).toLocaleDateString("en-GB", {
        timeZone: "Africa/Lagos",
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Posted update";

  return (
    <group position={[note.x, note.y, 0]} rotation={[0, 0, note.tilt]}>
      <group
        ref={group}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(note.item);
        }}
      >
        {/* The paper */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[NOTE_W, NOTE_H]} />
          <meshStandardMaterial
            color={hover ? palette.surfaceHover : palette.surfaceRaised}
            roughness={0.8}
            metalness={0}
          />
        </mesh>

        {/* The tone edge, left. Decoration; the kind is also text. */}
        <mesh position={[-NOTE_W / 2 + 0.04, 0, 0.025]}>
          <boxGeometry args={[0.09, NOTE_H, 0.025]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        {/* The pixel pin */}
        <mesh position={[0, NOTE_H / 2 + 0.02, 0.09]}>
          <sphereGeometry args={[0.075, 12, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>

        {/* Title and lines of context */}
        <Text
          font="/fonts/GeistSans-Regular.woff2"
          fontSize={0.15}
          maxWidth={NOTE_W - 0.24}
          lineHeight={1.05}
          color={palette.foreground}
          anchorX="center"
          anchorY="middle"
          position={[0, 0.13, 0.06]}
        >
          {title}
        </Text>
        <Text
          font="/fonts/GeistSans-Regular.woff2"
          fontSize={0.085}
          color={palette.mutedForeground}
          anchorX="center"
          anchorY="middle"
          position={[0, -0.3, 0.06]}
        >
          {`${kind}${note.item.startsAt ? " · " + whenText : ""}`}
        </Text>
      </group>
    </group>
  );
}

export default function BulletinScene({
  placed,
  palette,
  autoRotate = false,
  onSelect,
}: {
  placed: PlacedNote[];
  palette: BulletinPalette | null;
  autoRotate?: boolean;
  onSelect: (item: PlacedNote["item"]) => void;
}) {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.2, 7.2], fov: 40 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />

      {palette && (
        <>
          <BoardPlane
            rows={placed.length}
            palette={palette}
          />
          <Suspense fallback={null}>
            {placed.map((note) => (
              <Note key={note.item.id} note={note} palette={palette} onSelect={onSelect} />
            ))}
          </Suspense>
        </>
      )}

      <OrbitControls
        target={[0, 1, 0]}
        enableZoom={false}
        enablePan
        minPolarAngle={1.2}
        maxPolarAngle={1.75}
        minAzimuthAngle={-0.6}
        maxAzimuthAngle={0.6}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
