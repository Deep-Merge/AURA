import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "FAQ" };

const items = [
  ["Is this a live travel agency?", "No. AURA is a portfolio product. The journeys, copy, and sample bookings are demonstration content. The photographs are licensed."],
  ["Will my card be charged?", "No. Confirmation uses a test desk. The page says so. Stripe is not called unless a secret key is added later."],
  ["Can I travel with children?", "Yes. A child place is priced at 70% of the adult departure price."],
  ["What does private mean?", "The departure is arranged for your party, up to eight guests, rather than a coach group."],
  ["How do I change a booking?", "Open the trip in your account and cancel it, or write to the desk. A refund can be recorded after cancellation."],
];

export default function FaqPage() {
  return (
    <TextPage eyebrow="FAQ" title="Practical answers.">
      {items.map(([question, answer]) => (
        <div key={question}>
          <strong>{question}</strong>
          <p>{answer}</p>
        </div>
      ))}
    </TextPage>
  );
}
