import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowUpRight, FileText, LogOut, Pencil, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { LearningShell } from '../components/LearningShell'
import { getChapters, type Grade } from '../data/learning'
import { formatFileSize, formatUploadDate, type ScienceNote } from '../lib/notes'
import { MAX_PDF_BYTES, NOTES_BUCKET, supabase, supabaseConfigured } from '../lib/supabase'

type NoteFormState = { id?: string; grade: Grade; chapterNumber: number; title: string; description: string; published: boolean; file?: File; existingPath?: string }
const blankForm: NoteFormState = { grade: 9, chapterNumber: 1, title: '', description: '', published: false }

export function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [verifiedAdminId, setVerifiedAdminId] = useState<string | null>(null)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession))
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setSessionChecked(true) })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client || !session) return
    let active = true
    void client.rpc('is_science_admin').then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setAuthError(error ? 'Could not verify administrator access. Check that the database migration has been applied.' : 'This account is not on the Star Study Point administrator list.')
        void client.auth.signOut()
      } else { setAuthError(''); setVerifiedAdminId(session.user.id) }
    })
    return () => { active = false }
  }, [session])

  if (!supabaseConfigured) return <SetupRequired />
  if (!sessionChecked) return <LearningShell><main className="admin-auth-wrap"><p>Checking administrator access…</p></main></LearningShell>
  if (!session) return <AdminLogin error={authError} />
  if (verifiedAdminId !== session.user.id) return <LearningShell><main className="admin-auth-wrap"><p>Verifying administrator access…</p></main></LearningShell>
  return <NotesAdmin email={session.user.email ?? ''} userId={session.user.id} onSignOut={() => { setVerifiedAdminId(null); void supabase?.auth.signOut() }} />
}

export function RecoveryPasswordPage() {
  const [checking, setChecking] = useState(Boolean(supabase))
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data, error }) => {
      setHasRecoverySession(Boolean(data.session) && !error)
      setChecking(false)
    })
  }, [])

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !hasRecoverySession) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) setMessage(`Could not update password: ${error.message}`)
    else {
      setMessage('Password updated. You can now sign in to your administrator account.')
      setPassword('')
    }
  }

  return <LearningShell><main className="admin-auth-wrap"><section className="admin-auth-card"><span className="auth-icon"><FileText size={21} /></span><span className="eyebrow">STAR STUDY POINT</span><h1>Reset <em>Password</em></h1>{checking ? <p>Verifying your recovery link…</p> : hasRecoverySession ? <><p>Choose a new password for your administrator account.</p>{message && <p className="form-alert" role="status">{message}</p>}<form onSubmit={updatePassword} className="admin-login-form"><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'} <ArrowUpRight size={14} /></button></form></> : <><p>This recovery link is invalid or expired. Request a new password recovery email and open it while the site is available.</p><a className="secondary-button" href="/admin">Return to admin login</a></>}</section></main></LearningShell>
}

function SetupRequired() {
  return <LearningShell><main className="admin-auth-wrap"><section className="admin-auth-card setup-card"><span className="auth-icon"><UploadCloud size={21} /></span><span className="eyebrow">ADMIN SETUP</span><h1>Cloud PDF uploading<br /><em>isn’t configured yet.</em></h1><p>Add your Supabase project URL and public anon key to the local environment, then apply the SQL migration. No PDFs or credentials have been simulated.</p><ol><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li><li>Apply the migration in <code>supabase/migrations</code> and add your Auth user to <code>admin_users</code>.</li></ol><a className="secondary-button" href="/">Back to Home <ArrowUpRight size={14} /></a></section></main></LearningShell>
}

function AdminLogin({ error }: { error: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(error)
  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setMessage('')
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) setMessage(`Sign-in failed: ${loginError.message}`)
    setBusy(false)
  }
  return <LearningShell><main className="admin-auth-wrap"><section className="admin-auth-card"><span className="auth-icon"><FileText size={21} /></span><span className="eyebrow">STAR STUDY POINT</span><h1>Admin <em>Login</em></h1><p>Sign in to upload and manage Science PDF notes.</p>{message && <p className="form-alert" role="alert">{message}</p>}<form onSubmit={signIn} className="admin-login-form"><label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'} <ArrowUpRight size={14} /></button></form><a className="login-home-link" href="/">← Return to the notes library</a></section></main></LearningShell>
}

