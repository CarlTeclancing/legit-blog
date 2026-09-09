import 'dotenv/config'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcryptjs'
import slugify from 'slugify'
const p=new PrismaClient()
const cats=[
['Ancient History','Civilizations, people and ideas from the ancient world.'],
['Medieval','Societies, conflict, belief and culture in the medieval era.'],
['History','Events, people and turning points that shaped the world.'],
['Art & Artists','Artists, movements, objects and visual culture.'],
['Philosophy','Ideas and thinkers that challenge how we understand the world.'],
['Interviews','Conversations with specialists and creators.'],
['Answers','Clear answers to fascinating questions.'],['Mythology','Myths, legends and their meanings.'],
['Religion','Belief, ritual and religious history.'],['Travel','Culture-led journeys and destinations.'],
['Stories','Unexpected stories from past and present.'],['Collecting','Objects, collections and connoisseurship.'],
['Film','Cinema, directors and visual storytelling.'],['News','Current developments in culture and scholarship.'],
['Maps & Resources','Guides, maps and useful learning resources.']
]
for(const [name,description] of cats) await p.category.upsert({where:{slug:slugify(name,{lower:true,strict:true})},update:{description},create:{name,slug:slugify(name,{lower:true,strict:true}),description}})
const pass=await bcrypt.hash('ChangeMe123!',12)
const admin=await p.user.upsert({where:{email:'admin@example.com'},update:{},create:{name:'Super Administrator',email:'admin@example.com',password:pass,role:'SUPER_ADMIN'}})
const history=await p.category.findUnique({where:{slug:'history'}})
const ancient=await p.category.findUnique({where:{slug:'ancient-history'}})
const art=await p.category.findUnique({where:{slug:'art-and-artists'}})
const phil=await p.category.findUnique({where:{slug:'philosophy'}})
const samples=[
 ['How a Forgotten Port Changed Mediterranean Trade','A small harbor can reveal a surprisingly large story about exchange, migration and power.',history,'/assets/history.svg'],
 ['What Daily Life Looked Like in an Ancient River City','Archaeological evidence helps reconstruct how ordinary families worked, ate and worshipped.',ancient,'/assets/history.svg'],
 ['Why Renaissance Workshops Worked Like Creative Startups','Master artists relied on complex teams, apprentices and repeatable production systems.',art,'/assets/art.svg'],
 ['The Question That Made Stoic Thinkers Rethink Control','A practical introduction to the distinction between what depends on us and what does not.',phil,'/assets/philosophy.svg'],
 ['Five Objects That Explain a Kingdom','Material culture can preserve political and social history when written records disappear.',ancient,'/assets/history.svg'],
 ['The Painter Who Turned Light Into a Subject','A study of how one artist used atmosphere and color as the real focus of the canvas.',art,'/assets/art.svg'],
 ['How Maps Persuade as Much as They Inform','Maps are never purely neutral: scale, labels and framing all shape interpretation.',history,'/assets/history.svg'],
 ['Can a Good Life Be Designed?','From Aristotle to contemporary ethics, philosophers have long debated human flourishing.',phil,'/assets/philosophy.svg']
]
let n=0
for(const [title,excerpt,category,image] of samples){
 const slug=slugify(title,{lower:true,strict:true})
 await p.post.upsert({where:{slug},update:{},create:{title,slug,excerpt,content:`<p>${excerpt}</p><h2>A closer look</h2><p>This original demo article is placeholder editorial content. Replace it from the CMS with your own researched story, images, references and captions.</p><p>The publishing system supports long-form HTML, categories, authors, SEO fields, featured images and publication status.</p>`,featuredImage:image,status:'PUBLISHED',featured:n===0,publishedAt:new Date(Date.now()-n*86400000),authorId:admin.id,categoryId:category.id}});n++
}
await p.siteSetting.upsert({where:{id:'main'},update:{},create:{id:'main',siteName:'The Archive',tagline:'Stories that teach, inform, and inspire.',contactEmail:'hello@example.com',logoText:'THE ARCHIVE',footerText:'An independent editorial publication.'}})
console.log('Seed complete: admin@example.com / ChangeMe123!')
await p.$disconnect()
