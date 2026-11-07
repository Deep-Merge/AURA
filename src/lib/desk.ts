import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { catalog, journey as findJourney } from "@/lib/catalog";
import { findPromo, quote, type Promo } from "@/lib/price";

export type Role = "customer" | "agent" | "administrator" | "super";

export type Traveler = { id: string; name: string; note: string };

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  travelers: Traveler[];
};

export type Hold = { id: string; party: number; expires: string; bookingId: string };

export type Departure = {
  id: string;
  journeySlug: string;
  date: string;
  capacity: number;
  confirmed: number;
  holds: Hold[];
};

export type BookingStatus =
  | "Held"
  | "Pending Payment"
  | "Confirmed"
  | "Completed"
  | "Cancelled"
  | "Expired"
  | "Refunded"
  | "Failed";

export type Booking = {
  id: string;
  reference: string;
  userId: string | null;
  email: string;
  contactName: string;
  journeySlug: string;
  departureId: string;
  adults: number;
  children: number;
  addons: { id: string; name: string; price: number; quantity: number }[];
  travelers: { name: string; kind: "adult" | "child" }[];
  promoCode: string | null;
  status: BookingStatus;
  total: number;
  currency: "USD";
  payment: { provider: "test-desk"; label: string; at: string } | null;
  events: { at: string; from: string; to: string; note: string }[];
  createdAt: string;
  demo: boolean;
};

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  places: string;
  dates: string;
  flexible: boolean;
  party: string;
  budget: string;
  style: string;
  stay: string;
  notes: string;
  status: "New" | "In review" | "Replied";
  createdAt: string;
};

export type Desk = {
  users: User[];
  departures: Departure[];
  bookings: Booking[];
  favorites: { userId: string; journeySlug: string }[];
  enquiries: Enquiry[];
  subscribers: { email: string; createdAt: string }[];
  support: { id: string; userId: string; message: string; createdAt: string }[];
  audit: { id: string; at: string; actor: string; action: string }[];
};

const FILE = path.join(process.cwd(), "data", "desk.json");
const HOLD_MS = 20 * 60 * 1000;

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const current = Buffer.from(hash, "hex");
  if (current.length !== next.length) return false;
  return timingSafeEqual(current, next);
}