function NotesAdmin({ email, userId, onSignOut }: { email: string; userId: string; onSignOut: () => void }) {
  const [notes, setNotes] = useState<ScienceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState<Grade | 'all'>('all')
  const [chapterFilter, setChapterFilter] = useState('all')
  const [form, setForm] = useState<NoteFormState | null>(null)
  const [saving, setSaving] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!supabase) return
    const { data, error: queryError } = await supabase.from('science_notes').select('*').order('uploaded_at', { ascending: false })
    if (queryError) setError(`Could not load PDF notes: ${queryError.message}`)
    else setNotes((data ?? []) as ScienceNote[])
    setLoading(false)
  }, [])
  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.from('science_notes').select('*').order('uploaded_at', { ascending: false }).then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError(`Could not load PDF notes: ${queryError.message}`)
      else setNotes((data ?? []) as ScienceNote[])
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const chapterChoices = gradeFilter === 'all' ? [] : getChapters(gradeFilter)
  const filteredNotes = useMemo(() => notes.filter((note) => {
    const chapterName = getChapters(note.class_level).find((chapter) => chapter.number === note.chapter_number)?.title ?? ''
    return `${note.title} ${note.description} ${chapterName}`.toLowerCase().includes(query.toLowerCase())
      && (gradeFilter === 'all' || note.class_level === gradeFilter)
      && (chapterFilter === 'all' || `${note.class_level}-${note.chapter_number}` === chapterFilter)
  }), [notes, query, gradeFilter, chapterFilter])

  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !form) return
    setSaving(true); setError('')
    let uploadedPath = ''
    try {
      if (form.file) {
        if (!form.file.name.toLowerCase().endsWith('.pdf') || form.file.size > MAX_PDF_BYTES || form.file.size <= 0) throw new Error('Choose a PDF file smaller than 50 MB.')
        if ((await form.file.slice(0, 5).text()) !== '%PDF-') throw new Error('This file does not contain a valid PDF header.')
        uploadedPath = `${form.grade}/${form.chapterNumber}/${crypto.randomUUID()}.pdf`
        const { error: uploadError } = await supabase.storage.from(NOTES_BUCKET).upload(uploadedPath, form.file, { contentType: 'application/pdf', upsert: false })
        if (uploadError) throw uploadError
      }
      if (!form.id && !form.file) throw new Error('Select a PDF file to upload.')
      const values = {
        class_level: form.grade,
        chapter_number: form.chapterNumber,
        title: form.title.trim(),
        description: form.description.trim(),
        ...(uploadedPath ? { file_path: uploadedPath, file_size: form.file!.size, uploaded_at: new Date().toISOString() } : {}),
        is_published: form.published,
      }
      const result = form.id
        ? await supabase.from('science_notes').update(values).eq('id', form.id).select().single()
        : await supabase.from('science_notes').insert({ ...values, file_path: uploadedPath, file_size: form.file!.size, created_by: userId }).select().single()
      if (result.error) throw result.error
      if (form.id && uploadedPath && form.existingPath) {
        const { error: cleanupError } = await supabase.storage.from(NOTES_BUCKET).remove([form.existingPath])
        if (cleanupError) setError('The PDF was replaced, but the previous file could not be removed from storage.')
      }
      setForm(null)
      await loadNotes()
    } catch (caught) {
      if (uploadedPath) await supabase.storage.from(NOTES_BUCKET).remove([uploadedPath])
      setError(caught instanceof Error ? caught.message : 'The PDF could not be saved.')
    } finally { setSaving(false) }
  }

  const changePublished = async (note: ScienceNote) => {
    if (!supabase) return
    setError('')
    const { error: updateError } = await supabase.from('science_notes').update({ is_published: !note.is_published }).eq('id', note.id).select('id').single()
    if (updateError) setError(updateError.message)
    else setNotes((current) => current.map((item) => item.id === note.id ? { ...item, is_published: !item.is_published } : item))
  }

  const deleteNote = async (note: ScienceNote) => {
    if (!supabase || !window.confirm(`Delete “${note.title}” and its PDF file? This cannot be undone.`)) return
    setError('')
    const { error: rowError } = await supabase.from('science_notes').delete().eq('id', note.id).select('id').single()
    if (rowError) { setError(rowError.message); return }
    setNotes((current) => current.filter((item) => item.id !== note.id))
    const { error: fileError } = await supabase.storage.from(NOTES_BUCKET).remove([note.file_path])
    if (fileError) setError('The note record was deleted, but its PDF file could not be removed from Storage.')
  }

  const openEdit = (note: ScienceNote) => setForm({ id: note.id, grade: note.class_level, chapterNumber: note.chapter_number, title: note.title, description: note.description, published: note.is_published, existingPath: note.file_path })
  const openCreate = () => setForm({ ...blankForm })
  const handleGradeChange = (grade: Grade) => setForm((current) => current ? { ...current, grade, chapterNumber: 1 } : current)

  return <LearningShell><main className="admin-main notes-admin-main"><div className="admin-heading"><div><span className="eyebrow">PDF NOTES LIBRARY</span><h1>Admin Dashboard</h1><p>Signed in as {email}</p></div><div className="admin-heading-actions"><button className="primary-button" onClick={openCreate}><Plus size={15} /> Upload PDF</button><button className="secondary-button sign-out-button" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></div>
    <section className="admin-notes-panel"><div className="admin-panel-title"><div><h2>Uploaded PDFs</h2><p>Manage chapter notes for Class 9 and Class 10 Science.</p></div><span>{notes.length} documents</span></div><div className="admin-filters"><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PDF titles or chapters" /></label><select value={gradeFilter} onChange={(event) => { setGradeFilter(event.target.value === 'all' ? 'all' : Number(event.target.value) as Grade); setChapterFilter('all') }}><option value="all">All classes</option><option value={9}>Class 9 Science</option><option value={10}>Class 10 Science</option></select>{gradeFilter !== 'all' && <select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)}><option value="all">All chapters</option>{chapterChoices.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.number}. {chapter.title}</option>)}</select>}</div>
      {error && <p className="inline-notice" role="alert">{error}</p>}{loading ? <p className="admin-empty">Loading documents…</p> : filteredNotes.length ? <div className="admin-note-list">{filteredNotes.map((note) => <AdminNoteRow key={note.id} note={note} onEdit={() => openEdit(note)} onDelete={() => void deleteNote(note)} onToggle={() => void changePublished(note)} />)}</div> : <div className="admin-empty"><FileText size={22} /><b>No PDF documents found</b><span>Upload a chapter PDF to add it to the library.</span><button className="secondary-button" onClick={openCreate}><Plus size={14} /> Upload first PDF</button></div>}</section>
    {form && <NoteForm form={form} setForm={setForm} saving={saving} error={error} onSubmit={submitNote} onClose={() => { setForm(null); setError('') }} onGradeChange={handleGradeChange} />}
  </main></LearningShell>
}

