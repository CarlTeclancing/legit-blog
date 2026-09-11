import {NavLink,Outlet,useNavigate,useLocation} from 'react-router-dom'
import {LayoutDashboard,FileText,FolderTree,Users,Settings,LogOut,Image,Mail,UserCircle,Megaphone,MessageCircle,Inbox} from 'lucide-react'
import {useEffect,useState} from 'react'
import api from '../../api'
import {canAccess} from '../../permissions'
const links=[['dashboard','Dashboard',LayoutDashboard],['posts','Posts',FileText],['categories','Categories',FolderTree],['adverts','Adverts',Megaphone],['media','Media',Image],['comments','Comments',MessageCircle],['author-requests','Author requests',Inbox],['newsletter','Newsletter',Mail],['users','Accounts',Users],['settings','Settings',Settings]]
export default function AdminLayout(){
 const nav=useNavigate();const loc=useLocation();const [user,setUser]=useState(null);const [error,setError]=useState('');const [notifications,setNotifications]=useState([])
 useEffect(()=>{let cancelled=false;api.get('/admin/profile').then(r=>{if(cancelled)return;setUser(r.data);localStorage.setItem('cms_user',JSON.stringify(r.data));setError('')}).catch(e=>{if(e.response?.status===401){localStorage.removeItem('cms_token');nav('/admin',{replace:true})}else setError('Could not verify your account. Refresh to retry.')});return()=>{cancelled=true}},[loc.pathname,nav])
 useEffect(()=>{api.get('/admin/notifications').then(r=>setNotifications(r.data)).catch(()=>{})},[])
 function logout(){localStorage.removeItem('cms_token');localStorage.removeItem('cms_user');nav('/admin')}
 const section=loc.pathname.split('/')[2]||'posts'
 return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand">Publication <span>CMS</span></div><nav>{user&&links.filter(([section])=>canAccess(user.role,section)).map(([section,label,Icon])=><NavLink key={section} to={'/admin/'+section}><Icon/>{label}</NavLink>)}</nav><button onClick={logout}><LogOut/> Logout</button></aside><main className="admin-main"><div className="admin-top">{user&&<NavLink className="profile-chip" to="/admin/profile">{user.avatar?<img src={user.avatar} alt=""/>:<UserCircle/>}<span><strong>{user.name}</strong><small>{user.role}</small></span></NavLink>}</div>{error?<div className="alert">{error}</div>:!user?<p>Checking account…</p>:canAccess(user.role,section)?<><details><summary>Notifications ({notifications.filter(n=>!n.read).length} unread)</summary>{notifications.map(n=><p key={n.id}><strong>{n.title}</strong> {n.message}</p>)}</details><Outlet/></>:<div className="panel"><h2>Access restricted</h2><p>Your role does not have access to this section.</p><NavLink to="/admin/posts">Go to posts</NavLink></div>}</main></div>
}
