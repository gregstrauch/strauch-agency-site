// Encrypts the private Sales System page for strauchagency.com/sales-system/.
// Usage: node encrypt-sales-system.mjs [existing-key]   (omit key to mint a new link)
// Source of truth: ~/command-center/sales-system-files/sales-system.html (never published in plaintext).
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { homedir } from 'node:os';

const b64u = b => Buffer.from(b).toString('base64url');
const SRC = `${homedir()}/command-center/sales-system-files/sales-system.html`;

const keyBytes = process.argv[2] ? Buffer.from(process.argv[2], 'base64url') : crypto.getRandomValues(new Uint8Array(32));
const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, readFileSync(SRC));
writeFileSync('sales-system/page.enc.json', JSON.stringify({ iv: b64u(iv), ct: b64u(ct) }));
console.log(`https://strauchagency.com/sales-system/#k=${b64u(keyBytes)}`);
