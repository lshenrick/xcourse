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

// Build email HTML from template
function buildEmailHtml(
  template: string,
  vars: Record<string, string>
): string {
  let html = template;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  // Wrap in styled HTML
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#18181b;padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">🎉 Acesso Liberado!</h1>
    </div>
    <div style="padding:32px 24px;color:#27272a;font-size:15px;line-height:1.7;">
      ${html}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="color:#a1a1aa;font-size:12px;margin:0;">Enviado automaticamente pelo sistema</p>
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

  const supabase = getSupabase();
  const payload = req.body;

  // Log the raw webhook
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
    // Extract Hotmart data (v2.0.0 payload)
    const event = payload?.event;
    const buyerEmail = payload?.data?.buyer?.email;
    const buyerName = payload?.data?.buyer?.name;
    const productId = payload?.data?.product?.id?.toString();
    const transaction = payload?.data?.purchase?.transaction;

    // Validate required fields
    if (!event || !buyerEmail || !productId) {
      await supabase.from("webhook_logs").insert({
        ...logEntry,
        status: "error",
        error_message: "Missing required fields: event, buyer.email, or product.id",
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find which area this product belongs to
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

    // Verify hottok for each area
    const hottok = req.headers["x-hotmart-hottok"] as string;

    // Process for each mapped area
    for (const mapping of productMapping) {
      const areaSlug = mapping.area_slug;

      // Check integration settings
      const { data: settings } = await supabase
        .from("integration_settings")
        .select("*")
        .eq("area_slug", areaSlug)
        .single();

      // Verify hottok if configured
      if (settings?.hottok && hottok !== settings.hottok) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "error",
          error_message: "Invalid hottok token",
        });
        continue;
      }

      // Check if webhook is enabled
      if (settings && !settings.webhook_enabled) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "ignored",
          error_message: "Webhook disabled for this area",
        });
        continue;
      }

      // Handle different events
      if (event === "PURCHASE_APPROVED" || event === "PURCHASE_COMPLETE") {
        // Upsert authorized buyer
        const { error: buyerError } = await supabase
          .from("authorized_buyers")
          .upsert(
            {
              email: buyerEmail.toLowerCase().trim(),
              name: buyerName || null,
              area_slug: areaSlug,
              hotmart_transaction: transaction || null,
              hotmart_product_id: productId,
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email,area_slug", ignoreDuplicates: false }
          );

        if (buyerError) {
          // Try insert if upsert fails (unique constraint on lower(email))
          const { error: insertError } = await supabase
            .from("authorized_buyers")
            .insert({
              email: buyerEmail.toLowerCase().trim(),
              name: buyerName || null,
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

        // Send welcome email if enabled
        if (settings?.email_enabled && settings?.resend_api_key) {
          try {
            // Get area info for email
            const { data: areaInfo } = await supabase
              .from("member_areas")
              .select("title, slug")
              .eq("slug", areaSlug)
              .single();

            const courseName = areaInfo?.title || areaSlug;
            const accessLink = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/${areaSlug}`;

            const subject = (settings.email_subject_template || "Seu acesso está liberado!")
              .replace(/\{name\}/g, buyerName || "")
              .replace(/\{course_name\}/g, courseName)
              .replace(/\{email\}/g, buyerEmail);

            const bodyHtml = buildEmailHtml(
              settings.email_body_template || "Olá {name}, seu acesso ao curso {course_name} está liberado!<br><br><a href=\"{access_link}\">Clique aqui para acessar</a>",
              {
                name: buyerName || "Aluno(a)",
                course_name: courseName,
                access_link: accessLink,
                email: buyerEmail,
              }
            );

            await sendEmail(
              settings.resend_api_key,
              settings.email_from || "noreply@xmembers.app",
              buyerEmail,
              subject,
              bodyHtml
            );
          } catch (emailErr: unknown) {
            const errorMessage = emailErr instanceof Error ? emailErr.message : "Unknown email error";
            // Log email error but don't fail the webhook
            await supabase.from("webhook_logs").insert({
              ...logEntry,
              area_slug: areaSlug,
              status: "processed",
              error_message: `Buyer authorized, but email failed: ${errorMessage}`,
            });
            continue;
          }
        }

        // Log success
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "processed",
        });
      } else if (event === "PURCHASE_REFUNDED" || event === "PURCHASE_CHARGEBACK") {
        // Revoke access
        await supabase
          .from("authorized_buyers")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("email", buyerEmail.toLowerCase().trim())
          .eq("area_slug", areaSlug);

        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: areaSlug,
          status: "processed",
        });
      } else {
        // Log other events
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
