export interface RosterIdentity {
  matric: string;
  name: string;
  course: string;
}

export function normalizeMatric(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeSurname(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function finalNameToken(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? "";
}

export function matchesRosterIdentity(
  row: RosterIdentity,
  matric: string,
  surname: string
): boolean {
  return (
    normalizeMatric(row.matric) === normalizeMatric(matric) &&
    normalizeSurname(finalNameToken(row.name)) === normalizeSurname(surname) &&
    normalizeSurname(surname).length > 0
  );
}

interface ThrottleOptions {
  maxAttempts: number;
  windowMs: number;
  now?: () => number;
}

export class VerificationThrottle {
  private readonly failures = new Map<
    string,
    { count: number; until: number }
  >();

  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(options: ThrottleOptions) {
    this.maxAttempts = options.maxAttempts;
    this.windowMs = options.windowMs;
    this.now = options.now ?? Date.now;
  }

  isBlocked(key: string): boolean {
    const entry = this.failures.get(key);
    if (!entry) return false;
    if (this.now() > entry.until) {
      this.failures.delete(key);
      return false;
    }
    return entry.count >= this.maxAttempts;
  }

  recordFailure(key: string): void {
    const now = this.now();
    const entry = this.failures.get(key);
    if (!entry || now > entry.until) {
      this.failures.set(key, { count: 1, until: now + this.windowMs });
      return;
    }
    entry.count += 1;
    entry.until = now + this.windowMs;
  }

  clear(key: string): void {
    this.failures.delete(key);
  }
}

export const studentVerificationThrottle = new VerificationThrottle({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
});
