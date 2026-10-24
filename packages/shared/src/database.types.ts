
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
                    "cover_letter": string | null,"created_at": string,"cv_document_id": string | null,"id": string,"listing_id": string,"status": Database["public"]['Enums']["application_status"],"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_letter"?: string | null,"created_at"?: string,"cv_document_id"?: string | null,"id"?: string,"listing_id": string,"status"?: Database["public"]['Enums']["application_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "cover_letter"?: string | null,"created_at"?: string,"cv_document_id"?: string | null,"id"?: string,"listing_id"?: string,"status"?: Database["public"]['Enums']["application_status"],"student_id"?: string,"updated_at"?: string
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
                },"communes": {
                  Row: {
                    "canton": string,"code": string,"id": string,"language": Database["public"]['Enums']["app_locale"],"lat": number,"lng": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "canton"?: string,"code": string,"id"?: string,"language": Database["public"]['Enums']["app_locale"],"lat": number,"lng": number,"name": string
                  }
                  Update: {
                    "canton"?: string,"code"?: string,"id"?: string,"language"?: Database["public"]['Enums']["app_locale"],"lat"?: number,"lng"?: number,"name"?: string
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
                    "created_at": string,"guardian_email": string,"guardian_profile_id": string | null,"id": string,"revoked_at": string | null,"student_id": string,"token_hash": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"guardian_email": string,"guardian_profile_id"?: string | null,"id"?: string,"revoked_at"?: string | null,"student_id": string,"token_hash"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"guardian_email"?: string,"guardian_profile_id"?: string | null,"id"?: string,"revoked_at"?: string | null,"student_id"?: string,"token_hash"?: string | null
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
                },"parental_consents": {
                  Row: {
                    "confirmed_at": string | null,"created_at": string,"expires_at": string,"id": string,"parent_email": string,"student_id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed_at"?: string | null,"created_at"?: string,"expires_at": string,"id"?: string,"parent_email": string,"student_id": string,"token_hash": string
                  }
                  Update: {
                    "confirmed_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"parent_email"?: string,"student_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parental_consents_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["profile_id"]
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
                    "ai_notice_accepted_at": string | null,"aptitude_tests": NonNullable<Json>,"birth_date": string,"checkup_frequency_days": number,"commune": string,"commune_id": string | null,"created_at": string,"does_volunteering": boolean,"first_name": string,"grades": NonNullable<Json>,"has_moped_license": boolean,"interests": (string)[],"languages": (string)[],"parent_email": string | null,"parental_consent": Database["public"]['Enums']["consent_status"],"parental_consent_at": string | null,"plan": Database["public"]['Enums']["student_plan"],"profile_id": string,"school_year": string | null,"soft_skills": (string)[],"trial_internships": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_notice_accepted_at"?: string | null,"aptitude_tests"?: NonNullable<Json>,"birth_date": string,"checkup_frequency_days"?: number,"commune": string,"commune_id"?: string | null,"created_at"?: string,"does_volunteering"?: boolean,"first_name": string,"grades"?: NonNullable<Json>,"has_moped_license"?: boolean,"interests"?: (string)[],"languages"?: (string)[],"parent_email"?: string | null,"parental_consent"?: Database["public"]['Enums']["consent_status"],"parental_consent_at"?: string | null,"plan"?: Database["public"]['Enums']["student_plan"],"profile_id": string,"school_year"?: string | null,"soft_skills"?: (string)[],"trial_internships"?: NonNullable<Json>
                  }
                  Update: {
                    "ai_notice_accepted_at"?: string | null,"aptitude_tests"?: NonNullable<Json>,"birth_date"?: string,"checkup_frequency_days"?: number,"commune"?: string,"commune_id"?: string | null,"created_at"?: string,"does_volunteering"?: boolean,"first_name"?: string,"grades"?: NonNullable<Json>,"has_moped_license"?: boolean,"interests"?: (string)[],"languages"?: (string)[],"parent_email"?: string | null,"parental_consent"?: Database["public"]['Enums']["consent_status"],"parental_consent_at"?: string | null,"plan"?: Database["public"]['Enums']["student_plan"],"profile_id"?: string,"school_year"?: string | null,"soft_skills"?: (string)[],"trial_internships"?: NonNullable<Json>
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
                    "address": string | null,"commune_id": string,"commune_name": string,"company_name": string,"contact_name": string | null,"created_at": string,"description": string,"id": string,"lat": number,"lng": number,"places_count": number,"profession_code": string,"profession_id": string,"profession_name_de": string,"profession_name_fr": string,"start_date": string,"status": Database["public"]['Enums']["listing_status"],"title": string,"trial_dates": (string)[]
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "company_can_read_document":
{ Args: { "p_path": string }; Returns: boolean
                           },
"create_listing":
{ Args: { "p": Json }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_company_admin":
{ Args: { "p_company": string }; Returns: boolean
                           },
"is_company_member":
{ Args: { "p_company": string }; Returns: boolean
                           },
"is_listing_company_member":
{ Args: { "p_listing": string }; Returns: boolean
                           },
"listing_is_public":
{ Args: { "p_listing": string }; Returns: boolean
                           },
"min_parent_consent_age":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"student_can_apply":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "app_locale": "fr"|"de","application_status": "sent"|"followed_up"|"trial"|"interview"|"offer"|"accepted"|"declined"|"not_this_time"|"waitlist"|"withdrawn","company_plan": "basic"|"pro","company_role": "admin"|"trainer","consent_status": "not_required"|"pending"|"granted","criterion_kind": "required"|"bonus","document_kind": "cv"|"letter"|"video","listing_status": "draft"|"open"|"filled"|"closed","profession_type": "CFC"|"AFP","student_plan": "free"|"plus","user_role": "student"|"company_user"|"parent"|"admin"
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
            "app_locale": ["fr", "de"],"application_status": ["sent", "followed_up", "trial", "interview", "offer", "accepted", "declined", "not_this_time", "waitlist", "withdrawn"],"company_plan": ["basic", "pro"],"company_role": ["admin", "trainer"],"consent_status": ["not_required", "pending", "granted"],"criterion_kind": ["required", "bonus"],"document_kind": ["cv", "letter", "video"],"listing_status": ["draft", "open", "filled", "closed"],"profession_type": ["CFC", "AFP"],"student_plan": ["free", "plus"],"user_role": ["student", "company_user", "parent", "admin"]
          }
        }
} as const
