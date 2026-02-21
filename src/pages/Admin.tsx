import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, MessageCircle, LogOut, Users, Shield, Globe, Trash2, UserPlus, Clock, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BookOpen, Bell, Monitor, Smartphone, Tablet, CheckCircle2, Search, Link2 } from "lucide-react";
import { CourseContentManager } from "@/components/admin/CourseContentManager";
import { MemberAreasManager } from "@/components/admin/MemberAreasManager";
import { IntegrationsManager } from "@/components/admin/IntegrationsManager";
import { toast } from "sonner";
// Emails com acesso admin (adicione mais emails aqui)
const ADMIN_EMAILS = [
  "contatoluishenrick@gmail.com",
];

interface AreaLabel {
  slug: string;
  title: string;
  icon: string;
}

interface AdminComment {
  id: string;
  lesson_id: string;
  content: string;
  status: string;
  language: string;
  created_at: string;
  user_email: string;
}

interface AccessLog {
  id: string;
  email: string;
  language: string;
  accessed_at: string;
  user_id: string;
  device_type?: string;
}

interface UserRating {
  lesson_id: string;
  rating: number;
  language: string;
  created_at: string;
}

interface UserComment {
  lesson_id: string;
  content: string;
  language: string;
  status: string;
  created_at: string;
}

interface UserCompletion {
  lesson_id: string;
  language: string;
  completed_at: string;
}

interface GroupedUser {
  email: string;
  user_id: string;
  display_name: string | null;
  accesses: AccessLog[];
  ratings: UserRating[];
  userComments: UserComment[];
  completions: UserCompletion[];
  lastAccess: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  email: string;
}

