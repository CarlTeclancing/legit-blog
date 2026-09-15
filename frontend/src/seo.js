export const defaultSeoTitle='Cameroon & Africa News, Business & Trends | Legit.cm'
export const defaultSeoDescription='Read Cameroon and Africa news on Legit.cm. Explore business trends, entrepreneurship, entertainment and stories shaping life in Douala, Yaoundé and beyond.'
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c')
export function absoluteUrl(value,origin){try{const url=new URL(value,origin);return ['http:','https:'].includes(url.protocol)?url.href:undefined}catch{return undefined}}
const iso=value=>value&&!Number.isNaN(new Date(value).getTime())?new Date(value).toISOString():undefined

export function buildSeo({site={},path='/',page=1,post,category,origin='https://www.legit.cm',noindex=false}) {
 const name=site.siteName||'Legit.cm'
 let title=site.defaultSeoTitle||defaultSeoTitle
 let description=site.defaultSeoDescription||defaultSeoDescription
 const url=new URL(path,origin);if(page>1)url.searchParams.set('page',String(page))
 let image=site.logoUrl?absoluteUrl(site.logoUrl,origin):undefined
 const publisher={'@type':'Organization','@id':new URL('/#publisher',origin).href,name,url:new URL('/',origin).href,...(image?{logo:{'@type':'ImageObject',url:image}}:{})}
 let schema=[]
 if(post){
  title=post.seoTitle||`${post.title} | ${name}`
  description=post.seoDescription||post.excerpt||description
  image=post.featuredImage?absoluteUrl(post.featuredImage,origin):image
  schema=[{'@context':'https://schema.org','@type':'NewsArticle',headline:post.title,description,mainEntityOfPage:url.href,url:url.href,...(image?{image:[image]}:{}),datePublished:iso(post.publishedAt||post.createdAt),dateModified:iso(post.updatedAt||post.publishedAt||post.createdAt),author:post.author?.name?{'@type':'Person',name:post.author.name}:publisher,publisher,articleSection:post.category?.name,inLanguage:'en'},
   {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{name:'Home',item:origin},...(post.category?[{name:post.category.name,item:new URL(`/category/${encodeURIComponent(post.category.slug)}`,origin).href}]:[]),{name:post.title,item:url.href}].map((item,i)=>({'@type':'ListItem',position:i+1,...item}))}]
 }else if(category){title=`${category.name} News & Stories | ${name}`;description=category.description||`Read the latest ${category.name.toLowerCase()} stories, news and analysis on ${name}.`;schema=[{'@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:url.href}]}
 else if(path==='/'){schema=[{'@context':'https://schema.org','@type':'WebSite',name,url:new URL('/',origin).href,publisher}, {'@context':'https://schema.org',...publisher}]}
 else {const names={'/about':'About us','/author-request':'Write for us','/privacy':'Privacy policy','/terms':'Terms of use','/cookies':'Cookie policy','/search':'Search stories'};title=`${names[path]||'Page not found'} | ${name}`;description=`${names[path]||'Page not found'} at ${name}.`;if(path.startsWith('/admin')||path==='/search'||(!names[path]&&!path.startsWith('/article/')&&!path.startsWith('/category/')))noindex=true}
 if(page>1)title=`${title} — Page ${page}`
 if(site.maintenanceMode)noindex=true
 return {title,description,url:url.href,image,type:post?'article':'website',name,schema,robots:noindex?'noindex, follow':'index, follow, max-image-preview:large',published:post?iso(post.publishedAt||post.createdAt):undefined,modified:post?iso(post.updatedAt):undefined,imageAlt:post?.featuredImageAlt||post?.title||name}
}
export function seoHead(seo){
 const meta=(key,value,property=false)=>value?`<meta ${property?'property':'name'}="${key}" content="${escapeHtml(value)}" data-site-seo>`:''
 return `<title>${escapeHtml(seo.title)}</title><link rel="canonical" href="${escapeHtml(seo.url)}" data-site-seo>`+
 meta('description',seo.description)+meta('robots',seo.robots)+meta('og:title',seo.title,true)+meta('og:description',seo.description,true)+meta('og:url',seo.url,true)+meta('og:type',seo.type,true)+meta('og:site_name',seo.name,true)+meta('og:image',seo.image,true)+meta('og:image:alt',seo.image?seo.imageAlt:undefined,true)+meta('twitter:card',seo.image?'summary_large_image':'summary')+meta('twitter:title',seo.title)+meta('twitter:description',seo.description)+meta('twitter:image',seo.image)+meta('article:published_time',seo.published,true)+meta('article:modified_time',seo.modified,true)+seo.schema.map(item=>`<script type="application/ld+json" data-site-seo>${serialize(item)}</script>`).join('')
}
