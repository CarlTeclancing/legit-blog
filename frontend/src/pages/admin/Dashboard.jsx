import { useEffect,useState } from 'react'; import api from '../../api'
export default function Dashboard(){const [s,setS]=useState({});useEffect(()=>{api.get('/admin/stats').then(r=>setS(r.data))},[])
return <div><div className="admin-title"><div><h1>Dashboard</h1><p>Editorial overview and publishing activity.</p></div></div><div className="stats">
{[['Published',s.published],['Drafts',s.drafts],['Categories',s.categories],['Admins & Authors',s.users],['Subscribers',s.subscribers]].map(([k,v])=><div className="stat" key={k}><span>{k}</span><strong>{v??0}</strong></div>)}</div></div>}
