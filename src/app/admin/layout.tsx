import { redirect } from "next/navigation";
import { DeskNav } from "@/components/desk-nav";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { logout } from "@/lib/actions";
import { currentUser, staff } from "@/lib/auth";

export const dynamic = "force-dynamic";

const links: [string, string][] = [
  ["/admin", "Overview"],
  ["/admin/bookings", "Bookings"],
  ["/admin/journeys", "Journeys"],
  ["/admin/departures", "Departures"],
  ["/admin/enquiries", "Enquiries"],
  ["/admin/customers", "Customers"],
  ["/admin/payments", "Payments"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!staff(user)) redirect("/login?next=/admin");

  return (
    <>
      <Header solid />
      <div className="wrap desk">
        <DeskNav label="Desk" links={links}>
          <form action={logout}><button className="text-link" type="submit">Sign out</button></form>
        </DeskNav>
        <div>{children}</div>
      </div>
      <Footer />
    </>
  );
}
