/**
 * Makes a staff code.
 *
 * The staff area needs at least one person on the list before anybody can
 * sign in, and this is how the first one is made. It prints the code once.
 *
 * Run: node tools/add-staff.js "Dr Segun" [email]
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");

function env(name) {
  const file = path.join(ROOT, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
  const value = process.env[name];
  if (!value) {
    console.error(`FAIL: ${name} is not set`);
    process.exit(1);
  }
  return value;
}

const URL_BASE = env("SUPABASE_URL");
const KEY = env("SUPABASE_SERVICE_ROLE_KEY");

/** The same shape the site uses: scrypt, stored as "salt:hash" in hex. */
function hashSecret(secret) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(secret, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

/** The same alphabet the site uses. No 0 or O, no 1 or l. */
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const blocks = [];
  for (let b = 0; b < 4; b++) {
    let block = "";
    for (let i = 0; i < 5; i++) {
      block += alphabet[crypto.randomBytes(1)[0] % alphabet.length];
    }
    blocks.push(block);
  }
  return blocks.join("-");
}

async function main() {
  const name = (process.argv[2] || "").trim();
  const email = (process.argv[3] || "").trim();

  if (!name) {
    console.error('Usage: node tools/add-staff.js "Name" [email]');
    process.exit(1);
  }

  const code = generateCode();

  const res = await fetch(`${URL_BASE}/rest/v1/staff?select=id,name`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: `st_${crypto.randomUUID().slice(0, 8)}`,
      name,
      email: email || null,
      secret_hash: hashSecret(code),
      active: true,
    }),
  });

  if (!res.ok) {
    console.error("FAIL: " + (await res.text()));
    process.exit(1);
  }

  const row = await res.json();
  console.log(`\n  ${row[0].name} can sign in with this code:\n`);
  console.log(`      ${code}\n`);
  console.log("  It is shown once. Only a hash of it is kept, so it cannot be");
  console.log("  read back. Give it to them now, and put it somewhere safe.\n");
}

main().catch((e) => {
  console.error("FAIL: " + (e && e.message ? e.message : e));
  process.exit(1);
});
