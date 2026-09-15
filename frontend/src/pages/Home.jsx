import {useSearchParams} from 'react-router-dom'
import FeaturedStories from '../components/FeaturedStories'
import CategoryFeed from '../components/CategoryFeed'
import { useEffect,useState } from 'react'
import api from '../api'
import ArticleCard from '../components/ArticleCard'
import StoryCarousel from '../components/StoryCarousel'
import {getSiteSettings} from '../settings'
import {AnimatedHero, MarketingSlider} from '../components/HomePromotions'

export default function Home(){
 const [params]=useSearchParams();const page=Math.max(1,parseInt(params.get('page'),10)||1)
 const [posts,setPosts]=useState([])
 const [cats,setCats]=useState([])
 const [site,setSite]=useState({siteName:'Legit.cm',tagline:'Stories that entertain, inform, and inspire.'});const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{
  api.get('/posts?status=PUBLISHED&limit=12').then(response=>setPosts(response.data.items||[])).catch(error=>setError(error.code==='ECONNABORTED'?'The story service took too long to respond. Please try again shortly.':error.response?.data?.message||'Stories are temporarily unavailable.')).finally(()=>setLoading(false))
  api.get('/categories').then(response=>{setCats(response.data);setPosts(current=>current.map(post=>({...post,category:response.data.find(category=>category.id===post.categoryId)||null})))}).catch(()=>{})
   getSiteSettings().then(setSite)
 },[])
 useEffect(()=>{if(cats.length)setPosts(current=>current.map(post=>({...post,category:cats.find(category=>category.id===post.categoryId)||post.category||null})))},[cats])
 const hero=posts[0]
 return <main>{error&&<div className="container alert page-alert">{error}</div>}
   <AnimatedHero site={site}/>
   <MarketingSlider/>
  {loading&&<div className="container page-pad"><p>Loading stories...</p></div>}
  {!loading&&!error&&!posts.length&&<div className="container page-pad"><p>No published stories are available yet.</p></div>}
  <section className="container hero-grid" id="latest-stories" aria-label="Latest stories">
      <FeaturedStories categories={cats} fallback={hero}/>
      <div className="side-stack">{posts.slice(1,4).map(p=><ArticleCard key={p.id} post={p}/>)}</div>
   </section>
   <StoryCarousel posts={posts.slice(4)}/>
   <section className="container topics"><h2>Popular topics</h2><div className="topic-cloud">{cats.map(c=><a href={`/category/${c.slug}`} key={c.id}>{c.name}</a>)}</div></section>
   <CategoryFeed key={page} initialPage={page} categories={cats}/>
 </main>
}
