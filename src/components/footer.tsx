import Link from "next/link";
import { subscribe } from "@/lib/actions";

export function Footer({ credit }: { credit?: string }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link href="/" className="wordmark">
              <strong>AURA</strong>
              <span>Curated Journeys</span>
            </Link>
            <p style={{ marginTop: 16 }}>Beyond the ordinary.</p>
            <form className="news" action={subscribe}>
              <label className="sr-only" htmlFor="news-email" style={{ position: "absolute", left: -9999 }}>
                Email
              </label>
              <input id="news-email" name="email" type="email" required placeholder="Email for the occasional note" />
              <button type="submit">Join</button>
            </form>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/journeys">Journeys</Link>
            <Link href="/destinations">Destinations</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/journal">Journal</Link>
          </div>
          <div>
            <h3>The desk</h3>
            <Link href="/bespoke">Private journey</Link>
            <Link href="/about">About</Link>
            <Link href="/our-approach">Our approach</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div>
            <h3>Policies</h3>
            <Link href="/travel-policies">Travel policies</Link>
            <Link href="/cancellation-policy">Cancellation</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/accessibility">Accessibility</Link>
          </div>
        </div>
        <p className="legal">
          AURA is a portfolio demonstration. Payments run in test mode and do not charge a card. Sample bookings are labeled demo data.
          {credit ? ` ${credit}` : ""}
        </p>
      </div>
    </footer>
  );
}
