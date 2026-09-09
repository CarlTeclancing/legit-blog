import axios from 'axios'
const defaultApiUrl=import.meta.env.PROD?'https://legit-blog.vercel.app/api':'http://localhost:5000/api'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || defaultApiUrl })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export default api
