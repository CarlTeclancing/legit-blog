import {Link} from 'react-router-dom'
import {useEffect,useState} from 'react'
import {getSiteSettings} from '../settings'
import SiteLogo from './SiteLogo'
import api from '../api'
import '../pages/admin/Management.css'
export default function Footer(){
 const [site,setSite]=useState({siteName:'Legit.cm'});const [cats,setCats]=useState([]);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false)
 useEffect(()=>{getSiteSettings().then(setSite);api.get('/categories').then(r=>setCats(r.data)).catch(()=>{})},[])
 async function subscribe(e){e.preventDefault();const form=e.currentTarget;setBusy(true);setMessage('');try{await api.post('/newsletter',{email:form.email.value});form.reset();setMessage('You’re subscribed. Thank you!')}catch(e){setMessage(e.response?.data?.message||'Subscription failed. Please try again.')}finally{setBusy(false)}}
 return <footer className="footer"><div className="newsletter"><div><small>STAY CURIOUS</small><h2>Follow your favorite topics.</h2><p>Get a digest of new stories.</p></div><form onSubmit={subscribe}><input required type="email" name="email" aria-label="Email address for newsletter" placeholder="Email address"/><button disabled={busy}>{busy?'Subscribing…':'Subscribe'}</button></form>{message&&<p role="status" className="newsletter-status">{message}</p>}</div>
 <div className="footer-grid structured-footer"><div className="footer-brand"><Link to="/" className="wordmark inverse"><SiteLogo site={site}/></Link><p>{site.footerText}</p>{site.contactEmail&&<a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>}<div className="footer-socials">{Object.entries(site.socialLinks||{}).filter(([,url])=>typeof url==='string'&&/^https?:\/\//.test(url)).map(([name,url])=><a href={url} key={name} target="_blank" rel="noopener noreferrer">{name}</a>)}</div></div>
 <nav aria-label="Footer categories"><h4>Explore categories</h4><div className="footer-topic-links">{cats.map(c=><Link key={c.id} to={`/category/${c.slug}`}>{c.name}</Link>)}</div></nav>
 <nav aria-label="Publication"><h4>Our publication</h4><Link to="/">Latest stories</Link><Link to="/about">About us</Link><Link to="/search">Search the archive</Link><Link to="/author-request">Write for us</Link><Link to="/admin">Contributor sign in</Link></nav>
 <nav aria-label="Help and policies"><h4>Help & policies</h4>{site.contactEmail&&<a href={`mailto:${site.contactEmail}`}>Contact the team</a>}<Link to="/terms">Terms & conditions</Link><Link to="/privacy">Privacy policy</Link><Link to="/cookies">Cookie policy</Link></nav></div>
 <div className="copyright">© {new Date().getFullYear()} {site.siteName||'Legit.cm'}. All rights reserved.</div></footer>
}
