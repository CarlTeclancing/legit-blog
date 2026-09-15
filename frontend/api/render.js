import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {renderPublicPage,renderSitemap} from '../server/public-page.js'

let shellPromise
export default async function handler(req,res){
 const origin=process.env.VITE_SITE_URL||'https://www.legit.cm'
 const base=(process.env.VITE_API_URL||'https://legit-blog.vercel.app/api').replace(/\/$/,'')
 const query=new URL(req.url,'https://local.invalid').searchParams
 const route=req.query?.path??query.get('path')??''
 const path='/'+String(route).replace(/^\/+|\/+$/g,'')
 const preview=process.env.VERCEL_ENV==='preview'
 async function api(path){
  const response=await fetch(base+path,{signal:AbortSignal.timeout(10000)})
  if(!response.ok)throw Object.assign(new Error('Public API request failed'),{status:response.status})
  return response.json()
 }
 try{
  if(path==='/robots.txt'||path==='/sitemap.xml'||path.startsWith('/sitemaps/')){
   const result=await renderSitemap({path,origin,api})
   if(!result)return res.status(404).send('Not found')
   res.setHeader('Content-Type',result.type);res.setHeader('Cache-Control','public, max-age=60, s-maxage=300')
   return res.status(200).send(result.body)
  }
  shellPromise??=readFile(join(process.cwd(),'dist','index.html'),'utf8').catch(error=>{shellPromise=null;throw error})
  const result=await renderPublicPage({path,query,origin,api,shell:await shellPromise,preview})
  res.setHeader('Content-Type','text/html; charset=utf-8')
  res.setHeader('Cache-Control','no-cache')
  if(preview)res.setHeader('X-Robots-Tag','noindex')
  if(result.retryAfter)res.setHeader('Retry-After',result.retryAfter)
  return res.status(result.status).send(result.html)
 }catch(error){
  console.error('Public page rendering failed:',error.message)
  res.setHeader('Retry-After','60');res.setHeader('Cache-Control','no-store')
  return res.status(503).send('Stories are temporarily unavailable. Please try again shortly.')
 }
}
