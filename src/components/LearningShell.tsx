import type { ReactNode } from 'react'
import { Star } from 'lucide-react'

export function LearningShell({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <header className="site-header">
      <a className="site-brand" href="/" aria-label="Star Study Point home"><span className="brand-symbol"><Star size={17} fill="currentColor" /></span><span>Star Study Point</span></a>
      <nav className="site-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/class-9">Class 9 Science</a><a href="/class-10">Class 10 Science</a><a href="/admin">Admin Login</a></nav>
    </header>
    {children}
    <footer className="site-footer"><a className="site-brand" href="/"><span className="brand-symbol"><Star size={15} fill="currentColor" /></span><span>Star Study Point</span></a><span>Science notes, organized chapter by chapter.</span></footer>
  </div>
}
