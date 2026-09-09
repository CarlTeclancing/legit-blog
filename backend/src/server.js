import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import slugify from 'slugify'
import crypto from 'node:crypto'
import {PrismaClient} from '@prisma/client'
import {auth,roles} from './middleware/auth.js'

const prisma=new PrismaClient()
const app=express()
const allowedOrigins=(process.env.FRONTEND_URL||'http://localhost:5173').split(',').map(origin=>origin.trim()).filter(Boolean)
app.use(cors({origin:(origin,callback)=>{
 const isLocalOrigin=origin&&/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
 if(!origin||allowedOrigins.includes(origin)||isLocalOrigin)return callback(null,true)
 callback(new Error('Origin not allowed by CORS'))
}}))
app.use(express.json({limit:'2mb'}))
app.use(morgan('dev'))

const safeUser={id:true,name:true,email:true,role:true,bio:true,avatar:true,active:true,createdAt:true}
const postInclude={author:{select:{id:true,name:true,bio:true,avatar:true}},category:true,tags:{include:{tag:true}}}
const imageTypes=new Set(['image/jpeg','image/png','image/webp','image/gif'])
const maxImageBytes=5*1024*1024

function seoAnalysis(post){
 const text=String(post.content||'').replace(/<[^>]+>/g,' '); const title=String(post.title||''); const description=String(post.seoDescription||post.excerpt||''); const keyword=String(post.seoFocusKeyword||'').trim().toLowerCase();
 const checks=[
  {key:'keyword',label:'Focus keyword is set',pass:Boolean(keyword)},
  {key:'titleLength',label:'SEO title is 30-60 characters',pass:post.seoTitle?.length>=30&&post.seoTitle.length<=60},
  {key:'descriptionLength',label:'Meta description is 120-160 characters',pass:description.length>=120&&description.length<=160},
  {key:'keywordTitle',label:'Focus keyword appears in the title',pass:Boolean(keyword&&title.toLowerCase().includes(keyword))},
  {key:'keywordBody',label:'Focus keyword appears in the content',pass:Boolean(keyword&&text.toLowerCase().includes(keyword))},
  {key:'readability',label:'Content has at least 300 words',pass:text.trim().split(/\s+/).filter(Boolean).length>=300},
  {key:'imageAlt',label:'Featured image has alt text',pass:Boolean(post.featuredImageAlt?.trim())}
 ]; return {score:Math.round(checks.filter(item=>item.pass).length/checks.length*100),checks};
}

async function uploadToCloudinary(buffer,{filename,mimeType,folder='the-archive'}){
 const {CLOUDINARY_CLOUD_NAME:cloudName,CLOUDINARY_API_KEY:apiKey,CLOUDINARY_API_SECRET:apiSecret}=process.env
 if(!cloudName||!apiKey||!apiSecret)throw Object.assign(new Error('Cloudinary is not configured'),{status:503})
 const timestamp=Math.floor(Date.now()/1000); const signature=crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex')
 const form=new FormData(); form.append('file',new Blob([buffer],{type:mimeType}),filename); form.append('api_key',apiKey); form.append('timestamp',String(timestamp)); form.append('signature',signature); form.append('folder',folder)
 const response=await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,{method:'POST',body:form}); const data=await response.json(); if(!response.ok)throw Object.assign(new Error(data.error?.message||'Cloudinary upload failed'),{status:502}); return data
}

app.get('/api/health',(req,res)=>res.json({ok:true}))

