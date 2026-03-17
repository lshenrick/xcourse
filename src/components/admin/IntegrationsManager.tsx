import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Plus, Trash2, Link2, Mail, ShieldCheck, Key, Package,
  RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Eye, EyeOff,
  Copy, UserPlus, Search, ChevronLeft, ChevronRight, ScrollText,
} from "lucide-react";
import { toast } from "sonner";

interface AreaOption {
  slug: string;
  title: string;
  icon: string;
  lang_code?: string;
}

// Email defaults per language (mirrors api/email-i18n.ts)
const emailDefaults: Record<string, { subject: string; body: string }> = {
  pt: {
    subject: "Seu acesso ao curso está liberado!",
    body: 'Olá {name},<br><br>Seu acesso ao curso <strong>{course_name}</strong> está liberado!<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Acessar Curso</a><br><br>Use o email <strong>{email}</strong> para fazer login.<br><br>Bons estudos!',
  },
  en: {
    subject: "Your course access is ready!",
    body: 'Hi {name},<br><br>Your access to <strong>{course_name}</strong> is now available!<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Access Course</a><br><br>Use the email <strong>{email}</strong> to sign in.<br><br>Happy learning!',
  },
  es: {
    subject: "¡Tu acceso al curso está listo!",
    body: 'Hola {name},<br><br>¡Tu acceso a <strong>{course_name}</strong> está disponible!<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Acceder al Curso</a><br><br>Usa el email <strong>{email}</strong> para iniciar sesión.<br><br>¡Buenos estudios!',
  },
  de: {
    subject: "Dein Kurszugang ist freigeschaltet!",
    body: 'Hallo {name},<br><br>Dein Zugang zu <strong>{course_name}</strong> ist jetzt verfügbar!<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Kurs Zugreifen</a><br><br>Verwende die E-Mail <strong>{email}</strong> zum Anmelden.<br><br>Viel Erfolg beim Lernen!',
  },
  fr: {
    subject: "Votre accès au cours est prêt !",
    body: 'Bonjour {name},<br><br>Votre accès à <strong>{course_name}</strong> est maintenant disponible !<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accéder au Cours</a><br><br>Utilisez l\'email <strong>{email}</strong> pour vous connecter.<br><br>Bon apprentissage !',
  },
  it: {
    subject: "Il tuo accesso al corso è pronto!",
    body: 'Ciao {name},<br><br>Il tuo accesso a <strong>{course_name}</strong> è ora disponibile!<br><br><a href="{access_link}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accedi al Corso</a><br><br>Usa l\'email <strong>{email}</strong> per accedere.<br><br>Buono studio!',
  },
};

interface IntegrationSetting {
  id: string;
  area_slug: string;
  hottok: string | null;
  resend_api_key: string | null;
  email_from: string;
  email_subject_template: string;
  email_body_template: string;
  webhook_enabled: boolean;
  email_enabled: boolean;
  payment_provider: "hotmart" | "stripe";
  stripe_webhook_secret: string | null;
  stripe_secret_key: string | null;
}

interface StripeProduct {
  id: string;
  price_id: string;
  product_name: string | null;
  area_slug: string;
  payment_type: "one_time" | "recurring";
}

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  email: string;
  area_slug: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

interface HotmartProduct {
  id: string;
  product_id: string;
  product_name: string | null;
  area_slug: string;
}

interface WebhookLog {
  id: string;
  area_slug: string | null;
  event_type: string | null;
  buyer_email: string | null;
  buyer_name: string | null;
  product_id: string | null;
  transaction_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface AuthorizedBuyer {
  id: string;
  email: string;
  name: string | null;
  area_slug: string;
  status: string;
  hotmart_transaction: string | null;
  created_at: string;
}

interface IntegrationsManagerProps {
  adminUserId: string;
  isSuperAdmin: boolean;
}

export function IntegrationsManager({ adminUserId, isSuperAdmin }: IntegrationsManagerProps) {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [settings, setSettings] = useState<IntegrationSetting | null>(null);
  const [products, setProducts] = useState<HotmartProduct[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [buyers, setBuyers] = useState<AuthorizedBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [hottok, setHottok] = useState("");
  const [showHottok, setShowHottok] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<"hotmart" | "stripe">("hotmart");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  // Resend API Key agora é global (env var RESEND_API_KEY)
  const [emailFrom, setEmailFrom] = useState("noreply@xmembers.app");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Hotmart product form
  const [newProductId, setNewProductId] = useState("");
  const [newProductName, setNewProductName] = useState("");

  // Stripe product form
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);
  const [newStripePriceId, setNewStripePriceId] = useState("");
  const [newStripeProductName, setNewStripeProductName] = useState("");
  const [newStripePaymentType, setNewStripePaymentType] = useState<"one_time" | "recurring">("one_time");

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // New buyer form
  const [newBuyerEmail, setNewBuyerEmail] = useState("");
  const [newBuyerName, setNewBuyerName] = useState("");
  const [addingBuyer, setAddingBuyer] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Buyer search and pagination
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerPage, setBuyerPage] = useState(1);
  const BUYER_PAGE_SIZE = 10;

