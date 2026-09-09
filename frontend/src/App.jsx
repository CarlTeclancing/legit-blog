import {Routes,Route,useLocation,Navigate} from 'react-router-dom'
import Header from './components/Header';import Footer from './components/Footer'
import Home from './pages/Home';import Category from './pages/Category';import Article from './pages/Article';import About from './pages/About';import Search from './pages/Search'
import Login from './pages/admin/Login';import AdminLayout from './pages/admin/AdminLayout';import Dashboard from './pages/admin/Dashboard';import Posts from './pages/admin/Posts';import PostEditor from './pages/admin/PostEditor';import Categories from './pages/admin/Categories';import Users from './pages/admin/Users';import Settings from './pages/admin/Settings';import Media from './pages/admin/Media';import Newsletter from './pages/admin/Newsletter';import Profile from './pages/admin/Profile'
function Guard({children}){return localStorage.getItem('cms_token')?children:<Navigate to="/admin" replace/>}
export default function App(){const loc=useLocation();const admin=loc.pathname.startsWith('/admin')
return <>{!admin&&<Header/>}<Routes>
<Route path="/" element={<Home/>}/><Route path="/category/:slug" element={<Category/>}/><Route path="/article/:slug" element={<Article/>}/><Route path="/about" element={<About/>}/><Route path="/search" element={<Search/>}/>
<Route path="/admin" element={<Login/>}/><Route path="/admin/*" element={<Guard><AdminLayout/></Guard>}><Route path="dashboard" element={<Dashboard/>}/><Route path="posts" element={<Posts/>}/><Route path="posts/new" element={<PostEditor/>}/><Route path="posts/:id" element={<PostEditor/>}/><Route path="categories" element={<Categories/>}/><Route path="media" element={<Media/>}/><Route path="newsletter" element={<Newsletter/>}/><Route path="users" element={<Users/>}/><Route path="profile" element={<Profile/>}/><Route path="settings" element={<Settings/>}/></Route>
</Routes>{!admin&&<Footer/>}</>}
