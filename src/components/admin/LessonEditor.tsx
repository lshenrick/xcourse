import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Upload, FileText, Code, Type, GripVertical, Save, Headphones } from "lucide-react";
import { toast } from "sonner";

interface ContentBlock {
  id?: string;
  lesson_id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface LessonEditorProps {
  lessonId: string;
  onClose: () => void;
}

export function LessonEditor({ lessonId, onClose }: LessonEditorProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("video");
  const [duration, setDuration] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(true);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    const [lessonRes, blocksRes] = await Promise.all([
      supabase.from("course_lessons").select("*").eq("id", lessonId).single(),
      supabase.from("lesson_content_blocks").select("*").eq("lesson_id", lessonId).order("position"),
    ]);
    if (lessonRes.data) {
      setTitle(lessonRes.data.title);
      setType(lessonRes.data.type);
      setDuration(lessonRes.data.duration || "");
    }
    setBlocks(blocksRes.data || []);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    // Update lesson metadata
    await supabase.from("course_lessons").update({
      title, type, duration: duration || null,
    }).eq("id", lessonId);

    // Sync blocks: delete removed, upsert existing
    const existingIds = blocks.filter(b => b.id).map(b => b.id!);
    // Delete blocks not in current list
    if (existingIds.length > 0) {
      await supabase.from("lesson_content_blocks").delete().eq("lesson_id", lessonId).not("id", "in", `(${existingIds.join(",")})`);
    } else {
      await supabase.from("lesson_content_blocks").delete().eq("lesson_id", lessonId);
    }

    // Upsert each block
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const data = { lesson_id: lessonId, block_type: b.block_type, content: b.content, file_url: b.file_url, file_name: b.file_name, position: i };
      if (b.id) {
        await supabase.from("lesson_content_blocks").update(data).eq("id", b.id);
      } else {
        const { data: inserted } = await supabase.from("lesson_content_blocks").insert(data).select().single();
        if (inserted) blocks[i].id = inserted.id;
      }
    }

    toast.success("Aula salva!");
    setSaving(false);
  };

  const addBlock = (blockType: string) => {
    setBlocks(prev => [...prev, {
      lesson_id: lessonId,
      block_type: blockType,
      content: "",
      file_url: null,
      file_name: null,
      position: prev.length,
    }]);
  };

  const updateBlock = (index: number, field: keyof ContentBlock, value: string | null) => {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const removeBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (index: number, file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `lessons/${lessonId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("course-files").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar arquivo");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("course-files").getPublicUrl(path);
    updateBlock(index, "file_url", urlData.publicUrl);
    updateBlock(index, "file_name", file.name);
    setUploading(false);
    toast.success("Arquivo enviado!");
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Editar Aula</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground">Título *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" placeholder="Título da aula" />
          </div>

          {/* Type + Duration row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="ebook">E-book / Arquivo</SelectItem>
                  <SelectItem value="audio">Áudio / Meditação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium text-foreground">Duração</label>
              <Input value={duration} onChange={e => setDuration(e.target.value)} className="mt-1" placeholder="04:30" />
            </div>
          </div>

          {/* Content blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => addBlock("embed")} className="gap-1 text-xs">
                  <Code className="h-3.5 w-3.5" /> Embed
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("text")} className="gap-1 text-xs">
                  <Type className="h-3.5 w-3.5" /> Texto
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("file")} className="gap-1 text-xs">
                  <Upload className="h-3.5 w-3.5" /> Arquivo
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock("audio")} className="gap-1 text-xs">
                  <Headphones className="h-3.5 w-3.5" /> Áudio
                </Button>
              </div>
            </div>

            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg py-10 text-center">
                <p className="text-sm text-muted-foreground mb-3">Nenhum conteúdo adicionado.</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => addBlock("embed")} className="gap-1">
                    <Code className="h-4 w-4" /> Adicionar Embed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("text")} className="gap-1">
                    <Type className="h-4 w-4" /> Adicionar Texto
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <div key={index} className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <Badge block={block} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeBlock(index)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {block.block_type === "embed" && (
                      <Textarea
                        value={block.content || ""}
                        onChange={e => updateBlock(index, "content", e.target.value)}
                        placeholder='<iframe src="https://..." width="560" height="315"></iframe>'
                        className="font-mono text-xs min-h-[100px]"
                      />
                    )}

                    {block.block_type === "text" && (
                      <Textarea
                        value={block.content || ""}
                        onChange={e => updateBlock(index, "content", e.target.value)}
                        placeholder="Adicione texto, descrição, instruções..."
                        className="min-h-[100px]"
                      />
                    )}

                    {block.block_type === "file" && (
                      <div className="space-y-2">
                        {block.file_url ? (
                          <div className="flex items-center gap-2 bg-background rounded p-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <a href={block.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                              {block.file_name || "Arquivo"}
                            </a>
                            <Button variant="ghost" size="sm" onClick={() => { updateBlock(index, "file_url", null); updateBlock(index, "file_name", null); }} className="h-7 text-xs text-destructive">
                              Remover
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg py-6 cursor-pointer hover:bg-muted/30 transition-colors">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Clique para enviar arquivo"}</span>
                            <input
                              type="file"
                              className="hidden"
                              disabled={uploading}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(index, f);
                              }}
                            />
                          </label>
                        )}
                        <Input
                          value={block.content || ""}
                          onChange={e => updateBlock(index, "content", e.target.value)}
                          placeholder="Descrição do arquivo (opcional)"
                          className="text-sm"
                        />
                      </div>
                    )}

                    {block.block_type === "audio" && (
                      <div className="space-y-2">
                        {block.file_url ? (
                          <div className="space-y-2">
                            <audio controls className="w-full" src={block.file_url} />
                            <div className="flex items-center gap-2">
                              <Headphones className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-sm text-muted-foreground truncate flex-1">{block.file_name || "Áudio"}</span>
                              <Button variant="ghost" size="sm" onClick={() => { updateBlock(index, "file_url", null); updateBlock(index, "file_name", null); }} className="h-7 text-xs text-destructive">
                                Remover
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg py-6 cursor-pointer hover:bg-muted/30 transition-colors">
                            <Headphones className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Clique para enviar áudio (MP3, WAV...)"}</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="audio/*"
                              disabled={uploading}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(index, f);
                              }}
                            />
                          </label>
                        )}
                        <Input
                          value={block.content || ""}
                          onChange={e => updateBlock(index, "content", e.target.value)}
                          placeholder="Descrição do áudio (opcional)"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Badge({ block }: { block: ContentBlock }) {
  const config: Record<string, { icon: React.ReactNode; label: string }> = {
    embed: { icon: <Code className="h-3 w-3" />, label: "Embed / Vídeo" },
    text: { icon: <Type className="h-3 w-3" />, label: "Texto" },
    file: { icon: <Upload className="h-3 w-3" />, label: "Arquivo" },
    audio: { icon: <Headphones className="h-3 w-3" />, label: "Áudio" },
  };
  const c = config[block.block_type] || config.text;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
      {c.icon} {c.label}
    </span>
  );
}
