import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X, Eye, EyeOff, Pencil, ExternalLink, ShoppingCart, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CheckoutPage {
  id: string;
  slug: string;
  title: string;
  offer_code: string;
  description: string | null;
  owner_id: string;
  active: boolean;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

interface CheckoutPagesManagerProps {
  adminUserId: string;
  isSuperAdmin: boolean;
}

export function CheckoutPagesManager({ adminUserId, isSuperAdmin }: CheckoutPagesManagerProps) {
  const [pages, setPages] = useState<CheckoutPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CheckoutPage>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ slug: "", title: "", offer_code: "", description: "", custom_css: "" });
  const [saving, setSaving] = useState(false);
  const [showCssField, setShowCssField] = useState(false);
  const [showEditCss, setShowEditCss] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("checkout_pages")
      .select("*")
      .eq("owner_id", adminUserId)
      .order("created_at", { ascending: false });
    setPages((data as CheckoutPage[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const handleCreate = async () => {
    if (!newForm.slug.trim() || !newForm.title.trim() || !newForm.offer_code.trim()) {
      toast.error("Preencha slug, título e código do offer");
      return;
    }
    const slug = newForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSaving(true);
    const { error } = await supabase.from("checkout_pages").insert({
      slug,
      title: newForm.title.trim(),
      offer_code: newForm.offer_code.trim(),
      description: newForm.description.trim() || null,
      custom_css: newForm.custom_css.trim() || null,
      owner_id: adminUserId,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Esse slug já existe" : "Erro: " + error.message);
      return;
    }
    toast.success("Página de checkout criada!");
    setNewForm({ slug: "", title: "", offer_code: "", description: "", custom_css: "" });
    setShowNew(false);
    setShowCssField(false);
    fetchPages();
  };

  const startEdit = (page: CheckoutPage) => {
    setEditingId(page.id);
    setEditForm({ ...page });
    setShowEditCss(!!page.custom_css);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.slug?.trim() || !editForm.title?.trim() || !editForm.offer_code?.trim()) {
      toast.error("Preencha slug, título e código do offer");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("checkout_pages").update({
      slug: editForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      title: editForm.title.trim(),
      offer_code: editForm.offer_code.trim(),
      description: editForm.description?.trim() || null,
      custom_css: editForm.custom_css?.trim() || null,
    }).eq("id", editingId);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Esse slug já existe" : "Erro: " + error.message);
      return;
    }
    toast.success("Atualizado!");
    setEditingId(null);
    fetchPages();
  };

  const handleToggleActive = async (page: CheckoutPage) => {
    const { error } = await supabase.from("checkout_pages").update({ active: !page.active }).eq("id", page.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(page.active ? "Desativado" : "Ativado");
    fetchPages();
  };

  const handleDelete = async (page: CheckoutPage) => {
    if (!confirm(`Excluir a página "${page.title}"?`)) return;
    const { error } = await supabase.from("checkout_pages").delete().eq("id", page.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Excluído!");
    fetchPages();
  };

  const getCheckoutUrl = (slug: string) => {
    return `${window.location.origin}/checkout/${slug}`;
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getCheckoutUrl(slug));
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Páginas de Checkout
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Crie páginas com o checkout da Hotmart embutido. Basta colar o código do offer.
          </p>
        </div>
        {!showNew && (
          <Button onClick={() => setShowNew(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Nova Página
          </Button>
        )}
      </div>

      {/* New page form */}
      {showNew && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-zinc-200">Nova Página de Checkout</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Slug (URL)</label>
              <Input
                value={newForm.slug}
                onChange={e => setNewForm({ ...newForm, slug: e.target.value })}
                placeholder="meu-produto"
                className="bg-zinc-900 border-zinc-700"
              />
              {newForm.slug && (
                <p className="text-xs text-zinc-500 mt-1">
                  {getCheckoutUrl(newForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Título</label>
              <Input
                value={newForm.title}
                onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                placeholder="Nome do produto ou curso"
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Código do Offer (Hotmart)</label>
            <Input
              value={newForm.offer_code}
              onChange={e => setNewForm({ ...newForm, offer_code: e.target.value })}
              placeholder="Ex: ABC123DEF ou cole o código do hotlink"
              className="bg-zinc-900 border-zinc-700"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Encontre no Hotmart → Produto → Hotlinks. É o código que aparece no link de pagamento.
            </p>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Descrição (opcional)</label>
            <Textarea
              value={newForm.description}
              onChange={e => setNewForm({ ...newForm, description: e.target.value })}
              placeholder="Texto que aparece acima do checkout"
              className="bg-zinc-900 border-zinc-700 min-h-[60px]"
            />
          </div>

          {!showCssField ? (
            <button onClick={() => setShowCssField(true)} className="text-xs text-violet-400 hover:underline">
              + CSS customizado (avançado)
            </button>
          ) : (
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">CSS Customizado (opcional)</label>
              <Textarea
                value={newForm.custom_css}
                onChange={e => setNewForm({ ...newForm, custom_css: e.target.value })}
                placeholder="body { background: #f0f0f0; }"
                className="bg-zinc-900 border-zinc-700 font-mono text-xs min-h-[60px]"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Criar Página"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowNew(false); setShowCssField(false); }}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-zinc-500 text-center py-8">Carregando...</p>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma página de checkout criada.</p>
          <p className="text-sm mt-1">Clique em "Nova Página" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
              {editingId === page.id ? (
                /* Edit mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Slug (URL)</label>
                      <Input
                        value={editForm.slug || ""}
                        onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Título</label>
                      <Input
                        value={editForm.title || ""}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Código do Offer</label>
                    <Input
                      value={editForm.offer_code || ""}
                      onChange={e => setEditForm({ ...editForm, offer_code: e.target.value })}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Descrição</label>
                    <Textarea
                      value={editForm.description || ""}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="bg-zinc-900 border-zinc-700 min-h-[60px]"
                    />
                  </div>
                  {!showEditCss ? (
                    <button onClick={() => setShowEditCss(true)} className="text-xs text-violet-400 hover:underline">
                      + CSS customizado
                    </button>
                  ) : (
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">CSS Customizado</label>
                      <Textarea
                        value={editForm.custom_css || ""}
                        onChange={e => setEditForm({ ...editForm, custom_css: e.target.value })}
                        className="bg-zinc-900 border-zinc-700 font-mono text-xs min-h-[60px]"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={saving} size="sm" className="gap-2">
                      <Save className="h-3 w-3" /> {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setShowEditCss(false); }}>
                      <X className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-100 truncate">{page.title}</h3>
                      <Badge variant={page.active ? "default" : "secondary"} className="text-xs shrink-0">
                        {page.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                        /checkout/{page.slug}
                      </code>
                      <code className="text-xs text-violet-400 bg-violet-950/30 px-2 py-0.5 rounded">
                        {page.offer_code}
                      </code>
                    </div>
                    {page.description && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">{page.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => copyUrl(page.slug)} title="Copiar link">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="Abrir página">
                      <a href={getCheckoutUrl(page.slug)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(page)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(page)} title={page.active ? "Desativar" : "Ativar"}>
                      {page.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(page)} className="text-red-400 hover:text-red-300" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
