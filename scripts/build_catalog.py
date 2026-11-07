"""Build src/content/catalog.json from the verified photography manifest."""

from __future__ import annotations

import datetime
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "photography" / "manifest.json"
OUT = ROOT / "src" / "content" / "catalog.json"

BEATS: dict[str, list[tuple[str, str]]] = {
    "italy": [
        ("Arrival along the coast", "Leave Naples by car and follow the road as it narrows above the sea. By late afternoon you are in Positano, with time to walk down to the beach before dinner."),
        ("A day on the water", "A small boat runs toward Capri. Swim at the base of the cliffs, then return for a long lunch of lemon, mozzarella, and grilled fish."),
        ("Ravello", "The morning is for the gardens at Ravello and the view from the terrace. The afternoon is unscheduled."),
        ("Path of the Gods", "Walk a section of the Sentiero degli Dei with a guide, ending in a hamlet for coffee. Transfer back before the road gets busy."),
        ("Atrani and Amalfi", "Spend the day between Atrani’s small harbor and the duomo in Amalfi. Dinner is on a terrace, not in a dining room."),
        ("At your own pace", "A pool morning, a shop for ceramics if you want one, and an early evening passeggiata."),
        ("Departure", "Breakfast with the coast still in shadow, then the drive back to Naples."),
    ],
    "greece": [
        ("Caldera arrival", "The boat or the evening flight brings you to Santorini. Settle into a house facing the caldera and eat simply."),
        ("Oia on foot", "Walk the path before the day-trip boats arrive. The rest of the day stays close to the house."),
        ("A boat and a cove", "Sail the caldera, swim, and stop where the water is calm. No fixed beach club."),
        ("The south of the island", "Akrotiri and the quieter coast, then back for a late lunch."),
        ("Nothing planned", "Read, swim, watch the light change. Dinner is reserved, the hours before it are not."),
        ("Departure", "A last coffee above the water, then the transfer."),
    ],
    "japan": [
        ("Kyoto, slowly", "Arrive and walk one neighborhood only — Gion or the lanes near the river. The ryokan explains the evening meal."),
        ("East temples", "Kiyomizu-dera in the morning and a garden afterward. Tea is included, shopping is not the point."),
        ("Arashiyama", "The bamboo path early, then the river. Lunch is near the mountain, not in the center."),
        ("Fushimi and a quiet shrine", "The gates at Fushimi Inari, as far as you want to climb, then a long lunch."),
        ("A day without a list", "The Philosopher’s Path, or nothing. The ryokan can draw a bath."),
        ("Hakone or the station", "Depending on the journey, continue to Lake Ashi or depart from Kyoto."),
    ],
    "france": [
        ("The Riviera by road", "Arrive in Nice and continue to a house or hotel above the water. The first evening is a short walk and dinner."),
        ("Èze and the cape", "Morning in Èze, afternoon at Cap Ferrat. Swim if the water allows."),
        ("A table and a market", "The market sets the lunch. The afternoon is free."),
        ("Villefranche", "The bay, the old streets, and a boat if the weather is kind."),
        ("Unscheduled", "Read on the terrace. One reservation in the evening is enough."),
        ("Departure", "A slow morning and the road back to Nice."),
    ],
    "thailand": [
        ("The Andaman", "Arrive in Phuket and transfer by road and longtail to a quieter beach. The first swim is the schedule."),
        ("Limestone", "A boat day among the karsts of Phang Nga or Railay. Snorkel where the guide knows the current."),
        ("Shore day", "Walk, eat, sleep. A massage is easy to add."),
        ("Another island hour", "A short boat to a cove and back before the afternoon wind."),
        ("Departure", "The longtail returns you in time for the flight."),
    ],
    "maldives": [
        ("Lagoon arrival", "A boat or seaplane from Malé. You are in the villa before lunch. The reef is a few steps away."),
        ("The house reef", "Snorkel with the house guide. The rest of the day is the deck."),
        ("A sandbank", "Picnic on a bank that disappears at high tide. Back by late afternoon."),
        ("Nothing on the page", "This day is deliberately empty."),
        ("Last light", "A final swim and dinner with your feet toward the water."),
        ("Departure", "The boat meets the tide, not a crowded timetable."),
    ],
    "indonesia": [
        ("Ubud", "Land in Bali and drive inland. The villa looks over rice or jungle. Eat near the house."),
        ("Terraces", "Walk the ridges at Tegallalang or Sidemen with a local guide who lives there."),
        ("A temple morning", "Tirta Empul or a village temple, early. The afternoon is the pool."),
        ("The coast", "Uluwatu and the cliff, then a quieter beach. Return before dark."),
        ("Wellness", "A treatment in the villa and no other plan."),
        ("Departure", "The drive back to the airport is the only appointment."),
    ],
    "kenya": [
        ("Into the Mara", "A light aircraft from Nairobi. Lunch at the camp, then a short evening drive."),
        ("Full day in the reserve", "Two drives, breakfast in the field if you want it, and the heat of the day in camp."),
        ("On the animals’ time", "The guide chooses the direction. Cats, elephants, or the open grass — whatever the morning offers."),
        ("A slower drive", "Shorter hours, more sitting. The bush does not need a checklist."),
        ("Walking or a second camp", "Where the reserve allows, a walking hour with an armed guide, or the transfer toward Amboseli."),
        ("Departure", "A last look at the plain and the flight out."),
    ],
    "morocco": [
        ("Marrakech", "Arrive and go straight to the riad. The medina can wait until you have had tea."),
        ("The city, with a guide", "A palace, a garden, and one museum. The souks are optional and better with someone who knows when to leave."),
        ("The Atlas or the dunes", "Continue to a kasbah or toward Merzouga, depending on the journey. The road is part of the day."),
        ("Desert hours", "Walk the edge of the dunes before the heat. Dinner at the camp."),
        ("The return", "A slow road back, with one stop and no shopping itinerary."),
        ("Departure", "Breakfast in the riad and a private transfer."),
    ],
    "switzerland": [
        ("The valley", "Arrive by train. The chalet or hotel is a short transfer from the station."),
        ("A high path", "One walk with a guide, chosen for the weather and your pace. Lunch is carried or taken at a hut."),
        ("The lake", "A boat or a quiet shore. The peaks do the work."),
        ("A second valley", "A scenic rail hour and a walk at the other end."),
        ("Unscheduled", "The terrace, a book, an early night."),
        ("Departure", "The morning train."),
    ],
    "portugal": [
        ("Lisbon or Porto", "Arrive and walk one neighborhood. Dinner is reserved near the water."),
        ("The river", "Continue to the Douro or stay with the coast. The quintas and the cliffs are not the same day."),
        ("A table", "Wine is the point of this day, with food that belongs to it. No rush of tastings."),
        ("On foot", "A village, a viewpoint, a long lunch."),
        ("Free", "The house, the pool or the river, and nothing else."),
        ("Departure", "A private car to the airport."),
    ],
    "iceland": [
        ("South coast", "Leave Reykjavík and drive the south coast. Waterfalls and black sand, with time to stand still."),
        ("Ice and basalt", "Jökulsárlón or a quieter ice beach, then a warm pool."),
        ("Weather day", "The guide rewrites this day around the wind. That is the correct plan."),
        ("A short walk", "One trail, well chosen, and a long lunch indoors."),
        ("Departure", "Back toward Reykjavík with one stop, not five."),
    ],
    "spain": [
        ("Andalusia", "Arrive in Málaga or Seville and continue to the house. The first evening is a walk."),
        ("A palace or a white town", "The Alhambra, Ronda, or a pueblo blanco, depending on where you are staying. One major visit is enough."),
        ("Gardens", "The Generalife or a courtyard lunch. The afternoon is hot and should be empty."),
        ("Food", "A market, a kitchen hour if you want it, and a late dinner."),
        ("Departure", "A calm morning and the road out."),
    ],
    "south-africa": [
        ("The peninsula or the vines", "Arrive in Cape Town. Either the Atlantic coast or a wine estate, not both."),
        ("A full day outside", "Table Mountain if the wind allows, or a reserve drive if this is the safari chapter."),
        ("The winelands", "Two estates, a long lunch, and no third tasting."),
        ("On the water or in the bush", "A boat, a beach, or a game drive. The journey you chose decides which."),
        ("Free", "The hotel, the pool, the city if you want it."),
        ("Departure", "A private transfer to the airport."),
    ],
    "peru": [
        ("Cusco, gently", "Arrive and do very little. The altitude is the itinerary."),
        ("The Sacred Valley", "Descend to the valley. Moray, a village, or a loom — one or two things."),
        ("A ruin and a long lunch", "Ollantaytambo or Pisac in the morning. The afternoon is rest."),
        ("Machu Picchu", "The train and the citadel with a private guide. Back to the valley by evening."),
        ("A softer day", "Salt pans at Maras or simply the lodge garden."),
        ("Departure", "The flight from Cusco."),
    ],
    "new-zealand": [
        ("Queenstown", "Arrive and let the lake be the welcome. Dinner in town or at the lodge."),
        ("The Remarkables or the lake", "A walk matched to the weather, with a guide who will turn around if the cloud drops."),
        ("Toward the fiord", "The road to Milford, or a scenic flight if the cloud is low and the budget allows."),
        ("On the water", "A boat under the walls of the fiord, or a quiet hour at Glenorchy."),
        ("Unscheduled", "The lodge, the lake, an early fire."),
        ("Departure", "Morning transfer."),
    ],
    "mexico": [
        ("The Caribbean coast", "Arrive in Tulum or Cancún and go straight to the house. Swim before dinner."),
        ("Ruins at opening", "Tulum’s cliff early, before the heat and the coaches."),
        ("A cenote", "One cenote with a guide who knows which ones are quiet. Lunch nearby."),
        ("Bacalar or the beach", "Either the lagoon’s color or a day with nowhere to be."),
        ("Departure", "The boat or the car, timed to the flight."),
    ],
    "india": [
        ("Udaipur", "Arrive and go to the hotel on the lake. The city can wait until morning."),
        ("Palaces", "The City Palace and a boat on Pichola. One other stop at most."),
        ("A fort or the desert edge", "Amber, Jaipur, or the road toward Jaisalmer, depending on the journey."),
        ("Courtyards", "A textile studio or a kitchen, then a free afternoon."),
        ("On the water", "Kerala’s backwaters replace the desert on that journey: a day on a boat under the palms."),
        ("Departure", "A private car and a sensible connection."),
    ],
    "croatia": [
        ("The Adriatic", "Arrive in Dubrovnik or Split and transfer by car or boat. The first evening is the old stone and the sea."),
        ("Walls or a palace", "Dubrovnik’s walls early, or Diocletian’s Palace, then nothing else required."),
        ("An island", "The boat to Hvar, Korčula, or a quieter island. Swim, lunch, return or stay."),
        ("On the water", "A day with a skipper. The route follows the wind."),
        ("Free", "A harbor morning and a long lunch."),
        ("Departure", "The boat or the car back to the airport."),
    ],
    "seychelles": [
        ("Granite and sand", "Arrive on Mahé and continue to La Digue or Praslin. The first swim is the welcome."),
        ("Anse Source d’Argent", "Go early, before the day boats. The rest of the day is shade and water."),
        ("Praslin", "A beach and, if you want it, the palms of Vallée de Mai."),
        ("A boat", "A short sail to a cove. Snorkel and come back."),
        ("Empty hours", "The room opens onto the beach. Use that."),
        ("Departure", "The ferry and the flight are the only plan."),
    ],
}

