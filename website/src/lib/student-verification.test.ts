import { describe, expect, it } from "vitest";
import {
  VerificationThrottle,
  matchesRosterIdentity,
  normalizeMatric,
  normalizeSurname,
} from "@/lib/student-verification";
import {
  readStudentToken,
  sealStudentToken,
} from "@/lib/student-session-token";

describe("student identity normalization", () => {
  it("normalizes matric numbers without changing their meaning", () => {
    expect(normalizeMatric("  2423131001  ")).toBe("2423131001");
    expect(normalizeMatric("nutm/24/001")).toBe("NUTM/24/001");
  });

  it("normalizes surname accents, case, punctuation, and whitespace", () => {
    expect(normalizeSurname("  O’KÉLÉ - Smith ")).toBe("okelesmith");
  });

  it("matches only the registered final surname token", () => {
    const row = {
      matric: "2423131001",
      name: "David Ayonifemi Idowu",
      course: "CYB 305",
    };

    expect(matchesRosterIdentity(row, "2423131001", "Idowu")).toBe(true);
    expect(matchesRosterIdentity(row, "2423131001", "Ayonifemi")).toBe(false);
    expect(matchesRosterIdentity(row, "2423131002", "Idowu")).toBe(false);
  });
});

describe("student session token", () => {
  const secret = "test-admin-secret";
  const expiresAt = Date.parse("2026-11-28T12:00:00.000Z");

  it("round-trips only the narrow verified student payload", () => {
    const token = sealStudentToken(
      { matric: "2423131001", name: "David Ayonifemi Idowu" },
      secret,
      expiresAt
    );

    expect(readStudentToken(token, secret, expiresAt - 1)).toEqual({
      matric: "2423131001",
      name: "David Ayonifemi Idowu",
      expiresAt,
    });
  });

  it("rejects expired and tampered tokens", () => {
    const token = sealStudentToken(
      { matric: "2423131001", name: "David Ayonifemi Idowu" },
      secret,
      expiresAt
    );

    expect(readStudentToken(token, secret, expiresAt)).toBeNull();
    expect(readStudentToken(`${token.slice(0, -1)}x`, secret, expiresAt - 1)).toBeNull();
    expect(readStudentToken(token, "wrong-secret", expiresAt - 1)).toBeNull();
  });
});

describe("verification throttle", () => {
  it("blocks the fifth failed attempt for fifteen minutes and can be cleared", () => {
    let now = 1_000_000;
    const throttle = new VerificationThrottle({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      now: () => now,
    });

    for (let i = 0; i < 4; i += 1) {
      throttle.recordFailure("127.0.0.1");
      expect(throttle.isBlocked("127.0.0.1")).toBe(false);
    }
    throttle.recordFailure("127.0.0.1");
    expect(throttle.isBlocked("127.0.0.1")).toBe(true);

    throttle.clear("127.0.0.1");
    expect(throttle.isBlocked("127.0.0.1")).toBe(false);

    throttle.recordFailure("127.0.0.1");
    now += 15 * 60 * 1000 + 1;
    expect(throttle.isBlocked("127.0.0.1")).toBe(false);
  });
});
