import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link, Unlink, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, ImagePlus, Minus, Code, RemoveFormatting } from 'lucide-react'
import './RichTextEditor.css'

export default function RichTextEditor({ value, onChange, onUploadImage }) {
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { id: 'article-body', role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': 'article-body-label', class: 'rich-text-body' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  if (!editor) return null

  function button(label, Icon, action, active = false, disabled = false) {
    return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled}
      onMouseDown={event => event.preventDefault()} onClick={action} className={active ? 'is-active' : ''}>
      <Icon size={17} />
    </button>
  }

  function applyLink() {
    const href = url.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      if (!/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href)) {
        setLinkError('Use https://, http://, mailto:, tel:, /page, or #section.')
        return
      }
      const chain = editor.chain().focus().extendMarkRange('link')
      if (editor.state.selection.empty && !editor.isActive('link')) {
        chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
      } else chain.setLink({ href }).run()
    }
    setLinkOpen(false)
  }

  async function insertImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const image = await onUploadImage(file)
      if (image && !editor.isDestroyed) editor.chain().focus().setImage(image).run()
    } finally { setUploading(false) }
  }

  const heading = [1, 2, 3, 4, 5, 6].find(level => editor.isActive('heading', { level })) || 0
  const words = editor.getText().trim().split(/\s+/).filter(Boolean).length

  return <div className="article-editor-field">
    <label id="article-body-label" htmlFor="article-body">Article</label>
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" role="group" aria-label="Article formatting">
        <select aria-label="Paragraph style" value={heading} onChange={event => {
          const level = Number(event.target.value)
          if (level) editor.chain().focus().setHeading({ level }).run()
          else editor.chain().focus().setParagraph().run()
        }}>
          <option value="0">Paragraph</option>
          {[1, 2, 3, 4, 5, 6].map(level => <option key={level} value={level}>Heading {level}</option>)}
        </select>
        {button('Bold', Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {button('Italic', Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {button('Underline', Underline, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {button('Strikethrough', Strikethrough, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        {button('Bullet list', List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {button('Numbered list', ListOrdered, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {button('Block quote', Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {button('Add or edit link', Link, () => { setUrl(editor.getAttributes('link').href || ''); setLinkError(''); setLinkOpen(true) }, editor.isActive('link'))}
        {button('Remove link', Unlink, () => editor.chain().focus().extendMarkRange('link').unsetLink().run(), false, !editor.isActive('link'))}
        {button('Align left', AlignLeft, () => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }))}
        {button('Align center', AlignCenter, () => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}
        {button('Align right', AlignRight, () => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}
        {button('Code block', Code, () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
        {button('Horizontal divider', Minus, () => editor.chain().focus().setHorizontalRule().run())}
        {button(uploading ? 'Uploading image…' : 'Insert image', ImagePlus, () => fileInput.current.click(), false, uploading)}
        {button('Clear formatting', RemoveFormatting, () => editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run())}
        {button('Undo', Undo2, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
        {button('Redo', Redo2, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
      </div>
      {linkOpen && <div className="rich-text-link">
        <label htmlFor="article-link">Link URL</label>
        <input id="article-link" autoFocus value={url} placeholder="https://example.com" onChange={event => setUrl(event.target.value)} onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); applyLink() }
          if (event.key === 'Escape') { event.preventDefault(); setLinkOpen(false); editor.commands.focus() }
        }} />
        <button type="button" onClick={applyLink}>Apply link</button>
        <button type="button" onClick={() => { setLinkOpen(false); editor.commands.focus() }}>Cancel</button>
        {linkError && <p role="alert">{linkError}</p>}
      </div>}
      <input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={insertImage} />
      <EditorContent editor={editor} />
      <div className="rich-text-footer"><span>{words} {words === 1 ? 'word' : 'words'}</span><span role="status">{uploading ? 'Uploading image…' : 'Select text to format it. Paste text or use the toolbar.'}</span></div>
    </div>
  </div>
}
