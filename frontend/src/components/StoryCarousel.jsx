import {useEffect, useRef, useState} from 'react'
import {ChevronLeft, ChevronRight} from 'lucide-react'
import ArticleCard from './ArticleCard'

export default function StoryCarousel({posts}) {
 const track=useRef(null)
 const [position,setPosition]=useState({start:true,end:false})
 useEffect(()=>{const el=track.current;if(!el)return;const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect()},[posts.length])
 if(!posts.length)return null
 function update(){const el=track.current;setPosition({start:el.scrollLeft<2,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-2})}
 function move(direction){const el=track.current;el.scrollBy({left:direction*el.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 return <section className="container category-section" aria-label="More stories" aria-roledescription="carousel">
  <div className="section-head"><h2>More to discover</h2><div className="story-controls"><button type="button" aria-label="Previous stories" aria-controls="story-track" disabled={position.start} onClick={()=>move(-1)}><ChevronLeft size={20}/></button><button type="button" aria-label="Next stories" aria-controls="story-track" disabled={position.end} onClick={()=>move(1)}><ChevronRight size={20}/></button></div></div>
  <div id="story-track" className="story-track" ref={track} onScroll={update} tabIndex={0} aria-label="Stories: swipe or use arrow keys">{posts.map(post=><ArticleCard key={post.id} post={post} variant="framed"/>)}</div>
 </section>
}
