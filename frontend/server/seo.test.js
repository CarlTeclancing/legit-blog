import test from 'node:test'
import assert from 'node:assert/strict'
import {buildSeo,seoHead,defaultSeoTitle,defaultSeoDescription} from '../src/seo.js'
import {contrastRatio,textColor} from '../src/colors.js'
import {renderPublicPage,renderSitemap} from './public-page.js'

const origin='https://news.example'
const site={siteName:'Example',defaultSeoTitle:'Cameroon news | Example',defaultSeoDescription:'Our local reporting'}
const category={id:'c1',name:'Business',slug:'business',description:'Cameroon business news'}
const post={id:'p1',title:'Local business grows',slug:'local-business',content:'<h2>Reporting</h2><p>Verified story content.</p>',excerpt:'A local story',seoTitle:'Business in Cameroon',seoDescription:'Article-specific description',category,author:{name:'Reporter'},featuredImage:'/photo.jpg',publishedAt:'2026-09-12T12:00:00Z',updatedAt:'2026-09-13T12:00:00Z'}
const shell='<!doctype html><html><head><title>Old</title><meta name="description" content="Old" /></head><body><div id="root"></div><script src="/assets/main.js"></script></body></html>'
const api=async path=>{
 if(path==='/settings')return site
 if(path==='/categories')return [category]
 if(path.startsWith('/posts?'))return {items:[post],category:path.includes('category=')?category:null,hasMore:true}
 if(path.startsWith('/posts/local-business'))return post
 if(path.startsWith('/sitemap'))return {items:[post],totalPages:2}
 throw Object.assign(new Error('Missing'),{status:404})
}
test('metadata uses per-article fields, absolute URLs, real authors and timestamps',()=>{
 const seo=buildSeo({site,post,path:'/article/local-business',origin})
 assert.equal(seo.title,post.seoTitle);assert.equal(seo.description,post.seoDescription)
 assert.equal(seo.image,origin+'/photo.jpg');assert.equal(seo.schema[0].author.name,'Reporter')
 assert.equal(seo.schema[0].dateModified,'2026-09-13T12:00:00.000Z')
 assert.equal(seo.schema[1].itemListElement[1].item,origin+'/category/business')
 assert.match(seoHead(seo),/property="og:type" content="article"/)
})
test('metadata cannot break out of HTML attributes or JSON-LD scripts',()=>{
 const payload='</script><script>alert("test")</script>'
 const html=seoHead(buildSeo({site,post:{...post,title:payload,seoTitle:payload,seoDescription:'" onload="bad'},origin,path:'/article/local-business'}))
 assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('content="" onload='));assert.ok(html.includes('\\u003c/script>'))
})
test('pagination has its own canonical and private/search pages are noindex',()=>{
 assert.equal(buildSeo({site,path:'/',page:3,origin}).url,origin+'/?page=3')
 assert.match(buildSeo({site,category,path:'/category/business',page:2,origin}).title,/Page 2/)
 for(const path of ['/admin/posts','/search','/missing'])assert.equal(buildSeo({site,path,origin}).robots,'noindex, follow')
 assert.ok(defaultSeoTitle.length<=60);assert.ok(defaultSeoDescription.length<=160)
})
test('server response contains article text and metadata without running JavaScript',async()=>{
 const result=await renderPublicPage({path:'/article/local-business',origin,api,shell})
 assert.equal(result.status,200);assert.ok(result.html.includes(post.content));assert.ok(result.html.includes('<title>Business in Cameroon</title>'))
 assert.ok(result.html.includes('/assets/main.js'));assert.equal((result.html.match(/<title>/g)||[]).length,1)
})
test('server category pagination exposes crawlable next and previous links',async()=>{
 const result=await renderPublicPage({path:'/category/business',query:new URLSearchParams('page=2'),origin,api,shell})
 assert.match(result.html,/href="\/category\/business\?page=3"/)
 assert.match(result.html,/href="\/category\/business\?page=1"/)
 assert.match(result.html,/href="https:\/\/news.example\/category\/business\?page=2"/)
})
test('missing pages return 404 and maintenance returns retryable 503',async()=>{
 const missing=await renderPublicPage({path:'/article/missing',origin,api,shell})
 assert.equal(missing.status,404);assert.match(missing.html,/noindex, follow/)
 const maintenance=await renderPublicPage({path:'/',origin,shell,api:async()=>({...site,maintenanceMode:true})})
 assert.equal(maintenance.status,503);assert.equal(maintenance.retryAfter,'300')
})
test('sitemap index, category URLs and published article shards use the public origin',async()=>{
 const index=await renderSitemap({path:'/sitemap.xml',origin,api});assert.match(index.body,/https:\/\/news.example\/sitemaps\/posts-2.xml/)
 const pages=await renderSitemap({path:'/sitemaps/pages.xml',origin,api});assert.ok(pages.body.includes('/category/business'));assert.ok(!pages.body.includes('/admin'))
 const posts=await renderSitemap({path:'/sitemaps/posts-1.xml',origin,api});assert.ok(posts.body.includes('/article/local-business'));assert.ok(posts.body.includes('<lastmod>'))
 assert.equal(await renderSitemap({path:'/sitemaps/posts-3.xml',origin,api}),null)
})
test('CTA text choice persists and contrast reports both readable and poor pairs',()=>{
 assert.equal(textColor('#ffffff','#ff0000'),'#ff0000')
 assert.equal(textColor('#000000',null),'#ffffff')
 assert.ok(contrastRatio('#000000','#ffffff')>=21)
 assert.equal(contrastRatio('#ffffff','#ffffff'),1)
})
