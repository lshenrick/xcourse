import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload, FileText, Code, Type, GripVertical, Save, Headphones, Video, Link, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { parseVideoUrl, uploadToR2 } from "@/utils/videoUrl";
import { RichTextEditor } from "./RichTextEditor";

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
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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
      setCustomLabels((lessonRes.data as any).custom_labels || {});
    }
    setBlocks(blocksRes.data || []);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);

    // Clean empty labels
    const cleanLabels: Record<string, string> = {};
    for (const [k, v] of Object.entries(customLabels)) {
      if (v.trim()) cleanLabels[k] = v.trim();
    }

    await supabase.from("course_lessons").update({
      title, type, duration: duration || null,
      custom_labels: Object.keys(cleanLabels).length > 0 ? cleanLabels : null,
    }).eq("id", lessonId);

    const existingIds = blocks.filter(b => b.id).map(b => b.id!);
    if (existingIds.length > 0) {
      await supabase.from("lesson_content_blocks").delete().eq("lesson_id", lessonId).not("id", "in", `(${existingIds.join(",")})`);
    } else {
      await supabase.from("lesson_content_blocks").delete().eq("lesson_id", lessonId);
    }

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

  const handleR2Upload = async (index: number, file: File, folder: string) => {
    setUploading(true);
    setUploadProgress(`Enviando ${file.name}...`);
    try {
      const result = await uploadToR2(file, `${folder}/${lessonId}`);
      updateBlock(index, "file_url", result.url);
      updateBlock(index, "file_name", file.name);
      toast.success("Arquivo enviado!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao enviar";
      console.error("Upload error:", err);
      toast.error(message, { duration: 8000 });
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const updateLabel = (key: string, value: string) => {
    setCustomLabels(prev => ({ ...prev, [key]: value }));
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
            <label className="text-sm font-medium text-foreground">Título da aula *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" placeholder="Título da aula" />
          </div>

          {/* Type + Duration */}
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
                  <SelectItem value="audio">Áudio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium text-foreground">Duração</label>
              <Input value={duration} onChange={e => setDuration(e.target.value)} className="mt-1" placeholder="04:30" />
            </div>
          </div>

          {/* Per-lesson text customization — shown for audio and ebook types */}
          {(type === "audio" || type === "ebook") && (
            <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Textos do player</p>
              <p className="text-xs text-muted-foreground -mt-1">Personalize os textos que o aluno vê. Deixe em branco para usar o padrão.</p>

              {type === "audio" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Título</label>
                    <Input
                      value={customLabels.audioTitle || ""}
                      onChange={e => updateLabel("audioTitle", e.target.value)}
                      placeholder="Meditação Guiada"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Descrição</label>
                    <Input
                      value={customLabels.audioDescription || ""}
                      onChange={e => updateLabel("audioDescription", e.target.value)}
                      placeholder="Pressione play para ouvir"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              )}

              {type === "ebook" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Título</label>
                    <Input
                      value={customLabels.ebookTitle || ""}
                      onChange={e => updateLabel("ebookTitle", e.target.value)}
                      placeholder="Este conteúdo é um E-book"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Descrição</label>
                    <Input
                      value={customLabels.ebookDescription || ""}
                      onChange={e => updateLabel("ebookDescription", e.target.value)}
                      placeholder="Clique no botão abaixo para baixar o PDF"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <div className="flex gap-1 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => addBlock("video")} className="gap-1 text-xs">
                  <Video className="h-3.5 w-3.5" /> Vídeo
                </Button>
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
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => addBlock("video")} className="gap-1">
                    <Video className="h-4 w-4" /> Vídeo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("embed")} className="gap-1">
                    <Code className="h-4 w-4" /> Embed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addBlock("text")} className="gap-1">
                    <Type className="h-4 w-4" /> Texto
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

                    {/* VIDEO BLOCK */}
                    {block.block_type === "video" && (
                      <VideoBlockEditor
                        block={block}
                        index={index}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        onUpload={(i, f) => handleR2Upload(i, f, "videos")}
                        onUpdate={updateBlock}
                      />
                    )}

                    {/* EMBED BLOCK */}
                    {block.block_type === "embed" && (
                      <Textarea
                        value={block.content || ""}
                        onChange={e => updateBlock(index, "content", e.target.value)}
                        placeholder='<iframe src="https://..." width="560" height="315"></iframe>'
                        className="font-mono text-xs min-h-[100px]"
                      />
                    )}

                    {/* TEXT BLOCK */}
                    {block.block_type === "text" && (
                      <RichTextEditor
                        content={block.content || ""}
                        onChange={(html) => updateBlock(index, "content", html)}
                        placeholder="Adicione texto, descrição, instruções..."
                      />
                    )}

                    {/* FILE BLOCK */}
                    {block.block_type === "file" && (
                      <FileBlockEditor
                        block={block}
                        index={index}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        onUpload={(i, f) => handleR2Upload(i, f, "files")}
                        onUpdate={updateBlock}
                      />
                    )}

                    {/* AUDIO BLOCK */}
                    {block.block_type === "audio" && (
                      <AudioBlockEditor
                        block={block}
                        index={index}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        onUpload={(i, f) => handleR2Upload(i, f, "audio")}
                        onUpdate={updateBlock}
                      />
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

/* ─── Sub-components ──────────────────────────────────────── */

function Badge({ block }: { block: ContentBlock }) {
  const config: Record<string, { icon: React.ReactNode; label: string }> = {
    video: { icon: <Video className="h-3 w-3" />, label: "Vídeo" },
    embed: { icon: <Code className="h-3 w-3" />, label: "Embed" },
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

interface BlockEditorProps {
  block: ContentBlock;
  index: number;
  uploading: boolean;
  uploadProgress: string;
  onUpload: (index: number, file: File) => void;
  onUpdate: (index: number, field: keyof ContentBlock, value: string | null) => void;
}

function VideoBlockEditor({ block, index, uploading, uploadProgress, onUpload, onUpdate }: BlockEditorProps) {
  if (block.file_url) {
    return (
      <div className="space-y-2">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <video src={block.file_url} controls className="w-full h-full object-contain" preload="metadata" />
        </div>
        <div className="flex items-center gap-2 bg-background rounded p-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm text-muted-foreground truncate flex-1">{block.file_name || "Vídeo enviado"}</span>
          <Button variant="ghost" size="sm" onClick={() => { onUpdate(index, "file_url", null); onUpdate(index, "file_name", null); }} className="h-7 text-xs text-destructive">
            Remover
          </Button>
        </div>
      </div>
    );
  }

  if (block.content) {
    return (
      <div className="space-y-2">
        <VideoLinkPreview url={block.content} />
        <div className="flex items-center gap-2 bg-background rounded p-2">
          <Link className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm text-muted-foreground truncate flex-1">{block.content}</span>
          <Button variant="ghost" size="sm" onClick={() => onUpdate(index, "content", "")} className="h-7 text-xs text-destructive">
            Remover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-lg py-8 cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-all">
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">{uploadProgress}</span>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-foreground">Clique para enviar vídeo</span>
              <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV</p>
            </div>
          </>
        )}
        <input type="file" className="hidden" accept="video/*" disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(index, f); }} />
      </label>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium">OU COLE UM LINK</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Input
        placeholder="Cole o link do Google Drive, Dropbox ou URL do vídeo"
        className="text-sm"
        onKeyDown={e => {
          if (e.key === "Enter") {
            const val = (e.target as HTMLInputElement).value.trim();
            if (val) onUpdate(index, "content", val);
          }
        }}
        onBlur={e => {
          const val = e.target.value.trim();
          if (val) onUpdate(index, "content", val);
        }}
      />
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Google Drive: Compartilhe com "Qualquer pessoa com o link"
      </p>
    </div>
  );
}

function FileBlockEditor({ block, index, uploading, uploadProgress, onUpload, onUpdate }: BlockEditorProps) {
  return (
    <div className="space-y-2">
      {block.file_url ? (
        <div className="flex items-center gap-2 bg-background rounded p-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <a href={block.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
            {block.file_name || "Arquivo"}
          </a>
          <Button variant="ghost" size="sm" onClick={() => { onUpdate(index, "file_url", null); onUpdate(index, "file_name", null); }} className="h-7 text-xs text-destructive">
            Remover
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg py-6 cursor-pointer hover:bg-muted/30 transition-colors">
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">{uploadProgress}</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para enviar arquivo (PDF, DOC, etc.)</span>
            </>
          )}
          <input type="file" className="hidden" disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(index, f); }} />
        </label>
      )}
      <Input
        value={block.content || ""}
        onChange={e => onUpdate(index, "content", e.target.value)}
        placeholder="Descrição do arquivo (opcional)"
        className="text-sm"
      />
    </div>
  );
}

