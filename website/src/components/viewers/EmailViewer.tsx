"use client";

import { useMemo } from "react";
import { useFileText } from "./use-file";

/**
 * An email message, read as a message.
 *
 * The suspect's email in the lab manual is an .eml file, which is a plain
 * text format with a header block, a blank line and then the body. It may
 * be more complicated than that: the headers may be folded over several
 * lines, the interesting words may be encoded as MIME encoded words, and
 * the body may be a multipart with the text in one part and the
 * attachments in others.
 *
 * All of that is handled here so that what shows is the message a person
 * would recognise.
 */

/** Decodes =?UTF-8?B?...?= and =?UTF-8?Q?...?= words. */
export function decodeEncodedWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g,
    (_match, charset: string, kind: string, payload: string) => {
      try {
        if (kind.toLowerCase() === "b") {
          const binary = atob(payload);
          const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
          return new TextDecoder(charset).decode(bytes);
        }
        const bytes = Uint8Array.from(
          payload
            .replace(/_/g, " ")
            .replace(/=([0-9A-F]{2})/gi, (_m, hex: string) =>
              String.fromCharCode(parseInt(hex, 16))
            ),
          (c) => c.charCodeAt(0)
        );
        return new TextDecoder(charset).decode(bytes);
      } catch {
        return _match;
      }
    }
  );
}

/** Decodes quoted-printable, which is how a body is usually carried. */
export function decodeQuotedPrintable(value: string): string {
  const withoutSoftBreaks = value.replace(/=\r?\n/g, "");
  const bytes: number[] = [];

  for (let i = 0; i < withoutSoftBreaks.length; i++) {
    const ch = withoutSoftBreaks[i];
    if (ch === "=") {
      const hex = withoutSoftBreaks.slice(i + 1, i + 3);
      if (/^[0-9A-F]{2}$/i.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(ch.charCodeAt(0) & 0xff);
  }

  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

export interface ParsedMail {
  headers: { name: string; value: string }[];
  body: string;
  attachments: string[];
}

export function parseMail(raw: string): ParsedMail {
  const text = raw.replace(/\r\n/g, "\n");

  const blank = text.indexOf("\n\n");
  const headerBlock = blank === -1 ? text : text.slice(0, blank);
  const rest = blank === -1 ? "" : text.slice(blank + 2);

  // Unfold the headers: a line that starts with a space continues the one
  // above it.
  const unfolded: string[] = [];
  for (const line of headerBlock.split("\n")) {
    if (/^[ \t]/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += " " + line.trim();
    } else {
      unfolded.push(line);
    }
  }

  const map = new Map<string, string>();
  for (const line of unfolded) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    map.set(name, decodeEncodedWords(value));
  }

  const contentType = map.get("content-type") ?? "";
  const boundary = /boundary="?([^";\s]+)"?/i.exec(contentType)?.[1];

  let body = rest;
  const attachments: string[] = [];

  if (boundary) {
    const parts = rest.split(`--${boundary}`);
    let chosen: { headers: string; body: string } | null = null;

    for (const part of parts) {
      const cut = part.indexOf("\n\n");
      if (cut === -1) continue;
      const partHeaders = part.slice(0, cut);
      const partBody = part.slice(cut + 2);
      const type =
        /content-type:\s*([^;\r\n]+)/i.exec(partHeaders)?.[1]?.trim() ?? "";

      if (type.startsWith("text/plain")) {
        chosen = { headers: partHeaders, body: partBody };
        break;
      }
      const filename =
        /filename="?([^";\r\n]+)"?/i.exec(partHeaders)?.[1];
      if (filename) attachments.push(filename);
    }

    if (chosen) {
      body = decodeTransfer(chosen.body, chosen.headers);
    }
  } else if (!contentType.startsWith("multipart/")) {
    body = decodeTransfer(rest, `content-transfer-encoding: ${map.get("content-transfer-encoding") ?? "8bit"}`);
  }

  const order = ["from", "to", "cc", "bcc", "subject", "date", "reply-to"];
  const headers = order
    .filter((name) => map.has(name))
    .map((name) => ({
      name: name === "subject" ? "Subject" : name[0].toUpperCase() + name.slice(1),
      value: map.get(name) as string,
    }));

  for (const [name, value] of map) {
    if (order.includes(name)) continue;
    if (name.startsWith("content-") || name === "mime-version") continue;
    headers.push({
      name: name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    });
  }

  return { headers, body: body.trim(), attachments };
}

/** Undoes the transfer encoding a part was carried in. */
function decodeTransfer(body: string, headers: string): string {
  const encoding =
    /content-transfer-encoding:\s*([\w-]+)/i.exec(headers)?.[1]?.toLowerCase() ??
    "8bit";

  if (encoding === "base64") {
    try {
      const binary = atob(body.replace(/\s+/g, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      return body;
    }
  }
  if (encoding === "quoted-printable") {
    return decodeQuotedPrintable(body);
  }
  return body;
}

export default function EmailViewer({ url }: { url: string }) {
  const state = useFileText(url);

  const parsed = useMemo(
    () => (state.status === "ready" ? parseMail(state.value) : null),
    [state]
  );

  if (state.status === "loading") {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        Reading the message
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        {state.message}
      </p>
    );
  }

  if (!parsed) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <dl className="shrink-0 divide-y divide-border border-b border-border">
        {parsed.headers.map((h) => (
          <div
            key={h.name}
            className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:gap-4"
          >
            <dt className="shrink-0 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted sm:w-24">
              {h.name}
            </dt>
            <dd className="min-w-0 break-words font-mono text-[12.5px] text-foreground">
              {h.value}
            </dd>
          </div>
        ))}
      </dl>

      {parsed.attachments.length > 0 && (
        <p className="border-b border-border px-4 py-2 text-[11.5px] text-muted">
          {parsed.attachments.length} attachment
          {parsed.attachments.length === 1 ? "" : "s"}:{" "}
          {parsed.attachments.join(", ")}
        </p>
      )}

      <pre className="whitespace-pre-wrap break-words px-4 py-4 font-mono text-[12.5px] leading-[1.75] text-foreground">
        {parsed.body}
      </pre>
    </div>
  );
}
