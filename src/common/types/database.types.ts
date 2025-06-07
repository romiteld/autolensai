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
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled'
          subscription_tier: string
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          subscription_tier?: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          subscription_tier?: string
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number
          mileage: number | null
          price: number | null
          description: string | null
          condition: 'excellent' | 'good' | 'fair' | 'poor' | null
          location: string | null
          zip_code: string | null
          status: 'active' | 'pending' | 'sold' | 'archived'
          featured: boolean
          vin: string | null
          transmission: string | null
          fuel_type: string | null
          exterior_color: string | null
          interior_color: string | null
          cloudinary_folder: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          make: string
          model: string
          year: number
          mileage?: number | null
          price?: number | null
          description?: string | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          location?: string | null
          zip_code?: string | null
          status?: 'active' | 'pending' | 'sold' | 'archived'
          featured?: boolean
          vin?: string | null
          transmission?: string | null
          fuel_type?: string | null
          exterior_color?: string | null
          interior_color?: string | null
          cloudinary_folder?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          make?: string
          model?: string
          year?: number
          mileage?: number | null
          price?: number | null
          description?: string | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          location?: string | null
          zip_code?: string | null
          status?: 'active' | 'pending' | 'sold' | 'archived'
          featured?: boolean
          vin?: string | null
          transmission?: string | null
          fuel_type?: string | null
          exterior_color?: string | null
          interior_color?: string | null
          cloudinary_folder?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_images: {
        Row: {
          id: string
          vehicle_id: string
          original_url: string
          processed_url: string | null
          cloudinary_public_id: string | null
          order_index: number | null
          is_primary: boolean
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          original_url: string
          processed_url?: string | null
          cloudinary_public_id?: string | null
          order_index?: number | null
          is_primary?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          original_url?: string
          processed_url?: string | null
          cloudinary_public_id?: string | null
          order_index?: number | null
          is_primary?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
      }
      test_drives: {
        Row: {
          id: string
          vehicle_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          scheduled_date: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          license_front_url: string | null
          license_back_url: string | null
          verification_status: 'pending' | 'verified' | 'failed'
          verification_data: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          scheduled_date: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          license_front_url?: string | null
          license_back_url?: string | null
          verification_status?: 'pending' | 'verified' | 'failed'
          verification_data?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          scheduled_date?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          license_front_url?: string | null
          license_back_url?: string | null
          verification_status?: 'pending' | 'verified' | 'failed'
          verification_data?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      landing_pages: {
        Row: {
          id: string
          vehicle_id: string
          slug: string
          seo_title: string | null
          seo_description: string | null
          meta_keywords: string[] | null
          page_content: Json | null
          view_count: number
          last_viewed: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          slug: string
          seo_title?: string | null
          seo_description?: string | null
          meta_keywords?: string[] | null
          page_content?: Json | null
          view_count?: number
          last_viewed?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          slug?: string
          seo_title?: string | null
          seo_description?: string | null
          meta_keywords?: string[] | null
          page_content?: Json | null
          view_count?: number
          last_viewed?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          vehicle_id: string
          video_idea: string
          scenes: Json
          selected_images: string[]
          video_clips_urls: string[] | null
          final_video_url: string | null
          youtube_url: string | null
          youtube_video_id: string | null
          music_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          processing_logs: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          video_idea: string
          scenes: Json
          selected_images: string[]
          video_clips_urls?: string[] | null
          final_video_url?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
          music_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_logs?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          video_idea?: string
          scenes?: Json
          selected_images?: string[]
          video_clips_urls?: string[] | null
          final_video_url?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
          music_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_logs?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: string
          status: 'active' | 'paused' | 'cancelled' | 'expired'
          current_period_start: string | null
          current_period_end: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: string
          status?: 'active' | 'paused' | 'cancelled' | 'expired'
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: string
          status?: 'active' | 'paused' | 'cancelled' | 'expired'
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inquiries: {
        Row: {
          id: string
          vehicle_id: string
          seller_id: string
          inquirer_name: string
          inquirer_email: string
          inquirer_phone: string | null
          message: string
          inquiry_type: 'general' | 'test_drive' | 'financing' | 'inspection'
          status: 'pending' | 'responded' | 'closed'
          created_at: string
          updated_at: string
          responded_at: string | null
          response_message: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          seller_id: string
          inquirer_name: string
          inquirer_email: string
          inquirer_phone?: string | null
          message: string
          inquiry_type: 'general' | 'test_drive' | 'financing' | 'inspection'
          status?: 'pending' | 'responded' | 'closed'
          created_at?: string
          updated_at?: string
          responded_at?: string | null
          response_message?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          seller_id?: string
          inquirer_name?: string
          inquirer_email?: string
          inquirer_phone?: string | null
          message?: string
          inquiry_type?: 'general' | 'test_drive' | 'financing' | 'inspection'
          status?: 'pending' | 'responded' | 'closed'
          created_at?: string
          updated_at?: string
          responded_at?: string | null
          response_message?: string | null
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
      subscription_status_enum: 'active' | 'inactive' | 'cancelled'
      vehicle_condition_enum: 'excellent' | 'good' | 'fair' | 'poor'
      vehicle_status_enum: 'active' | 'pending' | 'sold' | 'archived'
      processing_status_enum: 'pending' | 'processing' | 'completed' | 'failed'
      test_drive_status_enum: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      verification_status_enum: 'pending' | 'verified' | 'failed'
      video_status_enum: 'pending' | 'processing' | 'completed' | 'failed'
      subscription_status_type: 'active' | 'paused' | 'cancelled' | 'expired'
    }
  }
}