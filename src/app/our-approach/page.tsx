import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Our approach" };

export default function ApproachPage() {
  return (
    <TextPage eyebrow="Approach" title="One region. Room in the day.">
      <p>Each journey stays in one geography. The itinerary names the road, the garden, or the drive, and it leaves at least one day unscheduled.</p>
      <p>Prices are calculated on the server from the departure, the party, and any add-on you tick. A code either applies or it does not. The browser does not get to invent the total.</p>
      <p>A seat is held for twenty minutes. If the test payment is not confirmed, the hold expires and the seat returns.</p>
    </TextPage>
  );
}