STYLE = {
    "italy": "Coastal",
    "greece": "Island",
    "japan": "Cultural",
    "france": "Coastal",
    "thailand": "Island",
    "maldives": "Island",
    "indonesia": "Wellness",
    "kenya": "Wildlife",
    "morocco": "Cultural",
    "switzerland": "Alpine",
    "portugal": "Culinary",
    "iceland": "Alpine",
    "spain": "Cultural",
    "south-africa": "Wildlife",
    "peru": "Cultural",
    "new-zealand": "Alpine",
    "mexico": "Coastal",
    "india": "Cultural",
    "croatia": "Coastal",
    "seychelles": "Island",
}

STYLE_OVERRIDE = {
    "cape-winelands": "Culinary",
    "ubud-wellness": "Wellness",
    "kerala-backwaters": "Wellness",
    "provence-harvest": "Culinary",
    "douro-quintas": "Culinary",
    "timbavati-safari": "Wildlife",
    "masai-mara": "Wildlife",
    "amboseli": "Wildlife",
    "bali-retreat": "Wellness",
    "engadin": "Alpine",
    "lake-lucerne": "Alpine",
    "queenstown-lakes": "Alpine",
    "milford-sound": "Alpine",
    "south-coast-iceland": "Alpine",
    "westfjords": "Alpine",
}

