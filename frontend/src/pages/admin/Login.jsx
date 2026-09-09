import { useState } from 'react'
import api from '../../api'
import { useNavigate } from 'react-router-dom'
export default function Login(){
 const nav=useNavigate(); const [error,setError]=useState('')
 async function submit(e){e.preventDefault();try{const r=await api.post('/auth/login',{email:e.target.email.value,password:e.target.password.value});localStorage.setItem('cms_token',r.data.token);localStorage.setItem('cms_user',JSON.stringify(r.data.user));nav('/admin/dashboard')}catch(err){setError(err.response?.data?.message||'Login failed')}}
 return <div className="admin-login"><form className="panel" onSubmit={submit}><h1>Editorial CMS</h1><p>Sign in to manage the publication.</p>{error&&<div className="alert">{error}</div>}<label>Email<input name="email" type="email" required defaultValue="admin@example.com"/></label><label>Password<input name="password" type="password" required defaultValue="ChangeMe123!"/></label><button className="primary">Sign in</button></form></div>
}
