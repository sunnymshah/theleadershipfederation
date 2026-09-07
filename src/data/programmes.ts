/**
 * The federation's hub cities.
 *
 * This file used to also carry hand-written "upcoming conclaves", "round
 * tables" and "past events" arrays. They were placeholders that ended up
 * rendering on the live site — an "Enterprise Leadership Summit, Bengaluru,
 * 14 November 2026" that does not exist, shown above the genuine calendar.
 * Every programme now comes from src/data/editions.ts, which mirrors the real
 * event pages. Do not reintroduce invented events here.
 */

export const HUBS = [
  'Hyderabad',
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Chennai',
  'Delhi NCR',
  'Dubai',
  'Riyadh',
  'Singapore',
  'Kuala Lumpur',
  'London',
  'Amsterdam',
  'Warsaw',
  'New York',
] as const;
