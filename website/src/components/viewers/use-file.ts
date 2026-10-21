"use client";

import { useEffect, useState } from "react";

export type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "error"; message: string };

/**
 * Fetches a file and hands back its text.
 *
 * The files are public course resources. A reader who can download one can
 * read one, so the browser asks for it where it lives rather than the site
 * fetching it and passing it along. For the files in the repository that is
 * this site's own address; for an uploaded file it is the store the file was
 * put in.
 */
export function useFileText(url: string, enabled = true): LoadState<string> {
  const [state, setState] = useState<LoadState<string>>({ status: "loading" });

  useEffect(() => {
    if (!enabled || !url) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(url, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "That file is not on the server any more."
              : `The server answered ${res.status}.`
          );
        }
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setState({ status: "ready", value: text });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "The file could not be fetched.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return state;
}

/** The same, for a file that has to be read as bytes rather than as text. */
export function useFileBuffer(
  url: string,
  enabled = true
): LoadState<ArrayBuffer> {
  const [state, setState] = useState<LoadState<ArrayBuffer>>({
    status: "loading",
  });

  useEffect(() => {
    if (!enabled || !url) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(url, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "That file is not on the server any more."
              : `The server answered ${res.status}.`
          );
        }
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (!cancelled) setState({ status: "ready", value: buffer });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "The file could not be fetched.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return state;
}
