import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";
import { buildEmailHtml, getEmailI18n } from "../lib/email-i18n";

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
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Resend email sending
async function sendEmail(
  resendApiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth — caller must be authenticated admin
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = getSupabase();
  const token = authHeader.replace("Bearer ", "");

  // Verify the user is authenticated
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Verify user is admin (roles are in user_roles table)
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const roles = (userRoles || []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return res.status(403).json({ error: "Forbidden - admin only" });
  }

  // Extract body
  const { email, name, area_slug } = req.body || {};

  if (!email || !area_slug) {
    return res.status(400).json({ error: "Missing email or area_slug" });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  }

  try {
    // Get integration settings for the area
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("area_slug", area_slug)
      .maybeSingle();

    // Get area info (including language)
    const { data: areaInfo } = await supabase
      .from("member_areas")
      .select("title, slug, lang_code")
      .eq("slug", area_slug)
      .single();

    if (!areaInfo) {
      return res.status(404).json({ error: "Area not found" });
    }

    const courseName = areaInfo.title || area_slug;
    const lang = (areaInfo as any)?.lang_code || "pt";
    const emailI18n = getEmailI18n(lang);
    const host = req.headers["x-forwarded-host"] || req.headers.host || "xmembers.app";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const accessLink = `${proto}://${host}/${area_slug}`;

    // Build subject from template (fallback to language-specific default)
    const subjectTemplate = settings?.email_subject_template || emailI18n.defaultSubject;
    const subject = subjectTemplate
      .replace(/\{name\}/g, name || "")
      .replace(/\{course_name\}/g, courseName)
      .replace(/\{email\}/g, email);

    // Build body from template (fallback to language-specific default)
    const bodyTemplate = settings?.email_body_template || emailI18n.defaultBody;

    const bodyHtml = buildEmailHtml(bodyTemplate, {
      name: name || emailI18n.fallbackName,
      course_name: courseName,
      access_link: accessLink,
      email: email,
    }, lang);

    const fromEmail = settings?.email_from || "noreply@xmembers.app";

    await sendEmail(RESEND_API_KEY, fromEmail, email, subject, bodyHtml);

    return res.status(200).json({ status: "ok", message: "Email sent successfully" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Send welcome email error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