  // Log pagination
  const [logPage, setLogPage] = useState(1);
  const LOG_PAGE_SIZE = 15;

  // Fetch areas
  useEffect(() => {
    const fetchAreas = async () => {
      let query = supabase.from("member_areas").select("slug, title, icon, lang_code").eq("active", true).order("position");
      query = query.eq("owner_id", adminUserId);
      const { data } = await query;
      const areaList = (data || []) as AreaOption[];
      setAreas(areaList);
      if (areaList.length > 0 && !selectedArea) {
        setSelectedArea(areaList[0].slug);
      }
      setLoading(false);
    };
    fetchAreas();
  }, []);

  // Fetch data when area changes
  useEffect(() => {
    if (!selectedArea) return;
    fetchSettings();
    fetchProducts();
    fetchStripeProducts();
    fetchSubscriptions();
    fetchLogs();
    fetchBuyers();
  }, [selectedArea]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("area_slug", selectedArea)
      .maybeSingle();
    if (data) {
      const s = data as IntegrationSetting;
      setSettings(s);
      setHottok(s.hottok || "");
      setPaymentProvider(s.payment_provider || "hotmart");
      setStripeWebhookSecret(s.stripe_webhook_secret || "");
      setStripeSecretKey((s as any).stripe_secret_key || "");
      const areaLang = areas.find(a => a.slug === selectedArea)?.lang_code || "pt";
      const defaults = emailDefaults[areaLang] || emailDefaults.pt;
      setEmailFrom(s.email_from || "noreply@xmembers.app");
      setEmailSubject(s.email_subject_template || defaults.subject);
      setEmailBody(s.email_body_template || defaults.body);
      setWebhookEnabled(s.webhook_enabled);
      setEmailEnabled(s.email_enabled);
    } else {
      setSettings(null);
      setHottok("");
      setPaymentProvider("hotmart");
      setStripeWebhookSecret("");
      setStripeSecretKey("");
      setEmailFrom("noreply@xmembers.app");
      // Use language-specific defaults
      const areaLang = areas.find(a => a.slug === selectedArea)?.lang_code || "pt";
      const defaults = emailDefaults[areaLang] || emailDefaults.pt;
      setEmailSubject(defaults.subject);
      setEmailBody(defaults.body);
      setWebhookEnabled(true);
      setEmailEnabled(true);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("hotmart_products")
      .select("*")
      .eq("area_slug", selectedArea)
      .order("created_at");
    setProducts((data || []) as HotmartProduct[]);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("area_slug", selectedArea)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data || []) as WebhookLog[]);
    setLogPage(1);
  };

  const fetchBuyers = async () => {
    const { data } = await supabase
      .from("authorized_buyers")
      .select("*")
      .eq("area_slug", selectedArea)
      .order("created_at", { ascending: false })
      .limit(500);
    setBuyers((data || []) as AuthorizedBuyer[]);
    setBuyerPage(1);
  };

  const fetchStripeProducts = async () => {
    const { data } = await supabase
      .from("stripe_products")
      .select("*")
      .eq("area_slug", selectedArea)
      .order("created_at");
    setStripeProducts((data || []) as StripeProduct[]);
  };

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("area_slug", selectedArea)
      .order("created_at", { ascending: false })
      .limit(100);
    setSubscriptions((data || []) as Subscription[]);
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    const payload = {
      area_slug: selectedArea,
      hottok: hottok.trim() || null,
      payment_provider: paymentProvider,
      stripe_webhook_secret: stripeWebhookSecret.trim() || null,
      stripe_secret_key: stripeSecretKey.trim() || null,
      email_from: emailFrom.trim() || "noreply@xmembers.app",
      email_subject_template: emailSubject.trim(),
      email_body_template: emailBody,
      webhook_enabled: webhookEnabled,
      email_enabled: emailEnabled,
      updated_at: new Date().toISOString(),
    };

    if (settings) {
      const { error } = await supabase.from("integration_settings").update(payload).eq("id", settings.id);
      if (error) toast.error("Erro ao salvar: " + error.message);
      else toast.success("Configurações salvas!");
    } else {
      const { error } = await supabase.from("integration_settings").insert(payload);
      if (error) toast.error("Erro ao salvar: " + error.message);
      else toast.success("Configurações criadas!");
    }
    await fetchSettings();
    setSaving(false);
  };

  // Add product mapping
  const handleAddProduct = async () => {
    if (!newProductId.trim()) {
      toast.error("Informe o ID do produto Hotmart");
      return;
    }
    const { error } = await supabase.from("hotmart_products").insert({
      product_id: newProductId.trim(),
      product_name: newProductName.trim() || null,
      area_slug: selectedArea,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este produto já está mapeado" : "Erro: " + error.message);
    } else {
      toast.success("Produto adicionado!");
      setNewProductId("");
      setNewProductName("");
      fetchProducts();
    }
  };

  // Remove product
  const handleRemoveProduct = async (id: string) => {
    await supabase.from("hotmart_products").delete().eq("id", id);
    toast.success("Produto removido");
    fetchProducts();
  };

  // Add Stripe product
  const handleAddStripeProduct = async () => {
    if (!newStripePriceId.trim()) {
      toast.error("Informe o Price ID do Stripe");
      return;
    }
    const { error } = await supabase.from("stripe_products").insert({
      price_id: newStripePriceId.trim(),
      product_name: newStripeProductName.trim() || null,
      area_slug: selectedArea,
      payment_type: newStripePaymentType,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este price já está mapeado" : "Erro: " + error.message);
    } else {
      toast.success("Produto Stripe adicionado!");
      setNewStripePriceId("");
      setNewStripeProductName("");
      setNewStripePaymentType("one_time");
      fetchStripeProducts();
    }
  };

  // Remove Stripe product
  const handleRemoveStripeProduct = async (id: string) => {
    await supabase.from("stripe_products").delete().eq("id", id);
    toast.success("Produto Stripe removido");
    fetchStripeProducts();
  };

  // Add buyer manually
  const handleAddBuyer = async () => {
    if (!newBuyerEmail.trim()) {
      toast.error("Informe o email do comprador");
      return;
    }
    setAddingBuyer(true);
    const buyerEmail = newBuyerEmail.trim().toLowerCase();
    const buyerName = newBuyerName.trim() || null;

    const { error } = await supabase.from("authorized_buyers").insert({
      email: buyerEmail,
      name: buyerName,
      area_slug: selectedArea,
      status: "active",
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este email já está autorizado" : "Erro: " + error.message);
      setAddingBuyer(false);
      return;
    }

    // Send welcome email if checkbox is checked
    if (sendWelcomeEmail) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Sessão expirada");

        const res = await fetch("/api/send-welcome-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: buyerEmail,
            name: buyerName,
            area_slug: selectedArea,
          }),
        });

        if (res.ok) {
          toast.success("Comprador autorizado e email enviado!");
        } else {
          const data = await res.json().catch(() => ({}));
          toast.warning(`Comprador autorizado, mas falha ao enviar email: ${data.error || "Erro desconhecido"}`);
        }
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error ? emailErr.message : "Erro desconhecido";
        toast.warning(`Comprador autorizado, mas falha ao enviar email: ${msg}`);
      }
    } else {
      toast.success("Comprador autorizado!");
    }

    setNewBuyerEmail("");
    setNewBuyerName("");
    fetchBuyers();
    setAddingBuyer(false);
  };

  // Toggle buyer status
  const handleToggleBuyer = async (buyer: AuthorizedBuyer) => {
    const newStatus = buyer.status === "active" ? "revoked" : "active";
    await supabase.from("authorized_buyers").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", buyer.id);
    toast.success(newStatus === "active" ? "Acesso reativado" : "Acesso revogado");
    fetchBuyers();
  };

  // Remove buyer
  const handleRemoveBuyer = async (id: string) => {
    await supabase.from("authorized_buyers").delete().eq("id", id);
    toast.success("Comprador removido");
    fetchBuyers();
  };

  // Copy webhook URL
  const copyWebhookUrl = (provider?: string) => {
    const p = provider || paymentProvider;
    const url = `${window.location.origin}/api/webhooks/${p === "stripe" ? "stripe" : "hotmart"}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  // Filtered buyers
  const filteredBuyers = buyers.filter((b) => {
    if (!buyerSearch.trim()) return true;
    const q = buyerSearch.toLowerCase();
    return b.email.includes(q) || (b.name || "").toLowerCase().includes(q);
  });
  const totalBuyerPages = Math.max(1, Math.ceil(filteredBuyers.length / BUYER_PAGE_SIZE));
  const paginatedBuyers = filteredBuyers.slice((buyerPage - 1) * BUYER_PAGE_SIZE, buyerPage * BUYER_PAGE_SIZE);

  // Paginated logs
  const totalLogPages = Math.max(1, Math.ceil(logs.length / LOG_PAGE_SIZE));
  const paginatedLogs = logs.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Processado</Badge>;
      case "error": return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Erro</Badge>;
      case "ignored": return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Ignorado</Badge>;
      default: return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Recebido</Badge>;
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  if (areas.length === 0) {
    return (
      <div className="text-center py-16">
        <Link2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Crie uma área de membros primeiro na aba "Áreas".</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Integrações de Pagamento</h2>
          <p className="text-sm text-muted-foreground">Configure Hotmart ou Stripe, webhooks, emails automáticos e gerencie compradores</p>
        </div>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Selecione uma área" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((a) => (
              <SelectItem key={a.slug} value={a.slug}>
                <span className="flex items-center gap-2">
                  <span>{a.icon || a.title[0]}</span>
                  <span>{a.title}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full justify-start mb-4 h-auto flex-wrap gap-1">
          <TabsTrigger value="settings" className="gap-2"><Key className="h-4 w-4" /> Configurações</TabsTrigger>
          <TabsTrigger value="products" className="gap-2"><Package className="h-4 w-4" /> Produtos</TabsTrigger>
          <TabsTrigger value="buyers" className="gap-2"><ShieldCheck className="h-4 w-4" /> Compradores</TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2"><RefreshCw className="h-4 w-4" /> Assinaturas</TabsTrigger>
          <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><ScrollText className="h-4 w-4" /> Logs</TabsTrigger>
        </TabsList>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4">
          {/* Payment Provider Selection */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Provedor de Pagamento
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentProvider("hotmart")}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${paymentProvider === "hotmart" ? "border-orange-500 bg-orange-500/10" : "border-border hover:border-muted-foreground/30"}`}
              >
                <p className="font-semibold text-sm text-foreground">Hotmart</p>
                <p className="text-xs text-muted-foreground mt-1">Checkout via iframe com ofuscacao de email</p>
              </button>
              <button
                onClick={() => setPaymentProvider("stripe")}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors text-left ${paymentProvider === "stripe" ? "border-purple-500 bg-purple-500/10" : "border-border hover:border-muted-foreground/30"}`}
              >
                <p className="font-semibold text-sm text-foreground">Stripe</p>
                <p className="text-xs text-muted-foreground mt-1">Payment Links com redirect e suporte a assinaturas</p>
              </button>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" /> URL do Webhook ({paymentProvider === "stripe" ? "Stripe" : "Hotmart"})
            </h3>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/api/webhooks/${paymentProvider === "stripe" ? "stripe" : "hotmart"}`}
                className="font-mono text-xs bg-muted"
              />
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/${paymentProvider === "stripe" ? "stripe" : "hotmart"}`);
                toast.success("URL copiada!");
              }} className="gap-2 shrink-0">
                <Copy className="h-4 w-4" /> Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentProvider === "stripe"
                ? "Cole esta URL no Stripe Dashboard em: Developers > Webhooks > Add endpoint. Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, charge.refunded"
                : "Cole esta URL na Hotmart em: Ferramentas > Webhooks > Nova URL > Cole > Selecione \"PURCHASE_APPROVED\""}
            </p>
          </div>

          {/* Provider-specific config */}
          {paymentProvider === "hotmart" ? (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Key className="h-4 w-4" /> Token Hotmart (Hottok)
              </h3>
              <div className="flex items-center gap-2">
                <Input
                  type={showHottok ? "text" : "password"}
                  placeholder="Cole aqui o Hottok da Hotmart"
                  value={hottok}
                  onChange={(e) => setHottok(e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowHottok(!showHottok)}>
                  {showHottok ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre em: Hotmart &gt; Ferramentas &gt; Webhooks &gt; Configurações &gt; Hottok
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Key className="h-4 w-4" /> Stripe Webhook Secret
              </h3>
              <div className="flex items-center gap-2">
                <Input
                  type={showStripeSecret ? "text" : "password"}
                  placeholder="whsec_..."
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowStripeSecret(!showStripeSecret)}>
                  {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre em: Stripe Dashboard &gt; Developers &gt; Webhooks &gt; Signing secret
              </p>

              <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mt-4">
                <Key className="h-4 w-4" /> Stripe Secret Key
              </h3>
              <div className="flex items-center gap-2">
                <Input
                  type={showStripeKey ? "text" : "password"}
                  placeholder="sk_live_... ou sk_test_..."
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowStripeKey(!showStripeKey)}>
                  {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre em: Stripe Dashboard &gt; Developers &gt; API keys &gt; Secret key
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={webhookEnabled} onChange={(e) => setWebhookEnabled(e.target.checked)} className="rounded" />
                <span className="text-sm text-foreground">Webhook ativo</span>
              </label>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" /> Mapear Produto Hotmart
            </h3>
            <p className="text-xs text-muted-foreground">
              Vincule um produto da Hotmart a esta área. O ID do produto está em: Hotmart &gt; Produtos &gt; Seu Produto &gt; URL ou Detalhes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">ID do Produto Hotmart*</label>
                <Input
                  placeholder="Ex: 1234567"
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Nome (opcional)</label>
                <Input
                  placeholder="Ex: Curso Completo"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddProduct} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Produto
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum produto mapeado para esta área.</p>
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.product_name || "Produto Hotmart"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">ID: {p.product_id}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(p.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* STRIPE PRODUCTS */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4" /> Mapear Produto Stripe
            </h3>
            <p className="text-xs text-muted-foreground">
              Vincule um Price ID do Stripe a esta área. Encontre em: Stripe Dashboard &gt; Products &gt; Seu Produto &gt; Pricing &gt; Price ID (price_xxx)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Price ID*</label>
                <Input
                  placeholder="Ex: price_1N..."
                  value={newStripePriceId}
                  onChange={(e) => setNewStripePriceId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Nome (opcional)</label>
                <Input
                  placeholder="Ex: Curso Completo"
                  value={newStripeProductName}
                  onChange={(e) => setNewStripeProductName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tipo</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setNewStripePaymentType("one_time")}
                    className={`px-3 py-2 rounded-md text-xs font-medium border ${newStripePaymentType === "one_time" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
                  >
                    Pagamento único
                  </button>
                  <button
                    onClick={() => setNewStripePaymentType("recurring")}
                    className={`px-3 py-2 rounded-md text-xs font-medium border ${newStripePaymentType === "recurring" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
                  >
                    Assinatura
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddStripeProduct} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Produto Stripe
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {stripeProducts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">Nenhum produto Stripe mapeado para esta área.</p>
              </div>
            ) : (
              stripeProducts.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.product_name || "Produto Stripe"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">Price: {p.price_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${p.payment_type === "recurring" ? "border-purple-500/40 text-purple-400" : "border-green-500/40 text-green-400"}`}>
                      {p.payment_type === "recurring" ? "Assinatura" : "Único"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveStripeProduct(p.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* SUBSCRIPTIONS TAB */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{subscriptions.length} assinatura{subscriptions.length !== 1 ? "s" : ""}</p>
            <Button variant="outline" size="sm" onClick={fetchSubscriptions} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
          </div>

          <div className="space-y-2">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma assinatura Stripe registrada.</p>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sub.email}</p>
                      <p className="text-xs text-muted-foreground font-mono">{sub.stripe_subscription_id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sub.status === "active" ? "default" : sub.status === "past_due" ? "secondary" : "destructive"} className="text-xs">
                        {sub.status === "active" ? "Ativa" : sub.status === "past_due" ? "Atrasada" : sub.status === "canceled" ? "Cancelada" : sub.status}
                      </Badge>
                      {sub.current_period_end && (
                        <span className="text-xs text-muted-foreground">
                          até {new Date(sub.current_period_end).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* BUYERS TAB */}
        <TabsContent value="buyers" className="space-y-4">
          {/* Add buyer manually */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Autorizar Comprador Manualmente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Email*</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newBuyerEmail}
                  onChange={(e) => setNewBuyerEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Nome (opcional)</label>
                <Input
                  placeholder="Nome do comprador"
                  value={newBuyerName}
                  onChange={(e) => setNewBuyerName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Enviar email de boas-vindas
                </span>
              </label>
              <Button onClick={handleAddBuyer} disabled={addingBuyer} className="gap-2">
                <UserPlus className="h-4 w-4" /> {addingBuyer ? "Autorizando..." : "Autorizar"}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por email ou nome..."
              value={buyerSearch}
              onChange={(e) => { setBuyerSearch(e.target.value); setBuyerPage(1); }}
              className="pl-9"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredBuyers.length} comprador{filteredBuyers.length !== 1 ? "es" : ""} autorizado{filteredBuyers.length !== 1 ? "s" : ""}
          </p>

          {/* Buyers list */}
          <div className="space-y-2">
            {filteredBuyers.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{buyerSearch ? "Nenhum comprador encontrado." : "Nenhum comprador autorizado."}</p>
              </div>
            ) : (
              paginatedBuyers.map((b) => (
                <div key={b.id} className={`bg-card border rounded-lg p-4 flex items-center justify-between ${b.status !== "active" ? "opacity-50 border-border/50" : "border-border"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck className={`h-5 w-5 shrink-0 ${b.status === "active" ? "text-green-500" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.name || b.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={b.status === "active" ? "default" : "destructive"} className="text-xs">
                      {b.status === "active" ? "Ativo" : b.status === "refunded" ? "Reembolsado" : "Revogado"}
                    </Badge>
                    {b.hotmart_transaction && (
                      <Badge variant="outline" className="text-xs font-mono">{b.hotmart_transaction.slice(0, 8)}...</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleBuyer(b)} className="h-8 w-8 p-0" title={b.status === "active" ? "Revogar acesso" : "Reativar acesso"}>
                      {b.status === "active" ? <XCircle className="h-4 w-4 text-muted-foreground" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBuyer(b.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Buyer pagination */}
          {totalBuyerPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={buyerPage <= 1} onClick={() => setBuyerPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">{buyerPage} / {totalBuyerPages}</span>
              <Button variant="outline" size="sm" disabled={buyerPage >= totalBuyerPages} onClick={() => setBuyerPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* EMAIL TAB */}
        <TabsContent value="email" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> Configuração de Email
            </h3>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Email configurado automaticamente</p>
                <p className="text-xs text-green-600/80 dark:text-green-500/80 mt-0.5">
                  Todos os emails são enviados de <strong>noreply@xmembers.app</strong> via Resend. Nenhuma configuração adicional necessária.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="rounded" />
                <span className="text-sm text-foreground">Envio de email ativo</span>
              </label>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> Template do Email
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Remetente (From)</label>
                <Input
                  placeholder="noreply@xmembers.app"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Assunto</label>
                <Input
                  placeholder="Seu acesso está liberado!"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Corpo do Email (HTML)</label>
              <textarea
                className="w-full mt-1 min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-foreground mb-2">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                {["{name}", "{email}", "{course_name}", "{access_link}"].map((v) => (
                  <Badge key={v} variant="outline" className="text-xs font-mono cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(v);
                    toast.success(`Copiado: ${v}`);
                  }}>
                    {v}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Clique para copiar. Use HTML para formatação ({`<br>`} = quebra de linha, {`<strong>`} = negrito, {`<a href="...">`} = link).
              </p>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* LOGS TAB */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{logs.length} eventos registrados</p>
            <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
          </div>

          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <ScrollText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum webhook recebido ainda.</p>
              </div>
            ) : (
              paginatedLogs.map((log) => (
                <div key={log.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getStatusBadge(log.status)}
                        <Badge variant="outline" className="text-xs font-mono">{log.event_type || "?"}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      {log.buyer_email && (
                        <p className="text-sm text-foreground">
                          {log.buyer_name && <span className="font-medium">{log.buyer_name} — </span>}
                          {log.buyer_email}
                        </p>
                      )}
                      {log.product_id && (
                        <p className="text-xs text-muted-foreground">Produto: {log.product_id} {log.transaction_id && `| Transação: ${log.transaction_id}`}</p>
                      )}
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Log pagination */}
          {totalLogPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">{logPage} / {totalLogPages}</span>
              <Button variant="outline" size="sm" disabled={logPage >= totalLogPages} onClick={() => setLogPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
