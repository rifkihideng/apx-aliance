export type Member = {
  id: number;
  ign: string;
  role: string;
  pangkat: string | null;
  level: number | null;
  discord: string | null;
  joined_at: string | null;
  active: number;
};

export type Application = {
  id: number;
  ign: string;
  level: number | null;
  discord: string | null;
  alasan: string | null;
  status: string;
  created_at: string;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  /** Slug unik hasil normalisasi judul (dipakai untuk URL). */
  slug?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type EventItem = {
  id: number;
  title: string;
  /** Slug unik hasil normalisasi judul (dipakai untuk URL). */
  slug?: string | null;
  event_date: string;
  event_time: string | null;
  description: string | null;
  type: string;
  created_at: string;
  updated_at?: string | null;
};
