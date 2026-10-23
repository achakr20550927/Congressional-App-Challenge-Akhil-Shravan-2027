import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function offlineShell() {
  return { name: 'neuratrack-offline-shell', generateBundle(_, bundle) {
    const publicFiles = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.svg', '/fonts/NotoSans-Regular.ttf', '/models/research-evaluation.json'];
    const files = ['/index.html', ...publicFiles, ...Object.keys(bundle).filter(n => /\.(js|css|woff2?)$/.test(n)).map(n => '/' + n)];
    const hash = createHash('sha256').update(JSON.stringify(files));
    for (const file of publicFiles) hash.update(readFileSync(new URL('./public' + file, import.meta.url)));
    const version = hash.digest('hex').slice(0,12);
    this.emitFile({type:'asset', fileName:'sw.js', source:`const CACHE='neuratrack-${version}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('neuratrack-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>r.ok?r:caches.match('/index.html')).catch(()=>caches.match('/index.html')));return;}if(FILES.includes(new URL(e.request.url).pathname)){e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreVary:true})).then(hit=>hit||fetch(e.request)));}});`});
  }};
}

export default defineConfig({
  plugins: [react(), offlineShell()],
  server: { port: 5173 },
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
