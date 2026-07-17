export interface TeachingRoom {
  id: string;
  name: string;
  building: string | null;
  floor: number | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ScheduleSlot {
  id: string;
  school_id: string;
  teaching_room_id: string;
  class_id: string;
  academic_year_id: string;
  staff_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string | null;
  color: string | null;
  class: { name: string; level: string | null } | null;
  staff: { full_name: string; specialization?: string | null } | null;
}

export interface ScheduleBreak {
  id: string;
  school_id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string | null;
}
