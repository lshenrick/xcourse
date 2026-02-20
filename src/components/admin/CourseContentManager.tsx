import { useState, useEffect, useCallback, useRef } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ChevronDown, ChevronUp, Plus, MoreVertical, Pencil, Trash2, Copy,
  GripVertical, BookOpen, FileText, MessageCircle, Star, Headphones
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LessonEditor } from "./LessonEditor";

interface AreaOption {
  slug: string;
  title: string;
  icon: string;
}

interface ModuleData {
  id: string;
  title: string;
  emoji: string;
  language: string;
  position: number;
  lesson_count: number;
}

interface LessonData {
  id: string;
  title: string;
  module_id: string;
  position: number;
  type: string;
  duration: string | null;
  comment_count: number;
  avg_rating: number;
}

export function CourseContentManager() {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [langFilter, setLangFilter] = useState("");
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [moduleLessons, setModuleLessons] = useState<Record<string, LessonData[]>>({});
  const [loading, setLoading] = useState(false);

  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleEmoji, setModuleEmoji] = useState("📖");

  // Lesson editor
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonModuleId, setEditingLessonModuleId] = useState<string | null>(null);

  // Fetch member areas for the filter
  useEffect(() => {
    const fetchAreas = async () => {
      const { data } = await supabase
        .from("member_areas")
        .select("slug, title, icon")
        .eq("active", true)
        .order("position");
      const list = (data || []) as AreaOption[];
      setAreas(list);
      if (list.length > 0 && !langFilter) {
        setLangFilter(list[0].slug);
      }
      setAreasLoading(false);
    };
    fetchAreas();
  }, []);

  // Drag state for modules
  const dragModuleIndex = useRef<number | null>(null);
  const [dragOverModuleIndex, setDragOverModuleIndex] = useState<number | null>(null);

  // Drag state for lessons
  const dragLessonIndex = useRef<number | null>(null);
  const dragLessonModuleId = useRef<string | null>(null);
  const [dragOverLessonIndex, setDragOverLessonIndex] = useState<number | null>(null);

  const fetchModules = useCallback(async () => {
    if (!langFilter) return;
    setLoading(true);
    const { data: mods } = await supabase
      .from("course_modules")
      .select("id, title, emoji, language, position")
      .eq("language", langFilter)
      .order("position", { ascending: true });

    if (!mods) { setLoading(false); return; }

    const moduleIds = mods.map(m => m.id);
    const { data: lessons } = await supabase
      .from("course_lessons")
      .select("module_id")
      .in("module_id", moduleIds.length ? moduleIds : ["__none__"]);

    const countMap = new Map<string, number>();
    for (const l of lessons || []) {
      countMap.set(l.module_id, (countMap.get(l.module_id) || 0) + 1);
    }

    setModules(mods.map(m => ({ ...m, lesson_count: countMap.get(m.id) || 0 })));
    setLoading(false);
  }, [langFilter]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const fetchLessons = async (moduleId: string) => {
    const { data } = await supabase
      .from("course_lessons")
      .select("id, title, module_id, position, type, duration")
      .eq("module_id", moduleId)
      .order("position", { ascending: true });

    if (!data) return;

    const lessonIds = data.map(l => l.id);
    const [commentsRes, ratingsRes] = await Promise.all([
      supabase.from("comments").select("lesson_id").in("lesson_id", lessonIds.length ? lessonIds : ["__none__"]),
      supabase.from("lesson_ratings").select("lesson_id, rating").in("lesson_id", lessonIds.length ? lessonIds : ["__none__"]),
    ]);

    const commentMap = new Map<string, number>();
    for (const c of commentsRes.data || []) {
      commentMap.set(c.lesson_id, (commentMap.get(c.lesson_id) || 0) + 1);
    }

    const ratingMap = new Map<string, number[]>();
    for (const r of ratingsRes.data || []) {
      if (!ratingMap.has(r.lesson_id)) ratingMap.set(r.lesson_id, []);
      ratingMap.get(r.lesson_id)!.push(r.rating);
    }

    setModuleLessons(prev => ({
      ...prev,
      [moduleId]: data.map(l => ({
        ...l,
        comment_count: commentMap.get(l.id) || 0,
        avg_rating: ratingMap.has(l.id)
          ? Math.round((ratingMap.get(l.id)!.reduce((a, b) => a + b, 0) / ratingMap.get(l.id)!.length) * 10) / 10
          : 0,
      })),
    }));
  };

  const toggleModule = (moduleId: string) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(moduleId);
      if (!moduleLessons[moduleId]) fetchLessons(moduleId);
    }
  };

  // ===== MODULE DRAG & DROP =====
  const handleModuleDragStart = (index: number) => {
    dragModuleIndex.current = index;
  };

  const handleModuleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragModuleIndex.current === null) return;
    setDragOverModuleIndex(index);
  };

  const handleModuleDrop = async (index: number) => {
    const from = dragModuleIndex.current;
    if (from === null || from === index) {
      dragModuleIndex.current = null;
      setDragOverModuleIndex(null);
      return;
    }

    const updated = [...modules];
    const [moved] = updated.splice(from, 1);
    updated.splice(index, 0, moved);

    // Update positions optimistically
    const withPositions = updated.map((m, i) => ({ ...m, position: i }));
    setModules(withPositions);
    dragModuleIndex.current = null;
    setDragOverModuleIndex(null);

    // Persist to DB
    await Promise.all(withPositions.map(m =>
      supabase.from("course_modules").update({ position: m.position }).eq("id", m.id)
    ));
    toast.success("Ordem dos módulos atualizada!");
  };

  const handleModuleDragEnd = () => {
    dragModuleIndex.current = null;
    setDragOverModuleIndex(null);
  };

  // ===== LESSON DRAG & DROP =====
  const handleLessonDragStart = (moduleId: string, index: number) => {
    dragLessonIndex.current = index;
    dragLessonModuleId.current = moduleId;
  };

  const handleLessonDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragLessonIndex.current === null) return;
    setDragOverLessonIndex(index);
  };

  const handleLessonDrop = async (moduleId: string, index: number) => {
    const from = dragLessonIndex.current;
    if (from === null || dragLessonModuleId.current !== moduleId || from === index) {
      dragLessonIndex.current = null;
      dragLessonModuleId.current = null;
      setDragOverLessonIndex(null);
      return;
    }

    const lessons = [...(moduleLessons[moduleId] || [])];
    const [moved] = lessons.splice(from, 1);
    lessons.splice(index, 0, moved);

    const withPositions = lessons.map((l, i) => ({ ...l, position: i }));
    setModuleLessons(prev => ({ ...prev, [moduleId]: withPositions }));
    dragLessonIndex.current = null;
    dragLessonModuleId.current = null;
    setDragOverLessonIndex(null);

    await Promise.all(withPositions.map(l =>
      supabase.from("course_lessons").update({ position: l.position }).eq("id", l.id)
    ));
    toast.success("Ordem das aulas atualizada!");
  };

  const handleLessonDragEnd = () => {
    dragLessonIndex.current = null;
    dragLessonModuleId.current = null;
    setDragOverLessonIndex(null);
  };

  // ===== Module CRUD =====
  const openCreateModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    setModuleEmoji("📖");
    setModuleDialogOpen(true);
  };

  const openEditModule = (mod: ModuleData) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleEmoji(mod.emoji);
    setModuleDialogOpen(true);
  };

  const saveModule = async () => {
    if (!moduleTitle.trim()) return;
    if (editingModule) {
      await supabase.from("course_modules").update({ title: moduleTitle, emoji: moduleEmoji }).eq("id", editingModule.id);
      toast.success("Módulo atualizado!");
    } else {
      const maxPos = modules.length ? Math.max(...modules.map(m => m.position)) + 1 : 0;
      await supabase.from("course_modules").insert({
        title: moduleTitle, emoji: moduleEmoji, language: langFilter, position: maxPos,
      });
      toast.success("Módulo criado!");
    }
    setModuleDialogOpen(false);
    fetchModules();
  };

  const deleteModule = async (mod: ModuleData) => {
    if (!confirm(`Excluir módulo "${mod.title}" e todas as suas aulas?`)) return;
    const { data: lessons } = await supabase.from("course_lessons").select("id").eq("module_id", mod.id);
    if (lessons?.length) {
      const lessonIds = lessons.map(l => l.id);
      await supabase.from("lesson_content_blocks").delete().in("lesson_id", lessonIds);
      await supabase.from("course_lessons").delete().eq("module_id", mod.id);
    }
    await supabase.from("course_modules").delete().eq("id", mod.id);
    toast.success("Módulo excluído!");
    if (expandedModuleId === mod.id) setExpandedModuleId(null);
    fetchModules();
  };

  const duplicateModule = async (mod: ModuleData) => {
    const maxPos = modules.length ? Math.max(...modules.map(m => m.position)) + 1 : 0;
    const { data: newMod } = await supabase.from("course_modules").insert({
      title: `${mod.title} (cópia)`, emoji: mod.emoji, language: mod.language, position: maxPos,
    }).select().single();
    if (!newMod) return;

    const { data: lessons } = await supabase.from("course_lessons").select("*").eq("module_id", mod.id).order("position");
    if (lessons?.length) {
      for (const l of lessons) {
        const { data: newLesson } = await supabase.from("course_lessons").insert({
          module_id: newMod.id, title: l.title, position: l.position, type: l.type, duration: l.duration,
        }).select().single();
        if (!newLesson) continue;

        const { data: blocks } = await supabase.from("lesson_content_blocks").select("*").eq("lesson_id", l.id);
        if (blocks?.length) {
          await supabase.from("lesson_content_blocks").insert(
            blocks.map(b => ({ lesson_id: newLesson.id, block_type: b.block_type, content: b.content, file_url: b.file_url, file_name: b.file_name, position: b.position }))
          );
        }
      }
    }
    toast.success("Módulo duplicado!");
    fetchModules();
  };

  // Lesson CRUD
  const addLesson = async (moduleId: string) => {
    const existing = moduleLessons[moduleId] || [];
    const maxPos = existing.length ? Math.max(...existing.map(l => l.position)) + 1 : 0;
    const { data } = await supabase.from("course_lessons").insert({
      module_id: moduleId, title: "Nova Aula", position: maxPos, type: "video",
    }).select().single();
    if (data) {
      toast.success("Aula criada!");
      fetchLessons(moduleId);
      fetchModules();
      setEditingLessonId(data.id);
      setEditingLessonModuleId(moduleId);
    }
  };

  const deleteLesson = async (lesson: LessonData) => {
    if (!confirm(`Excluir aula "${lesson.title}"?`)) return;
    await supabase.from("lesson_content_blocks").delete().eq("lesson_id", lesson.id);
    await supabase.from("course_lessons").delete().eq("id", lesson.id);
    toast.success("Aula excluída!");
    fetchLessons(lesson.module_id);
    fetchModules();
  };

  const duplicateLesson = async (lesson: LessonData) => {
    const existing = moduleLessons[lesson.module_id] || [];
    const maxPos = existing.length ? Math.max(...existing.map(l => l.position)) + 1 : 0;
    const { data: newLesson } = await supabase.from("course_lessons").insert({
      module_id: lesson.module_id, title: `${lesson.title} (cópia)`, position: maxPos, type: lesson.type, duration: lesson.duration,
    }).select().single();
    if (!newLesson) return;

    const { data: blocks } = await supabase.from("lesson_content_blocks").select("*").eq("lesson_id", lesson.id);
    if (blocks?.length) {
      await supabase.from("lesson_content_blocks").insert(
        blocks.map(b => ({ lesson_id: newLesson.id, block_type: b.block_type, content: b.content, file_url: b.file_url, file_name: b.file_name, position: b.position }))
      );
    }
    toast.success("Aula duplicada!");
    fetchLessons(lesson.module_id);
    fetchModules();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={langFilter} onValueChange={(v) => { setLangFilter(v); setExpandedModuleId(null); }}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Selecione uma área" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.slug} value={area.slug}>
                <span className="flex items-center gap-2">
                  <span>{area.icon || area.title[0]}</span>
                  <span>{area.title}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreateModule} className="gap-2" disabled={!langFilter}>
          <Plus className="h-4 w-4" /> Criar Módulo
        </Button>
      </div>

      {/* Modules list */}
      {areasLoading || loading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando...</div>
      ) : areas.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma área de membros criada. Crie uma na aba "Áreas" primeiro.</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum módulo nesta área.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((mod, modIndex) => (
            <div
              key={mod.id}
              draggable
              onDragStart={() => handleModuleDragStart(modIndex)}
              onDragOver={(e) => handleModuleDragOver(e, modIndex)}
              onDrop={() => handleModuleDrop(modIndex)}
              onDragEnd={handleModuleDragEnd}
              className={`bg-card border rounded-lg overflow-hidden transition-all ${
                dragOverModuleIndex === modIndex && dragModuleIndex.current !== modIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              {/* Module header */}
              <div className="flex items-center gap-2 p-4">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex-1 flex items-center gap-3 text-left hover:bg-muted/20 rounded-md transition-colors -m-1 p-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {mod.emoji} {mod.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{mod.lesson_count} {mod.lesson_count === 1 ? "aula" : "aulas"}</Badge>
                    </div>
                  </div>
                </button>

                <Button variant="outline" size="sm" onClick={() => addLesson(mod.id)} className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditModule(mod)} className="gap-2">
                      <Pencil className="h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateModule(mod)} className="gap-2">
                      <Copy className="h-4 w-4" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteModule(mod)} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button onClick={() => toggleModule(mod.id)} className="shrink-0 p-1">
                  {expandedModuleId === mod.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>

              {/* Expanded lessons */}
              {expandedModuleId === mod.id && (
                <div className="border-t border-border bg-muted/10">
                  {(moduleLessons[mod.id] || []).length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Nenhuma aula neste módulo.
                    </div>
                  ) : (
                    (moduleLessons[mod.id] || []).map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); handleLessonDragStart(mod.id, lessonIndex); }}
                        onDragOver={(e) => { e.stopPropagation(); handleLessonDragOver(e, lessonIndex); }}
                        onDrop={(e) => { e.stopPropagation(); handleLessonDrop(mod.id, lessonIndex); }}
                        onDragEnd={handleLessonDragEnd}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-all ${
                          dragOverLessonIndex === lessonIndex && dragLessonIndex.current !== lessonIndex && dragLessonModuleId.current === mod.id
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/20"
                        }`}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab active:cursor-grabbing" />
                        <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${lesson.type === "ebook" ? "bg-accent" : lesson.type === "audio" ? "bg-primary/20" : "bg-primary/10"}`}>
                          {lesson.type === "ebook" ? <FileText className="h-4 w-4 text-accent-foreground" /> : lesson.type === "audio" ? <Headphones className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {lesson.comment_count > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <MessageCircle className="h-3 w-3" /> {lesson.comment_count}
                              </span>
                            )}
                            {lesson.avg_rating > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Star className="h-3 w-3" /> {lesson.avg_rating}
                              </span>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingLessonId(lesson.id); setEditingLessonModuleId(lesson.module_id); }} className="gap-2">
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateLesson(lesson)} className="gap-2">
                              <Copy className="h-4 w-4" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteLesson(lesson)} className="gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}

                  <div className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => addLesson(mod.id)} className="gap-2 text-primary">
                      <Plus className="h-4 w-4" /> Adicionar aula
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Module create/edit dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Criar Módulo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Emoji</label>
              <Input value={moduleEmoji} onChange={e => setModuleEmoji(e.target.value)} placeholder="📖" className="mt-1 w-20" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Título *</label>
              <Input value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} placeholder="Nome do módulo" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveModule} disabled={!moduleTitle.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson editor */}
      {editingLessonId && (
        <LessonEditor
          lessonId={editingLessonId}
          onClose={() => {
            setEditingLessonId(null);
            if (editingLessonModuleId) fetchLessons(editingLessonModuleId);
            fetchModules();
          }}
        />
      )}
    </div>
  );
}
