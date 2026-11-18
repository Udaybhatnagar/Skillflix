import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const origin=(process.env.SITE_URL||'http://localhost:5173').replace(/\/$/,'');
const paths=['/','/courses','/paths','/categories','/playlists','/exams','/skills','/resources','/teachers','/about','/contact','/privacy','/terms'];
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${new URL(path,origin).href}</loc></url>`).join('')}</urlset>\n`;
writeFileSync(resolve('public/sitemap.xml'),xml);
