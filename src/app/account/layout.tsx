import { redirect } from "next/navigation";
import { DeskNav } from "@/components/desk-nav";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { logout } from "@/lib/actions";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const links: [string, string][] = [
  ["/account", "Overview"],
  ["/account/trips", "Trips"],
  ["/account/saved", "Saved"],
  ["/account/travelers", "Travelers"],
  ["/account/profile", "Profile"],
  ["/account/settings", "Settings"],
  ["/account/support", "Support"],
  ["/account/documents", "Documents"],
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <>
      <Header solid />
      <div className="wrap desk">
        <DeskNav label={user.name} links={links}>
          <form action={logout}><button className="text-link" type="submit">Sign out</button></form>
        </DeskNav>
        <div>{children}</div>
      </div>
      <Footer />
    </>
  );
}
