import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Cancellation" };

export default function CancellationPage() {
  return (
    <TextPage eyebrow="Cancellation" title="The same words on every journey.">
      <p>More than 60 days before departure, the deposit is retained. Between 30 and 60 days, half the journey price is due. Inside 30 days, the journey price is due unless a documented insurance claim applies.</p>
      <p>In this demo, cancelling releases the seats immediately. A refund can then be recorded by the desk. No money moves.</p>
    </TextPage>
  );
}
