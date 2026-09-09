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
  created_at: string;
};

export type EventItem = {
  id: number;
  title: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  type: string;
  created_at: string;
};
