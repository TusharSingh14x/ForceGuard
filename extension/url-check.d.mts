export type SiteAudit = {
  host: string; encrypted: boolean; flags: { level: string; text: string }[];
  assessment: string; level: string; internal: boolean;
  metrics: { length: number; labels: number; pathSegments: number };
  model?: {
    status: string; summary: string; detail: string;
    lower?: number; upper?: number; observed?: number; total?: number; trees?: number;
  };
};
export function auditUrl(input: string): SiteAudit;
export function checkUrl(input: string): Promise<SiteAudit>;
