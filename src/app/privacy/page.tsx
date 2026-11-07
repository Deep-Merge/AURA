import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <TextPage eyebrow="Privacy" title="What this demo stores.">
      <p>Accounts, enquiries, and bookings are written to a local file on the machine running the site. Passwords are stored as a salted hash. No card number is collected.</p>
      <p>Use example.com addresses. Do not enter a real traveler’s documents. This portfolio is not a production data processor.</p>
    </TextPage>
  );
}
