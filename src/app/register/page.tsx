import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { register } from "@/lib/actions";

export const metadata: Metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Account</p>
        <h1 className="display">Create an account</h1>
        {query.error ? <p className="error">{query.error}</p> : null}
        <form className="stack-form" action={register}>
          <label className="field"><span>Name</span><input name="name" required /></label>
          <label className="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com" /></label>
          <label className="field"><span>Password</span><input name="password" type="password" minLength={8} required /></label>
          <button className="button" type="submit">Create account</button>
        </form>
        <p><Link href="/login">Already registered</Link></p>
      </main>
      <Footer />
    </>
  );
}
