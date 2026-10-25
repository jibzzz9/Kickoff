
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "app_settings": {
                  Row: {
                    "description": string | null,"key": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"key": string,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"key"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"applications": {
                  Row: {
                    "cover_letter": string | null,"created_at": string,"cv_document_id": string | null,"decided_at": string | null,"first_response_at": string | null,"id": string,"listing_id": string,"status": Database["public"]['Enums']["application_status"],"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_letter"?: string | null,"created_at"?: string,"cv_document_id"?: string | null,"decided_at"?: string | null,"first_response_at"?: string | null,"id"?: string,"listing_id": string,"status"?: Database["public"]['Enums']["application_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "cover_letter"?: string | null,"created_at"?: string,"cv_document_id"?: string | null,"decided_at"?: string | null,"first_response_at"?: string | null,"id"?: string,"listing_id"?: string,"status"?: Database["public"]['Enums']["application_status"],"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_cv_document_id_fkey"
      columns: ["cv_document_id"]
isOneToOne: false
      referencedRelation: "student_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"appointment_slots": {
                  Row: {
                    "appointment_id": string,"id": string,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "appointment_id": string,"id"?: string,"starts_at": string
                  }
                  Update: {
                    "appointment_id"?: string,"id"?: string,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointment_slots_appointment_id_fkey"
      columns: ["appointment_id"]
isOneToOne: false
      referencedRelation: "appointments"
      referencedColumns: ["id"]
    }
                  ]
                },"appointments": {
                  Row: {
                    "application_id": string,"chosen_slot_id": string | null,"contact_person": string | null,"created_at": string,"created_by": string | null,"duration_minutes": number,"id": string,"kind": Database["public"]['Enums']["appointment_kind"],"location": string | null,"status": Database["public"]['Enums']["appointment_status"],"updated_at": string,"what_to_bring": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"chosen_slot_id"?: string | null,"contact_person"?: string | null,"created_at"?: string,"created_by"?: string | null,"duration_minutes"?: number,"id"?: string,"kind": Database["public"]['Enums']["appointment_kind"],"location"?: string | null,"status"?: Database["public"]['Enums']["appointment_status"],"updated_at"?: string,"what_to_bring"?: string | null
                  }
                  Update: {
                    "application_id"?: string,"chosen_slot_id"?: string | null,"contact_person"?: string | null,"created_at"?: string,"created_by"?: string | null,"duration_minutes"?: number,"id"?: string,"kind"?: Database["public"]['Enums']["appointment_kind"],"location"?: string | null,"status"?: Database["public"]['Enums']["appointment_status"],"updated_at"?: string,"what_to_bring"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "candidate_cards"
      referencedColumns: ["application_id"]
    },{
      foreignKeyName: "appointments_chosen_slot_fk"
      columns: ["chosen_slot_id"]
isOneToOne: false
      referencedRelation: "appointment_slots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"checkup_reports": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"id": string,"period_end": string,"period_start": string,"read_at": string | null,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": NonNullable<Json>,"created_at"?: string,"id"?: string,"period_end": string,"period_start": string,"read_at"?: string | null,"student_id": string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"period_end"?: string,"period_start"?: string,"read_at"?: string | null,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "checkup_reports_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"communes": {
                  Row: {
                    "canton": string,"code": string,"id": string,"language": Database["public"]['Enums']["app_locale"],"lat": number,"lng": number,"name": string,"station_id": string | null,"station_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "canton"?: string,"code": string,"id"?: string,"language": Database["public"]['Enums']["app_locale"],"lat": number,"lng": number,"name": string,"station_id"?: string | null,"station_name"?: string | null
                  }
                  Update: {
                    "canton"?: string,"code"?: string,"id"?: string,"language"?: Database["public"]['Enums']["app_locale"],"lat"?: number,"lng"?: number,"name"?: string,"station_id"?: string | null,"station_name"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"companies": {
                  Row: {
                    "address": string | null,"commune": string,"created_at": string,"id": string,"ide_number": string | null,"name": string,"plan": Database["public"]['Enums']["company_plan"],"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"commune": string,"created_at"?: string,"id"?: string,"ide_number"?: string | null,"name": string,"plan"?: Database["public"]['Enums']["company_plan"],"verified_at"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"commune"?: string,"created_at"?: string,"id"?: string,"ide_number"?: string | null,"name"?: string,"plan"?: Database["public"]['Enums']["company_plan"],"verified_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"company_members": {
                  Row: {
                    "company_id": string,"contact_name": string | null,"created_at": string,"profile_id": string,"role": Database["public"]['Enums']["company_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"contact_name"?: string | null,"created_at"?: string,"profile_id": string,"role"?: Database["public"]['Enums']["company_role"]
                  }
                  Update: {
                    "company_id"?: string,"contact_name"?: string | null,"created_at"?: string,"profile_id"?: string,"role"?: Database["public"]['Enums']["company_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_members_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"guardians_access": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"expires_at": string,"guardian_email": string,"guardian_profile_id": string | null,"id": string,"relation": string,"revoked_at": string | null,"student_id": string,"token_hash": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"expires_at"?: string,"guardian_email": string,"guardian_profile_id"?: string | null,"id"?: string,"relation"?: string,"revoked_at"?: string | null,"student_id": string,"token_hash"?: string | null
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"expires_at"?: string,"guardian_email"?: string,"guardian_profile_id"?: string | null,"id"?: string,"relation"?: string,"revoked_at"?: string | null,"student_id"?: string,"token_hash"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "guardians_access_guardian_profile_id_fkey"
      columns: ["guardian_profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guardians_access_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"listing_criteria": {
                  Row: {
                    "id": string,"key": string,"kind": Database["public"]['Enums']["criterion_kind"],"listing_id": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"key": string,"kind": Database["public"]['Enums']["criterion_kind"],"listing_id": string,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "id"?: string,"key"?: string,"kind"?: Database["public"]['Enums']["criterion_kind"],"listing_id"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_criteria_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listing_criteria_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_views": {
                  Row: {
                    "day": string,"listing_id": string,"viewer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day"?: string,"listing_id": string,"viewer_id": string
                  }
                  Update: {
                    "day"?: string,"listing_id"?: string,"viewer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_views_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listing_views_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listing_views_viewer_id_fkey"
      columns: ["viewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "address": string | null,"commune_id": string,"company_id": string,"contact_email": string | null,"contact_name": string | null,"created_at": string,"created_by": string | null,"description": string,"id": string,"places_count": number,"profession_id": string,"start_date": string,"status": Database["public"]['Enums']["listing_status"],"title": string,"trial_dates": (string)[],"updated_at": string,"weights": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"commune_id": string,"company_id": string,"contact_email"?: string | null,"contact_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"description": string,"id"?: string,"places_count"?: number,"profession_id": string,"start_date": string,"status"?: Database["public"]['Enums']["listing_status"],"title": string,"trial_dates"?: (string)[],"updated_at"?: string,"weights"?: NonNullable<Json>
                  }
                  Update: {
                    "address"?: string | null,"commune_id"?: string,"company_id"?: string,"contact_email"?: string | null,"contact_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"places_count"?: number,"profession_id"?: string,"start_date"?: string,"status"?: Database["public"]['Enums']["listing_status"],"title"?: string,"trial_dates"?: (string)[],"updated_at"?: string,"weights"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_commune_id_fkey"
      columns: ["commune_id"]
isOneToOne: false
      referencedRelation: "communes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_commune_id_fkey"
      columns: ["commune_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["commune_id"]
    },{
      foreignKeyName: "listings_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["profession_id"]
    },{
      foreignKeyName: "listings_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "professions"
      referencedColumns: ["id"]
    }
                  ]
                },"match_scores": {
                  Row: {
                    "algo_version": string,"application_id": string,"badge": string,"computed_at": string,"details": NonNullable<Json>,"inputs_hash": string,"score": number,"segments": number
                  }
                  ComputedFields: never
                  Insert: {
                    "algo_version": string,"application_id": string,"badge": string,"computed_at"?: string,"details": NonNullable<Json>,"inputs_hash": string,"score": number,"segments": number
                  }
                  Update: {
                    "algo_version"?: string,"application_id"?: string,"badge"?: string,"computed_at"?: string,"details"?: NonNullable<Json>,"inputs_hash"?: string,"score"?: number,"segments"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_scores_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "match_scores_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "candidate_cards"
      referencedColumns: ["application_id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "application_id": string,"appointment_id": string | null,"body": string | null,"created_at": string,"id": string,"kind": string,"sender_id": string | null,"sender_role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"appointment_id"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"sender_id"?: string | null,"sender_role": string
                  }
                  Update: {
                    "application_id"?: string,"appointment_id"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"sender_id"?: string | null,"sender_role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "candidate_cards"
      referencedColumns: ["application_id"]
    },{
      foreignKeyName: "messages_appointment_id_fkey"
      columns: ["appointment_id"]
isOneToOne: false
      referencedRelation: "appointments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"params": NonNullable<Json>,"profile_id": string,"pushed_at": string | null,"read_at": string | null,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"params"?: NonNullable<Json>,"profile_id": string,"pushed_at"?: string | null,"read_at"?: string | null,"type": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"params"?: NonNullable<Json>,"profile_id"?: string,"pushed_at"?: string | null,"read_at"?: string | null,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_features": {
                  Row: {
                    "enabled": boolean,"feature_key": string,"plan": Database["public"]['Enums']["company_plan"]
                  }
                  ComputedFields: never
                  Insert: {
                    "enabled"?: boolean,"feature_key": string,"plan": Database["public"]['Enums']["company_plan"]
                  }
                  Update: {
                    "enabled"?: boolean,"feature_key"?: string,"plan"?: Database["public"]['Enums']["company_plan"]
                  }
                  Relationships: [
                    
                  ]
                },"professions": {
                  Row: {
                    "active": boolean,"code": string,"id": string,"name_de": string,"name_fr": string,"type": Database["public"]['Enums']["profession_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"id"?: string,"name_de": string,"name_fr": string,"type": Database["public"]['Enums']["profession_type"]
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"id"?: string,"name_de"?: string,"name_fr"?: string,"type"?: Database["public"]['Enums']["profession_type"]
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"id": string,"locale": Database["public"]['Enums']["app_locale"],"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"locale"?: Database["public"]['Enums']["app_locale"],"role": Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"push_tokens": {
                  Row: {
                    "created_at": string,"id": string,"platform": string | null,"profile_id": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"platform"?: string | null,"profile_id": string,"token": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"platform"?: string | null,"profile_id"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"recruiter_notes": {
                  Row: {
                    "application_id": string,"author_id": string,"body": string,"created_at": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"author_id"?: string,"body": string,"created_at"?: string,"id"?: string
                  }
                  Update: {
                    "application_id"?: string,"author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recruiter_notes_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recruiter_notes_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "candidate_cards"
      referencedColumns: ["application_id"]
    },{
      foreignKeyName: "recruiter_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reminders": {
                  Row: {
                    "application_id": string | null,"appointment_id": string | null,"id": number,"kind": string,"sent_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"appointment_id"?: string | null,"id"?: never,"kind": string,"sent_at"?: string
                  }
                  Update: {
                    "application_id"?: string | null,"appointment_id"?: string | null,"id"?: never,"kind"?: string,"sent_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reminders_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminders_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "candidate_cards"
      referencedColumns: ["application_id"]
    },{
      foreignKeyName: "reminders_appointment_id_fkey"
      columns: ["appointment_id"]
isOneToOne: false
      referencedRelation: "appointments"
      referencedColumns: ["id"]
    }
                  ]
                },"score_audit_log": {
                  Row: {
                    "algo_version": string,"application_id": string,"badge": string,"created_at": string,"id": number,"inputs_hash": string,"score": number,"segments": number
                  }
                  ComputedFields: never
                  Insert: {
                    "algo_version": string,"application_id": string,"badge": string,"created_at"?: string,"id"?: never,"inputs_hash": string,"score": number,"segments": number
                  }
                  Update: {
                    "algo_version"?: string,"application_id"?: string,"badge"?: string,"created_at"?: string,"id"?: never,"inputs_hash"?: string,"score"?: number,"segments"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "score_audit_log_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "score_audit_log_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "candidate_cards"
      referencedColumns: ["application_id"]
    }
                  ]
                },"student_documents": {
                  Row: {
                    "created_at": string,"file_name": string,"id": string,"kind": Database["public"]['Enums']["document_kind"],"mime_type": string,"size_bytes": number,"storage_path": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_name": string,"id"?: string,"kind": Database["public"]['Enums']["document_kind"],"mime_type": string,"size_bytes": number,"storage_path": string,"student_id": string
                  }
                  Update: {
                    "created_at"?: string,"file_name"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["document_kind"],"mime_type"?: string,"size_bytes"?: number,"storage_path"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "student_documents_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"students": {
                  Row: {
                    "ai_notice_accepted_at": string | null,"aptitude_tests": NonNullable<Json>,"birth_date": string,"checkup_frequency_days": number,"commune": string,"commune_id": string | null,"created_at": string,"does_volunteering": boolean,"first_name": string,"grades": NonNullable<Json>,"has_moped_license": boolean,"interests": (string)[],"languages": (string)[],"plan": Database["public"]['Enums']["student_plan"],"profile_id": string,"school_year": string | null,"share_checkups_with_guardians": boolean,"share_trial_feedback": boolean,"soft_skills": (string)[],"target_professions": (string)[],"trial_internships": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_notice_accepted_at"?: string | null,"aptitude_tests"?: NonNullable<Json>,"birth_date": string,"checkup_frequency_days"?: number,"commune": string,"commune_id"?: string | null,"created_at"?: string,"does_volunteering"?: boolean,"first_name": string,"grades"?: NonNullable<Json>,"has_moped_license"?: boolean,"interests"?: (string)[],"languages"?: (string)[],"plan"?: Database["public"]['Enums']["student_plan"],"profile_id": string,"school_year"?: string | null,"share_checkups_with_guardians"?: boolean,"share_trial_feedback"?: boolean,"soft_skills"?: (string)[],"target_professions"?: (string)[],"trial_internships"?: NonNullable<Json>
                  }
                  Update: {
                    "ai_notice_accepted_at"?: string | null,"aptitude_tests"?: NonNullable<Json>,"birth_date"?: string,"checkup_frequency_days"?: number,"commune"?: string,"commune_id"?: string | null,"created_at"?: string,"does_volunteering"?: boolean,"first_name"?: string,"grades"?: NonNullable<Json>,"has_moped_license"?: boolean,"interests"?: (string)[],"languages"?: (string)[],"plan"?: Database["public"]['Enums']["student_plan"],"profile_id"?: string,"school_year"?: string | null,"share_checkups_with_guardians"?: boolean,"share_trial_feedback"?: boolean,"soft_skills"?: (string)[],"target_professions"?: (string)[],"trial_internships"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "students_commune_id_fkey"
      columns: ["commune_id"]
isOneToOne: false
      referencedRelation: "communes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "students_commune_id_fkey"
      columns: ["commune_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["commune_id"]
    },{
      foreignKeyName: "students_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"transit_cache": {
                  Row: {
                    "fetched_at": string,"from_commune_id": string,"minutes": number | null,"to_commune_id": string,"transfers": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "fetched_at"?: string,"from_commune_id": string,"minutes"?: number | null,"to_commune_id": string,"transfers"?: number | null
                  }
                  Update: {
                    "fetched_at"?: string,"from_commune_id"?: string,"minutes"?: number | null,"to_commune_id"?: string,"transfers"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "transit_cache_from_commune_id_fkey"
      columns: ["from_commune_id"]
isOneToOne: false
      referencedRelation: "communes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transit_cache_from_commune_id_fkey"
      columns: ["from_commune_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["commune_id"]
    },{
      foreignKeyName: "transit_cache_to_commune_id_fkey"
      columns: ["to_commune_id"]
isOneToOne: false
      referencedRelation: "communes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transit_cache_to_commune_id_fkey"
      columns: ["to_commune_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["commune_id"]
    }
                  ]
                },"trial_evaluations": {
                  Row: {
                    "appointment_id": string,"comment": string | null,"created_at": string,"created_by": string | null,"interest": number,"punctuality": number,"share_with_student": boolean,"team_contact": number
                  }
                  ComputedFields: never
                  Insert: {
                    "appointment_id": string,"comment"?: string | null,"created_at"?: string,"created_by"?: string | null,"interest": number,"punctuality": number,"share_with_student"?: boolean,"team_contact": number
                  }
                  Update: {
                    "appointment_id"?: string,"comment"?: string | null,"created_at"?: string,"created_by"?: string | null,"interest"?: number,"punctuality"?: number,"share_with_student"?: boolean,"team_contact"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "trial_evaluations_appointment_id_fkey"
      columns: ["appointment_id"]
isOneToOne: true
      referencedRelation: "appointments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trial_evaluations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "candidate_cards": {
                  Row: {
                    "age": number | null,"application_id": string,"aptitude_tests": NonNullable<Json>,"commune": string,"cover_letter": string | null,"created_at": string,"cv_file_name": string | null,"cv_path": string | null,"does_volunteering": boolean,"first_name": string,"grades": NonNullable<Json>,"has_moped_license": boolean,"interests": (string)[],"languages": (string)[],"listing_id": string,"school_year": string | null,"soft_skills": (string)[],"status": Database["public"]['Enums']["application_status"],"trial_internships": NonNullable<Json>
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "applications_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listing_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_cards": {
                  Row: {
                    "address": string | null,"commune_id": string,"commune_name": string,"company_name": string,"contact_name": string | null,"created_at": string,"description": string,"id": string,"lat": number,"lng": number,"places_count": number,"profession_code": string,"profession_id": string,"profession_name_de": string,"profession_name_fr": string,"start_date": string,"status": Database["public"]['Enums']["listing_status"],"title": string,"trial_dates": (string)[],"weights": NonNullable<Json>
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "application_context":
{ Args: { "p_application": string }; Returns: {
              "company_id": string,"company_name": string,"first_name": string,"listing_id": string,"listing_title": string,"places_count": number,"status": Database["public"]['Enums']["application_status"],"student_id": string
            }[]
                           },
"assert_company_action":
{ Args: { "p_application": string,"p_feature": string }; Returns: undefined
                           },
"assert_student_owns":
{ Args: { "p_application": string }; Returns: undefined
                           },
"build_checkup":
{ Args: { "p_end": string,"p_start": string,"p_student": string }; Returns: Json
                           },
"call_edge_function":
{ Args: { "p_body": Json,"p_name": string }; Returns: undefined
                           },
"can_see_application":
{ Args: { "p_application": string }; Returns: boolean
                           },
"company_can_read_document":
{ Args: { "p_path": string }; Returns: boolean
                           },
"company_decide":
{ Args: { "p_application": string,"p_decision": string,"p_message": string }; Returns: undefined
                           },
"company_evaluate_trial":
{ Args: { "p_appointment": string,"p_comment": string,"p_interest": number,"p_punctuality": number,"p_share": boolean,"p_team_contact": number }; Returns: undefined
                           },
"company_has_feature":
{ Args: { "p_company": string,"p_feature": string }; Returns: boolean
                           },
"company_invite":
{ Args: { "p_application_ids": (string)[],"p_contact_person"?: string,"p_duration_minutes"?: number,"p_kind": Database["public"]['Enums']["appointment_kind"],"p_location"?: string,"p_message": string,"p_slots": (string)[],"p_what_to_bring"?: string }; Returns: number
                           },
"company_mark_filled":
{ Args: { "p_listing": string }; Returns: undefined
                           },
"create_listing":
{ Args: { "p": Json }; Returns: string
                           },
"distance_km":
{ Args: { "lat1": number,"lat2": number,"lng1": number,"lng2": number }; Returns: number
                           },
"fill_listing":
{ Args: { "p_listing": string }; Returns: undefined
                           },
"generate_checkup":
{ Args: { "p_student": string }; Returns: string
                           },
"generate_due_checkups":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_application_company_member":
{ Args: { "p_application": string }; Returns: boolean
                           },
"is_company_admin":
{ Args: { "p_company": string }; Returns: boolean
                           },
"is_company_member":
{ Args: { "p_company": string }; Returns: boolean
                           },
"is_guardian_of":
{ Args: { "p_student": string }; Returns: boolean
                           },
"is_listing_company_member":
{ Args: { "p_listing": string }; Returns: boolean
                           },
"listing_is_public":
{ Args: { "p_listing": string }; Returns: boolean
                           },
"listing_stats":
{ Args: { "p_listing": string }; Returns: {
              "applications": number,"avg_response_hours": number,"invited": number,"offers": number,"unique_viewers": number,"views": number
            }[]
                           },
"post_message":
{ Args: { "p_application": string,"p_appointment"?: string,"p_body": string,"p_kind": string,"p_role": string }; Returns: string
                           },
"record_listing_view":
{ Args: { "p_listing": string }; Returns: undefined
                           },
"request_checkup":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"run_reminders":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"student_choose_slot":
{ Args: { "p_appointment": string,"p_slot": string }; Returns: undefined
                           },
"student_follow_up":
{ Args: { "p_application": string,"p_message": string }; Returns: undefined
                           },
"student_respond_offer":
{ Args: { "p_accept": boolean,"p_application": string }; Returns: undefined
                           },
"student_withdraw":
{ Args: { "p_application": string }; Returns: undefined
                           },
"suggest_listings":
{ Args: { "p_limit"?: number }; Returns: {
              "distance_km": number,"listing_id": string,"reason": string
            }[]
                           },
"suggest_listings_for":
{ Args: { "p_limit"?: number,"p_student": string }; Returns: {
              "distance_km": number,"listing_id": string,"reason": string
            }[]
                           }
          }
          Enums: {
            "app_locale": "fr"|"de","application_status": "sent"|"followed_up"|"trial"|"interview"|"offer"|"accepted"|"declined"|"not_this_time"|"waitlist"|"withdrawn","appointment_kind": "interview"|"trial","appointment_status": "proposed"|"scheduled"|"done"|"cancelled","company_plan": "basic"|"pro","company_role": "admin"|"trainer","criterion_kind": "required"|"bonus","document_kind": "cv"|"letter"|"video","listing_status": "draft"|"open"|"filled"|"closed","profession_type": "CFC"|"AFP","student_plan": "free"|"plus","user_role": "student"|"company_user"|"parent"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_locale": ["fr", "de"],"application_status": ["sent", "followed_up", "trial", "interview", "offer", "accepted", "declined", "not_this_time", "waitlist", "withdrawn"],"appointment_kind": ["interview", "trial"],"appointment_status": ["proposed", "scheduled", "done", "cancelled"],"company_plan": ["basic", "pro"],"company_role": ["admin", "trainer"],"criterion_kind": ["required", "bonus"],"document_kind": ["cv", "letter", "video"],"listing_status": ["draft", "open", "filled", "closed"],"profession_type": ["CFC", "AFP"],"student_plan": ["free", "plus"],"user_role": ["student", "company_user", "parent", "admin"]
          }
        }
} as const
