export type Settings = {
  hardMode: boolean;
  notifications: boolean;
  dailyGoalMinutes: number;
  allowMinutes: number;
  rapidSwitchThreshold: number;
  rapidSwitchWindowMs: number;
  siteRules: Record<string, "block" | "ask" | "allow">;
  pomodoro: { enabled: boolean; focusMin: number; breakMin: number };
};
export type Day = {
  focusSeconds: number;
  tabSwitches: number;
  interruptions: number;
  byHost: Record<string, number>;
};
export type Session = {
  start: number;
  end: number;
  focusSeconds: number;
  intent?: string;
};
export type Status = {
  success?: boolean;
  error?: string;
  extensionVersion?: string;
  isSessionActive: boolean;
  sessionStartMs?: number;
  sessionIntent: string;
  phase: string;
  phaseEndsAt?: number;
  today: Day;
  days: Record<string, Day>;
  sessions: Session[];
  settings: Settings;
  goalProgress: number;
};
export { type SiteAudit, checkUrl } from "./url-check.mjs";
import type { SiteAudit } from "./url-check.mjs";
export function finite(value: unknown, fallback?: number): number;
export function duration(seconds: unknown): string;
export function normalizeStatus(data?: unknown): Status;
export function week(
  days?: Record<string, Day>,
  now?: number,
): { key: string; label: string; seconds: number }[];
export function csvHistory(data: Partial<Status>): string;
export function auditUrl(input: string): SiteAudit;
export function downloadText(text: string, name: string, type: string): void;
