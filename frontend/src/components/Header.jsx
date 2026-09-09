import { Link, NavLink } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'

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
  return <header className="site-header">
    <div className="topbar">
      <button className="icon-btn mobile-only" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      <Link to="/" className="wordmark"><span>THE</span> ARCHIVE</Link>
      <button className="icon-btn" onClick={()=>setSearch(!search)}><Search/></button>
    </div>
    {search && <form className="searchbar" action="/search"><input name="q" autoFocus placeholder="Search stories, people, places..."/></form>}
    <nav className={"mainnav "+(open?'open':'')}>
      {primary.map(([n,s])=><NavLink key={s} to={`/category/${s}`}>{n}</NavLink>)}
      <div className="more-menu"><button>More ▾</button><div className="dropdown">
        {more.map(([n,s])=><NavLink key={s} to={`/category/${s}`}>{n}</NavLink>)}
      </div></div>
    </nav>
  </header>
}