function id(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyDesk(): Desk {
  const departures: Departure[] = catalog.journeys.flatMap((item) =>
    item.departures.map((departure) => ({
      id: departure.id,
      journeySlug: item.slug,
      date: departure.date,
      capacity: departure.capacity,
      confirmed: 0,
      holds: [],
    })),
  );

  const users: User[] = [
    {
      id: "user_maya",
      email: "maya@example.com",
      name: "Maya Ellis",
      passwordHash: hashPassword("aura-guest"),
      role: "customer",
      travelers: [{ id: "trav_maya", name: "Maya Ellis", note: "Window seat on short flights" }],
    },
    {
      id: "user_agent",
      email: "agent@example.com",
      name: "Leah Okonkwo",
      passwordHash: hashPassword("aura-desk"),
      role: "agent",
      travelers: [],
    },
    {
      id: "user_admin",
      email: "admin@example.com",
      name: "Jonas Berger",
      passwordHash: hashPassword("aura-desk"),
      role: "administrator",
      travelers: [],
    },
  ];

    const bookings: Booking[] = [];
  const cycle: BookingStatus[] = [
    "Confirmed",
    "Confirmed",
    "Confirmed",
    "Completed",
    "Confirmed",
    "Cancelled",
    "Pending Payment",
    "Refunded",
  ];

  for (let index = 0; index < 160; index += 1) {
    const trip = catalog.journeys[index % catalog.journeys.length];
    const departure = departures.find((item) => item.journeySlug === trip.slug && item.date === trip.departures[index % trip.departures.length].date);
    if (!departure) continue;
    const status = cycle[index % cycle.length];
    const adults = 2;
    const occupies = status === "Confirmed" || status === "Completed";
    if (occupies && departure.confirmed + adults > departure.capacity) continue;
    if (occupies) departure.confirmed += adults;
    const priced = quote({ adultPrice: trip.price, adults, children: 0, addons: [], promo: null });
    const created = new Date(Date.UTC(2026, index % 8, (index % 27) + 1)).toISOString();
    bookings.push({
      id: `book_demo_${index}`,
      reference: `AURA-${(1000 + index).toString()}`,
      userId: index % 11 === 0 ? "user_maya" : null,
      email: index % 11 === 0 ? "maya@example.com" : `guest${index}@example.com`,
      contactName: index % 11 === 0 ? "Maya Ellis" : `Guest ${index}`,
      journeySlug: trip.slug,
      departureId: departure.id,
      adults,
      children: 0,
      addons: [],
      travelers: [
        { name: index % 11 === 0 ? "Maya Ellis" : `Guest ${index}`, kind: "adult" },
        { name: "Companion", kind: "adult" },
      ],
      promoCode: null,
      status,
      total: priced.total,
      currency: "USD",
      payment:
        status === "Confirmed" || status === "Completed" || status === "Refunded"
          ? { provider: "test-desk", label: "Demo ledger entry. No card was charged.", at: created }
          : null,
      events: [{ at: created, from: "Draft", to: status, note: "Seeded demo record" }],
      createdAt: created,
      demo: true,
    });
  }

  return {
    users,
    departures,
    bookings,
    favorites: [{ userId: "user_maya", journeySlug: "amalfi-coast" }],
    enquiries: [],
    subscribers: [],
    support: [],
    audit: [{ id: "audit_seed", at: nowIso(), actor: "system", action: "Seeded the local desk with demo bookings" }],
  };
}

let cache: Desk | null = null;

function sweep(desk: Desk) {
  const now = Date.now();
  let changed = false;
  for (const departure of desk.departures) {
    const keep: Hold[] = [];
    for (const hold of departure.holds) {
      if (Date.parse(hold.expires) > now) {
        keep.push(hold);
        continue;
      }
      changed = true;
      const booking = desk.bookings.find((item) => item.id === hold.bookingId);
      if (booking && (booking.status === "Held" || booking.status === "Pending Payment")) {
        const from = booking.status;
        booking.status = "Expired";
        booking.events.push({ at: nowIso(), from, to: "Expired", note: "Hold expired before payment" });
      }
    }
    departure.holds = keep;
  }
  return changed;
}

function read(): Desk {
  if (!cache) {
    if (!existsSync(FILE)) {
      cache = emptyDesk();
      mkdirSync(path.dirname(FILE), { recursive: true });
      writeFileSync(FILE, JSON.stringify(cache));
    } else {
      cache = JSON.parse(readFileSync(FILE, "utf8")) as Desk;
    }
  }
  if (sweep(cache)) writeFileSync(FILE, JSON.stringify(cache));
  return cache;
}

function write(desk: Desk) {
  cache = desk;
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(desk));
}

export function remaining(departure: Departure, at = Date.now()) {
  const held = departure.holds.filter((hold) => Date.parse(hold.expires) > at).reduce((sum, hold) => sum + hold.party, 0);
  return departure.capacity - departure.confirmed - held;
}

