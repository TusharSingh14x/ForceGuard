import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
// The extension product and downloads work without Supabase.
export const config = { matcher: ["/protected/:path*", "/auth/:path*"] };
