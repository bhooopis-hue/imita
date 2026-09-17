import {readFile,writeFile,mkdir,readdir,cp,rm} from 'node:fs/promises';
import {build} from 'esbuild';
const assets={};
async function walk(dir,prefix=''){for(const file of await readdir(dir,{withFileTypes:true})){if(file.name.startsWith('.')||file.name==='server')continue;const p=`${dir}/${file.name}`,key=`${prefix}/${file.name}`;if(file.isDirectory())await walk(p,key);else if(/\.(html|js|css|svg)$/.test(file.name))assets[key]={body:await readFile(p,'utf8'),type:file.name.endsWith('.js')?'text/javascript; charset=utf-8':file.name.endsWith('.css')?'text/css; charset=utf-8':file.name.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8'}}}
await walk('dist');await mkdir('dist/server',{recursive:true});
await cp('worker/api.mjs','dist/server/api.mjs');
await writeFile('dist/server/assets.mjs','export const assets='+JSON.stringify(assets)+';');
await cp('worker/index.mjs','dist/server/entry.mjs');
await build({entryPoints:['dist/server/entry.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
await Promise.all(['api.mjs','assets.mjs','entry.mjs'].map(f=>rm('dist/server/'+f)));
await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Worker built with',Object.keys(assets).length,'assets and D1 migrations.');
