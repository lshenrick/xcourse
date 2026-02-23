import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Plus, Trash2, Mail, Bot, MessageSquare, ShieldAlert,
  RefreshCw, CheckCircle2, AlertCircle, Send,
} from "lucide-react";
import { toast } from "sonner";

interface AreaOption { slug: string; title: string; icon: string; }
interface QAPair { q: string; a: string; }

interface AITraining {
  id?: string;
  area_slug: string;
  ai_name: string;
  ai_tone: string;
  qa_pairs: QAPair[];
  retention_attempt_1: string;
  retention_attempt_2: string;
  retention_final: string;
  extra_context: string;
  support_email: string;
  google_connected: boolean;
}

interface FunnelTemplate {
  id?: string;
  area_slug: string;
  position: number;
  subject: string;
  body: string;
  delay_hours: number;
}

interface RefundRequest {
  id: string;
  buyer_email: string;
  area_slug: string;
  status: string;
  created_at: string;
}

const DELAY_LABELS = [
  { position: 1, label: "Email 1 — Imediato (após compra)", default_hours: 0 },
  { position: 2, label: "Email 2 — 3h após o 1º", default_hours: 3 },
  { position: 3, label: "Email 3 — 1 dia após o 2º", default_hours: 24 },
  { position: 4, label: "Email 4 — 2 dias após o 3º", default_hours: 48 },
  { position: 5, label: "Email 5 — 2 dias após o 4º", default_hours: 48 },
];

const emptyTraining: Omit<AITraining, "area_slug"> = {
  ai_name: "Ana", ai_tone: "friendly", qa_pairs: [],
  retention_attempt_1: "", retention_attempt_2: "", retention_final: "",
  extra_context: "", support_email: "", google_connected: false,
};

