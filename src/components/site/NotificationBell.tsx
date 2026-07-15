import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string; title: string; body: string | null; type: string;
  link_to: string | null; is_read: boolean; created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,type,link_to,is_read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);
    setItems((data ?? []) as Notification[]);
  };

  useEffect(() => {
    if (!user) { setItems([]); return; }
    refresh();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refresh()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const unread = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("is_read", false);
    refresh();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        className="relative p-2.5 rounded-full hover:bg-primary/10 text-foreground/80 hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 left-1 size-4 rounded-full bg-destructive text-white text-[10px] font-bold grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-elegant overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-extrabold">الإشعارات</div>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                  <Check className="h-3 w-3" /> تعليم الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد إشعارات بعد</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {items.map((n) => {
                    const inner = (
                      <div className={`p-4 hover:bg-secondary/40 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start gap-2">
                          {!n.is_read && <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm">{n.title}</div>
                            {n.body && <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</div>}
                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                              {new Date(n.created_at).toLocaleString("ar-LY", { dateStyle: "short", timeStyle: "short" })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    return (
                      <li key={n.id} onClick={() => !n.is_read && markRead(n.id)}>
                        {n.link_to ? (
                          <Link to={n.link_to} onClick={() => setOpen(false)} className="block">{inner}</Link>
                        ) : inner}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}