import {useParams,useSearchParams} from 'react-router-dom'
import {useEffect,useState} from 'react'
import api from '../api'
import CategoryFeed from '../components/CategoryFeed'
export default function Category(){
 const {slug}=useParams();const [params]=useSearchParams();const page=Math.max(1,parseInt(params.get('page'),10)||1)
 const [categories,setCategories]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('')
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');api.get('/categories',{signal:controller.signal}).then(r=>setCategories(r.data)).catch(()=>{if(!controller.signal.aborted)setError('Could not load this topic. Please reload to try again.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[slug])
 const category=categories.find(c=>c.slug===slug)
 if(loading)return <main className="container page-pad">Loading topic...</main>
 if(error||!category)return <main className="container page-pad"><h1>{error?'Topic unavailable':'Topic not found'}</h1><p>{error||'Explore another topic from the homepage.'}</p><a href="/">Back to home</a></main>
 return <main><div className="container page-pad"><div className="category-title"><div className="eyebrow">TOPIC</div><h1>{category.name}</h1><p>{category.description||'Explore our latest stories and analysis.'}</p></div></div><CategoryFeed key={slug+'-'+page} category={slug} categories={categories} initialPage={page}/></main>
}
