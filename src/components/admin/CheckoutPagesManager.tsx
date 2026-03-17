import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Eye, EyeOff, Pencil, ExternalLink, ShoppingCart, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CheckoutPage {
  id: string;
  slug: string;
  title: string;
  offer_code: string;
  payment_provider: "hotmart" | "stripe";
  stripe_payment_link: string | null;
  owner_id: string;
  active: boolean;
  created_at: string;
}

interface CheckoutPagesManagerProps {
  adminUserId: string;
  isSuperAdmin: boolean;
}

export function CheckoutPagesManager({ adminUserId, isSuperAdmin }: CheckoutPagesManagerProps) {
  const [pages, setPages] = useState<CheckoutPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ slug: string; offer_code: string; payment_provider: "hotmart" | "stripe"; stripe_payment_link: string }>({ slug: "", offer_code: "", payment_provider: "hotmart", stripe_payment_link: "" });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ slug: "", offer_code: "", payment_provider: "hotmart" as "hotmart" | "stripe", stripe_payment_link: "" });
  const [saving, setSaving] = useState(false);

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
    if (!newForm.slug.trim()) {
      toast.error("Preencha o slug");
      return;
    }
    if (newForm.payment_provider === "hotmart" && !newForm.offer_code.trim()) {
      toast.error("Preencha o link de pagamento Hotmart");
      return;
    }
    if (newForm.payment_provider === "stripe" && !newForm.stripe_payment_link.trim()) {
      toast.error("Preencha o Stripe Payment Link");
      return;
    }
    const slug = newForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSaving(true);
    const { error } = await supabase.from("checkout_pages").insert({
      slug,
      title: slug,
      offer_code: newForm.payment_provider === "hotmart" ? newForm.offer_code.trim() : "",
      payment_provider: newForm.payment_provider,
      stripe_payment_link: newForm.payment_provider === "stripe" ? newForm.stripe_payment_link.trim() : null,
      owner_id: adminUserId,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Esse slug já existe" : "Erro: " + error.message);
      return;
    }
    toast.success("Página de checkout criada!");
    setNewForm({ slug: "", offer_code: "", payment_provider: "hotmart", stripe_payment_link: "" });
    setShowNew(false);
    fetchPages();
  };

  const startEdit = (page: CheckoutPage) => {
    setEditingId(page.id);
    setEditForm({ slug: page.slug, offer_code: page.offer_code, payment_provider: page.payment_provider || "hotmart", stripe_payment_link: page.stripe_payment_link || "" });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.slug?.trim()) {
      toast.error("Preencha o slug");
      return;
    }
    if (editForm.payment_provider === "hotmart" && !editForm.offer_code?.trim()) {
      toast.error("Preencha o link de pagamento Hotmart");
      return;
    }
    if (editForm.payment_provider === "stripe" && !editForm.stripe_payment_link?.trim()) {
      toast.error("Preencha o Stripe Payment Link");
      return;
    }
    setSaving(true);
    const slug = editForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const { error } = await supabase.from("checkout_pages").update({
      slug,
      title: slug,
      offer_code: editForm.payment_provider === "hotmart" ? editForm.offer_code.trim() : "",
      payment_provider: editForm.payment_provider,
      stripe_payment_link: editForm.payment_provider === "stripe" ? editForm.stripe_payment_link.trim() : null,
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
    if (!confirm(`Excluir a página "/checkout/${page.slug}"?`)) return;
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
            Crie páginas com o checkout da Hotmart embutido via iframe.
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
            <label className="text-xs text-zinc-400 mb-1 block">Provedor de Pagamento</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setNewForm({ ...newForm, payment_provider: "hotmart" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${newForm.payment_provider === "hotmart" ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}
              >
                Hotmart
              </button>
              <button
                onClick={() => setNewForm({ ...newForm, payment_provider: "stripe" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${newForm.payment_provider === "stripe" ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}
              >
                Stripe
              </button>
            </div>
          </div>

          {newForm.payment_provider === "hotmart" ? (
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Link de Pagamento (Hotmart)</label>
              <Input
                value={newForm.offer_code}
                onChange={e => setNewForm({ ...newForm, offer_code: e.target.value })}
                placeholder="Ex: https://pay.hotmart.com/ABC123DEF"
                className="bg-zinc-900 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Cole o link completo do checkout. Encontre em Hotmart &rarr; Produto &rarr; Hotlinks.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Stripe Payment Link</label>
              <Input
                value={newForm.stripe_payment_link}
                onChange={e => setNewForm({ ...newForm, stripe_payment_link: e.target.value })}
                placeholder="Ex: https://buy.stripe.com/abc123"
                className="bg-zinc-900 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Crie em Stripe Dashboard &rarr; Payment Links &rarr; Novo link. Cole a URL aqui.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Criar Página"}
            </Button>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
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
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Slug (URL)</label>
                    <Input
                      value={editForm.slug}
                      onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Provedor de Pagamento</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setEditForm({ ...editForm, payment_provider: "hotmart" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${editForm.payment_provider === "hotmart" ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-zinc-900 border-zinc-700 text-zinc-400"}`}
                      >
                        Hotmart
                      </button>
                      <button
                        onClick={() => setEditForm({ ...editForm, payment_provider: "stripe" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${editForm.payment_provider === "stripe" ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-zinc-900 border-zinc-700 text-zinc-400"}`}
                      >
                        Stripe
                      </button>
                    </div>
                  </div>
                  {editForm.payment_provider === "hotmart" ? (
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Link de Pagamento (Hotmart)</label>
                      <Input
                        value={editForm.offer_code}
                        onChange={e => setEditForm({ ...editForm, offer_code: e.target.value })}
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Stripe Payment Link</label>
                      <Input
                        value={editForm.stripe_payment_link}
                        onChange={e => setEditForm({ ...editForm, stripe_payment_link: e.target.value })}
                        className="bg-zinc-900 border-zinc-700"
                        placeholder="https://buy.stripe.com/abc123"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={saving} size="sm" className="gap-2">
                      <Save className="h-3 w-3" /> {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm text-zinc-100 font-semibold">/checkout/{page.slug}</code>
                      <Badge variant={page.active ? "default" : "secondary"} className="text-xs shrink-0">
                        {page.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className={`text-xs shrink-0 ${page.payment_provider === "stripe" ? "border-purple-500/40 text-purple-400" : "border-orange-500/40 text-orange-400"}`}>
                        {page.payment_provider === "stripe" ? "Stripe" : "Hotmart"}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 truncate">
                      {page.payment_provider === "stripe" ? page.stripe_payment_link : page.offer_code}
                    </p>
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
