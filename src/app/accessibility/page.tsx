import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <TextPage eyebrow="Accessibility" title="The site should be usable without a mouse.">
      <p>Pages use headings, labels, and visible focus. Menus and filters are buttons and links, not pictures. Motion is reduced when your system asks for it.</p>
      <p>If a page blocks you, write through the contact form and name the screen.</p>
    </TextPage>
  );
}