function AdminNoteRow({ note, onEdit, onDelete, onToggle }: { note: ScienceNote; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const chapter = getChapters(note.class_level).find((item) => item.number === note.chapter_number)
  return <article className="admin-note-row"><span className="pdf-card-icon"><FileText size={20} /></span><div className="admin-note-copy"><b>{note.title}</b><span>Class {note.class_level} Science · Chapter {note.chapter_number}: {chapter?.title}</span><small>{formatFileSize(note.file_size)} · Uploaded {formatUploadDate(note.uploaded_at)}</small></div><span className={note.is_published ? 'publish-state published' : 'publish-state'}>{note.is_published ? 'Published' : 'Unpublished'}</span><div className="admin-note-actions"><button onClick={onToggle} title={note.is_published ? 'Unpublish PDF' : 'Publish PDF'}>{note.is_published ? 'Unpublish' : 'Publish'}</button><button onClick={onEdit} aria-label={`Edit ${note.title}`} title="Edit or replace PDF"><Pencil size={15} /></button><button className="delete-button" onClick={onDelete} aria-label={`Delete ${note.title}`} title="Delete PDF"><Trash2 size={15} /></button></div></article>
}

function NoteForm({ form, setForm, saving, error, onSubmit, onClose, onGradeChange }: { form: NoteFormState; setForm: (update: (current: NoteFormState | null) => NoteFormState | null) => void; saving: boolean; error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void; onGradeChange: (grade: Grade) => void }) {
  const chapters = getChapters(form.grade)
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="note-form-modal" role="dialog" aria-modal="true" aria-labelledby="note-form-heading"><header><div><span className="eyebrow">CHAPTER PDF</span><h2 id="note-form-heading">{form.id ? 'Edit PDF notes' : 'Upload PDF notes'}</h2></div><button onClick={onClose} aria-label="Close upload form"><X size={19} /></button></header><form onSubmit={onSubmit}><div className="form-grid-two"><label>Class<select value={form.grade} onChange={(event) => onGradeChange(Number(event.target.value) as Grade)}><option value={9}>Class 9 Science</option><option value={10}>Class 10 Science</option></select></label><label>Chapter<select value={form.chapterNumber} onChange={(event) => setForm((current) => current ? { ...current, chapterNumber: Number(event.target.value) } : current)}>{chapters.map((chapter) => <option key={chapter.id} value={chapter.number}>{chapter.number}. {chapter.title}</option>)}</select></label></div><label>PDF title<input required maxLength={160} value={form.title} onChange={(event) => setForm((current) => current ? { ...current, title: event.target.value } : current)} placeholder="e.g. Chapter 1 — Revision Notes" /></label><label>Short description<textarea required maxLength={500} rows={3} value={form.description} onChange={(event) => setForm((current) => current ? { ...current, description: event.target.value } : current)} placeholder="What do these notes cover?" /></label><label className="file-picker">{form.id ? 'Replace PDF file (optional)' : 'PDF file'}<input required={!form.id} type="file" accept="application/pdf,.pdf" onChange={(event) => setForm((current) => current ? { ...current, file: event.target.files?.[0] } : current)} /><small>{form.file?.name ?? (form.id ? 'Choose a replacement PDF to change the file.' : 'PDF only · maximum 50 MB')}</small></label><label className="publish-checkbox"><input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => current ? { ...current, published: event.target.checked } : current)} /> Publish this PDF to students</label>{error && <p className="form-alert" role="alert">{error}</p>}<div className="form-footer"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Upload PDF'} <ArrowDownToLine size={15} /></button></div></form></section></div>
}
