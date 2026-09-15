import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import api from '../api'
import {buildSeo,seoHead} from '../seo'
import {initialArticle} from '../initialPage'

export default function SiteSeo({site}){
 const {pathname,search}=useLocation()
 useEffect(()=>{
  const controller=new AbortController()
  const page=Math.max(1,parseInt(new URLSearchParams(search).get('page'),10)||1)
  const base={site:site||{},path:pathname,page,origin:import.meta.env.VITE_SITE_URL||'https://www.legit.cm'}
  function apply(data){
   if(controller.signal.aborted)return
   const seo=buildSeo({...base,...data})
   document.head.querySelectorAll('[data-site-seo],title,meta[name="description"],link[rel="canonical"],meta[name="robots"]').forEach(el=>el.remove())
   const template=document.createElement('template');template.innerHTML=seoHead(seo);document.head.append(template.content)
  }
  const initial=pathname.startsWith('/article/')?initialArticle(decodeURIComponent(pathname.slice(9))):null
  apply(initial?{post:initial}:{})
  if(pathname.startsWith('/article/'))api.get(`/posts/${encodeURIComponent(decodeURIComponent(pathname.slice(9)))}`,{params:{preview:true},signal:controller.signal}).then(r=>apply({post:r.data})).catch(e=>{if(e.response?.status===404)apply({noindex:true})})
  else if(pathname.startsWith('/category/'))api.get('/categories',{signal:controller.signal}).then(r=>{const category=r.data.find(c=>c.slug===decodeURIComponent(pathname.slice(10)));apply({category,noindex:!category})}).catch(()=>{})
  return()=>controller.abort()
 },[site,pathname,search])
 return null
}