app.post('/api/auth/login',async(req,res)=>{
 const {email,password}=req.body; const u=await prisma.user.findUnique({where:{email}})
 if(!u||!u.active||!await bcrypt.compare(password,u.password))return res.status(401).json({message:'Invalid credentials'})
 const token=jwt.sign({id:u.id,email:u.email,name:u.name,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'})
 res.json({token,user:{id:u.id,email:u.email,name:u.name,role:u.role}})
})

app.use((err,req,res,next)=>{
 if(res.headersSent)return next(err)
 console.error(err)
 res.status(500).json({message:'Internal server error'})
})

app.get('/api/categories',async(req,res)=>res.json(await prisma.category.findMany({orderBy:{name:'asc'},include:{_count:{select:{posts:true}}}})))
app.get('/api/settings',async(req,res)=>res.json(await prisma.siteSetting.upsert({where:{id:'main'},update:{},create:{id:'main'}})))

app.get('/api/posts',async(req,res)=>{
 const {category,status='PUBLISHED',limit='30'}=req.query
 const where={}; if(status)where.status=status; if(category)where.category={slug:category}
 const items=await prisma.post.findMany({where,take:Math.min(Number(limit)||30,100),orderBy:[{featured:'desc'},{publishedAt:'desc'},{createdAt:'desc'}],include:postInclude})
 const cat=category?await prisma.category.findUnique({where:{slug:category}}):null
 res.json({items,category:cat})
})
app.get('/api/posts/:slug',async(req,res)=>{
 const p=await prisma.post.findUnique({where:{slug:req.params.slug},include:postInclude}); if(!p)return res.status(404).json({message:'Not found'});res.json(p)
})
app.get('/api/search',async(req,res)=>{
 const q=String(req.query.q||'').trim()
 if(!q)return res.json([])
 const all=await prisma.post.findMany({where:{status:'PUBLISHED'},orderBy:{publishedAt:'desc'},include:postInclude,take:100})
 const lower=q.toLowerCase(); res.json(all.filter(p=>[p.title,p.excerpt,p.content].some(v=>v?.toLowerCase().includes(lower))).slice(0,30))
})
app.post('/api/newsletter',async(req,res)=>{
 const email=String(req.body.email||'').trim().toLowerCase();if(!email.includes('@'))return res.status(400).json({message:'Valid email required'})
 const item=await prisma.newsletterSubscriber.upsert({where:{email},update:{active:true},create:{email,source:'website'}});res.status(201).json(item)
})

app.use('/api/admin',auth)
app.get('/api/admin/stats',async(req,res)=>{
 const [published,drafts,categories,users,subscribers]=await Promise.all([
  prisma.post.count({where:{status:'PUBLISHED'}}),prisma.post.count({where:{status:'DRAFT'}}),prisma.category.count(),prisma.user.count(),prisma.newsletterSubscriber.count({where:{active:true}})
 ]);res.json({published,drafts,categories,users,subscribers})
})
app.get('/api/admin/profile',async(req,res)=>res.json(await prisma.user.findUnique({where:{id:req.user.id},select:safeUser})))
app.put('/api/admin/profile',async(req,res)=>{
 const {name,bio,avatar}=req.body; res.json(await prisma.user.update({where:{id:req.user.id},data:{name,bio:bio||null,avatar:avatar||null},select:safeUser}))
})
app.get('/api/admin/notifications',async(req,res)=>res.json(await prisma.notification.findMany({where:{OR:[{userId:req.user.id},{userId:null}]},orderBy:{createdAt:'desc'},take:30})))
app.patch('/api/admin/notifications/:id/read',async(req,res)=>res.json(await prisma.notification.update({where:{id:req.params.id},data:{read:true}})))
app.get('/api/admin/newsletter',async(req,res)=>res.json(await prisma.newsletterSubscriber.findMany({orderBy:{createdAt:'desc'}})))
app.patch('/api/admin/newsletter/:id',async(req,res)=>res.json(await prisma.newsletterSubscriber.update({where:{id:req.params.id},data:{active:Boolean(req.body.active),notes:req.body.notes}})))
app.get('/api/admin/media',async(req,res)=>res.json(await prisma.media.findMany({orderBy:{createdAt:'desc'}})))
app.delete('/api/admin/media/:id',roles('SUPER_ADMIN','ADMIN'),async(req,res)=>{await prisma.media.delete({where:{id:req.params.id}});res.json({ok:true})})
app.post('/api/admin/media/upload',roles('SUPER_ADMIN','ADMIN','EDITOR','AUTHOR'),express.raw({type:['image/*','application/octet-stream'],limit:'5mb'}),async(req,res)=>{
 const mimeType=req.headers['x-file-type']||req.headers['content-type']; const filename=req.headers['x-file-name']||'upload'; if(!imageTypes.has(mimeType)||!Buffer.isBuffer(req.body)||!req.body.length)return res.status(400).json({message:'Upload a JPEG, PNG, WEBP, or GIF image.'}); if(req.body.length>maxImageBytes)return res.status(413).json({message:'Images must be 5 MB or smaller.'})
 const data=await uploadToCloudinary(req.body,{filename,mimeType,folder:req.headers['x-upload-folder']||'the-archive'}); const media=await prisma.media.create({data:{name:filename,url:data.secure_url,publicId:data.public_id,mimeType,width:data.width,height:data.height,bytes:data.bytes,folder:data.folder,resourceType:data.resource_type||'image',altText:req.headers['x-alt-text']||null,createdById:req.user.id}}); res.status(201).json(media)
})
app.get('/api/admin/posts',async(req,res)=>res.json(await prisma.post.findMany({orderBy:{updatedAt:'desc'},include:postInclude})))
app.get('/api/admin/posts/:id',async(req,res)=>{const p=await prisma.post.findUnique({where:{id:req.params.id},include:postInclude});p?res.json(p):res.status(404).json({message:'Not found'})})
app.post('/api/admin/posts',async(req,res)=>{
 const b=req.body;const slug=b.slug?.trim()||slugify(b.title,{lower:true,strict:true});const publishedAt=b.status==='PUBLISHED'?new Date():null
 const seo=seoAnalysis(b); const p=await prisma.post.create({data:{title:b.title,slug,excerpt:b.excerpt||null,content:b.content||'',featuredImage:b.featuredImage||null,featuredImageAlt:b.featuredImageAlt||null,featuredImageCrop:b.featuredImageCrop||null,status:b.status||'DRAFT',featured:!!b.featured,seoTitle:b.seoTitle||null,seoDescription:b.seoDescription||null,seoFocusKeyword:b.seoFocusKeyword||null,seoScore:seo.score,seoChecks:seo.checks,contentFormat:b.contentFormat||'html',publishedAt,authorId:req.user.id,categoryId:b.categoryId||null},include:postInclude});res.status(201).json({...p,seo})
})
app.put('/api/admin/posts/:id',async(req,res)=>{
 const b=req.body;const old=await prisma.post.findUnique({where:{id:req.params.id}});if(!old)return res.status(404).json({message:'Not found'})
 const slug=b.slug?.trim()||slugify(b.title,{lower:true,strict:true});const publishedAt=b.status==='PUBLISHED'?(old.publishedAt||new Date()):old.publishedAt; const seo=seoAnalysis(b)
 const p=await prisma.post.update({where:{id:req.params.id},data:{title:b.title,slug,excerpt:b.excerpt||null,content:b.content||'',featuredImage:b.featuredImage||null,featuredImageAlt:b.featuredImageAlt||null,featuredImageCrop:b.featuredImageCrop||null,status:b.status,featured:!!b.featured,seoTitle:b.seoTitle||null,seoDescription:b.seoDescription||null,seoFocusKeyword:b.seoFocusKeyword||null,seoScore:seo.score,seoChecks:seo.checks,contentFormat:b.contentFormat||'html',publishedAt,categoryId:b.categoryId||null},include:postInclude});res.json({...p,seo})
})
app.post('/api/admin/posts/seo-analyze',(req,res)=>res.json(seoAnalysis(req.body)))
app.delete('/api/admin/posts/:id',roles('SUPER_ADMIN','ADMIN','EDITOR'),async(req,res)=>{await prisma.post.delete({where:{id:req.params.id}});res.json({ok:true})})

app.post('/api/admin/categories',roles('SUPER_ADMIN','ADMIN','EDITOR'),async(req,res)=>{
 const name=req.body.name.trim();res.status(201).json(await prisma.category.create({data:{name,slug:slugify(name,{lower:true,strict:true}),description:req.body.description||null}}))
})
app.get('/api/admin/users',roles('SUPER_ADMIN','ADMIN'),async(req,res)=>res.json(await prisma.user.findMany({select:safeUser,orderBy:{createdAt:'desc'}})))
app.post('/api/admin/users',roles('SUPER_ADMIN','ADMIN'),async(req,res)=>{
 const {name,email,password,role='AUTHOR'}=req.body; const hash=await bcrypt.hash(password,12)
 res.status(201).json(await prisma.user.create({data:{name,email:email.toLowerCase(),password:hash,role},select:safeUser}))
})
app.put('/api/admin/settings',roles('SUPER_ADMIN','ADMIN'),async(req,res)=>{
 const {siteName,tagline,contactEmail,logoText,footerText,defaultSeoTitle,defaultSeoDescription,socialLinks,googleAnalyticsId,allowComments,maintenanceMode,brandColor,customCss,customHead}=req.body
 res.json(await prisma.siteSetting.upsert({where:{id:'main'},update:{siteName,tagline,contactEmail,logoText,footerText,defaultSeoTitle,defaultSeoDescription,socialLinks,googleAnalyticsId,allowComments,maintenanceMode,brandColor,customCss,customHead},create:{id:'main',siteName,tagline,contactEmail,logoText,footerText,defaultSeoTitle,defaultSeoDescription,socialLinks,googleAnalyticsId,allowComments,maintenanceMode,brandColor,customCss,customHead}}))
})

app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:'Server error',detail:process.env.NODE_ENV==='development'?err.message:undefined})})
const port=Number(process.env.PORT||5000)
app.listen(port,()=>console.log(`API running on http://localhost:${port}`))
