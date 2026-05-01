export const SCHEDULE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const EDIT_HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
export const PREVIEW_HOURS = Array.from({ length: 10 }, (_, i) => i + 9);

export const SESSION_DURATION_OPTIONS = [30, 45, 60, 90] as const;
export const BUFFER_MINUTES_OPTIONS = [0, 15, 30] as const;
export const ADVANCE_BOOKING_DAY_OPTIONS = [7, 14, 30] as const;
export const CANCELLATION_NOTICE_HOUR_OPTIONS = [24, 48, 72] as const;

export const DEFAULT_SESSION_DURATIONS = [45, 60];
export const DEFAULT_BUFFER_MINUTES = 15;
export const DEFAULT_ADVANCE_BOOKING_DAYS = 14;
export const DEFAULT_CANCELLATION_NOTICE_HOURS = 24;

export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];
export type AvailabilityGrid = Record<ScheduleDay, boolean[]>;
export type AvailabilityBlockInput = {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
};

export function createEmptyAvailabilityGrid(hours = EDIT_HOURS): AvailabilityGrid {
  return Object.fromEntries(
    SCHEDULE_DAYS.map((day) => [day, Array(hours.length).fill(false)])
  ) as AvailabilityGrid;
}

export function dayLabelToDayOfWeek(day: ScheduleDay): number {
  const map: Record<ScheduleDay, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };
  return map[day];
}

export function dayOfWeekToDayLabel(dayOfWeek: number): ScheduleDay {
  const map: Record<number, ScheduleDay> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };
  return map[dayOfWeek] ?? "Mon";
}

export function defaultAvailabilityBlocks(slotMin = 60) {
  return [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    startMin: 9 * 60,
    endMin: 18 * 60,
    slotMin,
  }));
}

export function normalizeSessionDurations(durations?: number[] | null) {
  const valid = (durations ?? []).filter((duration): duration is number =>
    SESSION_DURATION_OPTIONS.includes(duration as (typeof SESSION_DURATION_OPTIONS)[number])
  );

  return Array.from(new Set(valid)).sort((a, b) => a - b).length > 0
    ? Array.from(new Set(valid)).sort((a, b) => a - b)
    : [...DEFAULT_SESSION_DURATIONS];
}

export function labelForBufferMinutes(minutes: number) {
  return minutes === 0 ? "No buffer" : `${minutes} min`;
}

export function labelForAdvanceBookingDays(days: number) {
  if (days === 7) return "Up to 1 week";
  if (days === 14) return "Up to 2 weeks";
  if (days === 30) return "Up to 1 month";
  return `Up to ${days} days`;
}

export function labelForCancellationNoticeHours(hours: number) {
  return `${hours} hours notice`;
}

export function availabilityBlocksToGrid(
  blocks: AvailabilityBlockInput[],
  hours = EDIT_HOURS
): AvailabilityGrid {
  const grid = createEmptyAvailabilityGrid(hours);

  for (const block of blocks) {
    const day = dayOfWeekToDayLabel(block.dayOfWeek);
    hours.forEach((hour, index) => {
      const hourStart = hour * 60;
      const hourEnd = hourStart + 60;
      if (hourStart < block.endMin && hourEnd > block.startMin) {
        grid[day][index] = true;
      }
    });
  }

  return grid;
}

export function gridToAvailabilityBlocks(
  grid: AvailabilityGrid,
  hours = EDIT_HOURS,
  slotMin = 60
) {
  const blocks: Array<AvailabilityBlockInput & { slotMin: number }> = [];

  for (const day of SCHEDULE_DAYS) {
    let runStart: number | null = null;

    for (let index = 0; index <= hours.length; index += 1) {
      const isActive = index < hours.length ? grid[day][index] : false;

      if (isActive && runStart === null) {
        runStart = index;
      }

      if (!isActive && runStart !== null) {
        const startHour = hours[runStart];
        const endHour = hours[index - 1] + 1;
        blocks.push({
          dayOfWeek: dayLabelToDayOfWeek(day),
          startMin: startHour * 60,
          endMin: endHour * 60,
          slotMin,
        });
        runStart = null;
      }
    }
  }

  return blocks;
}
