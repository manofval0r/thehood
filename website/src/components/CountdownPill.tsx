"use client";

import CountdownHoverCard from "@/components/CountdownHoverCard";

/**
 * The next class, floating below the navbar.
 *
 * The one thing a student opens the site to check, so it gets its own strip.
 * Hovering (or tapping) it opens a card with what period comes next, whether
 * it is the same class already running, and how many breaks fall inside it.
 */
export default function CountdownPill() {
  return <CountdownHoverCard />;
}
