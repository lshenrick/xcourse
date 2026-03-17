import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

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

function getStripe(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: "2025-03-31.basil" as any });
}

// ─── Email translations (same as hotmart webhook) ───

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

// ─── Collect raw body for signature verification ───

export const config = {
  api: { bodyParser: false },
};

function getRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ─── Shared: authorize buyer + send email ───

async function processAuthorizedBuyer(
  supabase: ReturnType<typeof getSupabase>,
  stripe: Stripe,
  req: VercelRequest,
  areaSlug: string,
  email: string,
  name: string | null,
  customerId: string | null,
  subscriptionId: string | null,
  logEntry: Record<string, any>,
  paymentType?: string
) {
  // Check integration_settings for this area
  const { data: settings } = await supabase
    .from("integration_settings")
    .select("*")
    .eq("area_slug", areaSlug)
    .single();

  if (settings && !settings.webhook_enabled) {
    await supabase.from("webhook_logs").insert({
      ...logEntry,
      area_slug: areaSlug,
      status: "ignored",
      error_message: "Webhook disabled for this area",
    });
    return;
  }

  // Create authorized buyer
  const { error: buyerError } = await supabase
    .from("authorized_buyers")
    .upsert(
      {
        email,
        name: name || null,
        area_slug: areaSlug,
        payment_provider: "stripe",
        stripe_customer_id: customerId || null,
        stripe_subscription_id: subscriptionId || null,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email,area_slug", ignoreDuplicates: false }
    );

  if (buyerError) {
    const { error: insertError } = await supabase.from("authorized_buyers").insert({
      email,
      name: name || null,
      area_slug: areaSlug,
      payment_provider: "stripe",
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      status: "active",
    });
    if (insertError && !insertError.message.includes("duplicate")) {
      await supabase.from("webhook_logs").insert({
        ...logEntry,
        area_slug: areaSlug,
        status: "error",
        error_message: `DB error: ${insertError.message}`,
      });
      return;
    }
  }

  // If subscription, track it
  if (subscriptionId && paymentType === "recurring") {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    await supabase.from("subscriptions").upsert(
      {
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId || "",
        email,
        area_slug: areaSlug,
        status: "active",
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id", ignoreDuplicates: false }
    );
  }

  // Send welcome email
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
        .replace(/\{name\}/g, name || "")
        .replace(/\{course_name\}/g, courseName)
        .replace(/\{email\}/g, email);

      const bodyHtml = buildEmailHtml(
        settings.email_body_template || t.defaultBody,
        {
          name: name || t.fallbackName,
          course_name: courseName,
          access_link: accessLink,
          email,
        },
        lang
      );

      await sendEmail(
        RESEND_API_KEY,
        settings.email_from || "noreply@xmembers.app",
        email,
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
      return;
    }
  }

  await supabase.from("webhook_logs").insert({
    ...logEntry,
    area_slug: areaSlug,
    status: "processed",
  });
}

// ─── Handler ───

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = getSupabase();

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  // Fetch all areas that have a stripe_webhook_secret configured
  const { data: allSettings } = await supabase
    .from("integration_settings")
    .select("area_slug, stripe_webhook_secret, stripe_secret_key")
    .not("stripe_webhook_secret", "is", null);

  if (!allSettings || allSettings.length === 0) {
    return res.status(500).json({ error: "No Stripe webhook secrets configured in any area" });
  }

  // Try each webhook secret to verify the signature
  let event: Stripe.Event | null = null;
  let matchedSecretKey: string | null = null;
  let matchedWebhookSecret: string | null = null;

  // Deduplicate by webhook_secret to avoid redundant attempts
  const uniqueSecrets = new Map<string, string>();
  for (const s of allSettings) {
    if (s.stripe_webhook_secret && s.stripe_secret_key) {
      uniqueSecrets.set(s.stripe_webhook_secret, s.stripe_secret_key);
    }
  }

  for (const [webhookSecret, secretKey] of uniqueSecrets) {
    try {
      const tempStripe = getStripe(secretKey);
      event = tempStripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      matchedSecretKey = secretKey;
      matchedWebhookSecret = webhookSecret;
      break;
    } catch {
      // Signature didn't match this secret, try next
    }
  }

  if (!event || !matchedSecretKey || !matchedWebhookSecret) {
    return res.status(400).json({ error: "Webhook signature verification failed: no matching secret found" });
  }

  // Find all areas that share this webhook secret (same Stripe account)
  const matchedAreaSlugs = allSettings
    .filter(s => s.stripe_webhook_secret === matchedWebhookSecret)
    .map(s => s.area_slug);

  const stripe = getStripe(matchedSecretKey);

  const logEntry = {
    event_type: event.type,
    buyer_email: null as string | null,
    buyer_name: null as string | null,
    product_id: null as string | null,
    transaction_id: null as string | null,
    raw_payload: event.data.object as any,
    status: "received" as string,
  };

  try {
    // ─── checkout.session.completed ───
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || null;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;

      logEntry.buyer_email = customerEmail;
      logEntry.buyer_name = customerName;
      logEntry.transaction_id = session.id;

      if (!customerEmail) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          status: "error",
          error_message: "No customer email in checkout session",
        });
        return res.status(200).json({ status: "error", reason: "No email" });
      }

      // Get line items to resolve area_slug via stripe_products
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      const priceIds = lineItems.data.map((item) => item.price?.id).filter(Boolean) as string[];

      logEntry.product_id = priceIds.join(",");

      if (priceIds.length === 0) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          status: "error",
          error_message: "No price IDs found in checkout session line items",
        });
        return res.status(200).json({ status: "error", reason: "No price IDs" });
      }

      // Find matching stripe_products
      const { data: productMappings } = await supabase
        .from("stripe_products")
        .select("area_slug, product_name, payment_type, price_id")
        .in("price_id", priceIds);

      if (!productMappings || productMappings.length === 0) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          status: "ignored",
          error_message: `Price IDs ${priceIds.join(",")} not mapped to any area`,
        });
        return res.status(200).json({ status: "ignored", reason: "Price not mapped" });
      }

      const finalEmail = customerEmail.toLowerCase().trim();
      for (const mapping of productMappings) {
        await processAuthorizedBuyer(supabase, stripe, req, mapping.area_slug, finalEmail, customerName, customerId, subscriptionId, logEntry, mapping.payment_type);
      }

      return res.status(200).json({ status: "ok" });
    }

    // ─── customer.subscription.updated ───
    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const subId = sub.id;
      const status = sub.status; // active, past_due, canceled, unpaid, etc.

      const mappedStatus = ["active", "past_due", "canceled", "unpaid"].includes(status)
        ? status
        : status === "trialing" ? "active" : "canceled";

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id, email, area_slug")
        .eq("stripe_subscription_id", subId)
        .maybeSingle();

      if (existing) {
        await supabase.from("subscriptions").update({
          status: mappedStatus,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);

        // If canceled or unpaid, revoke access
        if (mappedStatus === "canceled" || mappedStatus === "unpaid") {
          await supabase
            .from("authorized_buyers")
            .update({ status: "revoked", updated_at: new Date().toISOString() })
            .eq("email", existing.email)
            .eq("area_slug", existing.area_slug)
            .eq("payment_provider", "stripe");
        }
        // If reactivated, restore access
        if (mappedStatus === "active") {
          await supabase
            .from("authorized_buyers")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("email", existing.email)
            .eq("area_slug", existing.area_slug)
            .eq("payment_provider", "stripe");
        }

        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: existing.area_slug,
          buyer_email: existing.email,
          status: "processed",
          error_message: `Subscription ${subId} updated to ${mappedStatus}`,
        });
      } else {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          status: "ignored",
          error_message: `Subscription ${subId} not found in database`,
        });
      }

      return res.status(200).json({ status: "ok" });
    }

    // ─── customer.subscription.deleted ───
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const subId = sub.id;

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id, email, area_slug")
        .eq("stripe_subscription_id", subId)
        .maybeSingle();

      if (existing) {
        await supabase.from("subscriptions").update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);

        await supabase
          .from("authorized_buyers")
          .update({ status: "revoked", updated_at: new Date().toISOString() })
          .eq("email", existing.email)
          .eq("area_slug", existing.area_slug)
          .eq("payment_provider", "stripe");

        await supabase.from("webhook_logs").insert({
          ...logEntry,
          area_slug: existing.area_slug,
          buyer_email: existing.email,
          status: "processed",
          error_message: `Subscription ${subId} deleted/canceled`,
        });
      }

      return res.status(200).json({ status: "ok" });
    }

    // ─── charge.succeeded (for external checkouts like CheckoutPage.co) ───
    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      const metadata = charge.metadata || {};
      const customerEmail = metadata.customer_email || charge.billing_details?.email;
      const customerName = metadata.customer_name || charge.billing_details?.name;

      logEntry.buyer_email = customerEmail || null;
      logEntry.buyer_name = customerName || null;
      logEntry.transaction_id = charge.id;

      if (!customerEmail) {
        await supabase.from("webhook_logs").insert({
          ...logEntry,
          status: "error",
          error_message: "No customer email in charge metadata or billing_details",
        });
        return res.status(200).json({ status: "error", reason: "No email" });
      }

      const finalEmail = customerEmail.toLowerCase().trim();
      const finalName = customerName || null;

      // Check if this charge has a price_id (standard Stripe) — if so, use price mapping
      let priceMatched = false;

      if (charge.payment_intent) {
        const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;
        try {
          const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
          // Check if there's an invoice with line items
          if (pi.invoice) {
            const invId = typeof pi.invoice === "string" ? pi.invoice : pi.invoice.id;
            const invoice = await stripe.invoices.retrieve(invId);
            const priceIds = (invoice.lines?.data || []).map(l => l.price?.id).filter(Boolean) as string[];
            if (priceIds.length > 0) {
              const { data: productMappings } = await supabase
                .from("stripe_products")
                .select("area_slug, product_name, payment_type, price_id")
                .in("price_id", priceIds);
              if (productMappings && productMappings.length > 0) {
                priceMatched = true;
                // Process like checkout.session.completed using price mapping
                for (const mapping of productMappings) {
                  await processAuthorizedBuyer(supabase, stripe, req, mapping.area_slug, finalEmail, finalName, null, null, logEntry);
                }
              }
            }
          }
        } catch {
          // Could not resolve price from payment intent, fall through to area mapping
        }
      }

      // If no price mapping found, map by webhook_secret → area(s)
      if (!priceMatched) {
        if (matchedAreaSlugs.length === 0) {
          await supabase.from("webhook_logs").insert({
            ...logEntry,
            status: "error",
            error_message: "No areas mapped to this Stripe account",
          });
          return res.status(200).json({ status: "error", reason: "No area mapping" });
        }

        for (const areaSlug of matchedAreaSlugs) {
          await processAuthorizedBuyer(supabase, stripe, req, areaSlug, finalEmail, finalName, null, null, logEntry);
        }
      }

      return res.status(200).json({ status: "ok" });
    }

    // ─── charge.refunded ───
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const email = charge.billing_details?.email;

      logEntry.buyer_email = email || null;
      logEntry.transaction_id = charge.id;

      if (email) {
        // Find all areas where this customer has stripe access
        const { data: buyerEntries } = await supabase
          .from("authorized_buyers")
          .select("id, area_slug")
          .eq("email", email.toLowerCase().trim())
          .eq("payment_provider", "stripe")
          .eq("status", "active");

        if (buyerEntries && buyerEntries.length > 0) {
          for (const entry of buyerEntries) {
            await supabase
              .from("authorized_buyers")
              .update({ status: "refunded", updated_at: new Date().toISOString() })
              .eq("id", entry.id);

            await supabase.from("webhook_logs").insert({
              ...logEntry,
              area_slug: entry.area_slug,
              status: "processed",
            });
          }
        } else {
          await supabase.from("webhook_logs").insert({
            ...logEntry,
            status: "ignored",
            error_message: `No active stripe buyer found for ${email}`,
          });
        }
      }

      return res.status(200).json({ status: "ok" });
    }

    // ─── Unhandled event ───
    await supabase.from("webhook_logs").insert({
      ...logEntry,
      status: "ignored",
      error_message: `Event ${event.type} not handled`,
    });

    return res.status(200).json({ status: "ignored" });
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
