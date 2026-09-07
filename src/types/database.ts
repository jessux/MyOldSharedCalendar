export type MemberRole = "admin" | "member" | "viewer";
export type EventCategory =
  | "famille"
  | "ecole"
  | "travail"
  | "sante"
  | "loisirs"
  | "autre";

export type Profile = {
  id: string;
  display_name: string;
  avatar_emoji: string;
  created_at: string;
};

export type Household = {
  id: string;
  name: string;
  timezone: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
};

export type HouseholdMember = {
  household_id: string;
  user_id: string;
  role: MemberRole;
  color: string;
  joined_at: string;
  profile?: Profile;
};

export type Calendar = {
  id: string;
  household_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  calendar_id: string;
  household_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  category: EventCategory;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  recurrence_rule: string | null;
  color_override: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; display_name: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      households: {
        Row: Household;
        Insert: Partial<Household> & { name: string };
        Update: Partial<Household>;
        Relationships: [];
      };
      household_members: {
        Row: HouseholdMember;
        Insert: Partial<HouseholdMember> & {
          household_id: string;
          user_id: string;
        };
        Update: Partial<HouseholdMember>;
        Relationships: [];
      };
      calendars: {
        Row: Calendar;
        Insert: Partial<Calendar> & { household_id: string };
        Update: Partial<Calendar>;
        Relationships: [];
      };
      events: {
        Row: CalendarEvent;
        Insert: Partial<CalendarEvent> & {
          calendar_id: string;
          household_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<CalendarEvent>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}
