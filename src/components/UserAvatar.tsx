import Link from "next/link";

export function UserAvatar({ username, avatarUrl, size = "sm" }: { username: string; avatarUrl?: string | null; size?: "sm" | "lg" }) {
  const initials = username.slice(0, 2).toUpperCase();
  return <div className={`avatar avatar-${size}`} title={username}>{avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}</div>;
}

export function AvatarLink({ username, avatarUrl }: { username: string; avatarUrl?: string | null }) {
  return <Link href={`/user/${encodeURIComponent(username)}`}><UserAvatar username={username} avatarUrl={avatarUrl} /></Link>;
}