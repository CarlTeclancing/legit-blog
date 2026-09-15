import test from 'node:test'
import assert from 'node:assert/strict'

test('public pagination filters featured stories, bounds limits and keeps drafts out',async()=>{
 process.env.VERCEL='1'
 const queries=[]
 globalThis.__legitPrisma={
  $queryRaw:async query=>{queries.push(query);return Array.from({length:13},(_,i)=>({id:'p'+i,title:'Story '+i,slug:'story-'+i}))},
  category:{findUnique:async()=>({id:'c1',slug:'business'})},
  post:{count:async({where})=>{assert.equal(where.status,'PUBLISHED');return 1001},findMany:async({where,select,take,skip})=>{assert.equal(where.status,'PUBLISHED');assert.deepEqual(select,{slug:true,updatedAt:true});assert.equal(take,1000);assert.equal(skip,1000);return [{slug:'published-story',updatedAt:'2026-09-15T00:00:00Z'}]}}
 }
 const app=(await import('./server.js')).default
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base='http://127.0.0.1:'+server.address().port
 try{
  const result=await (await fetch(base+'/api/posts?limit=12&page=2&featured=true&status=DRAFT&category=business')).json()
  assert.equal(result.items.length,12);assert.equal(result.hasMore,true);assert.equal(result.nextPage,3);assert.equal(result.category.slug,'business')
  const sql=queries[0];assert.ok(sql.values.includes('PUBLISHED'));assert.ok(!sql.values.includes('DRAFT'));assert.ok(sql.values.includes('business'))
  assert.match(sql.strings.join(''),/"featured" = TRUE/);assert.deepEqual(sql.values.slice(-2),[13,12])
  const last=await (await fetch(base+'/api/posts?limit=100&page=-1')).json();assert.equal(last.page,1);assert.equal(last.hasMore,false);assert.equal(last.nextPage,null)
  const sitemap=await (await fetch(base+'/api/sitemap?page=2')).json();assert.equal(sitemap.totalPages,2);assert.equal(sitemap.items[0].slug,'published-story')
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));delete globalThis.__legitPrisma}
})
