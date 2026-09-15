import { Link } from 'react-router-dom'
export default function ArticleCard({post,large=false,variant=''}){
  return <article className={`article-card ${large?'large':''} ${variant}`}>
    <Link to={`/article/${post.slug}`} className="thumb"><img loading="lazy" decoding="async" src={post.featuredImage || '/assets/history.svg'} alt={post.featuredImageAlt||post.title}/></Link>
    <div className="card-body">
      <Link className="eyebrow" to={`/category/${post.category?.slug||'history'}`}>{post.category?.name||'History'}</Link>
      <h3><Link to={`/article/${post.slug}`}>{post.title}</Link></h3>
      {post.excerpt && <p>{post.excerpt}</p>}
      <div className="meta">By {post.author?.name || 'Editorial Team'} · {new Date(post.publishedAt||post.createdAt).toLocaleDateString()}</div>
    </div>
  </article>
}
