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
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, password, name, callerUserId } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha precisa ter no mínimo 6 caracteres" });
    }
    if (!callerUserId) {
      return res.status(400).json({ error: "Usuário não autenticado" });
    }

    const supabase = getSupabase();

    // Verify caller is super_admin
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId);
    const roles = callerRoles?.map((r: any) => r.role) || [];
    const isSuperAdmin = roles.includes("super_admin");

    // Also check email-based admin list
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", callerUserId)
      .single();
    const isEmailAdmin = callerProfile?.email === "contatoluishenrick@gmail.com";

    if (!isSuperAdmin && !isEmailAdmin) {
      return res.status(403).json({ error: "Apenas super admins podem criar administradores" });
    }

    // Try to create user, or update if already exists
    let userId: string;

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { name: name?.trim() || "" },
    });

    if (createError && createError.message.includes("already been registered")) {
      // User already exists — find their ID and update password
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email === email.trim().toLowerCase()
      );
      if (!existingUser) {
        return res.status(400).json({ error: "Usuário existe mas não foi possível encontrá-lo" });
      }
      userId = existingUser.id;

      // Update password
      await supabase.auth.admin.updateUserById(userId, {
        password: password,
        user_metadata: { name: name?.trim() || existingUser.user_metadata?.name || "" },
      });
    } else if (createError) {
      return res.status(400).json({ error: createError.message });
    } else if (!newUser?.user) {
      return res.status(500).json({ error: "Erro ao criar usuário" });
    } else {
      userId = newUser.user.id;
    }

    // Create/update profile
    await supabase.from("profiles").upsert({
      id: userId,
      email: email.trim().toLowerCase(),
    });

    // Add admin role (ignore if already exists)
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
    }

    // Send credentials email via Resend (if configured)
    let emailSent = false;
    if (RESEND_API_KEY) {
      try {
        const adminUrl = `${req.headers.origin || "https://xmembers.app"}/admin`;
        const emailHtml = `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0b; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
            <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px 32px; text-align: center;">
              <h1 style="color: #fafafa; font-size: 24px; margin: 0;">🔐 Acesso Administrador</h1>
              <p style="color: #a1a1aa; font-size: 14px; margin-top: 8px;">xMembers.app</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                Olá${name ? ` <strong>${name}</strong>` : ""},
              </p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                Você foi adicionado como administrador na plataforma xMembers. Aqui estão suas credenciais de acesso:
              </p>
              <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 4px;">Email</p>
                <p style="color: #fafafa; font-size: 16px; font-weight: 600; margin: 0 0 16px; font-family: monospace;">${email}</p>
                <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 4px;">Senha</p>
                <p style="color: #fafafa; font-size: 16px; font-weight: 600; margin: 0; font-family: monospace;">${password}</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${adminUrl}" style="display: inline-block; padding: 14px 32px; background: #fafafa; color: #0a0a0b; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Acessar Painel Admin
                </a>
              </div>
              <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 24px;">
                Recomendamos que altere sua senha após o primeiro acesso.
              </p>
            </div>
          </div>
        `;

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "xMembers <noreply@xmembers.app>",
            to: [email.trim().toLowerCase()],
            subject: "🔐 Suas credenciais de administrador - xMembers",
            html: emailHtml,
          }),
        });
        emailSent = emailRes.ok;
      } catch {
        // Email failed but user was created, continue
      }
    }

    return res.status(200).json({
      success: true,
      userId,
      emailSent,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Erro interno" });
  }
}
