import { useSearchParams } from 'react-router-dom'
import { useEffect,useState } from 'react'
import api from '../api'
import ArticleCard from '../components/ArticleCard'
export default function Search(){
 const [sp]=useSearchParams(); const q=sp.get('q')||''; const [items,setItems]=useState([])
 useEffect(()=>{ if(q) api.get('/search',{params:{q}}).then(r=>setItems(r.data)) },[q])
 return <main className="container page-pad"><h1>Search</h1><p>Results for “{q}”</p><div className="cards-grid">{items.map(p=><ArticleCard key={p.id} post={p}/>)}</div></main>
}
