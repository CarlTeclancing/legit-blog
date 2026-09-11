import { Router } from 'express'
import slugify from 'slugify'
import sanitizeHtml from 'sanitize-html'
import { ownPosts, editorial } from './permissions.js'

export const handled = fn => async (req,res,next) => { try { await fn(req,res) } catch(error) {
  if(error.code==='P2025')return res.status(404).json({message:'Record not found.'})
  if(error.code==='P2002')return res.status(409).json({message:'This email or slug is already in use.'})
  if(error.status)return res.status(error.status).json({message:error.message})
  next(error)
} }
export function fail(message,status=400){throw Object.assign(new Error(message),{status})}
export function cleanContent(value) {
  return sanitizeHtml(String(value||''), {allowedTags:[...sanitizeHtml.defaults.allowedTags,'img','u','s'],allowedAttributes:{a:['href','target','rel'],img:['src','alt','width','height'],p:['style'],h1:['style'],h2:['style'],h3:['style'],h4:['style'],h5:['style'],h6:['style']},allowedStyles:{'*':{'text-align':[/^(left|center|right|justify)$/]}},allowedSchemes:['http','https','mailto','tel'],allowProtocolRelative:false})
}
export function postFilters(query,user) {
  const where={...ownPosts(user)}
  if(query.status){if(!['DRAFT','PUBLISHED','ARCHIVED'].includes(query.status))fail('Invalid status.');where.status=query.status}
  if(query.q)where.OR=['title','slug','excerpt'].map(field=>({[field]:{contains:String(query.q).slice(0,200),mode:'insensitive'}}))
  if(query.categoryId)where.categoryId=query.categoryId==='none'?null:String(query.categoryId)
  if(query.authorId&&user.role!=='AUTHOR')where.authorId=String(query.authorId)
  if(query.featured){if(!['true','false'].includes(query.featured))fail('Invalid featured filter.');where.featured=query.featured==='true'}
  for(const [key,operator] of [['from','gte'],['to','lte']])if(query[key]){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(query[key]))fail('Invalid date.')
    const date=new Date(query[key]+(key==='to'?'T23:59:59.999Z':'T00:00:00Z'));if(isNaN(date))fail('Invalid date.')
    where.createdAt={...where.createdAt,[operator]:date}
  }
  if(where.createdAt?.gte>where.createdAt?.lte)fail('Start date must be before end date.')
  return where
}
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
const select={id:true,title:true,slug:true,status:true,featured:true,authorId:true,categoryId:true,viewCount:true,likeCount:true,commentCount:true,seoScore:true,createdAt:true,updatedAt:true,author:{select:{id:true,name:true}},category:{select:{id:true,name:true}}}

