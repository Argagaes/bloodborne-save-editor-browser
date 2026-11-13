import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// The fingerprint changes when shipped site code or assets change, without a manual version bump.
function siteVersion() {
  const root=process.cwd(), hash=createHash('sha256');
  function add(path) {
    const name=relative(root,path).replaceAll('\\','/');
    const entries=readdirSync(path,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'));
    for(const entry of entries) {
      const item=resolve(path,entry.name);
      if(entry.isDirectory()) add(item);
      else if(entry.isFile()) { hash.update(relative(root,item).replaceAll('\\','/')); hash.update('\0'); hash.update(readFileSync(item)); }
    }
  }
  for(const file of ['index.html','package.json','vite.config.mjs']) { try {hash.update(file);hash.update(readFileSync(resolve(root,file)));} catch(e){if(e.code!=='ENOENT')throw e;} }
  add(resolve(root,'src')); add(resolve(root,'public'));
  return hash.digest('hex').slice(0,16);
}
export default defineConfig({ base: './', cacheDir: './.vite-cache', plugins: [react()], define:{__APP_VERSION__:JSON.stringify(siteVersion())}, server: { port: 5176, strictPort: true } });
