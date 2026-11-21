import { ArrowRight, BookOpen, Files } from 'lucide-react'
import { LearningShell } from '../components/LearningShell'

function HomePage() {
  return <LearningShell><main className="home-main">
    <section className="home-hero"><span className="eyebrow"><span /> SCIENCE PDF LIBRARY</span><h1>Your Science Notes,<br /><em>All in One Place.</em></h1><p>Access clear, organized, chapter-wise Science notes for Class 9 and Class 10.</p></section>
    <section className="class-library" aria-label="Science classes">
      <a className="class-library-card class-nine-card" href="/class-9"><span className="class-card-icon"><BookOpen size={21} /></span><span className="class-card-kicker">SCIENCE NOTES LIBRARY</span><h2>Class 9 Science</h2><span className="class-card-bottom"><b>12 Chapters</b><span className="class-card-link">Browse chapters <ArrowRight size={16} /></span></span></a>
      <a className="class-library-card class-ten-card" href="/class-10"><span className="class-card-icon"><Files size={21} /></span><span className="class-card-kicker">SCIENCE NOTES LIBRARY</span><h2>Class 10 Science</h2><span className="class-card-bottom"><b>16 Chapters</b><span className="class-card-link">Browse chapters <ArrowRight size={16} /></span></span></a>
    </section>
    <p className="home-note">Choose your class to find chapter-wise notes. No student account is needed.</p>
  </main></LearningShell>
}

export default HomePage
