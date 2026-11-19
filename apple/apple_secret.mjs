// Makes the "client secret" Apple sign-in needs, from the key file Apple gave you.
// Run it with make_apple_secret.command. It lasts about six months, then needs redoing.
import { SignJWT, importPKCS8 } from "jose";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const TEAM_ID = "ZWRRKD9F4L";       // your Apple Developer team
const CLIENT_ID = "co.nesos.auth";  // the Services ID

const downloads = join(homedir(), "Downloads");
const keys = readdirSync(downloads)
  .filter((name) => /^AuthKey_[A-Z0-9]+\.p8$/.test(name))
  .map((name) => ({ name, time: statSync(join(downloads, name)).mtimeMs }))
  .sort((a, b) => b.time - a.time);

if (keys.length === 0) {
  console.log("\nNo key file found. Look for a file named AuthKey_XXXXXXXXXX.p8 in your Downloads folder.\n");
  process.exit(1);
}

const file = keys[0].name;
const keyId = file.replace("AuthKey_", "").replace(".p8", "");
const privateKey = await importPKCS8(readFileSync(join(downloads, file), "utf8"), "ES256");
const now = Math.floor(Date.now() / 1000);

const secret = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: keyId })
  .setIssuer(TEAM_ID)
  .setIssuedAt(now)
  .setExpirationTime(now + 180 * 24 * 60 * 60)
  .setAudience("https://appleid.apple.com")
  .setSubject(CLIENT_ID)
  .sign(privateKey);

execSync("pbcopy", { input: secret });
const expires = new Date((now + 180 * 24 * 60 * 60) * 1000).toDateString();
console.log(`\nUsed key file: ${file}`);
console.log("The secret is now copied. Paste it into Vercel with Cmd + V.");
console.log(`It expires on ${expires}. Put a reminder in your calendar a week before.\n`);
