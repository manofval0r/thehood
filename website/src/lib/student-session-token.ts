import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export interface VerifiedStudentToken {
  matric: string;
  name: string;
  expiresAt: number;
}

function signingKey(secret: string): string {
  return `student-session:${secret}`;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", signingKey(secret))
    .update(payload)
    .digest("base64url");
}

export function sealStudentToken(
  student: { matric: string; name: string },
  secret: string,
  expiresAt: number
): string {
  const payload = Buffer.from(
    JSON.stringify({
      matric: student.matric,
      name: student.name,
      expiresAt,
    }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readStudentToken(
  token: string,
  secret: string,
  now = Date.now()
): VerifiedStudentToken | null {
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const supplied = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<VerifiedStudentToken>;
    if (
      typeof parsed.matric !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt <= now
    ) {
      return null;
    }
    return {
      matric: parsed.matric,
      name: parsed.name,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}
