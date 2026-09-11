import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import {auth} from './middleware/auth.js'
import {adminAccess,accountPermission} from './permissions.js'
import {postManagement,postFilters,csvCell,cleanContent} from './post-management.js'
import {authorManagement} from './author-management.js'

const author={id:'writer',role:'AUTHOR',active:true,name:'Writer'}
const editor={id:'editor',role:'EDITOR',active:true,name:'Editor'}
const admin={id:'admin',role:'ADMIN',active:true,name:'Admin'}
const root={id:'root',role:'SUPER_ADMIN',active:true,name:'Owner'}
async function harness(prisma,router,run){
 process.env.JWT_SECRET='management-test-secret'
 const accounts={writer:author,editor,admin,root,disabled:{id:'disabled',role:'ADMIN',active:false}}
 const app=express();app.locals.prisma={...prisma,user:{...prisma.user,findUnique:async({where})=>accounts[where.id]||null}}
 app.use(express.json());app.use('/admin',auth,adminAccess,router)
 app.use((error,req,res,next)=>res.status(500).json({message:error.message}))
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base='http://127.0.0.1:'+server.address().port
 const call=async(path,actor='writer',method='GET',body)=>fetch(base+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:actor,role:'SUPER_ADMIN'},process.env.JWT_SECRET)},body:body===undefined?undefined:JSON.stringify(body)})
 try{await run(call)}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
}

test('role hierarchy blocks privilege escalation and self lockout',()=>{
 assert.ok(accountPermission(admin,null,'SUPER_ADMIN',true))
 assert.ok(accountPermission(admin,root,'AUTHOR',true))
 assert.ok(accountPermission(root,root,'AUTHOR',true))
 assert.ok(accountPermission(root,root,'SUPER_ADMIN',false))
 assert.equal(accountPermission(admin,author,'EDITOR',true),null)
 assert.equal(accountPermission(root,admin,'ADMIN',true),null)
})
test('filters always enforce author ownership and CSV and HTML are safe',()=>{
 assert.equal(postFilters({authorId:'someone-else'},author).authorId,'writer')
 assert.equal(postFilters({authorId:'someone-else'},editor).authorId,'someone-else')
 assert.throws(()=>postFilters({status:'INVALID'},author))
 assert.throws(()=>postFilters({from:'2026-09-10',to:'2026-09-01'},author))
 assert.equal(csvCell('=SUM(A1)'), '"\'=SUM(A1)"')
 const html=cleanContent('<h2 style="text-align:center">Title</h2><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Link</a>')
 assert.ok(html.includes('text-align:center'));assert.ok(!html.includes('script'));assert.ok(!html.includes('onerror'))
})
test('authenticated roles use current database state and forbidden modules are denied',async()=>{
 const router=express.Router();for(const section of ['settings','newsletter','author-requests','posts'])router.get('/'+section,(req,res)=>res.json({role:req.user.role}))
 await harness({},router,async call=>{
  assert.equal((await call('/admin/settings')).status,403)
  assert.equal((await call('/admin/newsletter','editor')).status,403)
  assert.equal((await call('/admin/author-requests','editor')).status,403)
  assert.equal((await call('/admin/settings','disabled')).status,401)
  assert.equal((await (await call('/admin/posts')).json()).role,'AUTHOR')
  assert.equal((await call('/admin/settings','admin')).status,200)
 })
})
test('post lists and export are scoped, authors cannot edit other posts or publish',async()=>{
 const row={id:'p1',title:'Own draft',slug:'own-draft',status:'DRAFT',authorId:'writer',createdAt:new Date(),updatedAt:new Date()}
 let saved
 const prisma={post:{count:async({where})=>{assert.equal(where.authorId,'writer');return 1},findMany:async({where})=>{assert.equal(where.authorId,'writer');return [row]},findFirst:async({where})=>where.id==='p1'?row:null,update:async({data})=>{saved=data;return {...row,...data}}}}
 await harness(prisma,postManagement(prisma,()=>({score:0,checks:[]})),async call=>{
  const list=await call('/admin/posts?pageSize=10&authorId=other');assert.equal(list.status,200);assert.equal((await list.json()).total,1)
  assert.equal((await call('/admin/posts/export?authorId=other')).status,200)
  assert.equal((await call('/admin/posts/other')).status,404)
  assert.equal((await call('/admin/posts/p1','writer','PUT',{title:'Test',status:'PUBLISHED'})).status,403)
  assert.equal((await call('/admin/posts/bulk','writer','POST',{ids:['p1'],status:'PUBLISHED'})).status,403)
  assert.equal((await call('/admin/posts/p1','writer','PUT',{title:'Test',status:'DRAFT',content:'<script>bad()</script><p>Good</p>'})).status,200)
  assert.equal(saved.content,'<p>Good</p>')
 })
})
test('author replies save drafts, use applicant address and record delivery failures',async()=>{
 const application={id:'a1',email:'applicant@example.test',response:''};const history=[]
 const prisma={authorRequest:{findUnique:async()=>application,update:async({data})=>Object.assign(application,data)},authorReply:{create:async({data})=>{const row={id:'r'+history.length,...data};history.push(row);return row},update:async({where,data})=>Object.assign(history.find(r=>r.id===where.id),data)}}
 let recipient
 await harness(prisma,authorManagement(prisma,async(to,text)=>{recipient=to;assert.equal(text,'Hello')}),async call=>{
  const r=await call('/admin/author-requests/a1/reply','admin','POST',{response:'Hello',to:'attacker@example.test'});assert.equal(r.status,200);assert.equal(recipient,application.email);assert.equal(history[0].status,'SENT')
 })
 await harness(prisma,authorManagement(prisma,async()=>{throw new Error('SMTP unavailable')}),async call=>{
  assert.equal((await call('/admin/author-requests/a1/reply','admin','POST',{response:'Saved despite failure'})).status,502)
  assert.equal(application.response,'Saved despite failure');assert.equal(history[1].status,'FAILED')
 })
})
