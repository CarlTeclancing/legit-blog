import {renderPublicPage,renderSitemap} from './public-page.js'

// The build embeds the matching Vite HTML. No runtime dist directory is needed.
export function createHandler(shell){
 if(!shell.includes('<div id="root"></div>'))throw new Error('Missing application HTML in renderer build')
 return async function handler(req,res){
  const origin=process.env.VITE_SITE_URL||'https://www.legit.cm'
  const base=(process.env.VITE_API_URL||'https://legit-blog.vercel.app/api').replace(/\/$/,'')
  const requestUrl=new URL(req.url,'https://local.invalid')
  const query=requestUrl.searchParams
  const route=req.query?.path??query.get('path')??requestUrl.pathname
  const path='/'+String(route).replace(/^\/+|\/+$/g,'')
  const preview=process.env.VERCEL_ENV==='preview'
  function send(status,body,type='text/html; charset=utf-8'){
   res.statusCode=status;res.setHeader('Content-Type',type);res.end(body)
  }
  async function api(path){
   const response=await fetch(base+path,{signal:AbortSignal.timeout(10000)})
   if(!response.ok)throw Object.assign(new Error('Public API request failed'),{status:response.status})
   return response.json()
  }
  try{
   if(path==='/robots.txt'||path==='/sitemap.xml'||path.startsWith('/sitemaps/')){
    const result=await renderSitemap({path,origin,api})
    if(!result)return send(404,'Not found','text/plain; charset=utf-8')
    res.setHeader('Cache-Control','public, max-age=60, s-maxage=300')
    return send(200,result.body,result.type)
   }
   const result=await renderPublicPage({path,query,origin,api,shell,preview})
   res.setHeader('Cache-Control','no-cache')
   if(preview)res.setHeader('X-Robots-Tag','noindex')
   if(result.retryAfter)res.setHeader('Retry-After',result.retryAfter)
   return send(result.status,result.html)
  }catch(error){
   console.error('Public page rendering failed:',error.message)
   res.setHeader('Retry-After','60');res.setHeader('Cache-Control','no-store')
   return send(error instanceof URIError?400:503,'Stories are temporarily unavailable. Please try again shortly.','text/plain; charset=utf-8')
  }
 }
}
