import { Router } from 'express'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { handled, fail } from './post-management.js'

export const mailReady = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)
export async function sendAuthorMail(to,text) {
 if(!mailReady())fail('Email delivery is not configured. Save your reply and use Open email app, or configure SMTP on the server.',503)
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined,connectionTimeout:10000,socketTimeout:15000})
 const info=await transport.sendMail({from:process.env.SMTP_FROM,to,subject:'Your contributor application',text})
 if(!info.accepted?.length)fail('The mail server did not accept this reply.',502)
}

export function authorManagement(prisma,sendMail=sendAuthorMail){
 const router=Router()
 router.get('/author-requests',handled(async(req,res)=>{
   const where={};if(req.query.status){if(!['PENDING','REVIEWING','APPROVED','REJECTED'].includes(req.query.status))fail('Invalid request status.');where.status=req.query.status}
   if(req.query.q)where.OR=['name','email'].map(field=>({[field]:{contains:String(req.query.q).slice(0,150),mode:'insensitive'}}))
   const page=Math.max(1,parseInt(req.query.page)||1);const [items,total]=await Promise.all([prisma.authorRequest.findMany({where,include:{replies:{orderBy:{createdAt:'desc'}}},orderBy:{createdAt:'desc'},skip:(page-1)*20,take:20}),prisma.authorRequest.count({where})])
   res.json({items,total,pages:Math.max(1,Math.ceil(total/20)),emailEnabled:mailReady()})
 }))
 router.put('/author-requests/:id',handled(async(req,res)=>{
   const {status,response}=req.body;if(!['PENDING','REVIEWING','APPROVED','REJECTED'].includes(status)||typeof response!=='string'||response.length>10000)fail('Choose a status and a reply under 10,000 characters.')
   res.json(await prisma.authorRequest.update({where:{id:req.params.id},data:{status,response,reviewedById:req.user.id},include:{replies:true}}))
 }))
 router.post('/author-requests/:id/reply',handled(async(req,res)=>{
   const application=await prisma.authorRequest.findUnique({where:{id:req.params.id}});if(!application)fail('Application not found.',404)
   const body=String(req.body.response||'').trim();if(!body||body.length>10000)fail('Write a reply under 10,000 characters.')
   // Keep the draft even when email delivery fails.
   await prisma.authorRequest.update({where:{id:application.id},data:{response:body,reviewedById:req.user.id}})
   if(sendMail===sendAuthorMail&&!mailReady())fail('Email delivery is not configured. Your reply was saved; use Open email app.',503)
   const reply=await prisma.authorReply.create({data:{requestId:application.id,body}})
   try {await sendMail(application.email,body)}catch(error){await prisma.authorReply.update({where:{id:reply.id},data:{status:'FAILED'}});fail('Email delivery failed. Your draft is saved; check delivery settings before retrying.',502)}
   await prisma.authorReply.update({where:{id:reply.id},data:{status:'SENT',sentAt:new Date()}})
   res.json({message:'Reply accepted by the email server.'})
 }))
 router.post('/author-requests/:id/account',handled(async(req,res)=>{
   const {role,password}=req.body
   if(!['AUTHOR','EDITOR'].includes(role))fail('Choose Author or Editor.')
   if(typeof password!=='string'||password.length<12||password.length>72)fail('Use a password between 12 and 72 characters.')
   const hash=await bcrypt.hash(password,12)
   const result=await prisma.$transaction(async tx=>{
     const application=await tx.authorRequest.findUnique({where:{id:req.params.id}})
     if(!application)fail('Application not found.',404)
     if(application.accountId)fail('An account was already created for this application.',409)
     if(await tx.user.findUnique({where:{email:application.email}}))fail('An account already exists for this email. Manage it in Accounts.',409)
     const user=await tx.user.create({data:{name:application.name,email:application.email,bio:application.bio,role,password:hash},select:{id:true,name:true,email:true,role:true}})
     const claimed=await tx.authorRequest.updateMany({where:{id:application.id,accountId:null},data:{accountId:user.id,status:'APPROVED',reviewedById:req.user.id}})
     if(!claimed.count)fail('This application has already been processed.',409)
     return user
   })
   res.status(201).json({user:result,message:'Account created. Share the login details securely with the applicant.'})
 }))
 return router
}