export function listDepartures(journeySlug: string) {
  const desk = read();
  return desk.departures
    .filter((item) => item.journeySlug === journeySlug)
    .map((item) => ({ ...item, remaining: remaining(item) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function nextOpen(journeySlug: string) {
  return listDepartures(journeySlug).find((item) => item.remaining > 0) ?? null;
}

export function getUser(id: string) {
  return read().users.find((user) => user.id === id) ?? null;
}

export function getUserByEmail(email: string) {
  return read().users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function registerUser(input: { name: string; email: string; password: string }) {
  const desk = read();
  if (desk.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    return { error: "An account with that email already exists." };
  }
  const user: User = {
    id: id("user"),
    email: input.email.toLowerCase(),
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
    role: "customer",
    travelers: [],
  };
  desk.users.push(user);
  desk.audit.push({ id: id("audit"), at: nowIso(), actor: user.email, action: "Registered" });
  write(desk);
  return { user };
}

export function authenticate(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function updateProfile(userId: string, input: { name: string }) {
  const desk = read();
  const user = desk.users.find((item) => item.id === userId);
  if (!user) return { error: "Account not found." };
  user.name = input.name.trim();
  write(desk);
  return { user };
}

export function addTraveler(userId: string, input: { name: string; note: string }) {
  const desk = read();
  const user = desk.users.find((item) => item.id === userId);
  if (!user) return { error: "Account not found." };
  user.travelers.push({ id: id("trav"), name: input.name.trim(), note: input.note.trim() });
  write(desk);
  return { ok: true };
}

export function removeTraveler(userId: string, travelerId: string) {
  const desk = read();
  const user = desk.users.find((item) => item.id === userId);
  if (!user) return;
  user.travelers = user.travelers.filter((item) => item.id !== travelerId);
  write(desk);
}

export function toggleFavorite(userId: string, journeySlug: string) {
  const desk = read();
  const existing = desk.favorites.find((item) => item.userId === userId && item.journeySlug === journeySlug);
  if (existing) desk.favorites = desk.favorites.filter((item) => item !== existing);
  else desk.favorites.push({ userId, journeySlug });
  write(desk);
  return { saved: !existing };
}

export function favoritesFor(userId: string) {
  return read().favorites.filter((item) => item.userId === userId).map((item) => item.journeySlug);
}

export function isSaved(userId: string | null, journeySlug: string) {
  if (!userId) return false;
  return read().favorites.some((item) => item.userId === userId && item.journeySlug === journeySlug);
}

export function addEnquiry(input: Omit<Enquiry, "id" | "status" | "createdAt">) {
  const desk = read();
  const enquiry: Enquiry = { ...input, id: id("enq"), status: "New", createdAt: nowIso() };
  desk.enquiries.unshift(enquiry);
  desk.audit.push({ id: id("audit"), at: nowIso(), actor: input.email, action: `Enquiry ${enquiry.id}` });
  write(desk);
  return enquiry;
}

export function addSubscriber(email: string) {
  const desk = read();
  const clean = email.trim().toLowerCase();
  if (!desk.subscribers.some((item) => item.email === clean)) {
    desk.subscribers.push({ email: clean, createdAt: nowIso() });
    write(desk);
  }
}

export function addSupport(userId: string, message: string) {
  const desk = read();
  desk.support.unshift({ id: id("sup"), userId, message: message.trim(), createdAt: nowIso() });
  write(desk);
}

export function supportFor(userId: string) {
  return read().support.filter((item) => item.userId === userId);
}

function event(booking: Booking, to: BookingStatus, note: string) {
  booking.events.push({ at: nowIso(), from: booking.status, to, note });
  booking.status = to;
}

export function createHold(input: {
  journeySlug: string;
  departureId: string;
  adults: number;
  children: number;
  addonIds: string[];
  promoCode: string;
  email: string;
  contactName: string;
  travelerNames: string[];
  userId: string | null;
}) {
  const trip = findJourney(input.journeySlug);
  if (!trip) return { error: "That journey is not in the collection." };
  const adults = input.adults;
  const children = input.children;
  if (!Number.isInteger(adults) || adults < 1 || adults > 8) return { error: "Choose between 1 and 8 adults." };
  if (!Number.isInteger(children) || children < 0 || children > 6) return { error: "Children must be between 0 and 6." };
  const party = adults + children;
  if (party > 8) return { error: "A single booking can hold up to 8 guests." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return { error: "Enter a valid email address." };
  if (input.travelerNames.filter(Boolean).length < party) return { error: "Add a name for each guest." };

  const promo = input.promoCode ? findPromo(input.promoCode) : null;
  if (input.promoCode && !promo) return { error: "That code is not valid." };

  const selected = trip.addons.filter((addon) => input.addonIds.includes(addon.id)).map((addon) => ({ ...addon, quantity: 1 }));
  const priced = quote({ adultPrice: trip.price, adults, children, addons: selected, promo });

  const desk = read();
  const departure = desk.departures.find((item) => item.id === input.departureId && item.journeySlug === input.journeySlug);
  if (!departure) return { error: "Choose a departure." };
  if (remaining(departure) < party) return { error: "Those seats were just taken. Choose another date." };

  const booking: Booking = {
    id: id("book"),
    reference: `AURA-${(3000 + desk.bookings.length).toString()}`,
    userId: input.userId,
    email: input.email.toLowerCase(),
    contactName: input.contactName.trim(),
    journeySlug: input.journeySlug,
    departureId: departure.id,
    adults,
    children,
    addons: selected,
    travelers: input.travelerNames.slice(0, party).map((name, index) => ({
      name: name.trim(),
      kind: index < adults ? "adult" : "child",
    })),
    promoCode: promo?.code ?? null,
    status: "Held",
    total: priced.total,
    currency: "USD",
    payment: null,
    events: [{ at: nowIso(), from: "Draft", to: "Held", note: "Seats held for 20 minutes" }],
    createdAt: nowIso(),
    demo: false,
  };
  departure.holds.push({
    id: id("hold"),
    party,
    expires: new Date(Date.now() + HOLD_MS).toISOString(),
    bookingId: booking.id,
  });
  desk.bookings.unshift(booking);
  desk.audit.push({ id: id("audit"), at: nowIso(), actor: booking.email, action: `Hold ${booking.reference}` });
  write(desk);
  return { booking };
}

export function getBooking(reference: string) {
  return read().bookings.find((item) => item.reference === reference) ?? null;
}

export function confirmTestPayment(reference: string) {
  const desk = read();
  const booking = desk.bookings.find((item) => item.reference === reference);
  if (!booking) return { error: "Booking not found." };
  if (booking.status === "Confirmed") return { booking };
  if (booking.status !== "Held" && booking.status !== "Pending Payment") {
    return { error: "This hold is no longer payable." };
  }
  const departure = desk.departures.find((item) => item.id === booking.departureId);
  const hold = departure?.holds.find((item) => item.bookingId === booking.id);
  if (!departure || !hold || Date.parse(hold.expires) <= Date.now()) {
    event(booking, "Expired", "Hold expired");
    write(desk);
    return { error: "The hold expired. Choose the departure again." };
  }
  departure.holds = departure.holds.filter((item) => item.bookingId !== booking.id);
  departure.confirmed += hold.party;
  booking.payment = {
    provider: "test-desk",
    label: "Test payment confirmed on the desk. No card was charged.",
    at: nowIso(),
  };
  event(booking, "Confirmed", "Test-desk payment");
  desk.audit.push({ id: id("audit"), at: nowIso(), actor: booking.email, action: `Confirmed ${booking.reference}` });
  write(desk);
  return { booking };
}

export function cancelBooking(reference: string, actor: string) {
  const desk = read();
  const booking = desk.bookings.find((item) => item.reference === reference);
  if (!booking) return { error: "Booking not found." };
  if (booking.status === "Cancelled" || booking.status === "Refunded") return { booking };
  if (booking.status !== "Confirmed" && booking.status !== "Held" && booking.status !== "Pending Payment") {
    return { error: "This booking cannot be cancelled." };
  }
  const departure = desk.departures.find((item) => item.id === booking.departureId);
  if (departure) {
    if (booking.status === "Confirmed") departure.confirmed = Math.max(0, departure.confirmed - (booking.adults + booking.children));
    departure.holds = departure.holds.filter((item) => item.bookingId !== booking.id);
  }
  event(booking, "Cancelled", "Cancelled");
  desk.audit.push({ id: id("audit"), at: nowIso(), actor, action: `Cancelled ${booking.reference}` });
  write(desk);
  return { booking };
}

export function refundBooking(reference: string, actor: string) {
  const desk = read();
  const booking = desk.bookings.find((item) => item.reference === reference);
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "Cancelled") return { error: "Cancel the booking before recording a refund." };
  event(booking, "Refunded", "Refund recorded on the test desk");
  desk.audit.push({ id: id("audit"), at: nowIso(), actor, action: `Refunded ${booking.reference}` });
  write(desk);
  return { booking };
}

export function bookingsForEmail(email: string) {
  return read().bookings.filter((item) => item.email.toLowerCase() === email.toLowerCase());
}

export function snapshot() {
  const desk = read();
  const confirmed = desk.bookings.filter((item) => item.status === "Confirmed" || item.status === "Completed");
  const pending = desk.bookings.filter((item) => item.status === "Pending Payment" || item.status === "Held");
  const refunded = desk.bookings.filter((item) => item.status === "Refunded");
  return {
    desk,
    gross: confirmed.reduce((sum, item) => sum + item.total, 0),
    pendingValue: pending.reduce((sum, item) => sum + item.total, 0),
    refundedValue: refunded.reduce((sum, item) => sum + item.total, 0),
    confirmedCount: confirmed.length,
    enquiryCount: desk.enquiries.length,
  };
}

export function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export type { Promo };
