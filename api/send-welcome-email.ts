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
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Resend email sending (same as hotmart webhook)
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

// Build email HTML from template (same as hotmart webhook)
function buildEmailHtml(
  template: string,
  vars: Record<string, string>
): string {
  let html = template;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  const courseName = vars.course_name || "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:linear-gradient(180deg,#f5f3ff 0%,#f4f4f5 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#18181b 0%,#27272a 100%);padding:40px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(124,58,237,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;line-height:64px;">🎉</span>
      </div>
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;font-weight:700;">Acesso Liberado!</h1>
      <p style="color:#a1a1aa;font-size:14px;margin:0;">${courseName}</p>
    </div>
    <div style="padding:36px 32px;color:#27272a;font-size:15px;line-height:1.7;">
      ${html}
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="color:#a1a1aa;font-size:12px;margin:0;">Este email foi enviado automaticamente. Não é necessário responder.</p>
      <p style="color:#d4d4d8;font-size:11px;margin:8px 0 0;">Powered by xmembers.app</p>
    </div>
  </div>
</body>
</html>`;
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

    // Get area info
    const { data: areaInfo } = await supabase
      .from("member_areas")
      .select("title, slug")
      .eq("slug", area_slug)
      .single();

    if (!areaInfo) {
      return res.status(404).json({ error: "Area not found" });
    }

    const courseName = areaInfo.title || area_slug;
    const host = req.headers["x-forwarded-host"] || req.headers.host || "xmembers.app";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const accessLink = `${proto}://${host}/${area_slug}`;

    // Build subject from template
    const subjectTemplate = settings?.email_subject_template || "Seu acesso ao curso está liberado!";
    const subject = subjectTemplate
      .replace(/\{name\}/g, name || "")
      .replace(/\{course_name\}/g, courseName)
      .replace(/\{email\}/g, email);

    // Build body from template
    const bodyTemplate = settings?.email_body_template ||
      'Olá {name},<br><br>Seu acesso ao curso <strong>{course_name}</strong> está liberado!<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Acessar Curso</a><br><br>Use o email <strong>{email}</strong> para fazer login.<br><br>Bons estudos!';

    const bodyHtml = buildEmailHtml(bodyTemplate, {
      name: name || "Aluno(a)",
      course_name: courseName,
      access_link: accessLink,
      email: email,
    });

    const fromEmail = settings?.email_from || "noreply@xmembers.app";

    await sendEmail(RESEND_API_KEY, fromEmail, email, subject, bodyHtml);

    return res.status(200).json({ status: "ok", message: "Email sent successfully" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Send welcome email error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
