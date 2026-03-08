import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flame, Heart, Send, Calendar, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Memorial {
  id: string;
  character_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  eulogy: string | null;
  image_url: string | null;
  frame_style: string;
  created_at: string;
}

interface MemorialComment {
  id: string;
  memorial_id: string;
  user_id: string;
  message: string;
  discord_username: string | null;
  discord_avatar: string | null;
  created_at: string;
}

const FRAME_STYLES: Record<string, string> = {
  classic: "border-4 border-amber-700/80 shadow-[0_0_30px_rgba(217,119,6,0.3)] rounded-lg",
  golden: "border-4 border-yellow-500/80 shadow-[0_0_40px_rgba(234,179,8,0.4)] rounded-none",
  ornate: "border-[6px] border-double border-amber-600/70 shadow-[0_0_25px_rgba(180,83,9,0.3)] rounded-xl",
  dark: "border-4 border-zinc-600/80 shadow-[0_0_30px_rgba(100,100,100,0.3)] rounded-lg",
  royal: "border-4 border-purple-700/60 shadow-[0_0_35px_rgba(126,34,206,0.3)] rounded-2xl",
};

const CandleAnimation = () => (
  <div className="relative w-8 h-24 mx-auto">
    {/* Candle body */}
    <div className="absolute bottom-0 w-6 h-16 mx-auto left-1 bg-gradient-to-t from-amber-100 to-amber-50 rounded-t-sm rounded-b-lg" />
    {/* Wick */}
    <div className="absolute bottom-16 left-[13px] w-[2px] h-3 bg-zinc-800" />
    {/* Flame */}
    <motion.div
      className="absolute bottom-[72px] left-[7px] w-[14px] h-[22px]"
      animate={{
        scaleX: [1, 1.15, 0.95, 1.1, 1],
        scaleY: [1, 1.1, 0.9, 1.05, 1],
        rotate: [-2, 3, -1, 2, -2],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="w-full h-full bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200 rounded-full opacity-95 blur-[0.5px]" />
    </motion.div>
    {/* Glow */}
    <motion.div
      className="absolute bottom-[65px] left-[-4px] w-[36px] h-[36px] rounded-full bg-amber-400/20 blur-md"
      animate={{ opacity: [0.3, 0.6, 0.35, 0.55, 0.3], scale: [1, 1.1, 0.95, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
  </div>
);

const MemorialCard = ({ memorial }: { memorial: Memorial }) => {
  const [comments, setComments] = useState<MemorialComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadComments();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const channel = supabase
      .channel(`memorial-comments-${memorial.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "memorial_comments", filter: `memorial_id=eq.${memorial.id}` }, () => loadComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [memorial.id]);

  const loadComments = async () => {
    const { data } = await supabase
      .from("memorial_comments")
      .select("*")
      .eq("memorial_id", memorial.id)
      .order("created_at", { ascending: false });
    if (data) setComments(data);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const meta = user.user_metadata || {};
    await supabase.from("memorial_comments").insert({
      memorial_id: memorial.id,
      user_id: user.id,
      message: newComment.trim(),
      discord_username: meta.discord_username || meta.full_name || "Anonymous",
      discord_avatar: meta.discord_avatar || meta.avatar_url,
    });
    setNewComment("");
    setSubmitting(false);
  };

  const frameClass = FRAME_STYLES[memorial.frame_style] || FRAME_STYLES.classic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col items-center"
    >
      {/* Memorial Card */}
      <div className="relative w-full max-w-sm mx-auto bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 backdrop-blur-xl rounded-2xl p-6 border border-zinc-700/30">
        {/* Decorative cross */}
        <div className="absolute top-3 right-3 text-zinc-600/40 text-2xl font-serif">✝</div>

        {/* Candles on sides */}
        <div className="flex justify-between items-end mb-4 px-4">
          <CandleAnimation />
          <CandleAnimation />
        </div>

        {/* Photo Frame */}
        {memorial.image_url && (
          <div className={`relative mx-auto w-48 h-56 overflow-hidden ${frameClass}`}>
            <img
              src={memorial.image_url}
              alt={memorial.character_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
          </div>
        )}

        {/* Character Name */}
        <h3 className="text-center text-xl font-serif font-bold text-amber-200/90 mt-4 tracking-wide">
          {memorial.character_name}
        </h3>

        {/* Dates */}
        {(memorial.date_of_birth || memorial.date_of_death) && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-zinc-400 font-mono">
            {memorial.date_of_birth && <span>{memorial.date_of_birth}</span>}
            {memorial.date_of_birth && memorial.date_of_death && <span className="text-amber-600">—</span>}
            {memorial.date_of_death && <span>{memorial.date_of_death}</span>}
          </div>
        )}

        {/* Eulogy */}
        {memorial.eulogy && (
          <p className="text-center text-sm text-zinc-300/80 mt-3 italic leading-relaxed px-2">
            "{memorial.eulogy}"
          </p>
        )}

        {/* Decorative divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
          <Skull className="w-4 h-4 text-zinc-600/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
        </div>

        {/* Leave Flowers Button */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-700/40 text-amber-300 hover:bg-amber-900/30 gap-2"
            onClick={() => setShowComments(!showComments)}
          >
            <Heart className="w-4 h-4" />
            Leave Flowers ({comments.length})
          </Button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              {/* Comment Input */}
              {user ? (
                <div className="flex gap-2 mb-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your feelings..."
                    className="min-h-[60px] bg-zinc-800/50 border-zinc-700/40 text-sm resize-none"
                    maxLength={300}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={submitComment}
                    disabled={submitting || !newComment.trim()}
                    className="text-amber-400 hover:text-amber-300 shrink-0 mt-auto"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-center text-zinc-500 mb-3">Login to leave flowers</p>
              )}

              {/* Comments List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/20">
                    <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                      <AvatarImage src={c.discord_avatar ? `https://cdn.discordapp.com/avatars/${c.user_id}/${c.discord_avatar}.png` : undefined} />
                      <AvatarFallback className="text-[10px] bg-zinc-700">{(c.discord_username || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-300/80 truncate">{c.discord_username || "Anonymous"}</span>
                        <span className="text-[10px] text-zinc-500">{format(new Date(c.created_at), "MMM d")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{c.message}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-center text-zinc-500 py-2">No flowers yet. Be the first to pay respects.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const Memorial = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemorials();
  }, []);

  const loadMemorials = async () => {
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .order("created_at", { ascending: false });
    setMemorials(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="relative overflow-hidden">
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/95 to-zinc-950 pointer-events-none" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-amber-900/20 blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-purple-900/15 blur-[100px]" />
        </div>

        <div className="relative container mx-auto px-4 py-12 sm:py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Flame className="w-10 h-10 text-amber-500" />
                <motion.div
                  className="absolute inset-0 w-10 h-10 text-amber-500 blur-md"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-10 h-10" />
                </motion.div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-200/90 tracking-wide">
              The Graveyard
            </h1>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base max-w-lg mx-auto">
              In loving memory of those who walked the streets of Skylife. Their stories live on forever.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-amber-700/50" />
              <span className="text-amber-700/60 text-lg">✝</span>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-amber-700/50" />
            </div>
          </motion.div>

          {/* Memorial Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : memorials.length === 0 ? (
            <div className="text-center py-20">
              <Skull className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No memorials yet. The streets are still alive.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {memorials.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <MemorialCard memorial={m} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Memorial;
