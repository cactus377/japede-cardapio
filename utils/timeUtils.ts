
import { OpeningHours, ParsedOpeningHours, ParsedOpeningHoursEntry } from '../types';

/**
 * Parses HH:MM string to minutes from midnight.
 */
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Parses the OpeningHours from settings into a more usable format with minutes from midnight.
 */
export const parseOpeningHours = (openingHours: OpeningHours): ParsedOpeningHours => {
  const parsed: any = {};
  for (const day in openingHours) {
    const entry = openingHours[day as keyof OpeningHours];
    parsed[day] = {
      openMinutes: timeToMinutes(entry.open),
      closeMinutes: timeToMinutes(entry.close),
      enabled: entry.enabled,
    } as ParsedOpeningHoursEntry;
  }
  return parsed as ParsedOpeningHours;
};

/**
 * Checks if the store is currently open based on parsed opening hours.
 * For simplicity, this version uses the user's browser local time.
 * A more robust solution would involve handling the store's specific timezone.
 * @param parsedHours Parsed opening hours.
 * @param storeTimezone Optional: IANA timezone string for the store (e.g., 'America/Sao_Paulo'). Not fully implemented here for simplicity.
 * @returns True if the store is open, false otherwise.
 */
export const isStoreOpen = (
  parsedHours: ParsedOpeningHours | undefined,
  storeTimezone?: string // Timezone handling is complex and not fully implemented here for brevity
): boolean => {
  if (!parsedHours) {
    return false; // Assume closed if hours are not defined
  }

  const now = new Date();
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We need to map this to our day keys ('sunday', 'monday', ...)
  const dayMapping: (keyof OpeningHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayKey = dayMapping[now.getDay()];
  
  const todayHours = parsedHours[currentDayKey];

  if (!todayHours || !todayHours.enabled) {
    return false; // Closed today or hours not defined for today
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Handle overnight hours (e.g., open 22:00, close 02:00)
  if (todayHours.openMinutes > todayHours.closeMinutes) {
    // Store is open overnight. Check if current time is:
    // 1. After open time today (e.g., current 23:00, open 22:00)
    // OR
    // 2. Before close time tomorrow (relative to today, e.g., current 01:00, close 02:00)
    return currentMinutes >= todayHours.openMinutes || currentMinutes < todayHours.closeMinutes;
  } else {
    // Standard same-day hours
    return currentMinutes >= todayHours.openMinutes && currentMinutes < todayHours.closeMinutes;
  }
};
