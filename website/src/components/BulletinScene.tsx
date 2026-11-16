"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import {
  NOTE_GAP,
  NOTE_H,
  NOTE_W,
  ROW_PITCH,
  noteRows,
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

// The 3-note row is 3 * NOTE_W + 2 * NOTE_GAP = 5.49 world units wide, so the
// board needs at least that plus margin; computed, not eyeballed.
const BOARD_WIDTH = 3 * NOTE_W + 2 * NOTE_GAP + 1.35;

function BoardPlane({
  rows,
  palette,
}: {
  rows: number;
  palette: BulletinPalette;
}) {
  // A vertical backdrop that grows with the note count. The old version
  // lay flat like a table and the camera stood nearly edge-on to it, which
  // is why the canvas came up as a black void.
  const count = Math.max(rows, 4);
  const topY = 3.55;
  const bottomY = Math.min(-0.7, 2.6 - (count - 1) * ROW_PITCH - 1.3);
  const height = topY - bottomY;
  const width = BOARD_WIDTH;
  return (
    <group>
      <mesh position={[0, (topY + bottomY) / 2, -0.15]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={palette.surfaceRaised} roughness={0.92} metalness={0} />
      </mesh>
      {/* The accent rail along the top and bottom edges, so the board reads as one object. */}
      <mesh position={[0, topY, -0.13]}>
        <boxGeometry args={[width, 0.08, 0.02]} />
        <meshStandardMaterial color={palette.accent} roughness={0.5} />
      </mesh>
      <mesh position={[0, bottomY, -0.13]}>
        <boxGeometry args={[width, 0.08, 0.02]} />
        <meshStandardMaterial color={palette.accent} roughness={0.5} />
      </mesh>
      <Text
        font="/fonts/GeistSans-Regular.ttf"
        fontSize={0.17}
        letterSpacing={0.08}
        anchorX="center"
        anchorY="middle"
        color={palette.mutedForeground}
        position={[0, topY + 0.3, -0.1]}
      >
        THE HOOD · LIVE BOARD
      </Text>
    </group>
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
            color={hover ? "#fffdf0" : "#f7f2e3"}
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
          font="/fonts/GeistSans-Regular.ttf"
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
          font="/fonts/GeistSans-Regular.ttf"
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
  const rows = noteRows(placed.length);
  const centerY = 2.6 - ((Math.max(rows, 1) - 1) * ROW_PITCH) / 2;
  const span = rows * ROW_PITCH + 1.5;
  const distance = (span / 2 / Math.tan((21 * Math.PI) / 180)) * 1.02;

  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.5]}
      camera={{ position: [0, centerY + 1.0, distance], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      {palette && <color attach="background" args={[palette.background]} />}
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 6, 5]} intensity={1.35} />

      {palette && (
        <>
          <Suspense fallback={null}>
            {placed.map((note) => (
              <Note key={note.item.id} note={note} palette={palette} onSelect={onSelect} />
            ))}
          </Suspense>
          <BoardPlane rows={noteRows(placed.length)} palette={palette} />
        </>
      )}

      <OrbitControls
        target={[0, centerY, 0]}
        enableZoom={false}
        enablePan
        minPolarAngle={1.3}
        maxPolarAngle={1.7}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