function AudioBlockEditor({ block, index, uploading, uploadProgress, onUpload, onUpdate }: BlockEditorProps) {
  return (
    <div className="space-y-2">
      {block.file_url ? (
        <div className="space-y-2">
          <audio controls className="w-full" src={block.file_url} />
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground truncate flex-1">{block.file_name || "Áudio"}</span>
            <Button variant="ghost" size="sm" onClick={() => { onUpdate(index, "file_url", null); onUpdate(index, "file_name", null); }} className="h-7 text-xs text-destructive">
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg py-6 cursor-pointer hover:bg-muted/30 transition-colors">
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">{uploadProgress}</span>
            </>
          ) : (
            <>
              <Headphones className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para enviar áudio (MP3, WAV...)</span>
            </>
          )}
          <input type="file" className="hidden" accept="audio/*" disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(index, f); }} />
        </label>
      )}
      <Input
        value={block.content || ""}
        onChange={e => onUpdate(index, "content", e.target.value)}
        placeholder="Descrição do áudio (opcional)"
        className="text-sm"
      />
    </div>
  );
}

function VideoLinkPreview({ url }: { url: string }) {
  const parsed = parseVideoUrl(url);

  if (parsed.type === "gdrive") {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <iframe src={parsed.src} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen style={{ border: 0 }} />
      </div>
    );
  }

  if (parsed.type === "direct" || parsed.type === "dropbox") {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <video src={parsed.src} controls className="w-full h-full object-contain" preload="metadata" />
      </div>
    );
  }

  if (parsed.src) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <iframe src={parsed.src} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen style={{ border: 0 }} />
      </div>
    );
  }

  return null;
}
