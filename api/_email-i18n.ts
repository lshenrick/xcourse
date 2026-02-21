// Email translations for all supported languages
// Used by both hotmart.ts webhook and send-welcome-email.ts

const buttonStyle = 'display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;';

export interface EmailI18n {
  headerTitle: string;
  footerText: string;
  defaultSubject: string;
  defaultBody: string;
  fallbackName: string;
}

export const emailTranslations: Record<string, EmailI18n> = {
  pt: {
    headerTitle: "Acesso Liberado!",
    footerText: "Este email foi enviado automaticamente. Não é necessário responder.",
    defaultSubject: "Seu acesso ao curso está liberado!",
    defaultBody: `Olá {name},<br><br>Seu acesso ao curso <strong>{course_name}</strong> está liberado!<br><br><a href="{access_link}" style="${buttonStyle}">Acessar Curso</a><br><br>Use o email <strong>{email}</strong> para fazer login.<br><br>Bons estudos!`,
    fallbackName: "Aluno(a)",
  },
  en: {
    headerTitle: "Access Granted!",
    footerText: "This email was sent automatically. No reply needed.",
    defaultSubject: "Your course access is ready!",
    defaultBody: `Hi {name},<br><br>Your access to <strong>{course_name}</strong> is now available!<br><br><a href="{access_link}" style="${buttonStyle}">Access Course</a><br><br>Use the email <strong>{email}</strong> to sign in.<br><br>Happy learning!`,
    fallbackName: "Student",
  },
  es: {
    headerTitle: "¡Acceso Liberado!",
    footerText: "Este correo fue enviado automáticamente. No es necesario responder.",
    defaultSubject: "¡Tu acceso al curso está listo!",
    defaultBody: `Hola {name},<br><br>¡Tu acceso a <strong>{course_name}</strong> está disponible!<br><br><a href="{access_link}" style="${buttonStyle}">Acceder al Curso</a><br><br>Usa el email <strong>{email}</strong> para iniciar sesión.<br><br>¡Buenos estudios!`,
    fallbackName: "Estudiante",
  },
  de: {
    headerTitle: "Zugang Freigeschaltet!",
    footerText: "Diese E-Mail wurde automatisch gesendet. Keine Antwort erforderlich.",
    defaultSubject: "Dein Kurszugang ist freigeschaltet!",
    defaultBody: `Hallo {name},<br><br>Dein Zugang zu <strong>{course_name}</strong> ist jetzt verfügbar!<br><br><a href="{access_link}" style="${buttonStyle}">Kurs Zugreifen</a><br><br>Verwende die E-Mail <strong>{email}</strong> zum Anmelden.<br><br>Viel Erfolg beim Lernen!`,
    fallbackName: "Teilnehmer(in)",
  },
  fr: {
    headerTitle: "Accès Activé !",
    footerText: "Cet email a été envoyé automatiquement. Aucune réponse nécessaire.",
    defaultSubject: "Votre accès au cours est prêt !",
    defaultBody: `Bonjour {name},<br><br>Votre accès à <strong>{course_name}</strong> est maintenant disponible !<br><br><a href="{access_link}" style="${buttonStyle}">Accéder au Cours</a><br><br>Utilisez l'email <strong>{email}</strong> pour vous connecter.<br><br>Bon apprentissage !`,
    fallbackName: "Étudiant(e)",
  },
  it: {
    headerTitle: "Accesso Attivato!",
    footerText: "Questa email è stata inviata automaticamente. Non è necessario rispondere.",
    defaultSubject: "Il tuo accesso al corso è pronto!",
    defaultBody: `Ciao {name},<br><br>Il tuo accesso a <strong>{course_name}</strong> è ora disponibile!<br><br><a href="{access_link}" style="${buttonStyle}">Accedi al Corso</a><br><br>Usa l'email <strong>{email}</strong> per accedere.<br><br>Buono studio!`,
    fallbackName: "Studente",
  },
};

export function getEmailI18n(lang: string): EmailI18n {
  return emailTranslations[lang] || emailTranslations.pt;
}

// Shared buildEmailHtml function
export function buildEmailHtml(
  template: string,
  vars: Record<string, string>,
  lang: string = "pt"
): string {
  const t = getEmailI18n(lang);

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
