import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { journey } from "@/lib/catalog";
import { favoritesFor } from "@/lib/desk";

export default async function SavedPage() {
  const user = await currentUser();
  if (!user) return null;
  const saved = favoritesFor(user.id).map((slug) => journey(slug)).filter((item) => item != null);

  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Saved</h1>
      {saved.length === 0 ? <p>Nothing saved yet.</p> : saved.map((item) => (
        <p key={item.slug}><Link href={`/journeys/${item.slug}`}>{item.title}</Link> · {item.place}</p>
      ))}
    </>
  );
}
