export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_budgets: {
        Row: {
          agent_id: string
          approved_amount: number | null
          breakdown: Json | null
          created_at: string | null
          currency: string
          description: string | null
          id: string
          requested_amount: number
          spent_amount: number
          status: string
          task_id: string | null
          thread_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          agent_id: string
          approved_amount?: number | null
          breakdown?: Json | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          requested_amount: number
          spent_amount?: number
          status?: string
          task_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string
          approved_amount?: number | null
          breakdown?: Json | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          requested_amount?: number
          spent_amount?: number
          status?: string
          task_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_budgets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_budgets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          content: string | null
          conversation_key: string
          created_at: string
          id: string
          name: string | null
          role: string
          tool_call_id: string | null
          tool_calls: Json | null
        }
        Insert: {
          content?: string | null
          conversation_key: string
          created_at?: string
          id?: string
          name?: string | null
          role: string
          tool_call_id?: string | null
          tool_calls?: Json | null
        }
        Update: {
          content?: string | null
          conversation_key?: string
          created_at?: string
          id?: string
          name?: string | null
          role?: string
          tool_call_id?: string | null
          tool_calls?: Json | null
        }
        Relationships: []
      }
      agent_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          processed_by: string | null
          source: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processed_by?: string | null
          source: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processed_by?: string | null
          source?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memories: {
        Row: {
          access_count: number
          agent_id: string
          content: string
          created_at: string
          embedding: string | null
          expires_at: string | null
          id: string
          importance: number
          last_accessed_at: string | null
          memory_type: string
          metadata: Json
          scope: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_count?: number
          agent_id: string
          content: string
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          last_accessed_at?: string | null
          memory_type: string
          metadata?: Json
          scope?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_count?: number
          agent_id?: string
          content?: string
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number
          last_accessed_at?: string | null
          memory_type?: string
          metadata?: Json
          scope?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_memories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_scheduled_jobs: {
        Row: {
          created_at: string
          cron_expression: string
          enabled: boolean
          id: string
          job_key: string
          last_result: string | null
          last_run_at: string | null
          run_count: number
          task_description: string
          updated_at: string
          workspace_agent_id: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          enabled?: boolean
          id?: string
          job_key: string
          last_result?: string | null
          last_run_at?: string | null
          run_count?: number
          task_description: string
          updated_at?: string
          workspace_agent_id: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          enabled?: boolean
          id?: string
          job_key?: string
          last_result?: string | null
          last_run_at?: string | null
          run_count?: number
          task_description?: string
          updated_at?: string
          workspace_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_scheduled_jobs_workspace_agent_id_fkey"
            columns: ["workspace_agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string | null
          created_at: string | null
          due: string | null
          id: string
          priority: string | null
          progress: number | null
          status: string | null
          task_key: string
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          due?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          status?: string | null
          task_key: string
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          due?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          status?: string | null
          task_key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          avatar_img: string | null
          category: string
          color: string | null
          cost_per_1k: number
          created_at: string | null
          description: string
          id: string
          model: string
          name: string
          price_label: string
          pricing_model: string
          rating: number
          reviews: number
          role: string
          status: string
          template_key: string
          updated_at: string | null
        }
        Insert: {
          avatar_img?: string | null
          category: string
          color?: string | null
          cost_per_1k?: number
          created_at?: string | null
          description: string
          id?: string
          model: string
          name: string
          price_label: string
          pricing_model: string
          rating?: number
          reviews?: number
          role: string
          status?: string
          template_key: string
          updated_at?: string | null
        }
        Update: {
          avatar_img?: string | null
          category?: string
          color?: string | null
          cost_per_1k?: number
          created_at?: string | null
          description?: string
          id?: string
          model?: string
          name?: string
          price_label?: string
          pricing_model?: string
          rating?: number
          reviews?: number
          role?: string
          status?: string
          template_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          agent_key: string
          avatar_img: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          last_message: string | null
          last_time: string | null
          name: string
          role: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_key: string
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          last_message?: string | null
          last_time?: string | null
          name: string
          role: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_key?: string
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          last_message?: string | null
          last_time?: string | null
          name?: string
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_revenue: {
        Row: {
          created_at: string | null
          id: string
          ip: number | null
          month: string
          shop: number | null
          subscriptions: number | null
          tips: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip?: number | null
          month: string
          shop?: number | null
          subscriptions?: number | null
          tips?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip?: number | null
          month?: string
          shop?: number | null
          subscriptions?: number | null
          tips?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_revenue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_views: {
        Row: {
          created_at: string | null
          id: string
          instagram: number | null
          month: string
          tiktok: number | null
          user_id: string | null
          youtube: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instagram?: number | null
          month: string
          tiktok?: number | null
          user_id?: string | null
          youtube?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instagram?: number | null
          month?: string
          tiktok?: number | null
          user_id?: string | null
          youtube?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transactions: {
        Row: {
          amount: number
          budget_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          amount: number
          budget_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "agent_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_events: {
        Row: {
          actor_type: string
          actor_user_id: string | null
          campaign_id: string
          created_at: string | null
          detail: string | null
          id: string
          target_id: string | null
          title: string
        }
        Insert: {
          actor_type: string
          actor_user_id?: string | null
          campaign_id: string
          created_at?: string | null
          detail?: string | null
          id?: string
          target_id?: string | null
          title: string
        }
        Update: {
          actor_type?: string
          actor_user_id?: string | null
          campaign_id?: string
          created_at?: string | null
          detail?: string | null
          id?: string
          target_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_events_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "business_campaign_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_targets: {
        Row: {
          campaign_id: string
          created_at: string | null
          creator_agent_id: string | null
          creator_id: string
          creator_message: string | null
          creator_reward: number
          deliverable_status: string
          deliverable_type: string
          id: string
          marketer_message: string | null
          offer_amount: number
          published_at: string | null
          reported_clicks: number
          reported_conversions: number
          reported_views: number
          responded_at: string | null
          stage: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          creator_agent_id?: string | null
          creator_id: string
          creator_message?: string | null
          creator_reward?: number
          deliverable_status?: string
          deliverable_type?: string
          id?: string
          marketer_message?: string | null
          offer_amount?: number
          published_at?: string | null
          reported_clicks?: number
          reported_conversions?: number
          reported_views?: number
          responded_at?: string | null
          stage?: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          creator_agent_id?: string | null
          creator_id?: string
          creator_message?: string | null
          creator_reward?: number
          deliverable_status?: string
          deliverable_type?: string
          id?: string
          marketer_message?: string | null
          offer_amount?: number
          published_at?: string | null
          reported_clicks?: number
          reported_conversions?: number
          reported_views?: number
          responded_at?: string | null
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_targets_creator_agent_id_fkey"
            columns: ["creator_agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_targets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaigns: {
        Row: {
          advertiser_id: string
          agent_id: string | null
          brand_name: string
          budget: number
          budget_spent: number
          created_at: string | null
          id: string
          name: string
          objective: string
          reported_conversions: number
          reported_reach: number
          status: string
          target_creator_count: number
          updated_at: string | null
        }
        Insert: {
          advertiser_id: string
          agent_id?: string | null
          brand_name: string
          budget?: number
          budget_spent?: number
          created_at?: string | null
          id?: string
          name: string
          objective: string
          reported_conversions?: number
          reported_reach?: number
          status?: string
          target_creator_count?: number
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string
          agent_id?: string | null
          brand_name?: string
          budget?: number
          budget_spent?: number
          created_at?: string | null
          id?: string
          name?: string
          objective?: string
          reported_conversions?: number
          reported_reach?: number
          status?: string
          target_creator_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaigns_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creators: {
        Row: {
          budget: number | null
          campaign_id: string | null
          conversions: number | null
          created_at: string | null
          creator_id: string | null
          id: string
          stage: string | null
          status: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          budget?: number | null
          campaign_id?: string | null
          conversions?: number | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          budget?: number | null
          campaign_id?: string | null
          conversions?: number | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          advertiser_id: string | null
          agent_key: string | null
          budget: number
          conversions: number | null
          created_at: string | null
          end_date: string
          id: string
          name: string
          reach: number | null
          spent: number | null
          start_date: string
          status: string | null
          target_conversions: number | null
          target_reach: number | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id?: string | null
          agent_key?: string | null
          budget: number
          conversions?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          reach?: number | null
          spent?: number | null
          start_date: string
          status?: string | null
          target_conversions?: number | null
          target_reach?: number | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string | null
          agent_key?: string | null
          budget?: number
          conversions?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          reach?: number | null
          spent?: number | null
          start_date?: string
          status?: string | null
          target_conversions?: number | null
          target_reach?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          chat_id: string
          joined_at: string | null
          role: string
          unread: number | null
          user_id: string
        }
        Insert: {
          chat_id: string
          joined_at?: string | null
          role?: string
          unread?: number | null
          user_id: string
        }
        Update: {
          chat_id?: string
          joined_at?: string | null
          role?: string
          unread?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          sender_avatar: string | null
          sender_id: string
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_avatar?: string | null
          sender_id: string
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_avatar?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          agent_id: string | null
          config: Json | null
          created_at: string | null
          experience_id: string | null
          id: string
          is_default: boolean
          last_message: string | null
          last_message_at: string | null
          name: string | null
          project_id: string | null
          scope: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          config?: Json | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          is_default?: boolean
          last_message?: string | null
          last_message_at?: string | null
          name?: string | null
          project_id?: string | null
          scope: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          config?: Json | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          is_default?: boolean
          last_message?: string | null
          last_message_at?: string | null
          name?: string | null
          project_id?: string | null
          scope?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "workspace_experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_course_purchases: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          purchased_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          purchased_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          purchased_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "consumer_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_course_sections: {
        Row: {
          course_id: string
          created_at: string | null
          duration: string
          id: string
          position: number
          preview: boolean
          section_key: string
          summary: string
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          duration: string
          id?: string
          position?: number
          preview?: boolean
          section_key: string
          summary: string
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          duration?: string
          id?: string
          position?: number
          preview?: boolean
          section_key?: string
          summary?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "consumer_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_courses: {
        Row: {
          completion_rate: string
          created_at: string | null
          creator_id: string
          description: string
          experience_id: string | null
          headline: string
          hero: string
          id: string
          instructor: string
          lessons_count: number
          level: string
          outcomes: string[]
          price: number
          slug: string
          status: string
          students_count: number
          subtitle: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completion_rate?: string
          created_at?: string | null
          creator_id: string
          description: string
          experience_id?: string | null
          headline: string
          hero: string
          id?: string
          instructor: string
          lessons_count?: number
          level: string
          outcomes?: string[]
          price?: number
          slug: string
          status?: string
          students_count?: number
          subtitle: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completion_rate?: string
          created_at?: string | null
          creator_id?: string
          description?: string
          experience_id?: string | null
          headline?: string
          hero?: string
          id?: string
          instructor?: string
          lessons_count?: number
          level?: string
          outcomes?: string[]
          price?: number
          slug?: string
          status?: string
          students_count?: number
          subtitle?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_courses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_courses_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "workspace_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          section_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          section_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          section_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "consumer_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_memberships: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          joined_at: string | null
          status: string
          tier_key: string
          tier_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          joined_at?: string | null
          status?: string
          tier_key: string
          tier_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          joined_at?: string | null
          status?: string
          tier_key?: string
          tier_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_memberships_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_purchases: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string | null
          product_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          product_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          product_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workspace_product_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "workspace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_course_chapters: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_course_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "experience_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_course_lessons: {
        Row: {
          attachments: Json | null
          chapter_id: string
          content: string | null
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attachments?: Json | null
          chapter_id: string
          content?: string | null
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attachments?: Json | null
          chapter_id?: string
          content?: string | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_course_lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "experience_course_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_courses: {
        Row: {
          cover: string | null
          created_at: string
          description: string | null
          experience_id: string
          id: string
          name: string
          position: number
          status: string
          updated_at: string
        }
        Insert: {
          cover?: string | null
          created_at?: string
          description?: string | null
          experience_id: string
          id?: string
          name: string
          position?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cover?: string | null
          created_at?: string
          description?: string | null
          experience_id?: string
          id?: string
          name?: string
          position?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_courses_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "workspace_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_video_items: {
        Row: {
          author_id: string | null
          created_at: string
          description: string | null
          experience_id: string
          id: string
          position: number
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description?: string | null
          experience_id: string
          id?: string
          position?: number
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string | null
          experience_id?: string
          id?: string
          position?: number
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_video_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_video_items_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "workspace_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      fans: {
        Row: {
          avatar_img: string | null
          color: string | null
          created_at: string | null
          creator_id: string | null
          handle: string
          id: string
          initials: string | null
          joined_date: string
          last_seen: string | null
          name: string
          status: string | null
          tier: string | null
          total_spend: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          creator_id?: string | null
          handle: string
          id?: string
          initials?: string | null
          joined_date: string
          last_seen?: string | null
          name: string
          status?: string | null
          tier?: string | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          creator_id?: string | null
          handle?: string
          id?: string
          initials?: string | null
          joined_date?: string
          last_seen?: string | null
          name?: string
          status?: string | null
          tier?: string | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fans_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          comment_count: number
          content: string
          created_at: string
          experience_id: string
          id: string
          images: string[] | null
          like_count: number
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_count?: number
          content: string
          created_at?: string
          experience_id: string
          id?: string
          images?: string[] | null
          like_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          experience_id?: string
          id?: string
          images?: string[] | null
          like_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "workspace_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_infringements: {
        Row: {
          action: string | null
          content: string
          created_at: string | null
          creator_id: string | null
          date: string
          id: string
          offender: string
          platform: string
          result: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action?: string | null
          content: string
          created_at?: string | null
          creator_id?: string | null
          date: string
          id?: string
          offender: string
          platform: string
          result?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string | null
          content?: string
          created_at?: string | null
          creator_id?: string | null
          date?: string
          id?: string
          offender?: string
          platform?: string
          result?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_infringements_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_licenses: {
        Row: {
          amount: string | null
          approved_by: string | null
          created_at: string | null
          creator_id: string | null
          date: string
          fee_type: string | null
          id: string
          requester: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: string | null
          approved_by?: string | null
          created_at?: string | null
          creator_id?: string | null
          date: string
          fee_type?: string | null
          id?: string
          requester: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: string | null
          approved_by?: string | null
          created_at?: string | null
          creator_id?: string | null
          date?: string
          fee_type?: string | null
          id?: string
          requester?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_licenses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          name: string
          perks: string[] | null
          price: number
          subscriber_count: number | null
          tier_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          name: string
          perks?: string[] | null
          price: number
          subscriber_count?: number | null
          tier_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          name?: string
          perks?: string[] | null
          price?: number
          subscriber_count?: number | null
          tier_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_tiers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          allow_fan_creation: boolean | null
          comments: number | null
          cover_img: string | null
          created_at: string | null
          creator_id: string | null
          emoji: string | null
          fan_creation_fee: number | null
          gradient_bg: string | null
          id: string
          likes: number | null
          lock_price: number | null
          locked: boolean | null
          preview: string | null
          sponsored: boolean | null
          sponsored_by: string | null
          tags: string[] | null
          tips: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          allow_fan_creation?: boolean | null
          comments?: number | null
          cover_img?: string | null
          created_at?: string | null
          creator_id?: string | null
          emoji?: string | null
          fan_creation_fee?: number | null
          gradient_bg?: string | null
          id?: string
          likes?: number | null
          lock_price?: number | null
          locked?: boolean | null
          preview?: string | null
          sponsored?: boolean | null
          sponsored_by?: string | null
          tags?: string[] | null
          tips?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          allow_fan_creation?: boolean | null
          comments?: number | null
          cover_img?: string | null
          created_at?: string | null
          creator_id?: string | null
          emoji?: string | null
          fan_creation_fee?: number | null
          gradient_bg?: string | null
          id?: string
          likes?: number | null
          lock_price?: number | null
          locked?: boolean | null
          preview?: string | null
          sponsored?: boolean | null
          sponsored_by?: string | null
          tags?: string[] | null
          tips?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          image: string | null
          name: string
          price: number
          sold_count: number | null
          status: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name: string
          price: number
          sold_count?: number | null
          status?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          price?: number
          sold_count?: number | null
          status?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string
          id: string
          mime_type: string | null
          name: string
          project_id: string
          size_bytes: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          name: string
          project_id: string
          size_bytes?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_participants: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_participants_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          parent_task_id: string | null
          priority: string
          progress: number
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          parent_task_id?: string | null
          priority?: string
          progress?: number
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          parent_task_id?: string | null
          priority?: string
          progress?: number
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          runtime_type: string
          status: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          runtime_type?: string
          status?: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          runtime_type?: string
          status?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      role_applications: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_creator_partnerships: {
        Row: {
          channel_manager: string | null
          created_at: string | null
          creator_id: string | null
          id: string
          ip_approved: boolean | null
          monthly_sales: number | null
          products_count: number | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          channel_manager?: string | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          ip_approved?: boolean | null
          monthly_sales?: number | null
          products_count?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_manager?: string | null
          created_at?: string | null
          creator_id?: string | null
          id?: string
          ip_approved?: boolean | null
          monthly_sales?: number | null
          products_count?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_creator_partnerships_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_creator_partnerships_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string | null
          creator_id: string | null
          id: string
          name: string
          price: number
          revenue_month: number | null
          sku: string
          sold_month: number | null
          sold_today: number | null
          sold_week: number | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          name: string
          price: number
          revenue_month?: number | null
          sku: string
          sold_month?: number | null
          sold_today?: number | null
          sold_week?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          name?: string
          price?: number
          revenue_month?: number | null
          sku?: string
          sold_month?: number | null
          sold_today?: number | null
          sold_week?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          created_at: string | null
          id: string
          token_balance: number
          updated_at: string | null
          usdc_balance: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_balance?: number
          updated_at?: string | null
          usdc_balance?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          token_balance?: number
          updated_at?: string | null
          usdc_balance?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_color: string | null
          avatar_img: string | null
          bio: string | null
          cover_img: string | null
          created_at: string | null
          email: string
          followers: number | null
          following: number | null
          handle: string
          id: string
          initials: string | null
          name: string
          onboarding_completed: boolean
          posts: number | null
          role: string
          roles: string[] | null
          social_links: Json | null
          updated_at: string | null
          username: string
          verified: boolean | null
        }
        Insert: {
          auth_id?: string | null
          avatar_color?: string | null
          avatar_img?: string | null
          bio?: string | null
          cover_img?: string | null
          created_at?: string | null
          email: string
          followers?: number | null
          following?: number | null
          handle: string
          id?: string
          initials?: string | null
          name: string
          onboarding_completed?: boolean
          posts?: number | null
          role: string
          roles?: string[] | null
          social_links?: Json | null
          updated_at?: string | null
          username: string
          verified?: boolean | null
        }
        Update: {
          auth_id?: string | null
          avatar_color?: string | null
          avatar_img?: string | null
          bio?: string | null
          cover_img?: string | null
          created_at?: string | null
          email?: string
          followers?: number | null
          following?: number | null
          handle?: string
          id?: string
          initials?: string | null
          name?: string
          onboarding_completed?: boolean
          posts?: number | null
          role?: string
          roles?: string[] | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      workspace_agent_task_logs: {
        Row: {
          action: string
          agent_id: string
          created_at: string
          detail: string | null
          id: string
          task_id: string
        }
        Insert: {
          action: string
          agent_id: string
          created_at?: string
          detail?: string | null
          id?: string
          task_id: string
        }
        Update: {
          action?: string
          agent_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_agent_task_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_agent_task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_agent_tasks: {
        Row: {
          created_at: string | null
          due: string | null
          id: string
          priority: string
          progress: number
          status: string
          task_key: string
          title: string
          updated_at: string | null
          workspace_agent_id: string
        }
        Insert: {
          created_at?: string | null
          due?: string | null
          id?: string
          priority?: string
          progress?: number
          status?: string
          task_key: string
          title: string
          updated_at?: string | null
          workspace_agent_id: string
        }
        Update: {
          created_at?: string | null
          due?: string | null
          id?: string
          priority?: string
          progress?: number
          status?: string
          task_key?: string
          title?: string
          updated_at?: string | null
          workspace_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_agent_tasks_workspace_agent_id_fkey"
            columns: ["workspace_agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_agents: {
        Row: {
          agent_key: string
          avatar_img: string | null
          color: string | null
          created_at: string | null
          description: string | null
          enabled_skills: string[] | null
          hired_at: string | null
          hired_by_user_id: string | null
          id: string
          lark_app_id: string | null
          lark_app_secret: string | null
          last_message: string | null
          last_time: string | null
          model: string | null
          name: string
          role: string
          status: string
          support_enabled: boolean | null
          template_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          agent_key: string
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          enabled_skills?: string[] | null
          hired_at?: string | null
          hired_by_user_id?: string | null
          id?: string
          lark_app_id?: string | null
          lark_app_secret?: string | null
          last_message?: string | null
          last_time?: string | null
          model?: string | null
          name: string
          role: string
          status?: string
          support_enabled?: boolean | null
          template_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          agent_key?: string
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          enabled_skills?: string[] | null
          hired_at?: string | null
          hired_by_user_id?: string | null
          id?: string
          lark_app_id?: string | null
          lark_app_secret?: string | null
          last_message?: string | null
          last_time?: string | null
          model?: string | null
          name?: string
          role?: string
          status?: string
          support_enabled?: boolean | null
          template_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_agents_hired_by_user_id_fkey"
            columns: ["hired_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_agents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_billing: {
        Row: {
          billing_email: string | null
          created_at: string | null
          id: string
          plan: string
          status: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_billing_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_consumer_configs: {
        Row: {
          config_json: Json
          created_at: string | null
          id: string
          template_key: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          config_json?: Json
          created_at?: string | null
          id?: string
          template_key: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          config_json?: Json
          created_at?: string | null
          id?: string
          template_key?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_consumer_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_employees: {
        Row: {
          avatar_img: string | null
          color: string | null
          created_at: string | null
          description: string | null
          email: string | null
          employment_status: string
          hired_at: string | null
          id: string
          name: string
          position: string
          salary_label: string | null
          skills: string[] | null
          status: string
          updated_at: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employment_status?: string
          hired_at?: string | null
          id?: string
          name: string
          position: string
          salary_label?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          avatar_img?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employment_status?: string
          hired_at?: string | null
          id?: string
          name?: string
          position?: string
          salary_label?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_employees_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_experiences: {
        Row: {
          config_json: Json | null
          cover: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          position: number
          status: string
          type: string
          updated_at: string
          visibility: string
          workspace_id: string
        }
        Insert: {
          config_json?: Json | null
          cover?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          position?: number
          status?: string
          type: string
          updated_at?: string
          visibility?: string
          workspace_id: string
        }
        Update: {
          config_json?: Json | null
          cover?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number
          status?: string
          type?: string
          updated_at?: string
          visibility?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_experiences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_home_configs: {
        Row: {
          ai_support_enabled: boolean | null
          ai_support_model: string | null
          cover: string | null
          created_at: string
          headline: string | null
          layout: string | null
          tabs: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_support_enabled?: boolean | null
          ai_support_model?: string | null
          cover?: string | null
          created_at?: string
          headline?: string | null
          layout?: string | null
          tabs?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_support_enabled?: boolean | null
          ai_support_model?: string | null
          cover?: string | null
          created_at?: string
          headline?: string | null
          layout?: string | null
          tabs?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_home_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_integrations: {
        Row: {
          config_json: Json
          created_at: string | null
          id: string
          last_sync_at: string | null
          provider: string
          status: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          config_json?: Json
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          status?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          config_json?: Json
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          status?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_joins: {
        Row: {
          id: string
          joined_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_joins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_joins_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          created_at: string | null
          id: string
          membership_role: string
          status: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          membership_role: string
          status?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          membership_role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_modules: {
        Row: {
          created_at: string | null
          enabled: boolean
          id: string
          module_key: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          module_key: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          module_key?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_permissions: {
        Row: {
          action: string
          allowed: boolean
          created_at: string | null
          id: string
          membership_role: string
          resource: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          allowed?: boolean
          created_at?: string | null
          id?: string
          membership_role: string
          resource: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          allowed?: boolean
          created_at?: string | null
          id?: string
          membership_role?: string
          resource?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_policies: {
        Row: {
          approval_policy: Json
          created_at: string | null
          id: string
          notification_policy: Json
          sandbox_policy: Json
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          approval_policy?: Json
          created_at?: string | null
          id?: string
          notification_policy?: Json
          sandbox_policy?: Json
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          approval_policy?: Json
          created_at?: string | null
          id?: string
          notification_policy?: Json
          sandbox_policy?: Json
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_product_experiences: {
        Row: {
          experience_id: string
          product_id: string
        }
        Insert: {
          experience_id: string
          product_id: string
        }
        Update: {
          experience_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_product_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "workspace_experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_product_experiences_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "workspace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_product_plans: {
        Row: {
          billing_type: string
          created_at: string
          currency: string
          id: string
          interval: string | null
          price: number
          product_id: string
          status: string
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          billing_type: string
          created_at?: string
          currency?: string
          id?: string
          interval?: string | null
          price?: number
          product_id: string
          status?: string
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_type?: string
          created_at?: string
          currency?: string
          id?: string
          interval?: string | null
          price?: number
          product_id?: string
          status?: string
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_product_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "workspace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_products: {
        Row: {
          access_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_wallets: {
        Row: {
          created_at: string | null
          id: string
          locked_amount: number
          pending_revenue: number
          token_balance: number
          total_spent: number
          updated_at: string | null
          usdc_balance: number
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          locked_amount?: number
          pending_revenue?: number
          token_balance?: number
          total_spent?: number
          updated_at?: string | null
          usdc_balance?: number
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          locked_amount?: number
          pending_revenue?: number
          token_balance?: number
          total_spent?: number
          updated_at?: string | null
          usdc_balance?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_wallets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          cover: string | null
          created_at: string | null
          headline: string | null
          icon: string | null
          id: string
          name: string
          owner_user_id: string
          slug: string
          status: string
          updated_at: string | null
        }
        Insert: {
          cover?: string | null
          created_at?: string | null
          headline?: string | null
          icon?: string | null
          id?: string
          name: string
          owner_user_id: string
          slug: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          cover?: string | null
          created_at?: string | null
          headline?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          slug?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_id: { Args: never; Returns: string }
      decrement_forum_like_count: {
        Args: { post_id_param: string }
        Returns: undefined
      }
      increment_forum_comment_count: {
        Args: { post_id_param: string }
        Returns: undefined
      }
      increment_forum_like_count: {
        Args: { post_id_param: string }
        Returns: undefined
      }
      is_chat_member: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      is_project_participant: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      is_workspace_owner: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
      reload_pgrst_schema: { Args: never; Returns: undefined }
      search_agent_memories: {
        Args: {
          p_agent_id: string
          p_limit?: number
          p_memory_type?: string
          p_query_embedding: string
          p_scope_prefix?: string
          p_similarity_threshold?: number
        }
        Returns: {
          content: string
          created_at: string
          id: string
          importance: number
          memory_type: string
          metadata: Json
          scope: string
          similarity: number
        }[]
      }
      submit_role_application: {
        Args: { reason_input?: string; target_role_input: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
