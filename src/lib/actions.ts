"use server";

import { redirect } from "next/navigation";
import { currentUser, setSession, clearSession, staff } from "@/lib/auth";
import {
  addEnquiry,
  addSubscriber,
  addSupport,
  addTraveler,
  authenticate,
  cancelBooking,
  confirmTestPayment,
  createHold,
  refundBooking,
  registerUser,
  removeTraveler,
  toggleFavorite,
  updateProfile,
} from "@/lib/desk";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function subscribe(formData: FormData) {
  const email = text(formData, "email");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) addSubscriber(email);
  redirect("/?joined=1");
}

export async function sendEnquiry(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/bespoke?error=Check your name and email.");
  }
  addEnquiry({
    name,
    email,
    places: text(formData, "places"),
    dates: text(formData, "dates"),
    flexible: formData.get("flexible") === "on",
    party: text(formData, "party"),
    budget: text(formData, "budget"),
    style: text(formData, "style"),
    stay: text(formData, "stay"),
    notes: text(formData, "notes"),
  });
  redirect("/bespoke?sent=1");
}

export async function sendContact(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const notes = text(formData, "notes");
  if (!name || !email || !notes) redirect("/contact?error=All three fields are required.");
  addEnquiry({
    name,
    email,
    places: "General",
    dates: "",
    flexible: true,
    party: "",
    budget: "",
    style: "",
    stay: "",
    notes,
  });
  redirect("/contact?sent=1");
}

export async function register(formData: FormData) {
  const result = registerUser({
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if ("error" in result && result.error) redirect(`/register?error=${encodeURIComponent(result.error)}`);
  if (!("user" in result) || !result.user) redirect("/register?error=Could not create the account.");
  await setSession(result.user.id);
  redirect("/account");
}

export async function login(formData: FormData) {
  const user = authenticate(text(formData, "email"), text(formData, "password"));
  if (!user) redirect(`/login?error=${encodeURIComponent("Email or password is incorrect.")}`);
  await setSession(user.id);
  const next = text(formData, "next");
  if (next.startsWith("/")) redirect(next);
  redirect(staff(user) ? "/admin" : "/account");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function saveProfile(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  updateProfile(user.id, { name: text(formData, "name") });
  redirect("/account/profile?saved=1");
}

export async function createTraveler(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  addTraveler(user.id, { name: text(formData, "name"), note: text(formData, "note") });
  redirect("/account/travelers");
}

export async function deleteTraveler(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  removeTraveler(user.id, text(formData, "id"));
  redirect("/account/travelers");
}

export async function saveJourney(formData: FormData) {
  const user = await currentUser();
  const slug = text(formData, "slug");
  if (!user) redirect(`/login?next=/journeys/${slug}`);
  toggleFavorite(user.id, slug);
  redirect(`/journeys/${slug}`);
}

export async function sendSupport(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const message = text(formData, "message");
  if (message) addSupport(user.id, message);
  redirect("/account/support?sent=1");
}

export async function holdSeats(formData: FormData) {
  const user = await currentUser();
  const slug = text(formData, "journey");
  const names = formData.getAll("traveler").map((item) => String(item));
  const result = createHold({
    journeySlug: slug,
    departureId: text(formData, "departure"),
    adults: Number(formData.get("adults")),
    children: Number(formData.get("children")),
    addonIds: formData.getAll("addon").map(String),
    promoCode: text(formData, "promo"),
    email: text(formData, "email") || user?.email || "",
    contactName: text(formData, "contactName") || user?.name || "",
    travelerNames: names,
    userId: user?.id ?? null,
  });
  if ("error" in result && result.error) {
    redirect(`/journeys/${slug}/book?error=${encodeURIComponent(result.error)}`);
  }
  if (!("booking" in result) || !result.booking) redirect(`/journeys/${slug}/book?error=Could not hold seats.`);
  redirect(`/booking/${result.booking.reference}`);
}

export async function payTest(formData: FormData) {
  const reference = text(formData, "reference");
  const result = confirmTestPayment(reference);
  if ("error" in result && result.error) {
    redirect(`/booking/${reference}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/booking/${reference}`);
}

export async function cancelTrip(formData: FormData) {
  const user = await currentUser();
  const reference = text(formData, "reference");
  const booking = (await import("@/lib/desk")).getBooking(reference);
  if (!user || !booking || (booking.email !== user.email && !staff(user))) redirect("/login");
  cancelBooking(reference, user.email);
  redirect(staff(user) && text(formData, "return") === "admin" ? `/admin/bookings/${reference}` : `/account/trips/${reference}`);
}

export async function refundTrip(formData: FormData) {
  const user = await currentUser();
  if (!staff(user)) redirect("/login");
  const reference = text(formData, "reference");
  refundBooking(reference, user!.email);
  redirect(`/admin/bookings/${reference}`);
}
