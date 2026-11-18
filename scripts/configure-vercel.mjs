import { readFileSync, writeFileSync } from 'node:fs';
const value = process.argv[2];
if (!value) throw new Error('Usage: node scripts/configure-vercel.mjs https://YOUR-API-HOST');
const origin = new URL(value);
if (
  origin.protocol !== 'https:' ||
  origin.username ||
  origin.password ||
  origin.pathname !== '/' ||
  origin.search ||
  origin.hash
)
  throw new Error('Provide an HTTPS API origin with no path, credentials, or query');
const file = new URL('../vercel.json', import.meta.url);
const config = JSON.parse(readFileSync(file, 'utf8'));
config.rewrites = [
  { source: '/api/:path*', destination: `${origin.origin}/api/:path*` },
  { source: '/((?!api/).*)', destination: '/index.html' },
];
writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
console.log('Vercel API proxy configured. Commit vercel.json and push to deploy.');
