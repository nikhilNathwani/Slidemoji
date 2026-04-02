#!/usr/bin/env node
/**
 * Usage: node scripts/import-firebase-key.js ~/Downloads/slidemoji-firebase-adminsdk-*.json
 *
 * Reads a Firebase Admin SDK service account JSON file and writes the three
 * server-side Firebase env vars into .env.local, preserving all other vars.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/import-firebase-key.js <path-to-service-account.json>");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(resolve(jsonPath), "utf8"));
const { project_id, client_email, private_key } = sa;

if (!project_id || !client_email || !private_key) {
  console.error("Invalid service account JSON — missing required fields.");
  process.exit(1);
}

// Escape private key for .env: replace real newlines with literal \n
const escapedKey = `"${private_key.replace(/\n/g, "\\n")}"`;

const envPath = resolve(".env.local");
let envContent = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

function setVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  return regex.test(content) ? content.replace(regex, line) : `${content}\n${line}`;
}

envContent = setVar(envContent, "FIREBASE_PROJECT_ID", project_id);
envContent = setVar(envContent, "FIREBASE_CLIENT_EMAIL", client_email);
envContent = setVar(envContent, "FIREBASE_PRIVATE_KEY", escapedKey);

writeFileSync(envPath, envContent.replace(/^\n+/, ""));

console.log(`✅ Updated .env.local with credentials for ${project_id}`);
console.log(`   Service account: ${client_email}`);
console.log();
console.log("Next steps:");
console.log("  1. Update Vercel env vars:  vercel env add FIREBASE_PRIVATE_KEY");
console.log("  2. Restart vercel dev");
