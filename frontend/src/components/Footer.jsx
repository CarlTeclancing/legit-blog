import { Link } from 'react-router-dom'
export default function Footer(){
  return <footer className="footer">
    <div className="newsletter"><div><small>STAY CURIOUS</small><h2>Follow your favorite topics.</h2><p>Get a weekly digest of new stories.</p></div>
      <form onSubmit={async e=>{e.preventDefault(); const email=e.currentTarget.email.value; await fetch((import.meta.env.VITE_API_URL||'http://localhost:5000/api')+'/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}); e.currentTarget.reset(); alert('Subscribed')}}>
        <input required type="email" name="email" placeholder="Email address"/><button>Subscribe</button>
      </form>
    </div>
    <div className="footer-grid">
      <div><div className="wordmark inverse"><span>THE</span> ARCHIVE</div><p>An independent editorial platform for history, art, ideas, culture and travel.</p></div>
      <div><h4>Topics</h4><Link to="/category/history">History</Link><Link to="/category/art-artists">Art & Artists</Link><Link to="/category/philosophy">Philosophy</Link><Link to="/category/travel">Travel</Link></div>
      <div><h4>About</h4><Link to="/about">About Us</Link><Link to="/authors">Authors</Link><Link to="/admin">Admin</Link></div>
    </div>
    <div className="copyright">© {new Date().getFullYear()} The Archive. All rights reserved.</div>
  </footer>
}
