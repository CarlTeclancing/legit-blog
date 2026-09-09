import { NavLink,Outlet,useNavigate } from 'react-router-dom'
import { LayoutDashboard,FileText,FolderTree,Users,Settings,LogOut,Image,Mail,UserCircle,Bell,MessageCircle } from 'lucide-react'
import {useEffect,useState} from 'react'
import api from '../../api'
export default function AdminLayout(){
 const nav=useNavigate(); const user=JSON.parse(localStorage.getItem('cms_user')||'{}'); const [notifications,setNotifications]=useState([]); const [open,setOpen]=useState(false)
 useEffect(()=>{api.get('/admin/notifications').then(r=>setNotifications(r.data)).catch(()=>{})},[])
 function logout(){localStorage.removeItem('cms_token');localStorage.removeItem('cms_user');nav('/admin')}
 return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand">THE ARCHIVE <span>CMS</span></div>
  <nav><NavLink to="/admin/dashboard"><LayoutDashboard/> Dashboard</NavLink><NavLink to="/admin/posts"><FileText/> Posts</NavLink><NavLink to="/admin/categories"><FolderTree/> Categories</NavLink><NavLink to="/admin/media"><Image/> Media</NavLink><NavLink to="/admin/comments"><MessageCircle/> Comments</NavLink><NavLink to="/admin/newsletter"><Mail/> Newsletter</NavLink><NavLink to="/admin/users"><Users/> Admins & Users</NavLink><NavLink to="/admin/settings"><Settings/> Settings</NavLink></nav>
  <button onClick={logout}><LogOut/> Logout</button></aside>
  <main className="admin-main"><div className="admin-top"><div className="notification-wrap"><button className="icon-action" title="Notifications" onClick={()=>setOpen(!open)}><Bell/>{notifications.filter(item=>!item.read).length>0&&<b>{notifications.filter(item=>!item.read).length}</b>}</button>{open&&<div className="notification-panel">{notifications.length?notifications.map(item=><div className={item.read?'':'unread'} key={item.id}><strong>{item.title}</strong><span>{item.message}</span></div>):<span>No notifications</span>}</div>}</div><NavLink className="profile-chip" to="/admin/profile">{user.avatar?<img src={user.avatar} alt=""/>:<UserCircle/>}<span><strong>{user.name||'Administrator'}</strong><small>{user.role}</small></span></NavLink></div><Outlet/></main></div>
}
