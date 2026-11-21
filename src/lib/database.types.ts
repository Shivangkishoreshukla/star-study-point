export type Database = {
  public: {
    Tables: {
      science_notes: {
        Row: {
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
        Insert: {
          id?: string
          class_level: 9 | 10
          chapter_number: number
          title: string
          description: string
          file_path: string
          file_size: number
          uploaded_at?: string
          is_published?: boolean
          created_by?: string
        }
        Update: Partial<Database['public']['Tables']['science_notes']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: { is_science_admin: { Args: Record<string, never>; Returns: boolean } }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