const AdminPanel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [filter, setFilter] = useState("pending");
  const [langFilter, setLangFilter] = useState("all");
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [accessLangFilter, setAccessLangFilter] = useState("all");
  const [groupedUsers, setGroupedUsers] = useState<GroupedUser[]>([]);
  const [dbModules, setDbModules] = useState<{ id: string; title: string; emoji: string; language: string; lessons: { id: string; title: string }[] }[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>("accesses");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [userSearch, setUserSearch] = useState("");
  const [accessPage, setAccessPage] = useState(1);
  const ACCESS_PAGE_SIZE = 20;
  const [areaLabels, setAreaLabels] = useState<AreaLabel[]>([]);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin auth listener (independent from member auth)
  useEffect(() => {
    const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabaseAdmin.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabaseAdmin.auth.signOut();
  };

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    const checkRoles = async () => {
      // Check email-based admin list first
      const isEmailAdmin = ADMIN_EMAILS.includes(user.email || "");

      // Also check database roles
      const { data: userRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
      const roles = userRoles?.map((r) => r.role) || [];
      const isDbAdmin = roles.includes("admin") || roles.includes("super_admin");

      setIsAdmin(isEmailAdmin || isDbAdmin);
      setIsSuperAdmin(isEmailAdmin || roles.includes("super_admin"));
    };
    checkRoles();
  }, [user]);

  // Fetch comments (filter by owned areas for non-super admins)
  const fetchComments = async () => {
    if (!user) return;
    let query = supabaseAdmin.from("comments").select("*").eq("status", filter as "pending" | "approved" | "rejected").order("created_at", { ascending: false });
    if (langFilter !== "all") query = query.eq("language", langFilter);
    else if (areaLabels.length > 0) {
      query = query.in("language", areaLabels.map((a) => a.slug));
    }

    const { data } = await query;
    if (!data) return;

    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, email").in("id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.email]));

    setComments(data.map((c) => ({
      id: c.id, lesson_id: c.lesson_id, content: c.content, status: c.status,
      language: c.language, created_at: c.created_at,
      user_email: profileMap.get(c.user_id) || "Desconhecido",
    })));
  };

  // Fetch access logs + ratings + comments per user (filter by owned areas)
  const fetchAccessLogs = async () => {
    if (!user) return;
    let query = supabaseAdmin.from("access_logs").select("*").order("accessed_at", { ascending: false }).limit(500);
    if (accessLangFilter !== "all") query = query.eq("language", accessLangFilter);
    else if (areaLabels.length > 0) {
      query = query.in("language", areaLabels.map((a) => a.slug));
    }
    const { data } = await query;
    const logs = data || [];
    setAccessLogs(logs);

    const userIds = [...new Set(logs.map((l) => l.user_id))];
    if (userIds.length === 0) { setGroupedUsers([]); return; }

    // Fetch profiles, ratings, comments in parallel
    const [profilesRes, ratingsRes, userCommentsRes, completionsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, display_name").in("id", userIds),
      supabaseAdmin.from("lesson_ratings").select("user_id, lesson_id, rating, language, created_at").in("user_id", userIds).order("created_at", { ascending: false }),
      supabaseAdmin.from("comments").select("user_id, lesson_id, content, language, status, created_at").in("user_id", userIds).order("created_at", { ascending: false }),
      supabaseAdmin.from("lesson_completions").select("user_id, lesson_id, language, completed_at").in("user_id", userIds).order("completed_at", { ascending: false }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
    const ratingsMap = new Map<string, UserRating[]>();
    for (const r of ratingsRes.data || []) {
      if (!ratingsMap.has(r.user_id)) ratingsMap.set(r.user_id, []);
      ratingsMap.get(r.user_id)!.push({ lesson_id: r.lesson_id, rating: r.rating, language: r.language, created_at: r.created_at });
    }
    const commentsMap = new Map<string, UserComment[]>();
    for (const c of userCommentsRes.data || []) {
      if (!commentsMap.has(c.user_id)) commentsMap.set(c.user_id, []);
      commentsMap.get(c.user_id)!.push({ lesson_id: c.lesson_id, content: c.content, language: c.language, status: c.status, created_at: c.created_at });
    }
    const completionsMap = new Map<string, UserCompletion[]>();
    for (const c of completionsRes.data || []) {
      if (!completionsMap.has(c.user_id)) completionsMap.set(c.user_id, []);
      completionsMap.get(c.user_id)!.push({ lesson_id: c.lesson_id, language: c.language, completed_at: c.completed_at });
    }

    const grouped = new Map<string, GroupedUser>();
    for (const log of logs) {
      if (!grouped.has(log.user_id)) {
        const profile = profileMap.get(log.user_id);
        grouped.set(log.user_id, {
          email: log.email,
          user_id: log.user_id,
          display_name: profile?.display_name || null,
          accesses: [],
          ratings: ratingsMap.get(log.user_id) || [],
          userComments: commentsMap.get(log.user_id) || [],
          completions: completionsMap.get(log.user_id) || [],
          lastAccess: log.accessed_at,
        });
      }
      grouped.get(log.user_id)!.accesses.push(log);
    }
    setGroupedUsers(Array.from(grouped.values()));
  };

  // Fetch admin users
  const fetchAdminUsers = async () => {
    if (!user) return;
    const { data: roles } = await supabaseAdmin.from("user_roles").select("*").in("role", ["admin", "super_admin"]);
    if (!roles) return;

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, email").in("id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.email]));

    setAdminUsers(roles.map((r) => ({
      id: r.id, user_id: r.user_id, role: r.role,
      email: profileMap.get(r.user_id) || "Desconhecido",
    })));
  };

  // Fetch pending comment counts per language (filter by owned areas)
  const fetchPendingCounts = async () => {
    if (!user) return;
    let query = supabaseAdmin.from("comments").select("language").eq("status", "pending");
    if (areaLabels.length > 0) {
      query = query.in("language", areaLabels.map((a) => a.slug));
    }
    const { data } = await query;
    if (!data) return;
    const counts: Record<string, number> = {};
    for (const c of data) {
      counts[c.language] = (counts[c.language] || 0) + 1;
    }
    setPendingCounts(counts);
  };

  // Fetch course modules + lessons from DB (filter by owned areas)
  const fetchDbModules = async () => {
    if (!user) return;
    let modQuery = supabaseAdmin.from("course_modules").select("id, title, emoji, language, position").order("position");
    if (areaLabels.length > 0) {
      modQuery = modQuery.in("language", areaLabels.map((a) => a.slug));
    }
    const { data: modules } = await modQuery;
    const { data: lessons } = await supabaseAdmin.from("course_lessons").select("id, title, module_id, position").order("position");
    if (!modules || !lessons) return;
    setDbModules(modules.map((m) => ({
      ...m,
      lessons: lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.position - b.position),
    })));
  };

  // Fetch member areas for dynamic filters (each admin sees only their own areas)
  const fetchAreaLabels = async () => {
    let query = supabaseAdmin.from("member_areas").select("slug, title, icon").eq("active", true).order("position");
    if (user) query = query.eq("owner_id", user.id);
    const { data } = await query;
    setAreaLabels((data || []) as AreaLabel[]);
  };

  // Load area labels first (needed for owner-based filtering in other fetches)
  useEffect(() => { if (isAdmin) fetchAreaLabels(); }, [isAdmin]);
  // Load data that depends on areaLabels for non-super admin filtering
  useEffect(() => { if (isAdmin && areaLabels.length > 0) fetchComments(); }, [isAdmin, areaLabels, filter, langFilter]);
  useEffect(() => { if (isAdmin && areaLabels.length > 0) fetchAccessLogs(); }, [isAdmin, areaLabels, accessLangFilter]);
  useEffect(() => { if (isAdmin) fetchAdminUsers(); }, [isAdmin]);
  useEffect(() => { if (isAdmin && areaLabels.length > 0) fetchPendingCounts(); }, [isAdmin, areaLabels]);
  useEffect(() => { if (isAdmin && areaLabels.length > 0) fetchDbModules(); }, [isAdmin, areaLabels]);
  useEffect(() => { setAccessPage(1); }, [accessLangFilter, userSearch]);

  const getLessonName = (id: string) => {
    for (const mod of dbModules) {
      const lesson = mod.lessons.find((l) => l.id === id);
      if (lesson) return `${mod.emoji} ${mod.title} › ${lesson.title}`;
    }
    return id;
  };

  const filteredUsers = groupedUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q);
  });
  const totalAccessPages = Math.max(1, Math.ceil(filteredUsers.length / ACCESS_PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((accessPage - 1) * ACCESS_PAGE_SIZE, accessPage * ACCESS_PAGE_SIZE);

  const handleModerate = async (commentId: string, newStatus: "approved" | "rejected") => {
    await supabaseAdmin.from("comments").update({ status: newStatus }).eq("id", commentId);
    fetchComments();
    fetchPendingCounts();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabaseAdmin.from("comments").delete().eq("id", commentId);
    fetchComments();
    fetchPendingCounts();
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      toast.error("Preencha email e senha");
      return;
    }
    if (newAdminPassword.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres");
      return;
    }
    setAddingAdmin(true);

    try {
      const res = await fetch("/api/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          password: newAdminPassword.trim(),
          name: newAdminName.trim() || undefined,
          callerUserId: user!.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar administrador");
      } else {
        const msg = data.emailSent
          ? "Administrador criado! As credenciais foram enviadas por email."
          : "Administrador criado com sucesso!";
        toast.success(msg);
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminName("");
        fetchAdminUsers();
      }
    } catch {
      toast.error("Erro de conexão ao criar administrador");
    }
    setAddingAdmin(false);
  };

  const handleRemoveAdmin = async (roleId: string, targetRole: string) => {
    if (targetRole === "super_admin") {
      toast.error("Não é possível remover o administrador principal.");
      return;
    }
    await supabaseAdmin.from("user_roles").delete().eq("id", roleId);
    toast.success("Administrador removido.");
    fetchAdminUsers();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    // Try with provided password first, then with auto password
    const { error } = await signIn(adminEmail, adminPassword);
    if (error) {
      const { error: error2 } = await signIn(adminEmail, "auto_member_access_2024");
      if (error2) toast.error("Credenciais inválidas");
    }
    setLoginLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <Shield className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Faça login com suas credenciais de administrador</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <Input type="email" placeholder="Email do admin" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="h-12" />
            <Input type="password" placeholder="Senha" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="h-12" />
            <Button type="submit" className="w-full h-12" disabled={loginLoading}>Entrar</Button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Verificando permissões...</p></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <Shield className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Você está logado como usuário comum. Faça login com credenciais de administrador.</p>
          </div>
          <form onSubmit={async (e) => { e.preventDefault(); setLoginLoading(true); await signOut(); const { error } = await signIn(adminEmail, adminPassword); if (error) { const { error: error2 } = await signIn(adminEmail, "auto_member_access_2024"); if (error2) toast.error("Credenciais inválidas"); } setLoginLoading(false); }} className="space-y-4">
            <Input type="email" placeholder="Email do admin" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="h-12" />
            <Input type="password" placeholder="Senha" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="h-12" />
            <Button type="submit" className="w-full h-12" disabled={loginLoading}>Entrar como Admin</Button>
          </form>
        </div>
      </div>
    );
  }

  const getAreaLabel = (slug: string) => {
    const area = areaLabels.find((a) => a.slug === slug);
    return area ? `${area.icon || area.title[0]} ${area.title}` : slug;
  };

  const LanguageFilter = ({ value, onChange, counts }: { value: string; onChange: (v: string) => void; counts?: Record<string, number> }) => {
    const totalPending = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <span>Todas as áreas</span>
              {counts && totalPending > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{totalPending}</Badge>
              )}
            </span>
          </SelectItem>
          {areaLabels.map((area) => (
            <SelectItem key={area.slug} value={area.slug}>
              <span className="flex items-center gap-2">
                <span>{area.icon || area.title[0]}</span>
                <span>{area.title}</span>
                {counts && (counts[area.slug] || 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{counts[area.slug]}</Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
          {isSuperAdmin && <Badge variant="secondary" className="text-xs">Super Admin</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full justify-start mb-6 h-auto flex-wrap gap-1">
            <TabsTrigger value="content" className="gap-2"><BookOpen className="h-4 w-4" /> Conteúdo</TabsTrigger>
            <TabsTrigger value="comments" className="gap-2"><MessageCircle className="h-4 w-4" /> Comentários</TabsTrigger>
            <TabsTrigger value="access" className="gap-2"><Users className="h-4 w-4" /> Acessos</TabsTrigger>
            <TabsTrigger value="areas" className="gap-2"><Globe className="h-4 w-4" /> Áreas</TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2"><Link2 className="h-4 w-4" /> Integrações</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="admins" className="gap-2"><Shield className="h-4 w-4" /> Administradores</TabsTrigger>
            )}
          </TabsList>

          {/* CONTENT CMS TAB */}
          <TabsContent value="content">
            <CourseContentManager adminUserId={user.id} isSuperAdmin={isSuperAdmin} />
          </TabsContent>

          {/* AREAS TAB */}
          <TabsContent value="areas">
            <MemberAreasManager adminUserId={user.id} isSuperAdmin={isSuperAdmin} />
          </TabsContent>

          {/* INTEGRATIONS TAB */}
          <TabsContent value="integrations">
            <IntegrationsManager adminUserId={user.id} isSuperAdmin={isSuperAdmin} />
          </TabsContent>

          {/* COMMENTS TAB */}
          <TabsContent value="comments" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {(["pending", "approved", "rejected"] as const).map((status) => (
                  <Button key={status} variant={filter === status ? "default" : "outline"} size="sm" onClick={() => setFilter(status)}>
                    {status === "pending" ? "Pendentes" : status === "approved" ? "Aprovados" : "Rejeitados"}
                  </Button>
                ))}
              </div>
              <LanguageFilter value={langFilter} onChange={setLangFilter} counts={pendingCounts} />
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum comentário {filter === "pending" ? "pendente" : filter === "approved" ? "aprovado" : "rejeitado"}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{comment.user_email}</span>
                          <Badge variant="outline" className="text-xs">{getAreaLabel(comment.language)}</Badge>
                          <Badge variant="secondary" className="text-xs max-w-xs truncate">{getLessonName(comment.lesson_id)}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {filter === "pending" && (
                          <>
                            <Button size="sm" variant="default" onClick={() => handleModerate(comment.id, "approved")} className="gap-1">
                              <Check className="h-4 w-4" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleModerate(comment.id, "rejected")} className="gap-1">
                              <X className="h-4 w-4" /> Rejeitar
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteComment(comment.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ACCESS LOGS TAB */}
          <TabsContent value="access" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">Registro de Acessos</h2>
              <LanguageFilter value={accessLangFilter} onChange={setAccessLangFilter} />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por email ou nome..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{userSearch.trim() ? "Nenhum usuário encontrado." : "Nenhum acesso registrado."}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}</p>
                <div className="space-y-2">
                  {paginatedUsers.map((u) => (
                    <div key={u.user_id} className="bg-card border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => { setExpandedUser(expandedUser === u.user_id ? null : u.user_id); setExpandedSection("accesses"); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {u.display_name || u.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline" className="text-xs">{u.accesses.length} {u.accesses.length === 1 ? "acesso" : "acessos"}</Badge>
                          {u.ratings.length > 0 && <Badge variant="outline" className="text-xs gap-1"><Star className="h-3 w-3" />{u.ratings.length}</Badge>}
                          {u.userComments.length > 0 && <Badge variant="outline" className="text-xs gap-1"><MessageCircle className="h-3 w-3" />{u.userComments.length}</Badge>}
                          {u.completions.length > 0 && <Badge variant="outline" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" />{u.completions.length}</Badge>}
                          {expandedUser === u.user_id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {expandedUser === u.user_id && (
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          <div className="flex gap-2 mb-3">
                            <Button size="sm" variant={expandedSection === "accesses" ? "default" : "outline"} onClick={() => setExpandedSection("accesses")} className="gap-1.5 text-xs">
                              <Clock className="h-3 w-3" /> Acessos ({u.accesses.length})
                            </Button>
                            <Button size="sm" variant={expandedSection === "ratings" ? "default" : "outline"} onClick={() => setExpandedSection("ratings")} className="gap-1.5 text-xs">
                              <Star className="h-3 w-3" /> Avaliações ({u.ratings.length})
                            </Button>
                            <Button size="sm" variant={expandedSection === "comments" ? "default" : "outline"} onClick={() => setExpandedSection("comments")} className="gap-1.5 text-xs">
                              <MessageCircle className="h-3 w-3" /> Comentários ({u.userComments.length})
                            </Button>
                            <Button size="sm" variant={expandedSection === "progress" ? "default" : "outline"} onClick={() => setExpandedSection("progress")} className="gap-1.5 text-xs">
                              <CheckCircle2 className="h-3 w-3" /> Progresso ({u.completions.length})
                            </Button>
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-1.5">
                            {expandedSection === "accesses" && u.accesses.map((log) => (
                              <div key={log.id} className="flex items-center gap-3 text-xs py-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-foreground">{new Date(log.accessed_at).toLocaleString()}</span>
                                <Badge variant="outline" className="text-xs">{getAreaLabel(log.language)}</Badge>
                                {log.device_type && log.device_type !== "unknown" && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    {log.device_type === "mobile" ? <Smartphone className="h-3 w-3" /> : log.device_type === "tablet" ? <Tablet className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                    {log.device_type}
                                  </Badge>
                                )}
                              </div>
                            ))}

                            {expandedSection === "ratings" && (u.ratings.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">Nenhuma avaliação registrada.</p>
                            ) : u.ratings.map((r, i) => (
                              <div key={i} className="flex items-center gap-3 text-xs py-1.5">
                                <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                                <span className="text-foreground font-medium">{r.rating}/5</span>
                                <span className="text-foreground">{getLessonName(r.lesson_id)}</span>
                                <Badge variant="outline" className="text-xs">{getAreaLabel(r.language)}</Badge>
                                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                              </div>
                            )))}

                            {expandedSection === "comments" && (u.userComments.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">Nenhum comentário registrado.</p>
                            ) : u.userComments.map((c, i) => (
                              <div key={i} className="bg-background/50 rounded p-2.5 text-xs space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-foreground font-medium">{getLessonName(c.lesson_id)}</span>
                                  <Badge variant="outline" className="text-xs">{getAreaLabel(c.language)}</Badge>
                                  <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                                    {c.status === "pending" ? "Pendente" : c.status === "approved" ? "Aprovado" : "Rejeitado"}
                                  </Badge>
                                  <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-foreground">{c.content}</p>
                              </div>
                            )))}

                            {expandedSection === "progress" && (() => {
                              const byLang = new Map<string, Set<string>>();
                              for (const c of u.completions) {
                                if (!byLang.has(c.language)) byLang.set(c.language, new Set());
                                byLang.get(c.language)!.add(c.lesson_id);
                              }
                              const languages = Array.from(byLang.keys());
                              if (languages.length === 0) return <p className="text-xs text-muted-foreground py-2">Nenhuma aula concluída.</p>;
                              return (
                                <div className="space-y-3">
                                  {languages.map((lang) => {
                                    const completed = byLang.get(lang)!;
                                    const langModules = dbModules.filter((m) => m.language === lang);
                                    const totalLessons = langModules.reduce((sum, m) => sum + m.lessons.length, 0);
                                    const pct = totalLessons > 0 ? Math.round((completed.size / totalLessons) * 100) : 0;
                                    return (
                                      <div key={lang} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">{getAreaLabel(lang)}</Badge>
                                          <span className="text-xs font-medium text-foreground">{completed.size}/{totalLessons} aulas ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="space-y-2">
                                          {langModules.map((mod) => {
                                            const modCompletedLessons = mod.lessons.filter((l) => completed.has(l.id));
                                            return (
                                              <div key={mod.id} className="text-xs">
                                                <div className="flex items-center gap-1 mb-1">
                                                  <span className="font-medium text-foreground">{mod.emoji} {mod.title}</span>
                                                  <span className="text-muted-foreground">({modCompletedLessons.length}/{mod.lessons.length})</span>
                                                </div>
                                                <div className="ml-4 space-y-0.5">
                                                  {mod.lessons.map((lesson) => {
                                                    const done = completed.has(lesson.id);
                                                    return (
                                                      <div key={lesson.id} className={`flex items-center gap-1.5 ${done ? "text-foreground font-semibold" : "text-muted-foreground/50"}`}>
                                                        <CheckCircle2 className={`h-3 w-3 shrink-0 ${done ? "text-primary" : "text-muted-foreground/30"}`} />
                                                        <span>{lesson.title}</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalAccessPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={accessPage <= 1} onClick={() => setAccessPage((p) => p - 1)} className="gap-1">
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalAccessPages }, (_, i) => i + 1).map((page) => (
                        <Button key={page} variant={page === accessPage ? "default" : "outline"} size="sm" onClick={() => setAccessPage(page)} className="h-8 w-8 p-0">
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" disabled={accessPage >= totalAccessPages} onClick={() => setAccessPage((p) => p + 1)} className="gap-1">
                      Próxima <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ADMINS TAB */}
          {isSuperAdmin && (
            <TabsContent value="admins" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Gerenciar Administradores</h2>
                <p className="text-sm text-muted-foreground">Apenas você (Super Admin) pode adicionar ou remover outros administradores.</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Adicionar Administrador
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Nome</label>
                    <Input
                      placeholder="Nome do admin"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email*</label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Senha*</label>
                    <Input
                      type="text"
                      placeholder="Mínimo 6 caracteres"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">A conta será criada e as credenciais enviadas por email automaticamente.</p>
                  <Button onClick={handleAddAdmin} disabled={addingAdmin || !newAdminEmail.trim() || !newAdminPassword.trim()} className="gap-2">
                    <UserPlus className="h-4 w-4" /> Criar Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {adminUsers.map((admin) => (
                  <div key={admin.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className={`h-5 w-5 ${admin.role === "super_admin" ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{admin.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {admin.role === "super_admin" ? "Super Admin (proprietário)" : "Administrador"}
                        </p>
                      </div>
                    </div>
                    {admin.role !== "super_admin" && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAdmin(admin.id, admin.role)} className="text-destructive hover:text-destructive gap-1">
                        <Trash2 className="h-4 w-4" /> Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
