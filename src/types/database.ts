export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  follower_count?: number;
  created_at: string;
};

export type MidiFile = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  filename: string;
  storage_path: string;
  tags: string[];
  tone: string | null;
  license: string;
  plays: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "username" | "avatar_url"> | null;
};

export type Comment = {
  id: string;
  midi_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, "username" | "avatar_url"> | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Omit<Profile, "id" | "created_at">> };
      profile_follows: { Row: { id: string; profile_id: string; follower_id: string; created_at: string }; Insert: { profile_id: string; follower_id: string }; Update: never };
      midi_files: { Row: MidiFile; Insert: Omit<MidiFile, "id" | "created_at" | "updated_at" | "plays" | "downloads" | "profiles">; Update: Partial<Pick<MidiFile, "title" | "description" | "tags" | "tone" | "license" | "plays" | "downloads">> };
      comments: { Row: Comment; Insert: Omit<Comment, "id" | "created_at" | "profiles">; Update: never };
      likes: { Row: { id: string; midi_id: string; user_id: string; created_at: string }; Insert: { midi_id: string; user_id: string }; Update: never };
      reports: { Row: { id: string; reporter_id: string; midi_id: string | null; comment_id: string | null; reason: ReportReason; details: string | null; description: string | null; status: "open" | "reviewed" | "dismissed"; created_at: string }; Insert: { reporter_id: string; midi_id?: string; comment_id?: string; reason: ReportReason; details?: string | null; description?: string | null }; Update: { status?: "open" | "reviewed" | "dismissed" } };
    };
  };
};

export type ReportReason = "copyright" | "inappropriate" | "spam" | "other";