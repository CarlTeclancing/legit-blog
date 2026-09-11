import {getSiteSettings} from '../settings'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Send, Share2 } from 'lucide-react'
import api from '../api'

export default function Article() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [allowComments, setAllowComments] = useState(false)
  useEffect(() => { getSiteSettings().then(site => setAllowComments(!!site.allowComments)) }, [])
  const [comments, setComments] = useState([])
  const [liked, setLiked] = useState(false)
  const [shared, setShared] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', body: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get(`/posts/${slug}`).then(response => setPost(response.data))
    api.get(`/posts/${slug}/comments`).then(response => setComments(response.data)).catch(() => {})
  }, [slug])

  if (!post) return <main className="container page-pad">Loading...</main>

  async function like() {
    const response = await api.post(`/posts/${slug}/like`)
    setLiked(response.data.liked || liked)
    setPost({ ...post, likeCount: response.data.likeCount })
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.excerpt, url })
      else await navigator.clipboard.writeText(url)
      setShared(true)
    } catch (error) {
      if (error.name !== 'AbortError') setMessage('Copy this article URL to share it with a friend.')
    }
  }

  async function comment(event) {
    event.preventDefault()
    setMessage('')
    try {
      const response = await api.post(`/posts/${slug}/comments`, form)
      setMessage(response.data.message)
      setForm({ name: '', email: '', body: '' })
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not submit comment')
    }
  }

  return <main>
    <article className="article-page">
      <header className="article-header container">
        <Link className="eyebrow" to={`/category/${post.category?.slug}`}>{post.category?.name}</Link>
        <h1>{post.title}</h1>
        <p className="dek">{post.excerpt}</p>
        <div className="byline">By <strong>{post.author?.name}</strong> · {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</div>
        <div className="article-actions">
          <button onClick={like} className={liked ? 'active' : ''}><Heart /> {post.likeCount || 0} Likes</button>
          <button onClick={share}><Share2 /> {shared ? 'Link copied' : 'Share'}</button>
          <span>{post.viewCount || 0} views</span>
        </div>
      </header>
      <div className="article-hero"><img src={post.featuredImage || '/assets/history.svg'} alt={post.featuredImageAlt || post.title} /></div>
      <div className="article-layout container">
        <aside><div className="sticky"><strong>IN THIS STORY</strong><p>{post.category?.name}</p>{post.tags?.map(tag => <span key={tag.tag.id} className="tag">{tag.tag.name}</span>)}</div></aside>
        <div>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          {post.sourceUrl && <p className="source-note">Further reading: <a href={post.sourceUrl} target="_blank" rel="noreferrer">{post.sourceName || 'Source reference'}</a></p>}
          <section className="comments">
            <h2>Join the conversation</h2>
            <p>Comments are reviewed before they appear. You can comment anonymously or leave your name and email.</p>
            {allowComments ? <form className="comment-form" onSubmit={comment}>
              <label>Name (optional)<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Anonymous" /></label>
              <label>Email (optional)<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
              <label>Comment<textarea required rows="5" value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} /></label>
              {message && <div className="alert">{message}</div>}
              <button className="primary"><Send /> Submit comment</button>
            </form> : <p>New comments are currently closed.</p>}
            <div className="comment-list">{comments.map(comment => <article className="comment" key={comment.id}><strong>{comment.isAnonymous ? 'Anonymous' : comment.name}</strong><small>{new Date(comment.createdAt).toLocaleDateString()}</small><p>{comment.body}</p></article>)}</div>
          </section>
        </div>
      </div>
    </article>
  </main>
}
