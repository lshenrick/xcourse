import { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLanguageBySlug, uiTranslations } from "@/data/languages";
import type { LanguageCode } from "@/data/languages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AUTO_PASSWORD = "auto_member_access_2024";

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua) || (!/mobile/i.test(ua) && /android/i.test(ua))) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

interface AreaInfo {
  slug: string;
  title: string;
  subtitle: string;
  langCode: LanguageCode;
  supportEmail: string;
  requireAuth: boolean;
  theme: string;
}

const Login = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();
  const { langSlug } = useParams<{ langSlug: string }>();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    const slug = langSlug || "";

    // Try known language first
    const lang = getLanguageBySlug(slug);
    if (lang) {
      setAreaInfo({
        slug: lang.slug,
        title: `${lang.mestraTitle} ${lang.mestraName}`,
        subtitle: lang.courseName,
        langCode: lang.code,
        supportEmail: "contact@everwynventures.com",
        requireAuth: true,
        theme: "dark",
      });
      setChecking(false);
      return;
    }

    // Try database member_areas
    supabase
      .from("member_areas")
      .select("slug, title, subtitle, lang_code, support_email, require_auth, theme")
      .eq("slug", slug)
      .eq("active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setAreaInfo({
            slug: data.slug,
            title: data.title,
            subtitle: data.subtitle,
            langCode: (data.lang_code || "pt") as LanguageCode,
            supportEmail: data.support_email || "contact@everwynventures.com",
            requireAuth: data.require_auth !== false,
            theme: data.theme || "dark",
          });
        } else {
          setNotFound(true);
        }
        setChecking(false);
      });
  }, [langSlug]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">...</p>
      </div>
    );
  }

  if (notFound || !areaInfo) return <Navigate to="/" replace />;
  if (user) return <Navigate to={`/${areaInfo.slug}/curso`} replace />;

  const t = uiTranslations[areaInfo.langCode];

  const logAccess = async (userId: string, userEmail: string) => {
    await supabase.from("access_logs").insert({
      user_id: userId,
      language: areaInfo.slug,
      email: userEmail,
      device_type: getDeviceType(),
    });
  };

  const notAuthorizedMessages: Record<string, string> = {
    pt: "Este e-mail n\u00e3o est\u00e1 autorizado para este curso. Verifique se usou o e-mail correto da compra.",
    en: "This email is not authorized for this course. Please check you used the correct purchase email.",
    es: "Este correo no est\u00e1 autorizado para este curso. Verifica que usaste el correo correcto de la compra.",
    de: "Diese E-Mail ist nicht f\u00fcr diesen Kurs autorisiert. Bitte \u00fcberpr\u00fcfen Sie die Kauf-E-Mail.",
    fr: "Cet e-mail n\u2019est pas autoris\u00e9 pour ce cours. V\u00e9rifiez que vous avez utilis\u00e9 l\u2019e-mail d\u2019achat.",
    it: "Questa email non \u00e8 autorizzata per questo corso. Verifica di aver usato l'email corretta dell'acquisto.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    // Check if buyer is authorized for this area (skip if auth is disabled)
    if (areaInfo.requireAuth) {
      const { data: buyer } = await supabase
        .from("authorized_buyers")
        .select("id, status")
        .eq("email", trimmedEmail)
        .eq("area_slug", areaInfo.slug)
        .eq("status", "active")
        .maybeSingle();

      if (!buyer) {
        toast.error(notAuthorizedMessages[areaInfo.langCode] || notAuthorizedMessages.pt);
        setLoading(false);
        return;
      }
    }

    const { error: signInError } = await signIn(trimmedEmail, AUTO_PASSWORD);
    if (signInError) {
      const { error: signUpError } = await signUp(trimmedEmail, AUTO_PASSWORD);
      if (signUpError) {
        toast.error(signUpError);
        setLoading(false);
        return;
      }
      const { error: retryError } = await signIn(trimmedEmail, AUTO_PASSWORD);
      if (retryError) {
        toast.error(retryError);
        setLoading(false);
        return;
      }
    }

    const { data: { user: loggedUser } } = await supabase.auth.getUser();
    if (loggedUser) {
      await logAccess(loggedUser.id, trimmedEmail);
      await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", loggedUser.id);
    }

    navigate(`/${areaInfo.slug}/curso`);
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-background px-4 ${areaInfo.theme === "light" ? "theme-light" : ""}`}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">
            {areaInfo.title}
          </h1>
          <p className="text-base text-accent">
            {areaInfo.subtitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.memberArea}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              {t.enterName}
            </label>
            <Input
              id="name"
              type="text"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 text-base"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {t.enterEmail}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                e.target.setCustomValidity("");
              }}
              onInvalid={(e) => {
                (e.target as HTMLInputElement).setCustomValidity(t.emailRequired);
              }}
              required
              className="h-12 text-base"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {t.enter}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          {t.supportText} <span className="font-medium text-primary">{areaInfo.supportEmail}</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
