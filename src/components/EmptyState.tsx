import { Music2 } from "lucide-react";
export function EmptyState({ title = "Nothing here yet", body = "The first upload is waiting to happen." }: { title?: string; body?: string }) { return <div className="empty-state"><Music2 size={28} /><h3>{title}</h3><p>{body}</p></div>; }
export function LoadingState() { return <div className="loading-state"><span /> <span /> <span /></div>; }