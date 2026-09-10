import { useEffect, useState } from 'react'
import api from '../../api'
import './Adverts.css'

const blank = { title: '', eyebrow: '', description: '', image: '', imageAlt: '', action: 'Learn more', href: '', color: '#ead8ca', active: false, sortOrder: 0 }
const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR']

export default function Adverts() {
  const [items, setItems] = useState([])
  const [media, setMedia] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const role = JSON.parse(localStorage.getItem('cms_user') || '{}').role
  const permitted = allowedRoles.includes(role)
  const busy = saving || uploading

  useEffect(() => {
    if (!permitted) { setLoading(false); return }
    api.get('/admin/adverts').then(response => setItems(response.data)).catch(error => setError(error.response?.data?.message || 'Could not load adverts. Please reload to try again.')).finally(() => setLoading(false))
    api.get('/admin/media').then(response => setMedia(response.data)).catch(() => {})
  }, [permitted])

  function set(field, value) { setForm(current => ({ ...current, [field]: value })) }
  function edit(item) { setForm({ ...item }); setError(''); setMessage('') }

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, WEBP, or GIF image no larger than 5 MB.')
      return
    }
    setUploading(true); setError('')
    try {
      const response = await api.post('/admin/media/upload', file, { headers: { 'Content-Type': file.type, 'X-File-Type': file.type, 'X-File-Name': file.name } })
      setForm(current => ({ ...current, image: response.data.url, imageAlt: current.imageAlt || file.name.replace(/\.[^.]+$/, '') }))
      setMedia(current => [response.data, ...current])
    } catch (error) { setError(error.response?.data?.message || 'Image upload failed. Try again.') }
    finally { setUploading(false) }
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      const response = form.id ? await api.put(`/admin/adverts/${form.id}`, form) : await api.post('/admin/adverts', form)
      setItems(current => [...current.filter(item => item.id !== response.data.id), response.data].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)))
      setForm(response.data)
      setMessage(response.data.active ? 'Advert saved and visible on the homepage.' : 'Advert saved. It is hidden from the homepage.')
    } catch (error) { setError(error.response?.data?.message || 'Could not save advert. Your changes are still here; please try again.') }
    finally { setSaving(false) }
  }

  if (!permitted) return <div className="alert">Adverts can be managed by administrators and editors.</div>
  return <div>
    <div className="admin-title"><div><h1>Adverts</h1><p>Manage the promotional banners beneath the homepage hero.</p></div>
      <button type="button" className="primary" disabled={busy || loading} onClick={() => edit({ ...blank, sortOrder: Math.min(9999, items.length ? Math.max(...items.map(item => item.sortOrder)) + 1 : 0) })}>Add advert</button>
    </div>
    {error && <div className="alert" role="alert">{error}</div>}
    {message && <div className="success" role="status">{message}</div>}
    {loading ? <p>Loading adverts...</p> : <div className="advert-admin-grid">
      <section className="advert-list" aria-label="Saved adverts">
        {!items.length && <div className="panel">No adverts yet. Select Add advert to create your first banner.</div>}
        {items.map(item => <button type="button" key={item.id} disabled={busy} className={`advert-list-item${form?.id === item.id ? ' selected' : ''}`} onClick={() => edit(item)}>
          <img src={item.image} alt="" /><span><strong>{item.title}</strong><small>Order {item.sortOrder} · {item.active ? 'Visible' : 'Hidden'}</small><span className="advert-edit-hint">Edit advert</span></span>
        </button>)}
      </section>
      {form ? <form className="panel advert-form" onSubmit={save}>
        <h2>{form.id ? 'Edit advert' : 'New advert'}</h2>
        <fieldset disabled={busy}>
          <label>Headline<input required maxLength="160" value={form.title} onChange={event => set('title', event.target.value)} /></label>
          <label>Small heading<input maxLength="80" value={form.eyebrow} onChange={event => set('eyebrow', event.target.value)} /></label>
          <label>Description<textarea rows="3" maxLength="500" value={form.description} onChange={event => set('description', event.target.value)} /></label>
          <label>Upload banner image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} /></label>
          <p className="field-note">JPEG, PNG, WEBP, or GIF, up to 5 MB. Choose a landscape image for the banner.</p>
          {media.length > 0 && <label>Or choose from the media library<select value={media.some(item => item.url === form.image) ? form.image : ''} onChange={event => {
            const item = media.find(item => item.url === event.target.value)
            if (item) setForm(current => ({ ...current, image: item.url, imageAlt: item.altText || item.alt || current.imageAlt || item.name }))
          }}><option value="">Select an image</option>{media.map(item => <option key={item.id} value={item.url}>{item.name}</option>)}</select></label>}
          <label>Image URL<input required maxLength="2048" value={form.image} placeholder="https://example.com/banner.jpg or /assets/image.svg" onChange={event => set('image', event.target.value)} /></label>
          <label>Image description (alt text)<input required maxLength="250" value={form.imageAlt} onChange={event => set('imageAlt', event.target.value)} /></label>
          <div className="advert-form-row">
            <label>Button text<input required maxLength="80" value={form.action} onChange={event => set('action', event.target.value)} /></label>
            <label>Destination link<input required maxLength="2048" value={form.href} placeholder="https://example.com or /about" onChange={event => set('href', event.target.value)} /></label>
          </div>
          <div className="advert-form-row">
            <label>Background color<input type="color" value={form.color} onChange={event => set('color', event.target.value)} /></label>
            <label>Display order<input type="number" required min="0" max="9999" step="1" value={form.sortOrder} onChange={event => set('sortOrder', event.target.value === '' ? '' : Number(event.target.value))} /></label>
          </div>
          <p className="field-note">Lower numbers appear first.</p>
          <label className="checkbox"><input type="checkbox" checked={form.active} onChange={event => set('active', event.target.checked)} /> Show on homepage</label>
        </fieldset>
        <p role="status">{uploading ? 'Uploading image…' : ''}</p>
        {form.image && <div className="advert-preview" style={{ background: form.color }} aria-label="Advert preview">
          <img src={form.image} alt={form.imageAlt} /><div><small>{form.eyebrow}</small><h3>{form.title || 'Your headline'}</h3><p>{form.description}</p><span className="primary">{form.action || 'Button text'}</span></div>
        </div>}
        <div className="editor-actions"><button className="primary" disabled={busy}>{saving ? 'Saving…' : 'Save advert'}</button><button type="button" disabled={busy} onClick={() => setForm(null)}>Close editor</button></div>
      </form> : <div className="panel"><h2>Your homepage adverts</h2><p>Select an advert to edit its content, or add a new one. Uncheck Show on homepage and save to hide an advert.</p></div>}
    </div>}
  </div>
}
