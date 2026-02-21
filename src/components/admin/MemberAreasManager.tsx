import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Globe, Link, GripVertical, Eye, EyeOff, Pencil, ChevronDown, ChevronUp, Type } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const LANG_OPTIONS = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
] as const;

const CUSTOM_LABEL_FIELDS = [
  { key: "audioTitle", label: "Título do Áudio", placeholder: "Ex: Meditação Guiada", defaultPt: "Meditação Guiada" },
  { key: "audioDescription", label: "Descrição do Áudio", placeholder: "Ex: Pressione play para ouvir", defaultPt: "Pressione play para ouvir" },
  { key: "ebookTitle", label: "Título do E-book", placeholder: "Ex: Este conteúdo é um E-book", defaultPt: "Este conteúdo é um E-book" },
  { key: "ebookDescription", label: "Descrição do E-book", placeholder: "Ex: Clique no botão abaixo para baixar o PDF", defaultPt: "Clique no botão abaixo para baixar o PDF e ler no seu dispositivo." },
  { key: "videoPlaceholder", label: "Placeholder do Vídeo", placeholder: "Ex: Vídeo em breve", defaultPt: "Insira o código do vídeo aqui" },
] as const;

interface MemberArea {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  button_text: string;
  lang_code: string;
  support_email: string;
  custom_labels: Record<string, string> | null;
  active: boolean;
  position: number;
  owner_id: string | null;
}

interface MemberAreasManagerProps {
  adminUserId: string;
  isSuperAdmin: boolean;
}

