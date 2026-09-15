import {absoluteUrl,buildSeo,escapeHtml as esc,seoHead} from '../src/seo.js'

const pageNumber=value=>Math.max(1,Math.min(parseInt(value,10)||1,100000))
const articlePath=slug=>`/article/${encodeURIComponent(slug)}`
const categoryPath=slug=>`/category/${encodeURIComponent(slug)}`
function card(post,origin){
 const image=post.featuredImage&&absoluteUrl(post.featuredImage,origin)
 return `<article class="article-card framed">${image?`<a class="thumb" href="${articlePath(post.slug)}"><img src="${esc(image)}" alt="${esc(post.featuredImageAlt||post.title)}" loading="lazy"></a>`:''}<div class="card-body"><h3><a href="${articlePath(post.slug)}">${esc(post.title)}</a></h3><p>${esc(post.excerpt)}</p></div></article>`
}
function pageLinks(path,page,hasMore){return `<nav class="feed-status" aria-label="Story pages">${page>1?`<a href="${path}?page=${page-1}">← Previous page</a>`:''} ${hasMore?`<a href="${path}?page=${page+1}">More stories →</a>`:''}</nav>`}
export async function renderPublicPage({path='/',query=new URLSearchParams(),origin,api,shell,preview=false}) {
 const page=pageNumber(query.get('page'))
 const site=await api('/settings')
 if(site.maintenanceMode)return {status:503,html:shell.replace(/<title>[\s\S]*?<\/title>/,'<title>Temporarily unavailable</title>').replace('<div id="root"></div>','<div id="root"><main class="container page-pad"><h1>We will be back soon</h1><p>Our publication is undergoing maintenance.</p><a href="/admin">Staff sign in</a></main></div>'),retryAfter:'300'}
 let post,category,body='',status=200
 const home=path==='/'
 if(home||path.startsWith('/category/')){
  const slug=home?'':decodeURIComponent(path.slice(10))
  const [data,categories]=await Promise.all([api(`/posts?limit=12&page=${page}${slug?`&category=${encodeURIComponent(slug)}`:''}`),api('/categories')])
  category=data.category
  if((!home&&!category)||(page>1&&!data.items.length))status=404
  body=`<main><section class="container page-pad"><h1>${esc(status===404?'Page not found':category?.name||site.siteName||'Legit.cm')}</h1><p>${esc(category?.description||site.tagline)}</p></section>`
  if(home)body+=`<section class="container topics"><h2>Popular topics</h2><div class="topic-cloud">${categories.map(c=>`<a href="${categoryPath(c.slug)}">${esc(c.name)}</a>`).join('')}</div></section>`
  body+=`<section class="container category-section"><h2>${esc(category?.name||'Latest stories')}</h2><div class="cards-grid">${data.items.map(p=>card(p,origin)).join('')}</div>${pageLinks(path,page,data.hasMore)}</section></main>`
 }else if(path.startsWith('/article/')){
  try{post=await api(`/posts/${encodeURIComponent(decodeURIComponent(path.slice(9)))}?preview=true`)}catch(error){if(error.status!==404)throw error;status=404}
  if(post){
   const image=post.featuredImage&&absoluteUrl(post.featuredImage,origin)
   // The public API sanitizes post.content using the same policy as the client article page.
   body=`<main class="container page-pad"><article><header class="article-header"><a href="/">Home</a>${post.category?` / <a href="${categoryPath(post.category.slug)}">${esc(post.category.name)}</a>`:''}<h1>${esc(post.title)}</h1><p class="dek">${esc(post.excerpt)}</p><p>By ${esc(post.author?.name||'Editorial Team')}</p><time datetime="${esc(post.publishedAt||post.createdAt)}">${esc(new Date(post.publishedAt||post.createdAt).toLocaleDateString('en-GB',{timeZone:'UTC'}))}</time></header>${image?`<img src="${esc(image)}" alt="${esc(post.featuredImageAlt||post.title)}">`:''}<div class="article-content">${post.content||''}</div></article></main>`
  }
 }else if(!['/about','/author-request','/privacy','/terms','/cookies','/search'].includes(path)){status=404}
 if(status===404)body='<main class="container page-pad"><h1>Page not found</h1><p>This page is not available.</p><a href="/">Explore the latest stories</a></main>'
 const seo=buildSeo({site,path,page,post,category,origin,noindex:preview||status===404})
 const head=seoHead(seo)
 const html=shell.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'').replace('</head>',`${head}</head>`).replace('<div id="root"></div>',`<div id="root">${body}</div>`)
 return {status,html}
}

export async function renderSitemap({path,origin,api}){
 const url=path=>new URL(path,origin).href
 if(path==='/robots.txt')return {type:'text/plain; charset=utf-8',body:`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${url('/sitemap.xml')}\n`}
 if(path==='/sitemap.xml'){
  const data=await api('/sitemap?page=1')
  return {type:'application/xml; charset=utf-8',body:`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/sitemaps/pages.xml',...Array.from({length:data.totalPages},(_,i)=>`/sitemaps/posts-${i+1}.xml`)].map(path=>`<sitemap><loc>${esc(url(path))}</loc></sitemap>`).join('')}</sitemapindex>`}
 }
 let entries=[]
 if(path==='/sitemaps/pages.xml'){
  const categories=await api('/categories')
  entries=['/','/about',...categories.map(c=>categoryPath(c.slug))].map(path=>({path}))
 }else{
  const match=path.match(/^\/sitemaps\/posts-([1-9]\d*)\.xml$/)
  if(!match)return null
  const data=await api(`/sitemap?page=${match[1]}`)
  if(Number(match[1])>data.totalPages)return null
  entries=data.items.map(post=>({path:articlePath(post.slug),updatedAt:post.updatedAt}))
 }
 return {type:'application/xml; charset=utf-8',body:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(item=>`<url><loc>${esc(url(item.path))}</loc>${item.updatedAt?`<lastmod>${esc(new Date(item.updatedAt).toISOString())}</lastmod>`:''}</url>`).join('')}</urlset>`}
}
