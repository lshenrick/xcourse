import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLanguageBySlug, uiTranslations } from "@/data/languages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AUTO_PASSWORD = "auto_member_access_2024!";

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

const Login = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { langSlug } = useParams<{ langSlug: string }>();
  const { signIn, signUp, user } = useAuth();

  const lang = getLanguageBySlug(langSlug || "");
  if (!lang) return <Navigate to="/" replace />;
  if (user) return <Navigate to={`/${lang.slug}/curso`} replace />;

  const t = uiTranslations[lang.code];

  const logAccess = async (userId: string, userEmail: string) => {
    await supabase.from("access_logs").insert({
      user_id: userId,
      language: lang.code,
      email: userEmail,
      device_type: getDeviceType(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    setLoading(true);

    const trimmedEmail = email.trim();

    // Try sign in first, if fails, sign up automatically
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

    // Log access and save display name
    const { data: { user: loggedUser } } = await supabase.auth.getUser();
    if (loggedUser) {
      await logAccess(loggedUser.id, trimmedEmail);
      await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", loggedUser.id);
    }

    navigate(`/${lang.slug}/curso`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {lang.courseName}
          </h1>
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
          {t.supportText} {t.supportLabel}
        </p>
      </div>
    </div>
  );
};

export default Login;