export function AutomationManager({ adminUserId, isSuperAdmin }: { adminUserId: string; isSuperAdmin: boolean }) {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [training, setTraining] = useState<AITraining | null>(null);
  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch areas
  useEffect(() => {
    const fetch = async () => {
      let q = supabase.from("member_areas").select("slug, title, icon").eq("active", true).order("position");
      q = q.eq("owner_id", adminUserId);
      const { data } = await q;
      const list = (data || []) as AreaOption[];
      setAreas(list);
      if (list.length > 0 && !selectedArea) setSelectedArea(list[0].slug);
    };
    fetch();
  }, [adminUserId]);

  // Fetch training + templates + refunds when area changes
  useEffect(() => {
    if (!selectedArea) return;
    fetchTraining();
    fetchTemplates();
    fetchRefunds();
  }, [selectedArea]);

  const fetchTraining = async () => {
    const { data } = await supabase.from("ai_training").select("*").eq("area_slug", selectedArea).maybeSingle();
    if (data) {
      setTraining({
        ...data,
        qa_pairs: (data.qa_pairs as QAPair[] || []),
        ai_name: data.ai_name || "Ana",
        ai_tone: data.ai_tone || "friendly",
      });
    } else {
      setTraining({ ...emptyTraining, area_slug: selectedArea });
    }
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from("email_funnel_templates").select("*").eq("area_slug", selectedArea).order("position");
    if (data && data.length > 0) {
      setTemplates(data as FunnelTemplate[]);
    } else {
      // Create default 5 empty templates
      setTemplates(DELAY_LABELS.map(d => ({
        area_slug: selectedArea, position: d.position,
        subject: "", body: "", delay_hours: d.default_hours,
      })));
    }
  };

  const fetchRefunds = async () => {
    const { data } = await supabase.from("refund_requests").select("*").eq("area_slug", selectedArea).order("created_at", { ascending: false });
    setRefunds((data || []) as RefundRequest[]);
  };

  // Save AI training
  const saveTraining = async () => {
    if (!training) return;
    setSaving(true);
    const payload = {
      area_slug: selectedArea,
      ai_name: training.ai_name,
      ai_tone: training.ai_tone,
      qa_pairs: training.qa_pairs,
      retention_attempt_1: training.retention_attempt_1,
      retention_attempt_2: training.retention_attempt_2,
      retention_final: training.retention_final,
      extra_context: training.extra_context,
      support_email: training.support_email,
      google_connected: training.google_connected,
      updated_at: new Date().toISOString(),
    };

    if (training.id) {
      await supabase.from("ai_training").update(payload).eq("id", training.id);
    } else {
      const { data } = await supabase.from("ai_training").insert(payload).select("id").single();
      if (data) setTraining({ ...training, id: data.id });
    }
    toast.success("Treinamento salvo!");
    setSaving(false);
  };

  // Save funnel templates
  const saveTemplates = async () => {
    setSaving(true);
    for (const t of templates) {
      const payload = {
        area_slug: selectedArea, position: t.position,
        subject: t.subject, body: t.body, delay_hours: t.delay_hours,
        updated_at: new Date().toISOString(),
      };
      if (t.id) {
        await supabase.from("email_funnel_templates").update(payload).eq("id", t.id);
      } else {
        const { data } = await supabase.from("email_funnel_templates").upsert(payload, { onConflict: "area_slug,position" }).select("id").single();
        if (data) t.id = data.id;
      }
    }
    toast.success("Funil de emails salvo!");
    setSaving(false);
  };

  // Q&A helpers
  const addQA = () => {
    if (!training) return;
    setTraining({ ...training, qa_pairs: [...training.qa_pairs, { q: "", a: "" }] });
  };
  const removeQA = (idx: number) => {
    if (!training) return;
    setTraining({ ...training, qa_pairs: training.qa_pairs.filter((_, i) => i !== idx) });
  };
  const updateQA = (idx: number, field: "q" | "a", value: string) => {
    if (!training) return;
    const pairs = [...training.qa_pairs];
    pairs[idx] = { ...pairs[idx], [field]: value };
    setTraining({ ...training, qa_pairs: pairs });
  };

  // Template helpers
  const updateTemplate = (pos: number, field: "subject" | "body" | "delay_hours", value: string | number) => {
    setTemplates(prev => prev.map(t => t.position === pos ? { ...t, [field]: value } : t));
  };

  const areaLabel = areas.find(a => a.slug === selectedArea);

  if (areas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Nenhuma área de membros encontrada.</p>
        <p className="text-sm mt-1">Crie uma área primeiro na aba "Áreas".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Area selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Área:</span>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {areas.map(a => (
              <SelectItem key={a.slug} value={a.slug}>{a.icon} {a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1">
          <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email Suporte</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Bot className="h-4 w-4" /> Treinar IA</TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2"><Send className="h-4 w-4" /> Funil de Emails</TabsTrigger>
          <TabsTrigger value="refunds" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Reembolsos
            {refunds.filter(r => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{refunds.filter(r => r.status === "pending").length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══ EMAIL SUPORTE TAB ═══ */}
        <TabsContent value="email" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" /> Email de Suporte — {areaLabel?.icon} {areaLabel?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Conecte um email Gmail para o n8n monitorar e responder automaticamente.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Email Gmail</label>
                <Input
                  placeholder="suporte@gmail.com"
                  value={training?.support_email || ""}
                  onChange={e => training && setTraining({ ...training, support_email: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                {training?.google_connected ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                    <AlertCircle className="h-3 w-3 mr-1" /> Não conectado
                  </Badge>
                )}
                <Button size="sm" variant="outline" disabled className="gap-2 opacity-60">
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Conectar com Google (em breve)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A integração OAuth com Google será ativada em breve. Por enquanto, configure o email e a App Password diretamente no n8n.
              </p>
            </div>

            <Button onClick={saveTraining} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </TabsContent>

        {/* ═══ TREINAR IA TAB ═══ */}
        <TabsContent value="ai" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" /> Treinamento da IA — {areaLabel?.icon} {areaLabel?.title}
            </h3>

            {/* AI Name + Tone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome da IA</label>
                <Input
                  placeholder="Ana"
                  value={training?.ai_name || ""}
                  onChange={e => training && setTraining({ ...training, ai_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Como a IA se apresenta ao cliente</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tom de voz</label>
                <Select
                  value={training?.ai_tone || "friendly"}
                  onValueChange={v => training && setTraining({ ...training, ai_tone: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">😊 Amigável</SelectItem>
                    <SelectItem value="professional">💼 Profissional</SelectItem>
                    <SelectItem value="technical">🔧 Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Q&A Pairs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Perguntas e Respostas
                </h4>
                <Button size="sm" variant="outline" onClick={addQA} className="gap-1">
                  <Plus className="h-3 w-3" /> Adicionar P&R
                </Button>
              </div>

              {training?.qa_pairs.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                  Nenhuma P&R adicionada. Clique em "Adicionar P&R" para treinar a IA.
                </p>
              )}

              {training?.qa_pairs.map((pair, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">P&R #{idx + 1}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeQA(idx)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Pergunta do cliente:</label>
                    <Input
                      placeholder="Ex: Como faço para acessar o curso?"
                      value={pair.q}
                      onChange={e => updateQA(idx, "q", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Resposta da IA:</label>
                    <Textarea
                      placeholder="Ex: Acesse xmembers.app/seu-curso, digite seu email..."
                      value={pair.a}
                      onChange={e => updateQA(idx, "a", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Retention Strategy */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Estratégia de Retenção (cancelamento)
              </h4>
              <div>
                <label className="text-sm font-medium">1ª tentativa de reter:</label>
                <Textarea
                  placeholder="Ex: Entendo sua frustração! Vi que você ainda não acessou o módulo 2..."
                  value={training?.retention_attempt_1 || ""}
                  onChange={e => training && setTraining({ ...training, retention_attempt_1: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">2ª tentativa (se insistir):</label>
                <Textarea
                  placeholder="Ex: Posso te oferecer acesso ao módulo bônus exclusivo..."
                  value={training?.retention_attempt_2 || ""}
                  onChange={e => training && setTraining({ ...training, retention_attempt_2: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mensagem final (escalar para admin):</label>
                <Textarea
                  placeholder="Ex: Ok, entendo perfeitamente. Vou encaminhar seu pedido..."
                  value={training?.retention_final || ""}
                  onChange={e => training && setTraining({ ...training, retention_final: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Extra context */}
            <div>
              <label className="text-sm font-medium">Contexto extra (opcional)</label>
              <Textarea
                placeholder="Ex: O curso ensina alemão do zero. O diferencial é a metodologia imersiva com anime..."
                value={training?.extra_context || ""}
                onChange={e => training && setTraining({ ...training, extra_context: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Informações sobre o produto/nicho que ajudam a IA a responder melhor</p>
            </div>

            <Button onClick={saveTraining} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Treinamento
            </Button>
          </div>
        </TabsContent>

        {/* ═══ FUNIL DE EMAILS TAB ═══ */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Send className="h-5 w-5" /> Funil de Emails — {areaLabel?.icon} {areaLabel?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure os 5 emails que serão enviados automaticamente após a compra.
              Use <code className="bg-muted px-1 rounded">{"{name}"}</code>, <code className="bg-muted px-1 rounded">{"{email}"}</code>, <code className="bg-muted px-1 rounded">{"{access_link}"}</code> como variáveis.
            </p>

            <div className="space-y-4">
              {DELAY_LABELS.map(d => {
                const tpl = templates.find(t => t.position === d.position);
                return (
                  <div key={d.position} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{d.label}</h4>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Delay (horas):</label>
                        <Input
                          type="number"
                          className="w-20 h-8 text-sm"
                          value={tpl?.delay_hours ?? d.default_hours}
                          onChange={e => updateTemplate(d.position, "delay_hours", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Assunto:</label>
                      <Input
                        placeholder="Ex: Seu acesso está liberado!"
                        value={tpl?.subject || ""}
                        onChange={e => updateTemplate(d.position, "subject", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Corpo do email (HTML):</label>
                      <Textarea
                        placeholder="Ex: Olá {name}, seu acesso ao curso está liberado! Acesse aqui: {access_link}"
                        value={tpl?.body || ""}
                        onChange={e => updateTemplate(d.position, "body", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={saveTemplates} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Funil
            </Button>
          </div>
        </TabsContent>

        {/* ═══ REEMBOLSOS TAB ═══ */}
        <TabsContent value="refunds" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" /> Reembolsos — {areaLabel?.icon} {areaLabel?.title}
              </h3>
              <Button size="sm" variant="outline" onClick={fetchRefunds} className="gap-1">
                <RefreshCw className="h-3 w-3" /> Atualizar
              </Button>
            </div>

            {refunds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">
                Nenhum pedido de reembolso para esta área.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map(r => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3 font-mono text-xs">{r.buyer_email}</td>
                        <td className="p-3">
                          <Badge variant={r.status === "pending" ? "destructive" : r.status === "refunded" ? "default" : "outline"}>
                            {r.status === "pending" ? "Pendente" : r.status === "refunded" ? "Reembolsado" : r.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
