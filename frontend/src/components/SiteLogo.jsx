import {useState} from 'react'
export default function SiteLogo({site}) {
 const [failed,setFailed]=useState('')
 return site.logoUrl&&failed!==site.logoUrl ? <img className="site-logo" src={site.logoUrl} alt={site.logoText||site.siteName||'Home'} onError={()=>setFailed(site.logoUrl)}/> : <>{site.logoText||site.siteName||'Legit.cm'}</>
}