PRICE = {
    "italy": 860_000,
    "greece": 740_000,
    "japan": 920_000,
    "france": 980_000,
    "thailand": 640_000,
    "maldives": 1_150_000,
    "indonesia": 690_000,
    "kenya": 1_080_000,
    "morocco": 620_000,
    "switzerland": 1_120_000,
    "portugal": 580_000,
    "iceland": 760_000,
    "spain": 640_000,
    "south-africa": 890_000,
    "peru": 720_000,
    "new-zealand": 940_000,
    "mexico": 610_000,
    "india": 680_000,
    "croatia": 700_000,
    "seychelles": 1_040_000,
}

NIGHTS = {
    "kenya": 8,
    "peru": 8,
    "maldives": 7,
    "new-zealand": 8,
    "iceland": 6,
    "thailand": 6,
}

REGION_OF = {
    "italy": "Europe",
    "greece": "Europe",
    "france": "Europe",
    "switzerland": "Europe",
    "portugal": "Europe",
    "iceland": "Europe",
    "spain": "Europe",
    "croatia": "Europe",
    "japan": "Asia",
    "thailand": "Asia",
    "indonesia": "Asia",
    "india": "Asia",
    "maldives": "Indian Ocean",
    "seychelles": "Indian Ocean",
    "kenya": "Africa",
    "morocco": "Africa",
    "south-africa": "Africa",
    "peru": "Americas",
    "mexico": "Americas",
    "new-zealand": "Oceania",
}

