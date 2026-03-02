import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";

// Vercel serverless types (inline to avoid dependency)
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

// ─── Email translations (inline, no external imports) ───

const BTN = 'display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;';

const emailI18n: Record<string, { headerTitle: string; footerText: string; defaultSubject: string; defaultBody: string; fallbackName: string }> = {
  pt: {
    headerTitle: "Acesso Liberado!",
    footerText: "Este email foi enviado automaticamente. Não é necessário responder.",
    defaultSubject: "Seu acesso ao curso está liberado!",
    defaultBody: `Olá {name},<br><br>Seu acesso ao curso <strong>{course_name}</strong> está liberado!<br><br><a href="{access_link}" style="${BTN}">Acessar Curso</a><br><br>Use o email <strong>{email}</strong> para fazer login.<br><br>Bons estudos!`,
    fallbackName: "Aluno(a)",
  },
  en: {
    headerTitle: "Access Granted!",
    footerText: "This email was sent automatically. No reply needed.",
    defaultSubject: "Your course access is ready!",
    defaultBody: `Hi {name},<br><br>Your access to <strong>{course_name}</strong> is now available!<br><br><a href="{access_link}" style="${BTN}">Access Course</a><br><br>Use the email <strong>{email}</strong> to sign in.<br><br>Happy learning!`,
    fallbackName: "Student",
  },
  es: {
    headerTitle: "¡Acceso Liberado!",
    footerText: "Este correo fue enviado automáticamente. No es necesario responder.",
    defaultSubject: "¡Tu acceso al curso está listo!",
    defaultBody: `Hola {name},<br><br>¡Tu acceso a <strong>{course_name}</strong> está disponible!<br><br><a href="{access_link}" style="${BTN}">Acceder al Curso</a><br><br>Usa el email <strong>{email}</strong> para iniciar sesión.<br><br>¡Buenos estudios!`,
    fallbackName: "Estudiante",
  },
  de: {
    headerTitle: "Zugang Freigeschaltet!",
    footerText: "Diese E-Mail wurde automatisch gesendet. Keine Antwort erforderlich.",
    defaultSubject: "Dein Kurszugang ist freigeschaltet!",
    defaultBody: `Hallo {name},<br><br>Dein Zugang zu <strong>{course_name}</strong> ist jetzt verfügbar!<br><br><a href="{access_link}" style="${BTN}">Kurs Zugreifen</a><br><br>Verwende die E-Mail <strong>{email}</strong> zum Anmelden.<br><br>Viel Erfolg beim Lernen!`,
    fallbackName: "Teilnehmer(in)",
  },
  fr: {
    headerTitle: "Accès Activé !",
    footerText: "Cet email a été envoyé automatiquement. Aucune réponse nécessaire.",
    defaultSubject: "Votre accès au cours est prêt !",
    defaultBody: `Bonjour {name},<br><br>Votre accès à <strong>{course_name}</strong> est maintenant disponible !<br><br><a href="{access_link}" style="${BTN}">Accéder au Cours</a><br><br>Utilisez l'email <strong>{email}</strong> pour vous connecter.<br><br>Bon apprentissage !`,
    fallbackName: "Étudiant(e)",
  },
  it: {
    headerTitle: "Accesso Attivato!",
    footerText: "Questa email è stata inviata automaticamente. Non è necessario rispondere.",
    defaultSubject: "Il tuo accesso al corso è pronto!",
    defaultBody: `Ciao {name},<br><br>Il tuo accesso a <strong>{course_name}</strong> è ora disponibile!<br><br><a href="{access_link}" style="${BTN}">Accedi al Corso</a><br><br>Usa l'email <strong>{email}</strong> per accedere.<br><br>Buono studio!`,
    fallbackName: "Studente",
  },
};

function getLang(lang: string) {
  return emailI18n[lang] || emailI18n.pt;
}

