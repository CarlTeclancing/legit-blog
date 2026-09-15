import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import {readFile,access} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {join} from 'node:path'

const output=fileURLToPath(new URL('../.vercel/output/',import.meta.url))
const post={id:'post1',slug:'cameroon-business',title:'Business & opportunity in Cameroon',excerpt:'A local business report.',content:'<h2>Local reporting</h2><p>The actual full article is readable.</p>',featuredImage:'https://images.example/featured.jpg',featuredImageAlt:'A business owner in Douala',publishedAt:'2026-09-15T10:00:00Z',author:{name:'Reporter'}}

test('packaged renderer serves full articles and featured-image previews without a runtime dist directory',async()=>{
 const bundle=await readFile(join(output,'functions/render.func/index.mjs'),'utf8')
 assert.ok(!bundle.includes('node:fs'));assert.ok(!bundle.includes('process.cwd'))
 const {default:handler}=await import('../.vercel/output/functions/render.func/index.mjs')
 const originalApi=process.env.VITE_API_URL,originalSite=process.env.VITE_SITE_URL
 const seen=[]
 const api=http.createServer((req,res)=>{
  seen.push(req.url);res.setHeader('Content-Type','application/json')
  if(req.url==='/settings')return res.end(JSON.stringify({siteName:'Legit.cm',logoUrl:'https://images.example/logo.png'}))
  if(req.url==='/posts/cameroon-business?preview=true')return res.end(JSON.stringify(post))
  res.statusCode=404;res.end(JSON.stringify({message:'Not found'}))
 })
 await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve))
 process.env.VITE_API_URL='http://127.0.0.1:'+api.address().port
 process.env.VITE_SITE_URL='https://www.legit.cm'
 const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 const base='http://127.0.0.1:'+server.address().port
 try{
  for(const agent of ['Mozilla/5.0','facebookexternalhit/1.1','WhatsApp/2.0','Twitterbot/1.0']){
   const response=await fetch(base+'/render?path=article/cameroon-business',{headers:{'User-Agent':agent}})
   assert.equal(response.status,200)
   const html=await response.text()
   assert.match(html,/<meta property="og:type" content="article"/)
   assert.match(html,/<meta property="og:image" content="https:\/\/images.example\/featured.jpg"/)
   assert.match(html,/<meta name="twitter:image" content="https:\/\/images.example\/featured.jpg"/)
   assert.match(html,/<meta name="twitter:card" content="summary_large_image"/)
   assert.match(html,/<meta property="og:description" content="A local business report\."/)
   assert.ok(html.includes(post.content));assert.ok(html.includes('Business &amp; opportunity in Cameroon'))
   const initial=JSON.parse(html.match(/<script id="initial-article" type="application\/json">([\s\S]*?)<\/script>/)[1])
   assert.deepEqual(initial,post)
   const script=html.match(/src="(\/assets\/[^\"]+\.js)"/)[1]
   await access(join(output,'static',script.slice(1)))
  }
  assert.equal((await fetch(base+'/article/cameroon-business')).status,200)
  assert.equal((await fetch(base+'/render?path=article/missing')).status,404)
  assert.ok(seen.includes('/posts/cameroon-business?preview=true'))
 }finally{
  server.closeAllConnections();api.closeAllConnections()
  await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>api.close(r))])
  if(originalApi===undefined)delete process.env.VITE_API_URL;else process.env.VITE_API_URL=originalApi
  if(originalSite===undefined)delete process.env.VITE_SITE_URL;else process.env.VITE_SITE_URL=originalSite
 }
})

test('deployment routes render the homepage before static index resolution and preserve admin/assets',async()=>{
 const config=JSON.parse(await readFile(join(output,'config.json'),'utf8'))
 const routes=config.routes
 const matching=path=>routes.find(r=>r.src&&new RegExp(r.src).test(path)&&!r.continue)
 assert.equal(matching('/').dest,'/render?path=')
 assert.ok(routes.indexOf(matching('/'))<routes.findIndex(r=>r.handle==='filesystem'))
 assert.equal(matching('/admin/posts').dest,'/index.html')
 assert.equal(matching('/article/cameroon-business').dest,'/render?path=$1')
 const runtime=JSON.parse(await readFile(join(output,'functions/render.func/.vc-config.json'),'utf8'))
 assert.equal(runtime.runtime,'nodejs22.x');assert.equal(runtime.handler,'index.mjs')
})
