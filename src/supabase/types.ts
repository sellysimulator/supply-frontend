/**
 * The database as the client sees it. Column names are snake_case here and are
 * mapped to the camelCase domain model in src/data/; nothing outside src/data/
 * and src/supabase/ should reference a column name.
 */

export type StoredImageRow = {
  path: string
  url: string
}

export type ResourceRow = {
  label: string
  url: string
}

export type GameRow = {
  id: string
  name: string
  short_description: string
  full_description: string
  learning_objectives: string[]
  audience: string
  min_players: number
  max_players: number
  duration_minutes: number
  categories: string[]
  tags: string[]
  resources: ResourceRow[]
  thumbnail: StoredImageRow | null
  screenshots: StoredImageRow[]
  launch_url: string
  published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type GameWriteRow = Omit<GameRow, 'created_at' | 'updated_at'>

export type AdminRow = {
  user_id: string
  email: string
  added_at: string
}

export type ClickCountRow = {
  game_id: string
  hour: string
  click_count: number
}

export type Database = {
  public: {
    Tables: {
      games: {
        Row: GameRow
        Insert: GameWriteRow
        Update: Partial<GameWriteRow>
        Relationships: []
      }
      admins: {
        Row: AdminRow
        Insert: AdminRow
        Update: Partial<AdminRow>
        Relationships: []
      }
      click_counts: {
        Row: ClickCountRow
        Insert: ClickCountRow
        Update: Partial<ClickCountRow>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      record_game_click: {
        Args: { p_game_id: string }
        Returns: void
      }
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
      click_totals_by_game: {
        Args: { p_days: number }
        Returns: { game_id: string; click_count: number }[]
      }
      click_series_hourly: {
        Args: { p_hours: number }
        Returns: { hour: string; click_count: number }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