BEST = {
    "italy": "May, June, and September. August is beautiful and crowded.",
    "greece": "Late May to early July, and September. The meltimi wind is part of August.",
    "japan": "Late March to April for blossom, November for maple. Summers are humid.",
    "france": "May, June, and September. July and August belong to the beach clubs.",
    "thailand": "December to March for the Andaman. The green season is quieter and wetter.",
    "maldives": "January to April is the driest. May and November are more changeable and less crowded.",
    "indonesia": "April to June and September. The rains are real from December.",
    "kenya": "July to October for the migration months. January and February are excellent for calves.",
    "morocco": "March to May and October. Midsummer in the desert is harsh.",
    "switzerland": "June to September for walking. December to March if you want snow.",
    "portugal": "May, June, September, and October. August on the coast is busy.",
    "iceland": "June to August for long light. September for fewer people and a chance of aurora.",
    "spain": "April, May, October. Andalusian afternoons in July are for staying indoors.",
    "south-africa": "November to March for the Cape summer. May to September for the bush.",
    "peru": "May to September for drier trails. The altitude is the same in every month.",
    "new-zealand": "December to March. Fiordland can rain on a perfect forecast.",
    "mexico": "November to April. Hurricane season deserves a flexible ticket.",
    "india": "October to March for Rajasthan. Kerala is gentler from December to February.",
    "croatia": "May, June, and September. July ferries are crowded.",
    "seychelles": "April, May, October, and November sit between the trades.",
}


