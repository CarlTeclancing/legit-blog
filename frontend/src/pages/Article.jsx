import { useParams,Link } from 'react-router-dom'
import { useEffect,useState } from 'react'
import api from '../api'
export default function Article(){
 const {slug}=useParams(); const [post,setPost]=useState(null)
 useEffect(()=>{api.get(`/posts/${slug}`).then(r=>setPost(r.data))},[slug])
 if(!post) return <main className="container page-pad">Loading…</main>
 return <main>
  <article className="article-page">
   <header className="article-header container">
    <Link className="eyebrow" to={`/category/${post.category?.slug}`}>{post.category?.name}</Link>
    <h1>{post.title}</h1><p className="dek">{post.excerpt}</p>
    <div className="byline">By <strong>{post.author?.name}</strong> · {new Date(post.publishedAt||post.createdAt).toLocaleDateString()}</div>
   </header>
   <div className="article-hero"><img src={post.featuredImage || '/assets/history.svg'} alt={post.title}/></div>
   <div className="article-layout container"><aside><div className="sticky"><strong>IN THIS STORY</strong><p>{post.category?.name}</p>{post.tags?.map(t=><span key={t.tag.id} className="tag">{t.tag.name}</span>)}</div></aside>
   <div className="article-content" dangerouslySetInnerHTML={{__html:post.content}}/>
   </div>
  </article>
 </main>
}