function buildEmailHtml(template: string, vars: Record<string, string>, lang: string = "pt"): string {
  const t = getLang(lang);
  let html = template;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  const courseName = vars.course_name || "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:linear-gradient(180deg,#f5f3ff 0%,#f4f4f5 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#18181b 0%,#27272a 100%);padding:40px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(124,58,237,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;line-height:64px;">🎉</span>
      </div>
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;font-weight:700;">${t.headerTitle}</h1>
      <p style="color:#a1a1aa;font-size:14px;margin:0;">${courseName}</p>
    </div>
    <div style="padding:36px 32px;color:#27272a;font-size:15px;line-height:1.7;">
      ${html}
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="color:#a1a1aa;font-size:12px;margin:0;">${t.footerText}</p>
      <p style="color:#d4d4d8;font-size:11px;margin:8px 0 0;">Powered by xmembers.app</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Resend email sending ───

async function sendEmail(resendApiKey: string, from: string, to: string, subject: string, html: string) {
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

// ─── Resolve real email from checkout_leads ───

async function resolveRealEmail(
  supabase: ReturnType<typeof getSupabase>,
  webhookEmail: string
): Promise<{ realEmail: string; realName: string | null } | null> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const normalizedEmail = webhookEmail.toLowerCase().trim();

  // Step 1: Try matching by obfuscated_email (normal case - customer didn't change email on Hotmart)
  const { data: byObfuscated } = await supabase
    .from("checkout_leads")
    .select("id, real_email, name")
    .eq("obfuscated_email", normalizedEmail)
    .eq("status", "pending")
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(1);

  if (byObfuscated && byObfuscated.length > 0) {
    const lead = byObfuscated[0];
    await supabase.from("checkout_leads").update({ status: "matched" }).eq("id", lead.id);
    return { realEmail: lead.real_email, realName: lead.name };
  }

  // Step 2: Try matching by real_email (customer corrected email on Hotmart)
  const { data: byReal } = await supabase
    .from("checkout_leads")
    .select("id, real_email, name")
    .eq("real_email", normalizedEmail)
    .eq("status", "pending")
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(1);

  if (byReal && byReal.length > 0) {
    const lead = byReal[0];
    await supabase.from("checkout_leads").update({ status: "matched" }).eq("id", lead.id);
    return { realEmail: lead.real_email, realName: lead.name };
  }

  // No match found - will use webhook email as-is
  return null;
}

// ─── Handler ───

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = getSupabase();
  const payload = req.body;

  const logEntry = {
    event_type: payload?.event || "unknown",
    buyer_email: payload?.data?.buyer?.email || null,
    buyer_name: payload?.data?.buyer?.name || null,
    product_id: payload?.data?.product?.id?.toString() || null,
    transaction_id: payload?.data?.purchase?.transaction || null,
    raw_payload: payload,
    status: "received" as const,
  };

  try {
    const event = payload?.event;
    const buyerEmail = payload?.data?.buyer?.email;
    const buyerName = payload?.data?.buyer?.name;
    const productId = payload?.data?.product?.id?.toString();
    const transaction = payload?.data?.purchase?.transaction;

    if (!event || !buyerEmail || !productId) {
      await supabase.from("webhook_logs").insert({
        ...logEntry,
        status: "error",
        error_message: "Missing required fields: event, buyer.email, or product.id",
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: productMapping } = await supabase
      .from("hotmart_products")
      .select("area_slug, product_name")
      .eq("product_id", productId);

    if (!productMapping || productMapping.length === 0) {
      await supabase.from("webhook_logs").insert({
        ...logEntry,
        status: "ignored",
        error_message: `Product ${productId} not mapped to any area`,
      });
      return res.status(200).json({ status: "ignored", reason: "Product not mapped" });
    }

    const hottok = req.headers["x-hotmart-hottok"] as string;

    for (const mapping of productMapping) {
      const areaSlug = mapping.area_slug;

      const { data: settings } = await supabase
        .from("integration_settings")
        .select("*")
        .eq("area_slug", areaSlug)
        .single();

      if (settings?.hottok && hottok !== settings.hottok) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "error",
          error_message: "Invalid hottok token",
        });
        continue;
      }

      if (settings && !settings.webhook_enabled) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "ignored",
          error_message: "Webhook disabled for this area",
        });
        continue;
      }

      if (event === "PURCHASE_APPROVED" || event === "PURCHASE_COMPLETE") {
        // Resolve real email from checkout_leads
        const resolved = await resolveRealEmail(supabase, buyerEmail);
        const finalEmail = resolved?.realEmail || buyerEmail;
        const finalName = resolved?.realName || buyerName;

        const { error: buyerError } = await supabase
          .from("authorized_buyers")
          .upsert(
            {
              email: finalEmail.toLowerCase().trim(),
              name: finalName || null,
              area_slug: areaSlug,
              hotmart_transaction: transaction || null,
              hotmart_product_id: productId,
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email,area_slug", ignoreDuplicates: false }
          );

        if (buyerError) {
          const { error: insertError } = await supabase
            .from("authorized_buyers")
            .insert({
              email: finalEmail.toLowerCase().trim(),
              name: finalName || null,
              area_slug: areaSlug,
              hotmart_transaction: transaction || null,
              hotmart_product_id: productId,
              status: "active",
            });

          if (insertError && !insertError.message.includes("duplicate")) {
            await supabase.from("webhook_logs").insert({
              ...logEntry,
              area_slug: areaSlug,
              status: "error",
              error_message: `DB error: ${insertError.message}`,
            });
            continue;
          }
        }

        if (settings?.email_enabled && RESEND_API_KEY) {
          try {
            const { data: areaInfo } = await supabase
              .from("member_areas")
              .select("title, slug, lang_code")
              .eq("slug", areaSlug)
              .single();

            const courseName = areaInfo?.title || areaSlug;
            const lang = (areaInfo as any)?.lang_code || "pt";
            const t = getLang(lang);
            const accessLink = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/${areaSlug}`;

            const subject = (settings.email_subject_template || t.defaultSubject)
              .replace(/\{name\}/g, finalName || "")
              .replace(/\{course_name\}/g, courseName)
              .replace(/\{email\}/g, finalEmail);

            const bodyHtml = buildEmailHtml(
              settings.email_body_template || t.defaultBody,
              {
                name: finalName || t.fallbackName,
                course_name: courseName,
                access_link: accessLink,
                email: finalEmail,
              },
              lang
            );

            await sendEmail(
              RESEND_API_KEY,
              settings.email_from || "noreply@xmembers.app",
              finalEmail,
              subject,
              bodyHtml
            );
          } catch (emailErr: unknown) {
            const errorMessage = emailErr instanceof Error ? emailErr.message : "Unknown email error";
            await supabase.from("webhook_logs").insert({
              ...logEntry,
              area_slug: areaSlug,
              status: "processed",
              error_message: `Buyer authorized, but email failed: ${errorMessage}`,
            });
            continue;
          }
        }

        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "processed",
          error_message: resolved
            ? `Resolved real email: ${finalEmail} (from webhook: ${buyerEmail})`
            : null,
        });
      } else if (event === "PURCHASE_REFUNDED" || event === "PURCHASE_CHARGEBACK") {
        // Resolve real email for refunds too
        const resolved = await resolveRealEmail(supabase, buyerEmail);
        const finalEmail = resolved?.realEmail || buyerEmail;

        await supabase
          .from("authorized_buyers")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("email", finalEmail.toLowerCase().trim())
          .eq("area_slug", areaSlug);

        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "processed",
        });
      } else {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "ignored",
          error_message: `Event ${event} not handled`,
        });
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("webhook_logs").insert({
      ...logEntry,
      status: "error",
      error_message: errorMessage,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
}