export function postManagement(prisma,seoAnalysis){
 const router=Router()
 router.get('/posts/authors',handled(async(req,res)=>res.json(req.user.role==='AUTHOR'?[{id:req.user.id,name:req.user.name}]:await prisma.user.findMany({select:{id:true,name:true},orderBy:{name:'asc'}}))))
 router.get('/posts/export',handled(async(req,res)=>{
   const where=postFilters(req.query,req.user);const count=await prisma.post.count({where})
   if(count>10000)fail('Narrow your filters to export 10,000 posts or fewer.')
   const rows=await prisma.post.findMany({where,select,orderBy:[{createdAt:'desc'},{id:'asc'}],take:10000})
   const csv=[['Title','Slug','Status','Author','Category','Featured','Views','Likes','Comments','Created','Updated'],...rows.map(p=>[p.title,p.slug,p.status,p.author?.name,p.category?.name,p.featured,p.viewCount,p.likeCount,p.commentCount,p.createdAt.toISOString(),p.updatedAt.toISOString()])].map(row=>row.map(csvCell).join(',')).join('\r\n')
   res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="posts.csv"'}).send('\uFEFF'+csv)
 }))
 router.get('/posts',handled(async(req,res)=>{
   const where=postFilters(req.query,req.user);const size=Number(req.query.pageSize||20);const requested=Number(req.query.page||1)
   if(![10,20,50,100].includes(size)||!Number.isInteger(requested)||requested<1)fail('Invalid page or page size.')
   const total=await prisma.post.count({where});const pages=Math.max(1,Math.ceil(total/size));const page=Math.min(requested,pages)
   const sort=['createdAt','updatedAt','title','viewCount','seoScore'].includes(req.query.sort)?req.query.sort:'updatedAt';const direction=req.query.direction==='asc'?'asc':'desc'
   const items=await prisma.post.findMany({where,select,orderBy:[{[sort]:direction},{id:'asc'}],skip:(page-1)*size,take:size})
   res.json({items,total,page,pages,pageSize:size})
 }))
 router.post('/posts/bulk',handled(async(req,res)=>{
   if(!editorial.includes(req.user.role))fail('Only editors and admins can change publication status.',403)
   const {ids,status}=req.body
   if(!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(id=>typeof id!=='string')||!['DRAFT','PUBLISHED','ARCHIVED'].includes(status))fail('Select up to 100 posts and a valid status.')
   const result=await prisma.$transaction(async tx=>{
     if(status==='PUBLISHED')await tx.post.updateMany({where:{id:{in:ids},publishedAt:null},data:{publishedAt:new Date()}})
     return tx.post.updateMany({where:{id:{in:ids}},data:{status}})
   });res.json(result)
 }))
 router.post('/posts/seo-analyze',(req,res)=>res.json(seoAnalysis(req.body)))
 router.get('/posts/:id',handled(async(req,res)=>{
   const post=await prisma.post.findFirst({where:{id:req.params.id,...ownPosts(req.user)}});if(!post)fail('Post not found.',404);res.json(post)
 }))
 const save=handled(async(req,res)=>{
   const old=req.params.id?await prisma.post.findFirst({where:{id:req.params.id,...ownPosts(req.user)}}):null
   if(req.params.id&&!old)fail('Post not found.',404)
   const b=req.body;const author=req.user.role==='AUTHOR'
   if(author&&(old&&old.status!=='DRAFT'||b.status&&b.status!=='DRAFT'))fail('Authors can edit their own drafts only. An editor must publish them.',403)
   if(!String(b.title||'').trim())fail('A title is required.')
   const status=b.status||'DRAFT';if(!['DRAFT','PUBLISHED','ARCHIVED'].includes(status))fail('Invalid status.')
   const slug=slugify(String(b.slug||b.title),{lower:true,strict:true});if(!slug)fail('Enter a valid slug.')
   const data={title:String(b.title).trim().slice(0,300),slug,content:cleanContent(b.content),status,featured:author?false:!!b.featured,contentFormat:'html',publishedAt:status==='PUBLISHED'?(old?.publishedAt||new Date()):old?.publishedAt||null,categoryId:b.categoryId||null}
   for(const field of ['excerpt','featuredImage','featuredImageAlt','sourceName','sourceUrl','seoTitle','seoDescription','seoFocusKeyword'])data[field]=typeof b[field]==='string'?b[field]:null
   const seo=seoAnalysis(data);Object.assign(data,{seoScore:seo.score,seoChecks:seo.checks})
   const p=old?await prisma.post.update({where:{id:old.id,...(author?{status:'DRAFT',authorId:req.user.id}:{})},data}):await prisma.post.create({data:{...data,authorId:req.user.id}})
   res.status(old?200:201).json({...p,seo})
 })
 router.post('/posts',save);router.put('/posts/:id',save)
 router.delete('/posts/:id',handled(async(req,res)=>{
   const where={id:req.params.id,...ownPosts(req.user),...(req.user.role==='AUTHOR'?{status:'DRAFT'}:{})}
   const result=await prisma.post.deleteMany({where});if(!result.count)fail('Post not found or not editable.',404);res.json({ok:true})
 }))
 return router
}
