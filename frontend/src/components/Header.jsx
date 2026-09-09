import { Link, NavLink } from 'react-router-dom'
import { Menu, Search, X, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSiteSettings } from '../settings'

const primary = [
  ['Ancient History','ancient-history'], ['Medieval','medieval'], ['History','history'],
  ['Art & Artists','art-artists'], ['Philosophy','philosophy']
]
const more = [
  ['Interviews','interviews'],['Answers','answers'],['Mythology','mythology'],
  ['Religion','religion'],['Travel','travel'],['Stories','stories'],['Collecting','collecting'],
  ['Film','film'],['News','news'],['Maps & Resources','maps-resources']
]

export default function Header(){
  const [open,setOpen] = useState(false)
  const [search,setSearch] = useState(false)
  const [moreOpen,setMoreOpen] = useState(false)
  const [site,setSite] = useState({logoText:'LEGIT.CM'})
  useEffect(()=>{getSiteSettings().then(setSite)},[])
  const closeMenu=()=>{setOpen(false);setMoreOpen(false)}
  return <header className="site-header">
    <div className="topbar">
      <button className="icon-btn mobile-only" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      <Link to="/" className="wordmark" onClick={closeMenu}>{site.logoText||site.siteName||'LEGIT.CM'}</Link>
      <div className="header-actions"><button className="icon-btn" title="Search" onClick={()=>setSearch(!search)}><Search/></button><Link className="icon-btn account-link" title="Account" to="/admin"><UserRound/></Link></div>
    </div>
    {search && <form className="searchbar" action="/search"><input name="q" autoFocus placeholder="Search stories, people, places..."/></form>}
    <nav className={"mainnav "+(open?'open':'')}>
      {primary.map(([n,s])=><NavLink key={s} to={`/category/${s}`} onClick={closeMenu}>{n}</NavLink>)}
      <div className={'more-menu '+(moreOpen?'expanded':'')}><button type="button" onClick={()=>setMoreOpen(!moreOpen)} aria-expanded={moreOpen}>More ▾</button><div className="dropdown">
        {more.map(([n,s])=><NavLink key={s} to={`/category/${s}`} onClick={closeMenu}>{n}</NavLink>)}
      </div></div>
    </nav>
  </header>
}
