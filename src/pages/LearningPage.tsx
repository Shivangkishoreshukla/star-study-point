import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, ExternalLink, FileText, X } from 'lucide-react'
import { LearningShell } from '../components/LearningShell'
import { getChapters, type Grade } from '../data/learning'
import { formatFileSize, formatUploadDate, safePdfName, type ScienceNote } from '../lib/notes'
import { NOTES_BUCKET, supabase } from '../lib/supabase'

export function LearningPage({ grade, chapterId }: { grade: Grade; chapterId: string }) {
  const chapter = getChapters(grade).find((item) => item.id === chapterId)
  const [notes, setNotes] = useState<ScienceNote[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState<{ title: string; url: string } | null>(null)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    if (!supabase || !chapter) return
    let active = true
    void supabase.from('science_notes').select('*').eq('class_level', grade).eq('chapter_number', chapter.number).eq('is_published', true).order('uploaded_at', { ascending: false }).then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError('Notes could not be loaded. Please try again later.')
      else setNotes((data ?? []) as ScienceNote[])
      setLoading(false)
    })
    return () => { active = false }
  }, [chapter, grade])

  const getPdfUrl = async (note: ScienceNote, download: boolean) => {
    if (!supabase) throw new Error('The PDF library is not configured.')
    const { data, error: urlError } = await supabase.storage.from(NOTES_BUCKET).createSignedUrl(note.file_path, 60 * 60, download ? { download: safePdfName(note.title) } : undefined)
    if (urlError || !data?.signedUrl) throw urlError ?? new Error('Could not open this PDF.')
    return data.signedUrl
  }

  const viewPdf = async (note: ScienceNote) => {
    setBusyId(note.id); setError('')
    try { setViewer({ title: note.title, url: await getPdfUrl(note, false) }) } catch { setError('This PDF could not be opened right now. Please try again.') } finally { setBusyId('') }
  }
  const downloadPdf = async (note: ScienceNote) => {
    setBusyId(note.id); setError('')
    try { const url = await getPdfUrl(note, true); const anchor = document.createElement('a'); anchor.href = url; anchor.download = safePdfName(note.title); anchor.rel = 'noreferrer'; document.body.append(anchor); anchor.click(); anchor.remove() } catch { setError('This PDF could not be downloaded right now. Please try again.') } finally { setBusyId('') }
  }

  if (!chapter) return <LearningShell><main className="content-main"><p className="empty-library">Chapter not found.</p></main></LearningShell>

  return <LearningShell><main className="content-main notes-page">
    <a className="back-link" href={`/class-${grade}`}><ArrowLeft size={15} /> Class {grade} Science</a>
    <div className="page-heading chapter-page-heading"><span className="eyebrow">CLASS {grade} SCIENCE · CHAPTER {chapter.number}</span><h1>{chapter.title}</h1><p>Chapter-wise Science notes in PDF format.</p></div>
    <section className="notes-section"><div className="notes-section-heading"><div><span className="eyebrow">CHAPTER LIBRARY</span><h2>PDF Notes</h2></div><span>{notes.length} {notes.length === 1 ? 'document' : 'documents'}</span></div>
      {error && <p className="inline-notice" role="alert">{error}</p>}
      {loading ? <div className="notes-loading" aria-live="polite">Loading notes…</div> : notes.length ? <div className="pdf-grid">{notes.map((note) => <article className="pdf-card" key={note.id}><span className="pdf-card-icon"><FileText size={22} /></span><div className="pdf-card-copy"><h3>{note.title}</h3><p>{note.description || 'Chapter-wise Science notes.'}</p></div><div className="pdf-meta"><span>{formatFileSize(note.file_size)}</span><span>Uploaded {formatUploadDate(note.uploaded_at)}</span></div><div className="pdf-actions"><button className="primary-button" disabled={busyId === note.id} onClick={() => void viewPdf(note)}>{busyId === note.id ? 'Opening…' : 'View PDF'} <ExternalLink size={14} /></button><button className="secondary-button" disabled={busyId === note.id} onClick={() => void downloadPdf(note)}>Download <ArrowDownToLine size={15} /></button></div></article>)}</div> : <div className="empty-library"><span className="empty-file-icon"><FileText size={22} /></span><h2>Notes coming soon.</h2><p>There are no published PDF notes for this chapter yet.</p></div>}
    </section>
  </main>{viewer && <div className="pdf-viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewer(null) }}><section className="pdf-viewer" role="dialog" aria-modal="true" aria-label={`PDF viewer: ${viewer.title}`}><header><b>{viewer.title}</b><button onClick={() => setViewer(null)} aria-label="Close PDF viewer"><X size={19} /></button></header><iframe src={viewer.url} title={viewer.title} /><a href={viewer.url} target="_blank" rel="noreferrer">Open PDF in a new tab <ExternalLink size={14} /></a></section></div>}</LearningShell>
}
