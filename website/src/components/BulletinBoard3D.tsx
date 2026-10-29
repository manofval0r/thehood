"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox, Environment } from "@react-three/drei";
import { useMemo, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import type { BulletinFeed, BulletinItem } from "@/lib/bulletin-feed";

// Color coding: AI / digital sovereignty / digital forensics = online; events = warm; alerts = red
const NOTE_COLORS: Record<string, string> = {
  event: "#FDE047", // yellow sticky
  class: "#93C5FD", // blue sticky (online lecture default)
  in_person: "#86EFAC", // green sticky
  deadline: "#FCA5A5", // pink
  notice: "#FDE68A", // cream
  alert: "#F87171", // red
  online: "#93C5FD", // online course
};

function getNoteColor(item: BulletinItem): string {
  if (item.priority === "alert" || item.category === "alert") return NOTE_COLORS.alert;
  if (item.category === "event") return NOTE_COLORS.event;
  if (item.category === "deadline") return NOTE_COLORS.deadline;
  if (item.category === "class") {
    if (item.isOnline || item.venue?.toLowerCase().includes("online")) return NOTE_COLORS.online;
    return NOTE_COLORS.in_person;
  }
  return NOTE_COLORS.notice;
}

function StickyNote({ item, index, onSelect, onDrag }: { item: BulletinItem; index: number; onSelect: (i: BulletinItem) => void; onDrag?: (pos:[number,number,number]) => void }) {
  const color = getNoteColor(item);
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef([0, 0, 0]);

  const pos = useMemo(() => {
    const x = (Math.random() - 0.5) * 7;
    const y = 3 + (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 2;
    return [x, y, z] as [number, number, number];
  }, []);
  const rot = useMemo(() => {
    return [Math.random() * 0.15 - 0.075, Math.random() * 0.15 - 0.075, Math.random() * 0.05] as [number, number, number];
  }, []);

  useFrame((_, delta) => {
    if (!dragging && ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <mesh
      ref={ref}
      position={pos}
      rotation={rot}
      onPointerOver={() => !dragging && setHover(true)}
      onPointerOut={() => setHover(false)}
      onPointerDown={(e) => { e.stopPropagation(); setDragging(true); dragOffset.current = [0, 0, 0]; }}
      onPointerUp={() => setDragging(false)}
      onClick={() => { if (!dragging) onSelect(item); }}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[1.8, 1.2]} />
      <meshStandardMaterial
        color={hover ? "#FFF7ED" : color}
        roughness={0.7}
        metalness={0.1}
        emissive={hover ? "#FFF7ED" : "#000000"}
        emissiveIntensity={hover ? 0.25 : 0}
      />
      {/* Note text */}
      <group position={[0, 0.05, 0.01]} rotation={[-0.05, 0, 0]}>
        <Text
          fontSize={0.12}
          maxWidth={1.6}
          lineHeight={1.1}
          color="#3E2723"
          anchorX="center"
          anchorY="middle"
          font="/fonts/GeistSans-Regular.woff2"
        >
          {item.title?.slice(0, 28) || "Note"}
        </Text>
        <Text
          fontSize={0.07}
          maxWidth={1.6}
          color="#6B4F3B"
          position={[0, -0.25, 0]}
          anchorX="center"
          anchorY="middle"
        >
          {item.venue ? "In person" : "Online"} · {new Date(item.startTime || Date.now()).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
        </Text>
      </group>
    </mesh>
  );
}

function CorkBoard({ feed, filter, onNoteSelect }: { feed: BulletinFeed; filter: string; onNoteSelect: (i: BulletinItem) => void }) {
  const items = useMemo(() => {
    let list = feed.items || [];
    if (filter === "today") {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((i) => (i.startTime || i.createdAt || "").slice(0, 10) === today);
    } else if (filter === "events") {
      list = list.filter((i) => i.category === "event");
    } else if (filter === "classes") {
      list = list.filter((i) => i.category === "class");
    } else if (filter === "deadlines") {
      list = list.filter((i) => i.category === "deadline");
    } else if (filter === "alerts") {
      list = list.filter((i) => i.priority === "alert" || i.category === "alert");
    }
    // User-requested: remove lectures, remove in-person
    // Implemented as filter keys that can hide them (handled by filter selection)
    return list;
  }, [feed, filter]);

  return (
    <>
      {/* Cork background plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#A8704A" roughness={1} metalness={0} />
      </mesh>
      {/* Subtle pinboard frame */}
      <mesh position={[0, 3.2, -0.05]} rotation={[-0.02, 0, 0]}>
        <boxGeometry args={[10.2, 7.2, 0.05]} />
        <meshStandardMaterial color="#7A4F2E" roughness={0.9} />
      </mesh>
      <Suspense fallback={null}>
        <Environment preset="sunset" />
      </Suspense>
      {items.map((item, idx) => (
        <StickyNote key={item.id || idx} item={item} index={idx} onSelect={onNoteSelect} />
      ))}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

export default function BulletinBoard3D({ feed, fullPage = false }: { feed: BulletinFeed; fullPage?: boolean }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<BulletinItem | null>(null);
  const [mobile, setMobile] = useState(false);

  // Mobile detection for graceful fallback
  useState(() => {
    if (typeof window !== "undefined") {
      setMobile(window.innerWidth < 768);
      const onResize = () => setMobile(window.innerWidth < 768);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "classes", label: "Classes" },
    { key: "events", label: "Events" },
    { key: "deadlines", label: "Deadlines" },
    { key: "alerts", label: "Alerts" },
  ];

  const selectedItem = selected;

  return (
    <div className="relative w-full h-[32rem] md:h-[42rem] bg-[#D9B48A] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-[#5D3A1A]/10 dark:bg-[#3D2B1F]" role="region" aria-label="Bulletin board">
      {/* Filter bar */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap" role="group" aria-label="Bulletin filters">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm transition-all duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500
              ${filter === f.key ? "bg-amber-500 text-white shadow-amber-500/30" : "bg-white/90 text-stone-800 dark:bg-stone-800/90 dark:text-stone-100 hover:translate-y-[-1px] hover:shadow-md"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Canvas shadows camera={{ position: [0, 4, 10], fov: 45 }} dpr={[1, 2]}>
        <CorkBoard feed={feed} filter={filter} onNoteSelect={setSelected} />
      </Canvas>

      {/* Mobile 2D sticky grid fallback (visible on small screens / no-WebGL) */}
      <div className="md:hidden absolute inset-0 z-20 overflow-y-auto p-3 bg-gradient-to-b from-[#A8704A]/40 to-[#8B5A2B]/60">
        <div className="grid grid-cols-2 gap-3">
          {feed.items?.map((item, idx) => (
            <button
              key={item.id || idx}
              onClick={() => setSelected(item)}
              className="relative rounded-xl p-3 shadow-md transition-all duration-150 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] text-left"
              style={{ backgroundColor: getNoteColor(item) }}
              aria-label={`${item.title || "Note"}, ${item.venue ? "in person" : "online"}`}
            >
              <div className="text-xs font-semibold text-stone-900 leading-tight">{item.title?.slice(0, 40) || "Note"}</div>
              <div className="text-[10px] text-stone-700 mt-1 opacity-90">{item.venue ? "In person" : "Online"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail card when note selected */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-200 dark:border-stone-700 z-20"
            role="dialog"
            aria-label="Note details"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1 shadow-sm"
                style={{ backgroundColor: getNoteColor(selectedItem) }}
                aria-label="Note color indicator"
              />
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm leading-tight">{selectedItem.title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {selectedItem.venue ? "In person · " + selectedItem.venue : "Online"} ·{" "}
                  {new Date(selectedItem.startTime || Date.now()).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">{selectedItem.body || "No details posted."}</p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
              aria-label="Close note details"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