export function MemberAreasManager({ adminUserId, isSuperAdmin }: MemberAreasManagerProps) {
  const [areas, setAreas] = useState<MemberArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MemberArea>>({});
  const [editLabels, setEditLabels] = useState<Record<string, string>>({});
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ slug: "", title: "", subtitle: "", icon: "", button_text: "Acessar", lang_code: "pt", support_email: "" });
  const [saving, setSaving] = useState(false);

  const fetchAreas = async () => {
    setLoading(true);
    let query = supabase
      .from("member_areas")
      .select("*")
      .order("position");
    query = query.eq("owner_id", adminUserId);
    const { data } = await query;
    setAreas((data as MemberArea[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAreas(); }, []);

  const handleCreate = async () => {
    if (!newForm.slug.trim() || !newForm.title.trim() || !newForm.subtitle.trim()) {
      toast.error("Preencha slug, título e subtítulo");
      return;
    }
    const slug = newForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSaving(true);
    const { error } = await supabase.from("member_areas").insert({
      slug,
      title: newForm.title.trim(),
      subtitle: newForm.subtitle.trim(),
      icon: newForm.icon.trim(),
      button_text: newForm.button_text.trim() || "Acessar",
      lang_code: newForm.lang_code,
      support_email: newForm.support_email.trim() || undefined,
      position: areas.length,
      owner_id: adminUserId,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este slug já existe" : `Erro ao criar área: ${error.message}`);
    } else {
      toast.success("Área criada!");
      setNewForm({ slug: "", title: "", subtitle: "", icon: "", button_text: "Acessar", lang_code: "pt", support_email: "" });
      setShowNew(false);
      fetchAreas();
    }
    setSaving(false);
  };

  const handleEdit = (area: MemberArea) => {
    setEditingId(area.id);
    setEditForm({ slug: area.slug, title: area.title, subtitle: area.subtitle, icon: area.icon, button_text: area.button_text, lang_code: area.lang_code || "pt", support_email: area.support_email || "" });
    setEditLabels(area.custom_labels || {});
    setLabelsOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.slug?.trim() || !editForm.title?.trim()) return;
    setSaving(true);
    const slug = editForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Filter out empty labels
    const cleanLabels: Record<string, string> = {};
    for (const [k, v] of Object.entries(editLabels)) {
      if (v.trim()) cleanLabels[k] = v.trim();
    }

    const { error } = await supabase.from("member_areas").update({
      slug,
      title: editForm.title?.trim(),
      subtitle: editForm.subtitle?.trim(),
      icon: editForm.icon?.trim(),
      button_text: editForm.button_text?.trim() || "Acessar",
      lang_code: editForm.lang_code || "pt",
      support_email: editForm.support_email?.trim() || undefined,
      custom_labels: Object.keys(cleanLabels).length > 0 ? cleanLabels : null,
    }).eq("id", editingId);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este slug já existe" : "Erro ao salvar");
    } else {
      toast.success("Área atualizada!");
      setEditingId(null);
      setLabelsOpen(false);
      fetchAreas();
    }
    setSaving(false);
  };

  const handleToggleActive = async (area: MemberArea) => {
    await supabase.from("member_areas").update({ active: !area.active }).eq("id", area.id);
    fetchAreas();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta área?")) return;
    await supabase.from("member_areas").delete().eq("id", id);
    toast.success("Área excluída");
    fetchAreas();
  };

  const getLangLabel = (code: string) => LANG_OPTIONS.find((l) => l.code === code)?.label || code;

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando áreas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Áreas de Membros</h2>
          <p className="text-sm text-muted-foreground">Gerencie suas áreas de membros e links de acesso</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Área
        </Button>
      </div>

      {/* New area form */}
      {showNew && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" /> Criar Nova Área
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Slug (URL)*</label>
              <Input
                placeholder="meu-curso"
                value={newForm.slug}
                onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Link: /{newForm.slug || "..."}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Idioma da Área*</label>
              <Select value={newForm.lang_code} onValueChange={(v) => setNewForm({ ...newForm, lang_code: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANG_OPTIONS.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Título*</label>
              <Input
                placeholder="Mestra Lian"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Subtítulo*</label>
              <Input
                placeholder="Caminhando com Lian"
                value={newForm.subtitle}
                onChange={(e) => setNewForm({ ...newForm, subtitle: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ícone/Emoji</label>
              <Input
                placeholder="🇧🇷 ou L"
                value={newForm.icon}
                onChange={(e) => setNewForm({ ...newForm, icon: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Texto do Botão</label>
              <Input
                placeholder="Acessar"
                value={newForm.button_text}
                onChange={(e) => setNewForm({ ...newForm, button_text: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Email de Suporte</label>
              <Input
                type="email"
                placeholder="suporte@exemplo.com"
                value={newForm.support_email}
                onChange={(e) => setNewForm({ ...newForm, support_email: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Exibido na tela de login e rodapé das aulas</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Criar
            </Button>
          </div>
        </div>
      )}

      {/* Areas list */}
      <div className="space-y-2">
        {areas.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma área criada.</p>
          </div>
        ) : (
          areas.map((area) => (
            <div key={area.id} className={`bg-card border rounded-lg overflow-hidden ${area.active ? "border-border" : "border-border/50 opacity-60"}`}>
              {editingId === area.id ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Slug (URL)</label>
                      <Input
                        value={editForm.slug || ""}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Link: /{editForm.slug || "..."}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Idioma da Área</label>
                      <Select value={editForm.lang_code || "pt"} onValueChange={(v) => setEditForm({ ...editForm, lang_code: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANG_OPTIONS.map((l) => (
                            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Título</label>
                      <Input
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Subtítulo</label>
                      <Input
                        value={editForm.subtitle || ""}
                        onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Ícone/Emoji</label>
                      <Input
                        value={editForm.icon || ""}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Texto do Botão</label>
                      <Input
                        value={editForm.button_text || ""}
                        onChange={(e) => setEditForm({ ...editForm, button_text: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground">Email de Suporte</label>
                      <Input
                        type="email"
                        placeholder="suporte@exemplo.com"
                        value={editForm.support_email || ""}
                        onChange={(e) => setEditForm({ ...editForm, support_email: e.target.value })}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Exibido na tela de login e rodapé das aulas</p>
                    </div>
                  </div>

                  {/* Custom Labels Section */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setLabelsOpen(!labelsOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Type className="h-4 w-4" />
                        Personalizar Textos da Área
                      </span>
                      {labelsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {labelsOpen && (
                      <div className="p-4 space-y-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para usar o texto padrão do idioma selecionado. Personalize apenas o que quiser.
                        </p>
                        {CUSTOM_LABEL_FIELDS.map((field) => (
                          <div key={field.key}>
                            <label className="text-xs text-muted-foreground">{field.label}</label>
                            <Input
                              value={editLabels[field.key] || ""}
                              onChange={(e) => setEditLabels({ ...editLabels, [field.key]: e.target.value })}
                              placeholder={field.placeholder}
                              className="mt-1 text-sm"
                            />
                            <p className="text-xs text-muted-foreground/60 mt-0.5">Padrão: {field.defaultPt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setLabelsOpen(false); }}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-4 p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg">{area.icon || area.title[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{area.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{area.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {getLangLabel(area.lang_code)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1">
                      <Link className="h-3 w-3" /> /{area.slug}
                    </span>
                    {area.custom_labels && Object.keys(area.custom_labels).length > 0 && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                        <Type className="h-3 w-3" /> Personalizado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(area)} className="h-8 w-8 p-0" title={area.active ? "Desativar" : "Ativar"}>
                      {area.active ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(area)} className="h-8 w-8 p-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(area.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
