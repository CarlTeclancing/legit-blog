import { useEffect,useState } from 'react'
import api from '../api'
import ArticleCard from '../components/ArticleCard'
import {getSiteSettings} from '../settings'

export default function Home(){
 const [posts,setPosts]=useState([])
 const [cats,setCats]=useState([])
 const [site,setSite]=useState({siteName:'Legit.cm',tagline:'Stories that entertain, inform, and inspire.'});const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{
  api.get('/posts?status=PUBLISHED&limit=12').then(response=>setPosts(response.data.items||[])).catch(error=>setError(error.code==='ECONNABORTED'?'The story service took too long to respond. Please try again shortly.':error.response?.data?.message||'Stories are temporarily unavailable.')).finally(()=>setLoading(false))
   api.get('/categories').then(response=>setCats(response.data)).catch(()=>{})
   getSiteSettings().then(setSite)
 },[])
 const hero=posts[0]
 return <main>{error&&<div className="container alert page-alert">{error}</div>}
   <section className="masthead">
    <div className="container"><h1>{site.siteName||'Legit.cm'}</h1><p>{site.tagline}</p></div>
   </section>
  {loading&&<div className="container page-pad"><p>Loading stories...</p></div>}
  {!loading&&!error&&!posts.length&&<div className="container page-pad"><p>No published stories are available yet.</p></div>}
  <section className="container hero-grid">
      {hero && <ArticleCard post={hero} large/>}
      <div className="side-stack">{posts.slice(1,4).map(p=><ArticleCard key={p.id} post={p}/>)}</div>
   </section>
   <section className="container topics"><h2>Popular topics</h2><div className="topic-cloud">{cats.map(c=><a href={`/category/${c.slug}`} key={c.id}>{c.name}</a>)}</div></section>
   {cats.slice(0,5).map((c,i)=>{
      const list=posts.filter(p=>p.category?.id===c.id).slice(0,6)
      if(!list.length) return null
      return <section className="container category-section" key={c.id}><div className="section-head"><h2>{c.name}</h2><a href={`/category/${c.slug}`}>View all posts →</a></div>
        <div className="cards-grid">{list.map(p=><ArticleCard key={p.id} post={p}/>)}</div></section>
   })}
 </main>
}
