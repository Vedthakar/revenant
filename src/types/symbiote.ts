export type HabitLabel = "good" | "bad" | "neutral" | "pending";

export interface EngineerSummary {
  id: number;
  email: string;
  username: string;
  full_name: string;
  bio: string;
  habit_score: number;
  onboarding_complete: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  engineer: EngineerSummary;
}

export interface AuthUrlResponse {
  auth_url: string;
}

export interface IntegrationStatusItem {
  provider: string;
  connected: boolean;
  connected_at: string | null;
  last_synced: string | null;
  unified_connection_id: string | null;
}

export interface DashboardSummaryResponse {
  habit_score: number;
  good_count: number;
  bad_count: number;
  neutral_count: number;
  connected_integrations: IntegrationStatusItem[];
}

export interface HabitLogItem {
  id: number;
  action_type: string;
  source: string;
  summary: string;
  label: HabitLabel;
  evaluation_notes: string;
  is_promoted: boolean;
  created_at: string;
}

export interface HabitScorePoint {
  date: string;
  score: number;
}

export type AdminEngineerItem = EngineerSummary;

export interface AdminHabitLogItem extends HabitLogItem {
  engineer_id: number;
  engineer_username: string;
  engineer_email: string;
}

export interface TeamMemberItem {
  id: number;
  slack_id: string;
  name: string;
  email: string | null;
  status: "synced" | "invited" | "joined";
  created_at: string;
}
