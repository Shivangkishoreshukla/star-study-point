export type ScienceNote = {
  id: string
  class_level: 9 | 10
  chapter_number: number
  title: string
  description: string
  file_path: string
  file_size: number
  uploaded_at: string
  is_published: boolean
  created_by: string
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatUploadDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function safePdfName(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'science-notes'}.pdf`
}
