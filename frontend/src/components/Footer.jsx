import { Link } from 'react-router-dom'
import {useEffect,useState} from 'react'
import {getSiteSettings} from '../settings'
export default function Footer(){
  const [site,setSite]=useState({siteName:'Legit.cm',footerText:'Entertainment and publishing from Cameroon and Africa.'})
  useEffect(()=>{getSiteSettings().then(setSite)},[])
  return <footer className="footer">
    <div className="newsletter"><div><small>STAY CURIOUS</small><h2>Follow your favorite topics.</h2><p>Get a weekly digest of new stories.</p></div>
      <form onSubmit={async e=>{e.preventDefault(); const email=e.currentTarget.email.value; await fetch((import.meta.env.VITE_API_URL||'http://localhost:5000/api')+'/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}); e.currentTarget.reset(); alert('Subscribed')}}>
        <input required type="email" name="email" placeholder="Email address"/><button>Subscribe</button>
      </form>
    </div>
    <div className="footer-grid">
      <div><div className="wordmark inverse">{site.logoText||site.siteName}</div><p>{site.footerText}</p></div>
      <div><h4>Topics</h4><Link to="/category/history">History</Link><Link to="/category/art-artists">Art & Artists</Link><Link to="/category/philosophy">Philosophy</Link><Link to="/category/travel">Travel</Link></div>
      <div><h4>About</h4><Link to="/about">About Us</Link><Link to="/author-request">Request author access</Link><Link to="/admin">Account</Link><Link to="/terms">Terms and conditions</Link><Link to="/privacy">Privacy policy</Link><Link to="/cookies">Cookie policy</Link></div>
    </div>
    <div className="copyright">© {new Date().getFullYear()} {site.siteName||'Legit.cm'}. All rights reserved.</div>
  </footer>
}
