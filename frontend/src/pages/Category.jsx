import { useParams } from 'react-router-dom'
import { useEffect,useState } from 'react'
import api from '../api'
import ArticleCard from '../components/ArticleCard'
export default function Category(){
 const {slug}=useParams(); const [data,setData]=useState({category:null,items:[]})
 useEffect(()=>{api.get(`/posts?category=${slug}&status=PUBLISHED&limit=50`).then(r=>setData({category:r.data.category,items:r.data.items||[]}))},[slug])
 return <main className="container page-pad">
  <div className="category-title"><div className="eyebrow">TOPIC</div><h1>{data.category?.name || slug.replaceAll('-',' ')}</h1><p>{data.category?.description || 'Explore our latest stories and analysis.'}</p></div>
  <div className="cards-grid">{data.items.map(p=><ArticleCard key={p.id} post={p}/>)}</div>
 </main>
}
