import { useEffect,useState } from 'react'
import api from '../api'
import ArticleCard from '../components/ArticleCard'
import {getSiteSettings} from '../settings'

export default function Home(){
 const [posts,setPosts]=useState([])
 const [cats,setCats]=useState([])
 const [site,setSite]=useState({siteName:'Legit.cm',tagline:'Stories that entertain, inform, and inspire.'})
 useEffect(()=>{Promise.all([api.get('/posts?status=PUBLISHED&limit=40'),api.get('/categories'),getSiteSettings()]).then(([postsResponse,categories,settings])=>{setPosts(postsResponse.data.items||[]);setCats(categories.data);setSite(settings)})},[])
 const hero=posts[0]
 return <main>
   <section className="masthead">
    <div className="container"><h1>{site.siteName||'Legit.cm'}</h1><p>{site.tagline}</p></div>
   </section>
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
