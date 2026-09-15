import {useEffect,useState} from 'react'
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react'
import api from '../api'
import ArticleCard from './ArticleCard'
import {useRotation} from './HomePromotions'

export default function FeaturedStories({categories,fallback}) {
 const [posts,setPosts]=useState([])
 useEffect(()=>{
  const controller=new AbortController()
  async function load(){
   let page=1
   do{
    const {data}=await api.get(`/posts?featured=true&limit=100&page=${page}`,{signal:controller.signal})
    if(controller.signal.aborted)return
    setPosts(current=>{const unique=new Map(current.map(p=>[p.id,p]));data.items.forEach(p=>unique.set(p.id,p));return [...unique.values()]})
    page=data.nextPage
   }while(page)
  }
  load().catch(()=>{})
  return()=>controller.abort()
 },[])
 const slides=posts.length?posts:fallback?[fallback]:[]
 const rotation=useRotation(slides.length,6000)
 if(!slides.length)return null
 return <section className="featured-stories" aria-label={posts.length?'Featured stories':'Latest story'} aria-roledescription="carousel" {...rotation.interactions}>
  <div className="featured-heading"><h2>{posts.length?'Featured stories':'Latest story'}</h2>{slides.length>1&&<div className="featured-controls">
   <button type="button" onClick={()=>rotation.select(rotation.index-1)} aria-label="Previous featured story"><ChevronLeft size={18}/></button>
   <span aria-live="off">{rotation.index+1} / {slides.length}</span>
   {!rotation.reducedMotion&&<button type="button" onClick={rotation.toggle} aria-label={rotation.paused?'Play featured slideshow':'Pause featured slideshow'}>{rotation.paused?<Play size={16}/>:<Pause size={16}/>}</button>}
   <button type="button" onClick={()=>rotation.select(rotation.index+1)} aria-label="Next featured story"><ChevronRight size={18}/></button>
  </div>}</div>
  {slides.map((post,index)=><div key={post.id} hidden={index!==rotation.index} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${slides.length}`}><ArticleCard large priority={index===rotation.index} variant="cover-story" post={{...post,category:categories.find(c=>c.id===post.categoryId)||post.category}}/></div>)}
 </section>
}
