// Publishes a private page: AES-GCM ciphertext + unlock shim under <slug>/.
// Usage: node encrypt-private.mjs <slug> "<Title>" [key]   (omit key to mint a new one = new link)
// Plaintext sources live in ~/command-center/private-pages/<slug>.html — never in a repo.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { homedir } from 'node:os';

const [slug, title, keyArg] = process.argv.slice(2);
if (!slug || !title) { console.error('usage: node encrypt-private.mjs <slug> "<Title>" [key]'); process.exit(1); }
const b64u = b => Buffer.from(b).toString('base64url');

const keyBytes = keyArg ? Buffer.from(keyArg, 'base64url') : crypto.getRandomValues(new Uint8Array(32));
const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, readFileSync(`${homedir()}/command-center/private-pages/${slug}.html`));
mkdirSync(slug, { recursive: true });
writeFileSync(`${slug}/page.enc.json`, JSON.stringify({ iv: b64u(iv), ct: b64u(ct) }));
writeFileSync(`${slug}/index.html`, readFileSync('private-shim.html', 'utf8').replaceAll('{{TITLE}}', title));
console.log(`https://strauchagency.com/${slug}/#k=${b64u(keyBytes)}`);
