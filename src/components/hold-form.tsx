"use client";

import { useState } from "react";
import { holdSeats } from "@/lib/actions";
import { findPromo, formatDate, money, quote } from "@/lib/price";

type Departure = { id: string; date: string; remaining: number };
type Addon = { id: string; name: string; price: number };

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function HoldForm({
  slug,
  title,
  place,
  country,
  nights,
  price,
  style,
  manner,
  summary,
  addons,
  departures,
  contactName,
  email,
  error,
}: {
  slug: string;
  title: string;
  place: string;
  country: string;
  nights: number;
  price: number;
  style: string;
  manner: string;
  summary: string;
  addons: Addon[];
  departures: Departure[];
  contactName: string;
  email: string;
  error?: string;
}) {
  const [departureId, setDepartureId] = useState(departures[0]?.id ?? "");
  const [adults, setAdults] = useState(() => Math.min(2, Math.max(1, departures[0]?.remaining ?? 1)));
  const [children, setChildren] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [names, setNames] = useState<string[]>(() => {
    const seed = Array.from({ length: 8 }, () => "");
    if (contactName) seed[0] = contactName;
    return seed;
  });

  const party = adults + children;
  const departure = departures.find((item) => item.id === departureId) ?? departures[0];
  const promo = findPromo(promoCode);
  const promoInvalid = promoCode.trim().length > 0 && !promo;
  const seatsShort = departure ? party > departure.remaining : true;
  const selected = addons.filter((addon) => chosen.includes(addon.id)).map((addon) => ({ price: addon.price, quantity: 1 }));
  const priced = quote({ adultPrice: price, adults, children, addons: selected, promo });
  const canHold = Boolean(departure) && !seatsShort && !promoInvalid;

  function toggleAddon(id: string) {
    setChosen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function setParty(nextAdults: number, nextChildren: number) {
    const adultsNext = Math.min(8, Math.max(1, nextAdults));
    const childrenNext = Math.min(6, Math.max(0, nextChildren));
    if (adultsNext + childrenNext > 8) return;
    setAdults(adultsNext);
    setChildren(childrenNext);
  }

  return (
    <form className="hold" action={holdSeats}>
      <input type="hidden" name="journey" value={slug} />
      <input type="hidden" name="adults" value={adults} />
      <input type="hidden" name="children" value={children} />

      <div className="hold-main">
        <header className="hold-intro">
          <p className="eyebrow">Hold seats</p>
          <h1>{title}</h1>
          <p>{summary}. {nights} nights in {place}, {country}. Seats stay yours for 20 minutes while you review. The test desk does not charge a card.</p>
        </header>

        {error ? <p className="hold-error">{error}</p> : null}

        <section className="hold-card">
          <header className="hold-head">
            <span>01</span>
            <div>
              <h2>Departure</h2>
              <p>Choose a date with enough open seats for your party.</p>
            </div>
          </header>
          <div className="date-list">
            {departures.map((item) => (
              <label key={item.id} className="choice">
                <input
                  type="radio"
                  name="departure"
                  value={item.id}
                  checked={item.id === departureId}
                  onChange={() => setDepartureId(item.id)}
                  required
                />
                <span>
                  <strong>{formatDate(item.date)}</strong>
                  <small>Returns {formatDate(addDays(item.date, nights))}</small>
                </span>
                <em className={item.remaining <= 2 ? "tight" : undefined}>{item.remaining} open</em>
              </label>
            ))}
          </div>
        </section>

        <section className="hold-card">
          <header className="hold-head">
            <span>02</span>
            <div>
              <h2>Party</h2>
              <p>Children travel at 70% of the adult fare. One booking holds up to 8 guests.</p>
            </div>
          </header>
          <div className="party">
            <div className="stepper">
              <div>
                <strong>Adults</strong>
                <small>{money(price)} each</small>
              </div>
              <div className="stepper-controls">
                <button type="button" aria-label="Fewer adults" onClick={() => setParty(adults - 1, children)} disabled={adults <= 1}>−</button>
                <b>{adults}</b>
                <button type="button" aria-label="More adults" onClick={() => setParty(adults + 1, children)} disabled={party >= 8 || adults >= 8}>+</button>
              </div>
            </div>
            <div className="stepper">
              <div>
                <strong>Children</strong>
                <small>{money(priced.childPrice)} each</small>
              </div>
              <div className="stepper-controls">
                <button type="button" aria-label="Fewer children" onClick={() => setParty(adults, children - 1)} disabled={children <= 0}>−</button>
                <b>{children}</b>
                <button type="button" aria-label="More children" onClick={() => setParty(adults, children + 1)} disabled={party >= 8 || children >= 6}>+</button>
              </div>
            </div>
          </div>
          {seatsShort && departure ? (
            <p className="hold-error">This departure has {departure.remaining} seats open. Choose another date or a smaller party.</p>
          ) : null}
        </section>

        <section className="hold-card">
          <header className="hold-head">
            <span>03</span>
            <div>
              <h2>Optional extras</h2>
              <p>Add them now, or leave them for the desk after you hold.</p>
            </div>
          </header>
          <div className="date-list">
            {addons.map((addon) => (
              <label key={addon.id} className="choice">
                <input
                  type="checkbox"
                  name="addon"
                  value={addon.id}
                  checked={chosen.includes(addon.id)}
                  onChange={() => toggleAddon(addon.id)}
                />
                <span>
                  <strong>{addon.name}</strong>
                  <small>Optional for this party</small>
                </span>
                <em>{money(addon.price)}</em>
              </label>
            ))}
          </div>
        </section>

        <section className="hold-card">
          <header className="hold-head">
            <span>04</span>
            <div>
              <h2>Your details</h2>
              <p>The hold confirmation is sent to this email. A code is optional.</p>
            </div>
          </header>
          <div className="party">
            <label className="field">
              <span>Your name</span>
              <input name="contactName" required defaultValue={contactName} autoComplete="name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" required defaultValue={email} autoComplete="email" />
            </label>
          </div>
          <label className="field">
            <span>Code</span>
            <input
              name="promo"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="AURA10 or WELCOME500"
              autoComplete="off"
              aria-invalid={promoInvalid}
            />
          </label>
          {promoInvalid ? <p className="hold-error">That code is not recognized. Try AURA10 or WELCOME500, or leave it blank.</p> : null}
          {promo ? <p className="hold-note">{promo.code} is applied in the summary.</p> : null}
        </section>

        <section className="hold-card">
          <header className="hold-head">
            <span>05</span>
            <div>
              <h2>Guest names</h2>
              <p>One name for each person on this hold. You can correct them before you confirm.</p>
            </div>
          </header>
          <div className="party">
            {names.slice(0, party).map((name, index) => (
              <label className="field" key={index}>
                <span>{index === 0 ? "Lead guest" : `Guest ${index + 1}`}</span>
                <input
                  name="traveler"
                  required
                  value={name}
                  autoComplete="name"
                  placeholder="Full name"
                  onChange={(event) => {
                    const next = [...names];
                    next[index] = event.target.value;
                    setNames(next);
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="hold-summary">
        <p className="eyebrow">{place}, {country}</p>
        <h2>{title}</h2>
        <dl className="facts">
          <div><dt>Duration</dt><dd>{nights} nights</dd></div>
          <div><dt>Travel</dt><dd>{manner}</dd></div>
          <div><dt>Style</dt><dd>{style}</dd></div>
          <div><dt>Guests</dt><dd>{party}</dd></div>
        </dl>
        <dl className="hold-lines">
          <div>
            <dt>{adults} {adults === 1 ? "adult" : "adults"}</dt>
            <dd>{money(adults * price)}</dd>
          </div>
          {children > 0 ? (
            <div>
              <dt>{children} {children === 1 ? "child" : "children"}</dt>
              <dd>{money(children * priced.childPrice)}</dd>
            </div>
          ) : null}
          {addons.filter((addon) => chosen.includes(addon.id)).map((addon) => (
            <div key={addon.id}>
              <dt>{addon.name}</dt>
              <dd>{money(addon.price)}</dd>
            </div>
          ))}
          {promo ? (
            <div className="discount">
              <dt>{promo.code}</dt>
              <dd>−{money(priced.discount)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="hold-total"><span>To hold</span> {money(priced.total)}</p>
        {departure ? <p className="hold-meta">{formatDate(departure.date)} · {party} {party === 1 ? "guest" : "guests"}</p> : null}
        <button className="button hold-submit" type="submit" disabled={!canHold}>Hold these seats</button>
        <p className="hold-fine">Held for 20 minutes. The test desk does not charge a card.</p>
      </aside>

      <div className="hold-dock">
        <div>
          <strong>{money(priced.total)}</strong>
          <small>{party} {party === 1 ? "guest" : "guests"}</small>
        </div>
        <button className="button" type="submit" disabled={!canHold}>Hold seats</button>
      </div>
    </form>
  );
}
