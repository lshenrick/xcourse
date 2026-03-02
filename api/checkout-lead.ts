import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";

interface VercelRequest extends IncomingMessage {
  body: any;
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
}
interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  json(data: any): VercelResponse;
  send(data: any): VercelResponse;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { real_email, obfuscated_email, name, checkout_slug } = req.body || {};

    if (!real_email || !obfuscated_email || !checkout_slug) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(real_email) || !emailRegex.test(obfuscated_email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("checkout_leads").insert({
      real_email: real_email.toLowerCase().trim(),
      obfuscated_email: obfuscated_email.toLowerCase().trim(),
      name: name?.trim() || null,
      checkout_slug: checkout_slug.trim(),
    });

    if (error) {
      console.error("checkout-lead insert error:", error.message);
      return res.status(500).json({ error: "Failed to save lead" });
    }

    return res.status(200).json({ status: "ok" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("checkout-lead error:", msg);
    return res.status(500).json({ error: "Internal server error" });
  }
}
