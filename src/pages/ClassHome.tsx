import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, FileText, Search } from 'lucide-react'
import { LearningShell } from '../components/LearningShell'
import { getChapters, type Grade, type ScienceChapter } from '../data/learning'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function ClassHome({ grade }: { grade: Grade }) {
  const chapters = getChapters(grade)
  const [query, setQuery] = useState('')
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(supabaseConfigured)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.from('science_notes').select('chapter_number').eq('class_level', grade).eq('is_published', true).then(({ data, error }) => {
      if (!active) return
      if (error) setLoadFailed(true)
      else setCounts((data ?? []).reduce<Record<number, number>>((totals, note) => { totals[note.chapter_number] = (totals[note.chapter_number] ?? 0) + 1; return totals }, {}))
      setLoading(false)
    })
    return () => { active = false }
  }, [grade])

  const visible = useMemo(() => chapters.filter((chapter) => chapter.title.toLowerCase().includes(query.trim().toLowerCase())), [chapters, query])
  return <LearningShell><main className="content-main">
    <div className="page-heading"><a className="back-link" href="/">← Home</a><span className="eyebrow">STAR STUDY POINT · SCIENCE NOTES</span><h1>Class {grade} <em>Science</em></h1><p>{chapters.length} chapters · Chapter-wise PDF notes</p></div>
    <section className="chapter-library"><div className="library-toolbar"><div><h2>Chapters</h2><span>{visible.length} of {chapters.length} chapters</span></div><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chapters" aria-label="Search chapters" /></label></div>
      {loadFailed && <p className="inline-notice">The notes library could not be reached. Try again in a moment.</p>}
      {visible.length ? <div className="chapter-list">{visible.map((chapter) => <ChapterRow key={chapter.id} chapter={chapter} pdfCount={counts[chapter.number] ?? 0} countLoading={loading} />)}</div> : <div className="empty-search"><Search size={20} /><b>No chapters found</b><span>Try a different search.</span></div>}
    </section>
  </main></LearningShell>
}

function ChapterRow({ chapter, pdfCount, countLoading }: { chapter: ScienceChapter; pdfCount: number; countLoading: boolean }) {
  return <article className="chapter-row"><span className="chapter-number">{String(chapter.number).padStart(2, '0')}</span><span className="chapter-title">{chapter.title}</span><span className="chapter-pdf-count"><FileText size={15} />{countLoading ? '…' : `${pdfCount} PDFs`}</span><a className="small-button" href={`/class-${chapter.grade}/chapter/${chapter.id}`}>View Notes <ArrowRight size={14} /></a></article>
}
