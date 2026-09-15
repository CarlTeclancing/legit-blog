import {readFile,mkdir,writeFile,cp} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {join} from 'node:path'
import {build} from 'esbuild'

const root=fileURLToPath(new URL('../',import.meta.url))
const output=join(root,'.vercel','output')
const functionDir=join(output,'functions','render.func')
const html=await readFile(join(root,'dist','index.html'),'utf8')
if(!html.includes('<div id="root"></div>')||!html.includes('/assets/'))throw new Error('Build Vite before packaging the public renderer')
await mkdir(functionDir,{recursive:true})
await cp(join(root,'dist'),join(output,'static'),{recursive:true})
await build({
 stdin:{contents:"import {createHandler} from './server/request-handler.js'; export default createHandler(__PAGE_HTML__);",resolveDir:root,sourcefile:'renderer-entry.js'},
 bundle:true,platform:'node',format:'esm',target:'node22',outfile:join(functionDir,'index.mjs'),define:{__PAGE_HTML__:JSON.stringify(html)},
})
await writeFile(join(functionDir,'.vc-config.json'),JSON.stringify({runtime:'nodejs22.x',handler:'index.mjs',launcherType:'Nodejs'},null,2))
await writeFile(join(output,'config.json'),JSON.stringify({version:3,routes:[
 {src:'^/assets/(.*)$',headers:{'Cache-Control':'public, max-age=31536000, immutable'},continue:true},
 {src:'^/admin(?:/.*)?$',dest:'/index.html',headers:{'X-Robots-Tag':'noindex, nofollow'}},
 // Root must reach the renderer before the CDN resolves static index.html.
 {src:'^/$',dest:'/render?path='},
 {handle:'filesystem'},
 {src:'^/(.*)$',dest:'/render?path=$1'},
]},null,2))
console.log('Packaged public renderer with embedded HTML and matching static assets.')
