import {useEffect,useRef,useState} from 'react'
import ArticleCard from './ArticleCard'
import api from '../api'

export default function CategoryFeed({categories=[],category='',initialPage=1}) {
 const [page,setPage]=useState(initialPage)
 const [batches,setBatches]=useState([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [hasMore,setHasMore]=useState(false)
 const [retry,setRetry]=useState(0)
 const sentinel=useRef(null)
 useEffect(()=>{
  const controller=new AbortController()
  setLoading(true);setError('')
  api.get('/posts',{params:{page,limit:12,...(category?{category}:{})},signal:controller.signal}).then(({data})=>{
   if(controller.signal.aborted)return
   setBatches(current=>{
    const ids=new Set(current.flatMap(b=>b.items.map(p=>p.id)))
    return [...current,{page,items:data.items.filter(p=>!ids.has(p.id))}]
   });setHasMore(data.hasMore)
  }).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.message||'Could not load more stories. Please try again.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return()=>controller.abort()
 },[page,category,retry])
 useEffect(()=>{
  if(loading||error||!hasMore||!sentinel.current||!('IntersectionObserver' in window))return
  const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){observer.disconnect();setPage(p=>p+1)}},{rootMargin:'200px'})
  observer.observe(sentinel.current);return()=>observer.disconnect()
 },[loading,error,hasMore,page])
 const path=category?`/category/${encodeURIComponent(category)}`:'/'
 return <div className="continuing-feed" aria-label="Stories by category">
  {batches.map(batch=>{
   const groups=new Map()
   batch.items.forEach(post=>{const cat=categories.find(c=>c.id===post.categoryId)||post.category;const key=cat?.id||'latest';if(!groups.has(key))groups.set(key,{cat,posts:[]});groups.get(key).posts.push({...post,category:cat})})
   return <div key={batch.page}>{[...groups.values()].map(({cat,posts},i)=><section className="container category-section" key={cat?.id||'latest'}><div className="section-head"><h2>{cat?.name||'Latest stories'}</h2>{cat&&<a href={`/category/${cat.slug}`}>Explore {cat.name} →</a>}</div><div className={`cards-grid ${i%2?'feed-list':'feed-cards'}`}>{posts.map(post=><ArticleCard key={post.id} post={post} variant={i%2?'compact':'framed'}/>)}</div></section>)}</div>
  })}
  <div className="container feed-status" ref={sentinel}>
   <p role="status">{loading?'Loading more stories…':error||(!batches.some(b=>b.items.length)?'No stories available.':!hasMore?'You’re all caught up. Explore a topic for more stories.':'Keep scrolling to discover more stories.')}</p>
   {error&&<button type="button" className="primary" onClick={()=>setRetry(v=>v+1)}>Try again</button>}
   <nav aria-label="Story pages">{initialPage>1&&<a href={`${path}?page=${initialPage-1}`}>← Previous page</a>}{hasMore&&!loading&&!error&&<a className="primary" href={`${path}?page=${page+1}`} onClick={e=>{if(e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){e.preventDefault();setPage(p=>p+1)}}}>More stories →</a>}</nav>
  </div>
 </div>
}
