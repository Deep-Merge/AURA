import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { login } from "@/lib/actions";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Account</p>
        <h1 className="display">Sign in</h1>
        {query.error ? <p className="error">{query.error}</p> : null}
        <form className="stack-form" action={login}>
          <input type="hidden" name="next" value={query.next ?? ""} />
          <label className="field"><span>Email</span><input name="email" type="email" required defaultValue="maya@example.com" /></label>
          <label className="field"><span>Password</span><input name="password" type="password" required /></label>
          <button className="button" type="submit">Continue</button>
        </form>
        <p className="muted">Demo traveler: maya@example.com / aura-guest. Desk: admin@example.com / aura-desk.</p>
        <p><Link href="/register">Create an account</Link></p>
      </main>
      <Footer />
    </>
  );
}