def load_fetch():
    spec = importlib.util.spec_from_file_location("fetch", ROOT / "scripts" / "fetch_photography.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def photo_from(record: dict) -> dict:
    files = {item["name"]: item for item in record["files"]}
    best = files.get("large") or files.get("card") or files.get("mobile")
    src = "/" + best["file"].replace("\\", "/").removeprefix("public/")
    return {
        "src": src,
        "alt": record["alt"],
        "width": best["width"],
        "height": best["height"],
        "credit": record["attribution"]["credit"],
        "license": record["attribution"]["license"],
        "source": record["attribution"]["source"],
    }


def main() -> None:
    fetch = load_fetch()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_id = {item["id"]: item for item in manifest["photographs"]}

    def photo(pid: str) -> dict:
        return photo_from(by_id[pid])

    destinations = []
    for slug, country, place, story, _queries in fetch.DESTINATIONS:
        images = []
        hero = None
        for role, _aspect in fetch.DEST_ROLES:
            record = by_id.get(f"dest-{slug}-{role}")
            if not record:
                continue
            frame = photo(record["id"])
            frame["role"] = role
            images.append(frame)
            if role == "hero":
                hero = frame
        destinations.append(
            {
                "slug": slug,
                "name": place,
                "country": country,
                "region": REGION_OF[slug],
                "story": story,
                "summary": story,
                "bestTime": BEST[slug],
                "climate": BEST[slug],
                "culture": f"The journey is arranged around how people actually live in {place}, not around a checklist of sights.",
                "practical": "AURA arranges private transfers, the guide, and the pace. You carry a passport, comfortable shoes, and a willingness to leave one day empty.",
                "hero": hero,
                "gallery": images,
            }
        )

    journeys = []
    start = datetime.date(2026, 12, 4)
    for index, (slug, destination, title, _cq, _ca, _dq, detail_alt) in enumerate(fetch.PACKAGES):
        nights = NIGHTS.get(destination, 7)
        if slug in ("path-of-the-gods", "uluwatu-cliffs", "hvar-islands"):
            nights = 5
        style = STYLE_OVERRIDE.get(slug, STYLE[destination])
        manner = "Small group" if style == "Wildlife" or index % 5 == 0 else "Private"
        capacity = 10 if manner == "Small group" else 8
        beats = BEATS[destination]
        offset = (index * 2) % max(1, len(beats) - 3)
        chosen = []
        for day_index in range(nights):
            title_day, body = beats[(offset + day_index) % len(beats)]
            chosen.append({"title": title_day, "body": body})
        price = PRICE[destination] + (index % 4) * 40_000
        departures = []
        for number in range(6):
            day = start + datetime.timedelta(days=21 * number + (index % 9))
            departures.append(
                {
                    "id": f"{slug}-{day.isoformat()}",
                    "date": day.isoformat(),
                    "capacity": capacity,
                    "seedConfirmed": (index + number) % 4,
                }
            )
        cover = photo(f"pkg-{slug}-cover") if f"pkg-{slug}-cover" in by_id else photo(f"dest-{destination}-hero")
        detail = photo(f"pkg-{slug}-detail") if f"pkg-{slug}-detail" in by_id else cover
        place = next(item["name"] for item in destinations if item["slug"] == destination)
        country = next(item["country"] for item in destinations if item["slug"] == destination)
        journeys.append(
            {
                "slug": slug,
                "destination": destination,
                "title": title,
                "place": place,
                "country": country,
                "region": REGION_OF[destination],
                "nights": nights,
                "price": price,
                "style": style,
                "manner": manner,
                "group": f"Up to {capacity} guests" if manner == "Private" else "8 to 10 guests",
                "summary": detail_alt,
                "overview": f"{title} is {'an' if nights == 8 else 'a'} {nights}-night journey in {place}, {country}. {detail_alt.rstrip('.')}. The days are few on purpose. One strong experience is better than a full page of stops.",
                "highlights": [
                    f"{nights} nights in {place}",
                    "Private guiding and transfers",
                    detail_alt,
                    "One day left deliberately open",
                ],
                "days": chosen,
                "stay": f"A carefully chosen house, lodge, or small hotel in {place}. AURA does not invent a partnership with a named brand.",
                "transport": "Private car, boat, or light aircraft where the geography requires it. International flights are not included.",
                "included": [
                    "Accommodation as described",
                    "Daily breakfast",
                    "Private guide on planned days",
                    "Transfers listed in the itinerary",
                    "Entrance fees for planned visits",
                ],
                "excluded": [
                    "International flights",
                    "Travel insurance",
                    "Lunches and dinners unless noted",
                    "Optional add-ons",
                    "Visas and personal expenses",
                ],
                "addons": [
                    {"id": "guide", "name": "Additional private guide day", "price": 48_000},
                    {"id": "transfer", "name": "Arrival transfer upgrade", "price": 22_000},
                    {"id": "night", "name": "Extra night at the same stay", "price": 95_000},
                ],
                "faqs": [
                    {
                        "q": "Can the pace change?",
                        "a": "Yes. Tell the desk before you travel, or tell the guide on the morning. Empty time is part of the design.",
                    },
                    {
                        "q": "Are international flights included?",
                        "a": "No. The journey begins when you land. AURA can advise on routing.",
                    },
                ],
                "cancellation": "More than 60 days before departure: the deposit is retained. 30 to 60 days: 50% of the journey price. Inside 30 days: the journey price is due, unless a documented travel-insurance claim applies. Test bookings in this demo follow the same words.",
                "cover": cover,
                "detail": detail,
                "departures": departures,
            }
        )

    collections = []
    for name, styles in [
        ("Romantic escapes", ["Coastal", "Island"]),
        ("Private houses", ["Coastal", "Wellness"]),
        ("Cultural immersion", ["Cultural"]),
        ("Island retreats", ["Island"]),
        ("Wellness journeys", ["Wellness"]),
        ("Wildlife safaris", ["Wildlife"]),
        ("Culinary discoveries", ["Culinary"]),
        ("Family adventures", ["Coastal", "Alpine"]),
        ("Alpine escapes", ["Alpine"]),
        ("Honeymoon collection", ["Island", "Coastal"]),
        ("Coastal journeys", ["Coastal"]),
        ("Signature experiences", ["Wildlife", "Cultural", "Alpine"]),
    ]:
        slug = name.lower().replace(" ", "-")
        matched = [item["slug"] for item in journeys if item["style"] in styles][:8]
        hero_journey = next(item for item in journeys if item["slug"] == matched[0])
        collections.append(
            {
                "slug": slug,
                "name": name,
                "summary": f"A short list of {name.lower()}, chosen for pace and place rather than a theme-park version of the idea.",
                "journeySlugs": matched,
                "image": hero_journey["cover"],
            }
        )

    journal = []
    for record in manifest["photographs"]:
        if record["group"] != "journal":
            continue
        journal.append(
            {
                "slug": record["role"],
                "title": record["alt"],
                "excerpt": "A note from the road, written as sample editorial for AURA.",
                "body": [
                    record["alt"] + ".",
                    "This is sample editorial, not a dispatch from a guest. The photograph is real, licensed, and credited below.",
                    "AURA would rather publish one exact place than a list of adjectives. The light, the hour, and the ground underfoot are the story.",
                ],
                "image": photo_from(record),
            }
        )

    heroes = []
    for record in manifest["photographs"]:
        if record["group"] == "hero":
            heroes.append({"id": record["id"], **photo_from(record)})

    payload = {
        "brand": manifest["brand"],
        "heroes": heroes,
        "destinations": destinations,
        "journeys": journeys,
        "collections": collections,
        "journal": journal,
        "regions": sorted({item["region"] for item in destinations}),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"destinations {len(destinations)} journeys {len(journeys)} journal {len(journal)} -> {OUT}")


if __name__ == "__main__":
    main()
