export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          original_prompt: string
          parameters: Json
          file_path: string
          width: number | null
          height: number | null
          is_favorite: boolean
          model: string | null
          cost: number | null
          generation_time: number | null
          tags: string[]
          folder_id: string | null
          prompt_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_prompt: string
          parameters?: Json
          file_path: string
          width?: number | null
          height?: number | null
          is_favorite?: boolean
          model?: string | null
          cost?: number | null
          generation_time?: number | null
          tags?: string[]
          folder_id?: string | null
          prompt_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_prompt?: string
          parameters?: Json
          file_path?: string
          width?: number | null
          height?: number | null
          is_favorite?: boolean
          model?: string | null
          cost?: number | null
          generation_time?: number | null
          tags?: string[]
          folder_id?: string | null
          prompt_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          description: string | null
          template_id: string | null
          settings: Json
          is_template: boolean
          template_category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          description?: string | null
          template_id?: string | null
          settings?: Json
          is_template?: boolean
          template_category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          description?: string | null
          template_id?: string | null
          settings?: Json
          is_template?: boolean
          template_category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompt_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          template_text: string
          category: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          template_text: string
          category?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          template_text?: string
          category?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prompt_history: {
        Row: {
          id: string
          user_id: string
          prompt_text: string
          image_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_text: string
          image_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_text?: string
          image_id?: string | null
          created_at?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          user_id: string | null
          category: string
          text: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          category: string
          text: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          category?: string
          text?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prompt_boards: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          layout: Json
          background_color: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          layout?: Json
          background_color?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          layout?: Json
          background_color?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prompt_notes: {
        Row: {
          id: string
          board_id: string
          user_id: string
          content: string
          title: string | null
          position: Json
          size: Json
          color: string
          category: string
          tags: string[]
          is_enhanced: boolean
          enhanced_content: string | null
          usage_count: number
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          content: string
          title?: string | null
          position?: Json
          size?: Json
          color?: string
          category?: string
          tags?: string[]
          is_enhanced?: boolean
          enhanced_content?: string | null
          usage_count?: number
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          user_id?: string
          content?: string
          title?: string | null
          position?: Json
          size?: Json
          color?: string
          category?: string
          tags?: string[]
          is_enhanced?: boolean
          enhanced_content?: string | null
          usage_count?: number
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          settings: Json
          default_prompts: Json
          is_public: boolean
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string
          settings?: Json
          default_prompts?: Json
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string
          settings?: Json
          default_prompts?: Json
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      prompt_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      prompt_usage: {
        Row: {
          id: string
          user_id: string
          prompt_note_id: string
          project_id: string | null
          model_used: string | null
          generation_successful: boolean
          used_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_note_id: string
          project_id?: string | null
          model_used?: string | null
          generation_successful?: boolean
          used_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_note_id?: string
          project_id?: string | null
          model_used?: string | null
          generation_successful?: boolean
          used_at?: string
        }
      }
      workflow_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          board_id: string | null
          project_id: string | null
          actions: Json
          duration_seconds: number | null
          completed: boolean
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_type: string
          board_id?: string | null
          project_id?: string | null
          actions?: Json
          duration_seconds?: number | null
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          board_id?: string | null
          project_id?: string | null
          actions?: Json
          duration_seconds?: number | null
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          content: string
          title: string | null
          enhanced_content: string | null
          category: string
          tags: string[]
          prompt_type: string
          is_favorite: boolean
          is_public: boolean
          model_used: string | null
          parameters: Json
          usage_count: number
          successful_generations: number
          total_attempts: number
          success_rate: number | null
          avg_generation_time: number | null
          last_used_at: string
          board_position: Json | null
          board_size: Json | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          title?: string | null
          enhanced_content?: string | null
          category?: string
          tags?: string[]
          prompt_type?: string
          is_favorite?: boolean
          is_public?: boolean
          model_used?: string | null
          parameters?: Json
          usage_count?: number
          successful_generations?: number
          total_attempts?: number
          avg_generation_time?: number | null
          last_used_at?: string
          board_position?: Json | null
          board_size?: Json | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          title?: string | null
          enhanced_content?: string | null
          category?: string
          tags?: string[]
          prompt_type?: string
          is_favorite?: boolean
          is_public?: boolean
          model_used?: string | null
          parameters?: Json
          usage_count?: number
          successful_generations?: number
          total_attempts?: number
          avg_generation_time?: number | null
          last_used_at?: string
          board_position?: Json | null
          board_size?: Json | null
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      image_edits: {
        Row: {
          id: string
          user_id: string
          original_image_url: string
          edited_image_url: string
          mask_url: string | null
          prompt: string
          model_used: string
          parameters: Json
          generation_time: number | null
          cost: number | null
          replicate_id: string | null
          prompt_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_image_url: string
          edited_image_url: string
          mask_url?: string | null
          prompt: string
          model_used: string
          parameters?: Json
          generation_time?: number | null
          cost?: number | null
          replicate_id?: string | null
          prompt_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_image_url?: string
          edited_image_url?: string
          mask_url?: string | null
          prompt?: string
          model_used?: string
          parameters?: Json
          generation_time?: number | null
          cost?: number | null
          replicate_id?: string | null
          prompt_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
