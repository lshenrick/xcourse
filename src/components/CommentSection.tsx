import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, Pencil, Trash2, X, Check } from "lucide-react";
import type { UITranslations, LanguageCode } from "@/data/languages";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  status: string;
  created_at: string;
  profile_name?: string;
  likes_count: number;
  user_liked: boolean;
  replies: Reply[];
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile_name?: string;
}

interface CommentSectionProps {
  lessonId: string;
  translations: UITranslations;
  language: LanguageCode;
}

export function CommentSection({ lessonId, translations: t, language }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);
  const [confirmDeleteReply, setConfirmDeleteReply] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setIsAdmin(data?.some((r) => r.role === "admin" || r.role === "super_admin") ?? false);
    });
  }, [user]);

  const fetchComments = async () => {
    if (!user) return;
    const { data: commentsData } = await supabase
      .from("comments").select("*").eq("lesson_id", lessonId).eq("language", language)
      .order("created_at", { ascending: false });
    if (!commentsData) return;

    const commentIds = commentsData.map((c) => c.id);
    const userIds = [...new Set(commentsData.map((c) => c.user_id))];

    const { data: profiles } = await supabase.from("profiles").select("id, email, display_name").in("id", userIds);
    const { data: likesData } = await supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds);
    const { data: repliesData } = await supabase.from("comment_replies").select("*").in("comment_id", commentIds).order("created_at", { ascending: true });

    const replyUserIds = [...new Set((repliesData || []).map((r) => r.user_id))];
    const { data: replyProfiles } = replyUserIds.length > 0
      ? await supabase.from("profiles").select("id, email, display_name").in("id", replyUserIds)
      : { data: [] };

    const getName = (p: { display_name: string | null; email: string }) => p.display_name || p.email.split("@")[0];
    const profileMap = new Map((profiles || []).map((p) => [p.id, getName(p)]));
    const replyProfileMap = new Map((replyProfiles || []).map((p) => [p.id, getName(p)]));

    setComments(commentsData.map((c) => {
      const commentLikes = (likesData || []).filter((l) => l.comment_id === c.id);
      const commentReplies = (repliesData || []).filter((r) => r.comment_id === c.id);
      return {
        id: c.id, content: c.content, user_id: c.user_id, status: c.status, created_at: c.created_at,
        profile_name: profileMap.get(c.user_id) || "Anônimo",
        likes_count: commentLikes.length,
        user_liked: commentLikes.some((l) => l.user_id === user.id),
        replies: commentReplies.map((r) => ({
          id: r.id, content: r.content, user_id: r.user_id, created_at: r.created_at,
          profile_name: replyProfileMap.get(r.user_id) || profileMap.get(r.user_id) || "Anônimo",
        })),
      };
    }));
  };

  useEffect(() => { fetchComments(); }, [lessonId, user, language]);

  const handleSendComment = async () => {
    if (!user || !newComment.trim() || sending) return;
    setSending(true);
    await supabase.from("comments").insert({ lesson_id: lessonId, user_id: user.id, content: newComment.trim(), language });
    setNewComment("");
    setSending(false);
    fetchComments();
  };

  const handleSendReply = async (commentId: string) => {
    if (!user || !replyText.trim() || sending) return;
    setSending(true);
    await supabase.from("comment_replies").insert({ comment_id: commentId, user_id: user.id, content: replyText.trim(), language });
    setReplyText("");
    setReplyingTo(null);
    setSending(false);
    fetchComments();
  };

  const handleLike = async (commentId: string, alreadyLiked: boolean) => {
    if (!user) return;
    if (alreadyLiked) {
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setConfirmDeleteComment(null);
    fetchComments();
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    await supabase.from("comments").update({ content: editText.trim() }).eq("id", commentId);
    setEditingComment(null);
    fetchComments();
  };

  const handleDeleteReply = async (replyId: string) => {
    await supabase.from("comment_replies").delete().eq("id", replyId);
    setConfirmDeleteReply(null);
    fetchComments();
  };

  const handleEditReply = async (replyId: string) => {
    if (!editReplyText.trim()) return;
    await supabase.from("comment_replies").update({ content: editReplyText.trim() }).eq("id", replyId);
    setEditingReply(null);
    fetchComments();
  };

  const canModify = (authorId: string) => user && (user.id === authorId || isAdmin);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (!user) return null;

  return (
    <div className="mt-6 pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">{t.comments}</h3>
      <div className="flex gap-2 mb-4">
        <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t.commentPlaceholder} className="min-h-[60px] text-sm resize-none" />
        <Button size="sm" onClick={handleSendComment} disabled={!newComment.trim() || sending} className="shrink-0 self-end">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{comment.profile_name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
              </div>
              {canModify(comment.user_id) && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingComment(comment.id); setEditText(comment.content); }} className="text-muted-foreground hover:text-foreground transition-colors p-1" title={t.editComment}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  {confirmDeleteComment === comment.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-destructive">{t.confirmDelete}</span>
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-destructive hover:text-destructive/80 p-1"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setConfirmDeleteComment(null)} className="text-muted-foreground hover:text-foreground p-1"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteComment(comment.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title={t.deleteComment}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {editingComment === comment.id ? (
              <div className="flex gap-2 mb-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[40px] text-sm resize-none" />
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" onClick={() => handleEditComment(comment.id)} disabled={!editText.trim()}><Check className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground mb-2">{comment.content}</p>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => handleLike(comment.id, comment.user_liked)} className={`flex items-center gap-1 text-xs transition-colors ${comment.user_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                <Heart className={`h-3.5 w-3.5 ${comment.user_liked ? "fill-current" : ""}`} />
                {comment.likes_count > 0 && comment.likes_count}
              </button>
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />
                {t.reply}
              </button>
            </div>
            {comment.replies.length > 0 && (
              <div className="mt-2 ml-4 space-y-2 border-l-2 border-border pl-3">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{reply.profile_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                      </div>
                      {canModify(reply.user_id) && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingReply(reply.id); setEditReplyText(reply.content); }} className="text-muted-foreground hover:text-foreground transition-colors p-0.5"><Pencil className="h-2.5 w-2.5" /></button>
                          {confirmDeleteReply === reply.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDeleteReply(reply.id)} className="text-destructive p-0.5"><Check className="h-2.5 w-2.5" /></button>
                              <button onClick={() => setConfirmDeleteReply(null)} className="text-muted-foreground p-0.5"><X className="h-2.5 w-2.5" /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteReply(reply.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5"><Trash2 className="h-2.5 w-2.5" /></button>
                          )}
                        </div>
                      )}
                    </div>
                    {editingReply === reply.id ? (
                      <div className="flex gap-1">
                        <Textarea value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} className="min-h-[30px] text-xs resize-none" />
                        <Button size="sm" variant="outline" onClick={() => handleEditReply(reply.id)} className="text-xs shrink-0"><Check className="h-2.5 w-2.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingReply(null)} className="text-xs shrink-0"><X className="h-2.5 w-2.5" /></Button>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground">{reply.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {replyingTo === comment.id && (
              <div className="mt-2 ml-4 flex gap-2">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={t.replyPlaceholder} className="min-h-[40px] text-xs resize-none" />
                <Button size="sm" variant="outline" onClick={() => handleSendReply(comment.id)} disabled={!replyText.trim() || sending} className="shrink-0 self-end text-xs">
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
