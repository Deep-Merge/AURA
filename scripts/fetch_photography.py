"""AURA photography pipeline.

Builds a controlled manifest, downloads freely licensed photographs from
Wikimedia Commons, validates them, and writes cropped WebP renditions.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "images"
DATA = ROOT / "data" / "photography"
ORIGINALS = DATA / "originals"
CACHE_PATH = DATA / "search-cache.json"
MANIFEST_PATH = DATA / "manifest.json"
PROGRESS_PATH = DATA / "progress.jsonl"

UA = "AURAPhotographyPipeline/1.0 (local portfolio; travel photography; Python urllib)"
API = "https://commons.wikimedia.org/w/api.php"
_THROTTLE = threading.Lock()
_NEXT_REQUEST = 0.0

ALLOWED_ASPECTS = {
    "16:9": [("large", 2400, 1350), ("card", 1280, 720), ("mobile", 800, 450)],
    "3:2": [("large", 1920, 1280), ("card", 1200, 800), ("mobile", 750, 500)],
    "4:5": [("large", 1400, 1750), ("card", 880, 1100), ("mobile", 640, 800)],
}

NEG_RE = re.compile(
    r"\b(maps?|flags?|logos?|icons?|diagrams?|locator|stamps?|coins?|paintings?|"
    r"drawings?|sketches?|posters?|emblems?|cemetery|military|satellite|charts?|"
    r"screenshots?|cartoons?|manga|pictograms?|plaques?|selfies?|crowds?|tourists?|"
    r"traffic|parking|construction|graffiti|billboards?|election|coat of arms|"
    r"photochrom\w*|postcard|engraving|lithograph|illustration|woodcut|etching|"
    r"lccn|kodak|calibration)\b",
    re.I,
)
CLUTTER_RE = re.compile(
    r"lccn|photochrom|detroit publishing|library of congress|color chart|"
    r"\b(svg|pdf|document|book cover|newspaper)\b",
    re.I,
)


class QualityError(ValueError):
    """Raised when a file is a scan, chart, or otherwise unusable as photography."""

DEST_ROLES = [
    ("hero", "16:9"),
    ("coast", "16:9"),
    ("architecture", "4:5"),
    ("stay", "3:2"),
    ("experience", "3:2"),
    ("detail", "4:5"),
    ("nature", "16:9"),
    ("evening", "3:2"),
]

# slug, name, region, story, list of (query, alt) aligned with DEST_ROLES
DESTINATIONS = [
    (
        "italy",
        "Italy",
        "Amalfi Coast",
        "Coastal views, boutique hotels, sailing, and cliffside architecture.",
        [
            ("Positano Amalfi Coast", "Cliffside houses of Positano above the Tyrrhenian Sea"),
            ("Amalfi town sea Campania", "Amalfi stacked above the harbor"),
            ("Ravello villa terrace Campania", "A Ravello terrace looking over the coast"),
            ("Positano hotel terrace sea", "A hotel terrace on the Amalfi Coast"),
            ("Capri Faraglioni boat", "Boats passing the Faraglioni of Capri"),
            ("Atrani Amalfi village", "The compact harbor of Atrani"),
            ("Sentiero degli Dei Amalfi", "The Path of the Gods above the Amalfi Coast"),
            ("Praiano Amalfi evening", "Praiano in warm evening light"),
        ],
    ),
    (
        "greece",
        "Greece",
        "Santorini",
        "Caldera views, whitewashed architecture, and quiet Aegean light.",
        [
            ("Oia Santorini caldera", "Oia perched on the Santorini caldera"),
            ("Santorini caldera sea", "The Santorini caldera opening to the Aegean"),
            ("Fira Santorini architecture", "Whitewashed architecture in Fira"),
            ("Santorini hotel pool caldera", "A caldera pool in Santorini"),
            ("Imerovigli Santorini path", "The path along Imerovigli"),
            ("Santorini blue dome church", "A blue dome above white walls in Santorini"),
            ("Akrotiri Santorini coast", "The raw coast near Akrotiri"),
            ("Santorini sunset caldera", "Sunset over the Santorini caldera"),
        ],
    ),
    (
        "japan",
        "Japan",
        "Kyoto",
        "Temples, ryokan life, gardens, and the pace of an old capital.",
        [
            ("Fushimi Inari Kyoto", "Vermilion gates at Fushimi Inari"),
            ("Arashiyama bamboo grove", "The bamboo grove at Arashiyama"),
            ("Kiyomizu-dera Kyoto", "The wooden stage of Kiyomizu-dera"),
            ("Kyoto ryokan interior", "A ryokan interior in Kyoto"),
            ("Philosopher's Path Kyoto", "The Philosopher's Path in Kyoto"),
            ("Ryoan-ji Kyoto garden", "Raked gravel at Ryoan-ji"),
            ("Kinkaku-ji Kyoto", "The Golden Pavilion across still water"),
            ("Gion Kyoto street evening", "A quiet street in Gion at dusk"),
        ],
    ),
    (
        "france",
        "France",
        "Côte d'Azur",
        "Mediterranean hill towns, capes, and the light of the Riviera.",
        [
            ("Eze village France", "The medieval hill town of Èze"),
            ("Villefranche-sur-Mer", "Villefranche-sur-Mer along the bay"),
            ("Saint-Jean-Cap-Ferrat", "The coast at Saint-Jean-Cap-Ferrat"),
            ("Eze hotel garden terrace", "A garden terrace above Èze"),
            ("Promenade des Anglais Nice", "The curve of the Promenade des Anglais"),
            ("Menton old town", "The old town of Menton in color and light"),
            ("Cassis calanque", "A calanque near Cassis"),
            ("Antibes coast evening", "The Antibes coast in the evening"),
        ],
    ),
    (
        "thailand",
        "Thailand",
        "Andaman Coast",
        "Limestone islands, longtail silhouettes, and warm Andaman water.",
        [
            ("Railay Krabi", "Limestone cliffs at Railay"),
            ("Phang Nga Bay Thailand", "Karsts rising from Phang Nga Bay"),
            ("Phi Phi Leh", "The cliffs of Phi Phi Leh"),
            ("Phuket beach resort", "A quiet Phuket beach"),
            ("Longtail boat Thailand", "A longtail boat in Andaman water"),
            ("Koh Lanta beach", "The long beach at Koh Lanta"),
            ("Krabi limestone coast", "Krabi's limestone coastline"),
            ("Maya Bay Phi Phi", "Maya Bay enclosed by cliffs"),
        ],
    ),
    (
        "maldives",
        "Maldives",
        "The Atolls",
        "Overwater villas, sandbanks, and shallow lagoons.",
        [
            ("Maldives overwater bungalow", "Overwater villas in a Maldivian lagoon"),
            ("Maldives aerial atoll", "An atoll seen from above"),
            ("Maldives water villa deck", "A deck over clear lagoon water"),
            ("Maldives beach palm", "Palms along a Maldivian beach"),
            ("Maldives sandbank", "A sandbank in shallow turquoise water"),
            ("Maldives coral reef", "Coral just under the surface"),
            ("Maldives lagoon", "A still Maldivian lagoon"),
            ("Maldives sunset ocean", "Sunset over open ocean in the Maldives"),
        ],
    ),
    (
        "indonesia",
        "Indonesia",
        "Bali",
        "Private villas, rice terraces, temples, and the island's green interior.",
        [
            ("Tegallalang rice terrace", "The rice terraces at Tegallalang"),
            ("Nusa Penida Kelingking", "Kelingking beach on Nusa Penida"),
            ("Uluwatu temple cliff", "Uluwatu temple on the cliff"),
            ("Bali private villa pool", "A private pool villa in Bali"),
            ("Tanah Lot Bali", "Tanah Lot at the water's edge"),
            ("Ubud Bali temple", "A temple courtyard in Ubud"),
            ("Sidemen Bali rice", "Rice fields in Sidemen"),
            ("Bali beach sunset", "A Bali beach at sunset"),
        ],
    ),
    (
        "kenya",
        "Kenya",
        "Maasai Mara",
        "Wildlife, tented lodges, game drives, and open savannah.",
        [
            ("Maasai Mara landscape", "Open grassland in the Maasai Mara"),
            ("Maasai Mara elephant", "Elephants crossing the Mara"),
            ("Safari lodge Kenya tent", "A tented safari lodge in Kenya"),
            ("Kenya safari camp", "A bush camp in Kenya"),
            ("Maasai Mara game drive", "A game drive on the Mara plains"),
            ("Acacia tree savannah Kenya", "An acacia on the savannah"),
            ("Amboseli Kilimanjaro elephants", "Elephants with Kilimanjaro behind them"),
            ("Maasai Mara sunset", "Sunset over the Mara"),
        ],
    ),
    (
        "morocco",
        "Morocco",
        "Marrakech and the Sahara",
        "Riads, medina craft, kasbahs, and desert camps.",
        [
            ("Marrakech medina", "The medina of Marrakech"),
            ("Erg Chebbi dunes", "Dunes at Erg Chebbi"),
            ("Bahia Palace Marrakech", "Courtyards of the Bahia Palace"),
            ("Marrakech riad courtyard", "A riad courtyard in Marrakech"),
            ("Ait Benhaddou", "The ksar of Aït Benhaddou"),
            ("Jardin Majorelle Marrakech", "Majorelle blue and garden shade"),
            ("Dades Valley Morocco", "The Dadès Valley"),
            ("Sahara camp Morocco evening", "A desert camp at dusk"),
        ],
    ),
    (
        "switzerland",
        "Switzerland",
        "The Alps",
        "Lakes, chalets, and high valleys.",
        [
            ("Lake Sils Switzerland", "Lake Sils in the Engadin"),
            ("Oeschinensee", "Oeschinen Lake beneath the peaks"),
            ("Lauterbrunnen valley", "Cliffs above Lauterbrunnen"),
            ("Swiss chalet Alps", "A timber chalet in the Alps"),
            ("Matterhorn reflection", "The Matterhorn reflected in still water"),
            ("Lavaux vineyard terraces", "Terraced vineyards at Lavaux"),
            ("Lake Lucerne mountains", "Lake Lucerne and the mountains"),
            ("St Moritz lake evening", "The lake at St. Moritz"),
        ],
    ),
    (
        "portugal",
        "Portugal",
        "Lisbon and the Douro",
        "River light, tiled cities, and terraced quintas.",
        [
            ("Douro Valley Portugal", "Terraces of the Douro Valley"),
            ("Porto Ribeira river", "The Ribeira waterfront in Porto"),
            ("Alfama Lisbon", "A lane in Alfama"),
            ("Douro quinta estate", "A wine estate above the Douro"),
            ("Belem Tower Lisbon", "Belém Tower on the Tagus"),
            ("Sintra Pena palace", "Pena Palace above the Sintra hills"),
            ("Cascais coast Portugal", "The coast at Cascais"),
            ("Lisbon sunset Tagus", "Lisbon and the Tagus at sunset"),
        ],
    ),
    (
        "iceland",
        "Iceland",
        "South Coast",
        "Waterfalls, black sand, and glacial lagoons.",
        [
            ("Skogafoss Iceland", "Skógafoss in full light"),
            ("Reynisfjara black sand", "Basalt and black sand at Reynisfjara"),
            ("Seljalandsfoss Iceland", "Seljalandsfoss and the cliff path"),
            ("Iceland lodge landscape", "A lodge in the Icelandic landscape"),
            ("Jokulsarlon glacier lagoon", "Ice on Jökulsárlón"),
            ("Kirkjufell Iceland", "Kirkjufell and its waterfall"),
            ("Iceland highlands", "The open Icelandic highlands"),
            ("Vik Iceland evening", "Vík and the south coast at dusk"),
        ],
    ),
    (
        "spain",
        "Spain",
        "Andalusia",
        "Palaces, white hill towns, and garden courts.",
        [
            ("Alhambra Granada", "The Alhambra above Granada"),
            ("Ronda Spain bridge", "Ronda over the gorge"),
            ("Seville Plaza de Espana", "Plaza de España in Seville"),
            ("Andalusia courtyard hotel", "A courtyard in Andalusia"),
            ("Generalife gardens Granada", "Gardens of the Generalife"),
            ("Cordoba Mezquita arches", "Arches of the Mezquita"),
            ("Frigiliana white village", "The white lanes of Frigiliana"),
            ("Seville evening Guadalquivir", "Seville along the river at evening"),
        ],
    ),
    (
        "south-africa",
        "South Africa",
        "Cape Town and the bush",
        "The peninsula, winelands, and private-reserve light.",
        [
            ("Cape Town Table Mountain", "Table Mountain over Cape Town"),
            ("Camps Bay Cape Town", "Camps Bay and the Twelve Apostles"),
            ("Cape Dutch Stellenbosch", "A Cape Dutch estate in Stellenbosch"),
            ("Franschhoek wine estate", "A wine estate in Franschhoek"),
            ("Chapman's Peak drive", "Chapman's Peak above the Atlantic"),
            ("Boulders Beach Cape Town", "Granite boulders along the Cape coast"),
            ("Kruger National Park landscape", "Bushveld in Kruger National Park"),
            ("Cape Town sunset Atlantic", "The Atlantic seaboard at sunset"),
        ],
    ),
    (
        "peru",
        "Peru",
        "Sacred Valley",
        "Andean lodges, terraces, and the high ruins.",
        [
            ("Machu Picchu", "Machu Picchu in the cloud forest"),
            ("Sacred Valley Urubamba", "The Sacred Valley along the Urubamba"),
            ("Ollantaytambo terraces", "Stone terraces at Ollantaytambo"),
            ("Sacred Valley lodge Peru", "A lodge in the Sacred Valley"),
            ("Moray Peru", "The circular terraces at Moray"),
            ("Maras salt mines Peru", "Salt pans at Maras"),
            ("Andes Peru landscape", "High Andean landscape in Peru"),
            ("Cusco evening plaza", "Cusco in the evening"),
        ],
    ),
    (
        "new-zealand",
        "New Zealand",
        "Queenstown and Fiordland",
        "Lakes, peaks, and the walls of Milford Sound.",
        [
            ("Queenstown Lake Wakatipu", "Queenstown on Lake Wakatipu"),
            ("Milford Sound", "Milford Sound between sheer walls"),
            ("Lake Wanaka", "Lake Wānaka and the mountains"),
            ("Queenstown lodge landscape", "A lodge landscape near Queenstown"),
            ("Hooker Valley track", "The Hooker Valley track"),
            ("Fiordland waterfall", "A waterfall in Fiordland"),
            ("Mount Cook Tasman Valley", "Aoraki / Mount Cook above the Tasman"),
            ("Queenstown evening lake", "Lake Wakatipu in the evening"),
        ],
    ),
    (
        "mexico",
        "Mexico",
        "Riviera Maya",
        "Caribbean coast, cenotes, and low limestone ruins.",
        [
            ("Tulum ruins beach", "Tulum above the Caribbean"),
            ("Bacalar lagoon", "The lagoon at Bacalar"),
            ("Tulum cliff", "The cliff at Tulum"),
            ("Tulum beach hotel", "A beach along the Riviera Maya"),
            ("Cenote Mexico", "A limestone cenote"),
            ("Holbox Mexico beach", "The wide beach at Holbox"),
            ("Sian Ka'an biosphere", "The coast of Sian Ka'an"),
            ("Tulum sunset caribbean", "Caribbean light at Tulum"),
        ],
    ),
    (
        "india",
        "India",
        "Rajasthan",
        "Lake palaces, forts, and desert cities.",
        [
            ("Udaipur Lake Palace", "Lake Palace on the water at Udaipur"),
            ("Jaisalmer fort desert", "Jaisalmer rising from the desert"),
            ("Hawa Mahal Jaipur", "The facade of Hawa Mahal"),
            ("Udaipur city palace courtyard", "A courtyard of the City Palace, Udaipur"),
            ("Amber Fort Jaipur", "Amber Fort above the hills"),
            ("Rajasthan palace interior", "Palace interiors in Rajasthan"),
            ("Thar desert Rajasthan", "The Thar desert"),
            ("Udaipur lake evening", "Lake Pichola in the evening"),
        ],
    ),
    (
        "croatia",
        "Croatia",
        "Dalmatia",
        "Walled cities, island harbors, and Adriatic stone.",
        [
            ("Dubrovnik old town", "Dubrovnik's old town and walls"),
            ("Dubrovnik walls sea", "The city walls above the Adriatic"),
            ("Hvar harbor Croatia", "The harbor at Hvar"),
            ("Croatia villa sea Dalmatia", "A stone house above the Dalmatian sea"),
            ("Korcula Croatia", "Korčula on the water"),
            ("Split Diocletian palace", "Diocletian's Palace in Split"),
            ("Elafiti islands Croatia", "The Elafiti islands"),
            ("Dubrovnik evening", "Dubrovnik at dusk"),
        ],
    ),
    (
        "seychelles",
        "Seychelles",
        "Granite islands",
        "Boulder beaches, palms, and clear shallows.",
        [
            ("Anse Source d'Argent", "Granite boulders at Anse Source d'Argent"),
            ("Anse Lazio Praslin", "Anse Lazio on Praslin"),
            ("La Digue granite beach", "Granite and sand on La Digue"),
            ("Seychelles hotel beach", "A beach hotel in Seychelles"),
            ("Praslin beach", "A beach on Praslin"),
            ("Vallee de Mai palm", "Palms in Vallée de Mai"),
            ("Mahe Seychelles coast", "The coast of Mahé"),
            ("La Digue evening beach", "La Digue beach in the evening"),
        ],
    ),
]

# slug, destination, name, cover query, cover alt, detail query, detail alt
PACKAGES = [
    ("amalfi-coast", "italy", "Amalfi Coast", "Amalfi Coast aerial Positano", "The Amalfi Coast from the water", "Amalfi lemon groves", "Lemon groves above Amalfi"),
    ("capri-sailing", "italy", "Capri Sailing", "Capri island marina", "The marina at Capri", "Capri Gardens of Augustus", "Gardens above the Capri cliffs"),
    ("ravello-villas", "italy", "Ravello Villas", "Villa Rufolo Ravello", "Villa Rufolo in Ravello", "Villa Cimbrone infinity terrace", "The terrace at Villa Cimbrone"),
    ("lake-como", "italy", "Lake Como", "Villa Balbianello Lake Como", "Villa del Balbianello on Lake Como", "Varenna Lake Como", "Varenna on Lake Como"),
    ("santorini-caldera", "greece", "Santorini Caldera", "Oia windmills Santorini", "Windmills above Oia", "Santorini cave house", "A cave house in Santorini"),
    ("crete-retreat", "greece", "Crete Retreat", "Elafonissi Crete", "Pink sand at Elafonissi", "Chania old harbor", "The old harbor of Chania"),
    ("mykonos-coves", "greece", "Mykonos Coves", "Mykonos windmills", "Windmills above Mykonos town", "Little Venice Mykonos", "Little Venice in Mykonos"),
    ("kyoto-discovery", "japan", "Kyoto Discovery", "Arashiyama Kyoto river", "The river at Arashiyama", "Ginkaku-ji Kyoto", "The Silver Pavilion"),
    ("hakone-ryokan", "japan", "Hakone Ryokan", "Lake Ashi Hakone", "Lake Ashi and the Hakone hills", "Hakone torii water", "The torii on the water at Hakone"),
    ("naoshima-island", "japan", "Naoshima", "Naoshima Benesse", "Art and sea on Naoshima", "Naoshima pumpkin", "The Naoshima waterfront"),
    ("cote-dazur", "france", "Côte d'Azur", "Nice France bay", "The bay of Nice", "Eze botanical garden", "The garden path at Èze"),
    ("paris-rive-gauche", "france", "Paris, Rive Gauche", "Paris Seine riverside", "The Seine and the Paris quays", "Paris courtyard architecture", "A Paris courtyard"),
    ("provence-harvest", "france", "Provence", "Valensole lavender", "Lavender fields at Valensole", "Gordes Provence", "The hill town of Gordes"),
    ("phuket-andaman", "thailand", "Phuket and the Andaman", "Phuket viewpoint coast", "The Phuket coast", "Nai Harn beach Phuket", "A quiet cove on Phuket"),
    ("chiang-mai-sanctuary", "thailand", "Chiang Mai", "Chiang Mai temple", "A temple in Chiang Mai", "Chiang Mai lanterns", "Lantern light in Chiang Mai"),
    ("male-atoll", "maldives", "North Malé Atoll", "Maldives villa row aerial", "A line of overwater villas", "Maldives jetty", "A jetty across a lagoon"),
    ("maldivian-sandbank", "maldives", "Private Sandbank", "Maldives uninhabited island", "An uninhabited Maldivian island", "Maldives turquoise shallows", "Shallows around a sandbank"),
    ("bali-retreat", "indonesia", "Bali Retreat", "Bali rice terrace farmer", "Rice terraces in central Bali", "Bali offering temple", "Offerings at a Balinese temple"),
    ("ubud-wellness", "indonesia", "Ubud Wellness", "Ubud jungle Bali", "Jungle above Ubud", "Tirta Empul Bali", "Holy water at Tirta Empul"),
    ("komodo-sailing", "indonesia", "Komodo Sailing", "Padar Island Komodo", "The ridges of Padar Island", "Komodo National Park sea", "Water inside Komodo National Park"),
    ("masai-mara", "kenya", "Maasai Mara", "Wildebeest Maasai Mara", "Wildebeest on the Mara", "Lion Maasai Mara", "Lion country in the Maasai Mara"),
    ("amboseli", "kenya", "Amboseli", "Amboseli National Park", "The plains of Amboseli", "Kilimanjaro from Kenya", "Kilimanjaro from Amboseli"),
    ("marrakech-riads", "morocco", "Marrakech Riads", "Marrakech rooftop medina", "Rooftops of the Marrakech medina", "Zellige Morocco tile", "Zellige tilework"),
    ("merzouga-dunes", "morocco", "Merzouga Dunes", "Merzouga camel dunes", "Dunes outside Merzouga", "Erg Chebbi sunrise", "Sunrise on Erg Chebbi"),
    ("atlas-lodges", "morocco", "Atlas Lodges", "Atlas Mountains kasbah", "A kasbah in the Atlas", "Todra Gorge Morocco", "Todra Gorge"),
    ("engadin", "switzerland", "Engadin Chalets", "St Moritz Switzerland", "The Upper Engadin", "Swiss alpine hotel", "An alpine hotel in the Engadin"),
    ("lake-lucerne", "switzerland", "Lake Lucerne", "Chapel Bridge Lucerne", "Lucerne and its covered bridge", "Pilatus Switzerland", "Mount Pilatus above the lake"),
    ("douro-quintas", "portugal", "Douro Quintas", "Douro river cruise vineyard", "The Douro between quintas", "Port wine lodge Porto", "Port lodges in Vila Nova de Gaia"),
    ("algarve-cliffs", "portugal", "Algarve Cliffs", "Benagil cave Algarve", "The Algarve cliffs", "Lagos Portugal coast", "The coast near Lagos"),
    ("south-coast-iceland", "iceland", "South Coast", "Reynisdrangar Iceland", "Reynisdrangar off the south coast", "Gljufrabui Iceland", "The hidden waterfall Gljúfrabúi"),
    ("westfjords", "iceland", "Westfjords", "Dynjandi waterfall", "Dynjandi in the Westfjords", "Isafjordur Iceland", "The fjord at Ísafjörður"),
    ("mallorca-fincas", "spain", "Mallorca Fincas", "Serra de Tramuntana", "The Serra de Tramuntana", "Deia Mallorca", "Deià on the Mallorca coast"),
    ("andalucia", "spain", "Andalucía", "Alhambra palace courts", "Courts of the Alhambra", "Seville Alcazar gardens", "Gardens of the Alcázar"),
    ("cape-winelands", "south-africa", "Cape Winelands", "Stellenbosch vineyard", "Vineyards in Stellenbosch", "Constantia wine estate", "A Constantia estate"),
    ("timbavati-safari", "south-africa", "Timbavati Safari", "Kruger leopard", "Big-cat country near the private reserves", "South Africa safari lodge", "A lodge on the edge of the bush"),
    ("garden-route", "south-africa", "Garden Route", "Knysna heads", "The Knysna Heads", "Tsitsikamma coast", "The Tsitsikamma coast"),
    ("sacred-valley", "peru", "Sacred Valley", "Urubamba river valley", "The Urubamba valley", "Pisac ruins Peru", "The ruins above Pisac"),
    ("machu-picchu", "peru", "Machu Picchu", "Machu Picchu sunrise", "Machu Picchu at first light", "Huayna Picchu", "Huayna Picchu above the citadel"),
    ("queenstown-lakes", "new-zealand", "Queenstown Lakes", "Remarkables Queenstown", "The Remarkables behind Queenstown", "Glenorchy New Zealand", "Glenorchy at the head of the lake"),
    ("milford-sound", "new-zealand", "Milford Sound", "Mitre Peak Milford", "Mitre Peak in Milford Sound", "Milford Sound boat", "A boat under the fiord walls"),
    ("tulum-riviera", "mexico", "Tulum Riviera", "Tulum caribbean sea", "The sea below Tulum", "Tulum ruins columns", "Columns of the Tulum ruins"),
    ("bacalar-lagoon", "mexico", "Bacalar", "Laguna de Bacalar", "Colors of the Bacalar lagoon", "Bacalar cenote", "Fresh water near Bacalar"),
    ("rajasthan-palaces", "india", "Rajasthan Palaces", "City Palace Udaipur", "The City Palace at Udaipur", "Jaipur palace gate", "A palace gate in Jaipur"),
    ("kerala-backwaters", "india", "Kerala Backwaters", "Alleppey houseboat", "A houseboat on the Kerala backwaters", "Kerala palm canal", "A palm-lined canal in Kerala"),
    ("dubrovnik-coast", "croatia", "Dubrovnik", "Dubrovnik from hill", "Dubrovnik seen from above", "Lokrum island Dubrovnik", "Lokrum opposite the city"),
    ("hvar-islands", "croatia", "Hvar Islands", "Hvar fortress view", "Hvar from the fortress", "Pakleni islands", "The Pakleni islands"),
    ("la-digue", "seychelles", "La Digue", "Anse Source d Argent beach", "Boulders and palms on La Digue", "La Digue bicycle coast", "The coast road on La Digue"),
    ("praslin", "seychelles", "Praslin", "Anse Georgette", "A beach on Praslin", "Coco de mer Vallee de Mai", "Forest in the Vallée de Mai"),
    ("path-of-the-gods", "italy", "Path of the Gods", "Path of the Gods hiking Amalfi", "Walking the Path of the Gods", "Nocelle Amalfi", "The hamlet of Nocelle"),
    ("uluwatu-cliffs", "indonesia", "Uluwatu Cliffs", "Uluwatu cliff ocean", "Cliffs at Uluwatu", "Pura Luhur Uluwatu", "Pura Luhur Uluwatu"),
]

HEROES = [
    ("amalfi", "16:9", "Amalfi Coast from the sea", "The Amalfi Coast seen from the water"),
    ("santorini", "16:9", "Oia Santorini blue domes", "Blue domes and the caldera at Oia"),
    ("kyoto", "16:9", "Arashiyama bamboo path", "Walking the bamboo path at Arashiyama"),
    ("maldives", "16:9", "Maldives island aerial beach", "A Maldivian island from the air"),
    ("bali", "16:9", "Tegallalang rice aerial", "Rice terraces stepping through Tegallalang"),
    ("sahara", "16:9", "Sahara dunes Morocco Erg Chebbi", "Dunes of the Sahara at Erg Chebbi"),
    ("alps", "16:9", "Matterhorn Switzerland", "The Matterhorn above the alpine valleys"),
    ("seychelles", "16:9", "Anse Source d'Argent La Digue", "Granite, sand, and palms at Anse Source d'Argent"),
]

EXPERIENCES = [
    ("sailing-capri", "3:2", "sailboat Capri Mediterranean", "Sailing beneath the cliffs of Capri"),
    ("wine-douro", "3:2", "Douro Valley vineyard rows", "Vineyard rows in the Douro"),
    ("onsen-hakone", "3:2", "Japanese onsen outdoor bath", "An outdoor onsen in the Japanese mountains"),
    ("game-drive", "3:2", "safari vehicle savannah Africa", "A game drive across open savannah"),
    ("tea-kyoto", "4:5", "Japanese tea ceremony bowl", "A tea bowl prepared in Kyoto"),
    ("reef-maldives", "3:2", "snorkeling Maldives coral", "The reef just off a Maldivian beach"),
    ("ubud-table", "3:2", "Bali restaurant rice field", "A table looking over Balinese rice fields"),
    ("hiking-amalfi", "3:2", "hiking trail Amalfi Coast view", "A cliff path on the Amalfi Coast"),
    ("lavender-provence", "16:9", "Provence lavender field", "Lavender in bloom in Provence"),
    ("desert-camp", "3:2", "Morocco desert camp tents", "A camp among the Moroccan dunes"),
    ("fiord-kayak", "3:2", "kayak Milford Sound", "Kayaks under the walls of a fiord"),
    ("kerala-boat", "3:2", "Kerala houseboat backwaters", "A houseboat moving through the backwaters"),
    ("cenote-swim", "4:5", "cenote swimming Mexico light", "Light falling into a cenote"),
    ("winelands-tasting", "3:2", "Stellenbosch wine tasting", "A tasting on a Cape wine estate"),
    ("caldera-walk", "3:2", "Santorini footpath caldera", "Walking the caldera rim"),
    ("temple-dawn", "4:5", "Fushimi Inari early morning", "Fushimi Inari in the early morning"),
    ("glacier-lagoon", "16:9", "Jokulsarlon icebergs", "Icebergs in a glacial lagoon"),
    ("palace-courts", "4:5", "Bahia Palace courtyard", "Moving through a Marrakech palace court"),
]

ACCOMMODATIONS = [
    ("positano-terrace", "3:2", "Positano luxury hotel sea view", "A sea-facing terrace in Positano"),
    ("santorini-suite", "3:2", "Santorini suite pool", "A suite and pool on the caldera"),
    ("kyoto-ryokan", "4:5", "ryokan room tatami", "Tatami, timber, and a garden view"),
    ("bali-villa", "3:2", "Bali villa infinity pool", "A private villa pool in Bali"),
    ("mara-camp", "3:2", "luxury safari tent camp Africa", "A tented camp opening onto the bush"),
    ("marrakech-riad", "4:5", "riad courtyard fountain Morocco", "A riad courtyard and fountain"),
    ("alpine-chalet", "3:2", "luxury chalet Switzerland interior", "A chalet in the Alps"),
    ("overwater-villa", "16:9", "Maldives overwater villa bedroom", "An overwater villa"),
    ("eze-terrace", "3:2", "hotel terrace French Riviera", "A terrace above the Riviera"),
    ("iceland-retreat", "3:2", "Iceland design hotel landscape", "A retreat in the Icelandic landscape"),
    ("udaipur-suite", "4:5", "Udaipur hotel lake view", "A room looking onto Lake Pichola"),
    ("mallorca-finca", "3:2", "Mallorca finca stone house", "A stone finca in Mallorca"),
    ("andes-lodge", "3:2", "Urubamba hotel Sacred Valley", "A lodge in the Sacred Valley"),
    ("seychelles-room", "3:2", "Seychelles resort beach", "A room opening onto a Seychelles beach"),
    ("hvar-house", "3:2", "Hvar stone house sea", "A stone house above Hvar"),
    ("franschhoek-manor", "3:2", "Franschhoek manor house", "A manor in the Franschhoek valley"),
]

JOURNAL = [
    ("morning-positano", "16:9", "Positano morning light", "Morning light on Positano"),
    ("moss-kyoto", "4:5", "Kyoto moss temple garden", "Moss and stone in a Kyoto garden"),
    ("dawn-mara", "16:9", "sunrise savannah Kenya", "Dawn on the savannah"),
    ("terrace-ubud", "3:2", "Ubud valley view", "The valley above Ubud"),
    ("dusk-marrakech", "3:2", "Marrakech dusk rooftops", "Marrakech rooftops at dusk"),
    ("black-sand", "16:9", "Iceland black beach waves", "Black sand and white water"),
    ("vines-stellenbosch", "3:2", "Stellenbosch vine rows", "Vine rows in the Cape winelands"),
    ("sunset-oia", "16:9", "Oia sunset", "Sunset at Oia"),
    ("andes-salt", "16:9", "Maras salt evaporation ponds", "Salt ponds cut into the Andean slope"),
    ("lagoon-still", "16:9", "Maldives calm lagoon", "A lagoon with almost no wind"),
    ("hill-town-eze", "4:5", "Eze stone street", "A stone street in Èze"),
    ("lake-wanaka-morning", "16:9", "Lake Wanaka morning", "Morning on Lake Wānaka"),
]

EDITORIAL = [
    ("table-coast", "3:2", "Italy restaurant terrace sea view", "A table set toward the sea"),
    ("riad-door", "4:5", "Moroccan riad carved door", "A carved door in a riad"),
    ("infinity-pool", "16:9", "infinity pool tropical sea", "An infinity pool toward open water"),
    ("sail-deck", "3:2", "wooden sailboat deck Mediterranean", "The deck of a Mediterranean sailboat"),
    ("ravello-garden", "4:5", "Ravello garden path", "A garden path in Ravello"),
    ("suite-linen", "3:2", "luxury hotel bedroom natural light", "Linen and natural light in a suite"),
    ("olive-grove", "3:2", "Provence olive grove", "An olive grove in Provence"),
    ("positano-steps", "4:5", "Positano staircase", "Steps between houses in Positano"),
    ("tea-bowl", "4:5", "handmade ceramic tea bowl", "A handmade tea bowl"),
    ("palace-marble", "4:5", "Jaipur palace marble detail", "Marble inlay in a Jaipur palace"),
]


def strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def license_ok(short: str, full: str) -> bool:
    blob = f"{short} {full}".lower()
    if any(token in blob for token in ("noncommercial", "non-commercial", "by-nc", "by-nd", "noderiv", "no deriv")):
        return False
    return any(
        token in blob
        for token in ("cc0", "cc-by", "cc by", "public domain", "no restrictions", "copyrighted free use")
    )


def build_slots() -> list[dict]:
    slots: list[dict] = []

    for slug, name, region, story, queries in DESTINATIONS:
        for (role, aspect), (query, alt) in zip(DEST_ROLES, queries):
            slots.append(
                {
                    "id": f"dest-{slug}-{role}",
                    "group": "destination",
                    "folder": f"destinations/{slug}",
                    "role": role,
                    "aspect": aspect,
                    "query": query,
                    "fallback": f"{region} {name}",
                    "alt": alt,
                    "destination": slug,
                    "place": f"{region}, {name}",
                    "story": story,
                }
            )

    for slug, destination, name, cover_q, cover_alt, detail_q, detail_alt in PACKAGES:
        slots.append(
            {
                "id": f"pkg-{slug}-cover",
                "group": "package",
                "folder": f"packages/{slug}",
                "role": "cover",
                "aspect": "16:9",
                "query": cover_q,
                "fallback": f"{name} {destination}",
                "alt": cover_alt,
                "destination": destination,
                "package": slug,
                "place": name,
            }
        )
        slots.append(
            {
                "id": f"pkg-{slug}-detail",
                "group": "package",
                "folder": f"packages/{slug}",
                "role": "detail",
                "aspect": "4:5",
                "query": detail_q,
                "fallback": name,
                "alt": detail_alt,
                "destination": destination,
                "package": slug,
                "place": name,
            }
        )

    def add_group(items, group, folder, id_prefix):
        for slug, aspect, query, alt in items:
            slots.append(
                {
                    "id": f"{id_prefix}-{slug}",
                    "group": group,
                    "folder": folder,
                    "role": slug,
                    "aspect": aspect,
                    "query": query,
                    "fallback": query,
                    "alt": alt,
                    "place": alt,
                }
            )

    add_group(HEROES, "hero", "hero", "hero")
    add_group(EXPERIENCES, "experience", "experiences", "exp")
    add_group(ACCOMMODATIONS, "accommodation", "accommodations", "stay")
    add_group(JOURNAL, "journal", "journal", "journal")
    add_group(EDITORIAL, "editorial", "editorial", "edit")
    return slots


def commons_read(url: str, timeout: int = 90) -> bytes:
    global _NEXT_REQUEST
    delay = 4.0
    last_error: Exception | None = None
    for attempt in range(6):
        with _THROTTLE:
            wait = _NEXT_REQUEST - time.time()
            if wait > 0:
                time.sleep(wait)
            _NEXT_REQUEST = time.time() + 0.9
        request = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code in (429, 503) and attempt < 5:
                retry = 25.0
                header = exc.headers.get("Retry-After") if exc.headers else None
                if header and str(header).isdigit():
                    retry = max(float(header), 5.0)
                with _THROTTLE:
                    _NEXT_REQUEST = max(_NEXT_REQUEST, time.time() + retry)
                time.sleep(min(retry, 40))
                continue
            if attempt < 5 and exc.code >= 500:
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            raise
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < 5:
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            raise
    raise RuntimeError(f"commons request failed: {last_error}")


def api_search(query: str) -> list[dict]:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": "20",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": "1920",
        "maxlag": "5",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    try:
        payload = json.loads(commons_read(url, timeout=45).decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        print(f"SEARCH FAIL {query} {exc}", flush=True)
        return None

    if "error" in payload:
        code = payload["error"].get("code")
        if code == "maxlag":
            time.sleep(3)
            return api_search(query)
        return []

    pages = (payload.get("query") or {}).get("pages") or {}
    found = []
    for page in pages.values():
        info_list = page.get("imageinfo") or []
        if not info_list:
            continue
        info = info_list[0]
        meta = info.get("extmetadata") or {}
        short = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
        full = strip_html(meta.get("License", {}).get("value", "") + " " + meta.get("UsageTerms", {}).get("value", ""))
        if not license_ok(short, full):
            continue
        mime = info.get("mime") or ""
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        title = page.get("title") or ""
        categories = strip_html(meta.get("Categories", {}).get("value", ""))
        description = strip_html(meta.get("ImageDescription", {}).get("value", ""))
        blob = f"{title} {categories} {description}"
        if NEG_RE.search(blob) or CLUTTER_RE.search(blob):
            continue
        if re.search(
            r"photochrom|library of congress|postcards|engravings|lithographs|paintings|drawings|maps|flags|coats of arms",
            categories,
            re.I,
        ):
            continue
        width = int(info.get("width") or 0)
        height = int(info.get("height") or 0)
        if width < 1400 or height < 900:
            continue
        artist = strip_html(meta.get("Artist", {}).get("value", "")) or "Unknown"
        credit = strip_html(meta.get("Credit", {}).get("value", ""))
        license_url = strip_html(meta.get("LicenseUrl", {}).get("value", ""))
        object_name = strip_html(meta.get("ObjectName", {}).get("value", "")) or title.replace("File:", "")
        file_title = title.replace(" ", "_")
        page_url = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(file_title)
        thumb = info.get("thumburl") or info.get("url")
        found.append(
            {
                "pageid": page.get("pageid"),
                "title": title,
                "objectName": object_name,
                "mime": mime,
                "width": width,
                "height": height,
                "url": info.get("url"),
                "thumb": thumb,
                "artist": artist[:180],
                "credit": credit[:180],
                "license": short or full[:80],
                "licenseUrl": license_url,
                "pageUrl": page_url,
                "description": description[:280],
            }
        )
    return found


def score_candidate(slot: dict, item: dict) -> float:
    ratio = item["width"] / max(item["height"], 1)
    score = min(item["width"], 3000) / 120
    title = f"{item['title']} {item.get('objectName', '')} {item.get('description', '')}".lower()
    tokens = re.findall(r"[a-z0-9']{4,}", slot["query"].lower())
    hits = sum(1 for token in tokens if token in title)
    score += hits * 26
    if tokens and hits == 0:
        score -= 24
    if slot["aspect"] == "16:9":
        score += 30 if 1.25 <= ratio <= 2.3 else -25
        if ratio < 1:
            score -= 40
    elif slot["aspect"] == "4:5":
        score += 24 if 0.62 <= ratio <= 1.15 else 0
        if ratio > 1.8:
            score -= 20
    else:
        score += 20 if 1.15 <= ratio <= 2.15 else 0
    if ratio > 3.1 or ratio < 0.4:
        score -= 80
    if item["width"] >= 2400:
        score += 12
    if "featured pictures" in (item.get("description") or "").lower():
        score += 8
    return score


def thumb_url(item: dict, target: int) -> str:
    thumb = item.get("thumb") or ""
    if item["width"] < target:
        return item["url"]
    if re.search(r"/\d+px-", thumb):
        return re.sub(r"/\d+px-", f"/{target}px-", thumb, count=1)
    return thumb or item["url"]


def fetch_bytes(url: str) -> bytes:
    data = commons_read(url)
    if len(data) < 40_000:
        raise ValueError(f"file too small ({len(data)} bytes)")
    if not (
        data[:3] == b"\xff\xd8\xff"
        or data[:8] == b"\x89PNG\r\n\x1a\n"
        or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")
    ):
        raise ValueError("response is not an image")
    return data


def hue_bucket(red: int, green: int, blue: int) -> int | None:
    peak = max(red, green, blue)
    floor = min(red, green, blue)
    if peak < 140 or peak - floor < 70:
        return None
    span = peak - floor
    if peak == red:
        hue = ((green - blue) / span) % 6
    elif peak == green:
        hue = (blue - red) / span + 2
    else:
        hue = (red - green) / span + 4
    return int(hue) % 6


def quality_gate(image: Image.Image) -> None:
    sample = image.resize((32, 32), Image.Resampling.BOX)
    raw = sample.tobytes()
    chroma = 0.0
    count = len(raw) // 3
    for index in range(0, len(raw), 3):
        red, green, blue = raw[index], raw[index + 1], raw[index + 2]
        chroma += abs(red - green) + abs(green - blue) + abs(red - blue)
    if count and chroma / count < 12:
        raise QualityError("near grayscale")

    width, height = image.size
    pixels_at = image.load()
    x_step = max(1, width // 70)
    y_step = max(1, height // 70)

    def line_stats(samples: list[tuple[int, int, int]]) -> tuple[float, set[int]]:
        dark = 0
        hues: set[int] = set()
        saturated = 0
        for red, green, blue in samples:
            if red < 46 and green < 46 and blue < 46:
                dark += 1
            bucket = hue_bucket(red, green, blue)
            if bucket is not None:
                hues.add(bucket)
                saturated += 1
        total = max(len(samples), 1)
        return dark / total, hues if saturated / total > 0.4 else set()

    top_dark = bottom_dark = left_dark = right_dark = False
    for y in range(0, height, y_step):
        samples = [pixels_at[x, y] for x in range(0, width, x_step)]
        dark, hues = line_stats(samples)
        frac = y / max(height - 1, 1)
        if frac < 0.12 and dark > 0.75:
            top_dark = True
        if frac > 0.88 and dark > 0.75:
            bottom_dark = True
        if (frac < 0.12 or frac > 0.88) and len(hues) >= 4:
            raise QualityError("calibration bar")
    for x in range(0, width, x_step):
        samples = [pixels_at[x, y] for y in range(0, height, y_step)]
        dark, hues = line_stats(samples)
        frac = x / max(width - 1, 1)
        if frac < 0.08 and dark > 0.75:
            left_dark = True
        if frac > 0.92 and dark > 0.75:
            right_dark = True
        if (frac < 0.08 or frac > 0.92) and len(hues) >= 4:
            raise QualityError("calibration bar")
    if (top_dark and bottom_dark) or (left_dark and right_dark):
        raise QualityError("scan border")


def render(slot: dict, item: dict, raw: bytes) -> dict:
    with Image.open(BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode in ("RGBA", "LA"):
            background = Image.new("RGB", image.size, (246, 241, 232))
            background.paste(image.convert("RGBA"), mask=image.convert("RGBA").split()[-1])
            image = background
        else:
            image = image.convert("RGB")
        quality_gate(image)

        variants = []
        folder = PUBLIC / slot["folder"]
        folder.mkdir(parents=True, exist_ok=True)
        for name, width, height in ALLOWED_ASPECTS[slot["aspect"]]:
            if image.width < width * 0.72 or image.height < height * 0.72:
                continue
            fitted = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))
            filename = f"{slot['role']}-{name}.webp"
            target = folder / filename
            fitted.save(target, format="WEBP", quality=84, method=4)
            variants.append(
                {
                    "name": name,
                    "file": str(target.relative_to(ROOT)).replace("\\", "/"),
                    "width": width,
                    "height": height,
                    "bytes": target.stat().st_size,
                }
            )
        if len(variants) < 2:
            raise ValueError("not enough resolution for required renditions")
    return {"variants": variants}


def process_slot(slot: dict, item: dict) -> dict:
    target_width = 3840 if slot["role"] in ("hero", "cover") and slot["aspect"] == "16:9" else 1920
    url = thumb_url(item, target_width)
    try:
        raw = fetch_bytes(url)
    except Exception:
        raw = fetch_bytes(thumb_url(item, 1920))
    digest = hashlib.sha256(raw).hexdigest()
    rendered = render(slot, item, raw)
    original = ORIGINALS / f"{slot['id']}.jpg"
    original.parent.mkdir(parents=True, exist_ok=True)
    original.write_bytes(raw)
    return {
        "slot": slot,
        "source": item,
        "sha256": digest,
        "original": str(original.relative_to(ROOT)).replace("\\", "/"),
        "sourceUrl": url,
        **rendered,
    }


def load_cache() -> dict:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict) -> None:
    CACHE_PATH.write_text(json.dumps(cache), encoding="utf-8")


def search_cached(cache: dict, query: str) -> list[dict]:
    if query in cache:
        return cache[query]
    items = api_search(query)
    if items is None:
        return []
    cache[query] = items
    save_cache(cache)
    return items


def can_render(item: dict, aspect: str) -> bool:
    width = int(item["width"])
    height = int(item["height"])
    if width > 1920:
        height = int(height * 1920 / width)
        width = 1920
    ready = 0
    for _name, target_w, target_h in ALLOWED_ASPECTS[aspect]:
        if width >= target_w * 0.72 and height >= target_h * 0.72:
            ready += 1
    return ready >= 2


def choose(slot: dict, cache: dict, used: set[int]) -> dict | None:
    def best_from(query: str, minimum: float) -> dict | None:
        if not query:
            return None
        best = None
        best_score = minimum
        for item in search_cached(cache, query):
            pageid = item.get("pageid")
            if not pageid or pageid in used or not can_render(item, slot["aspect"]):
                continue
            score = score_candidate(slot, item)
            if score > best_score:
                best = item
                best_score = score
        return best

    primary = best_from(slot["query"], 18)
    if primary:
        return primary
    fallback = best_from(slot.get("fallback") or "", 10)
    if fallback:
        return fallback
    broader = BROADER.get(slot["id"])
    if broader:
        return best_from(broader, 6)
    return None


BROADER = {
    "hero-bali": "Bali rice terrace",
    "hero-kyoto": "Kyoto temple",
    "exp-sailing-capri": "Capri boat",
    "exp-game-drive": "Maasai Mara safari",
    "exp-cenote-swim": "cenote Mexico",
    "exp-caldera-walk": "Santorini path",
    "exp-tea-kyoto": "Japanese tea",
    "exp-ubud-table": "Ubud Bali",
    "exp-fiord-kayak": "Milford Sound",
    "stay-positano-terrace": "Positano coast",
    "stay-santorini-suite": "Santorini hotel",
    "stay-bali-villa": "Bali villa pool",
    "stay-mara-camp": "safari lodge Kenya",
    "stay-marrakech-riad": "Marrakech riad",
    "stay-alpine-chalet": "Swiss chalet",
    "stay-overwater-villa": "Maldives bungalow",
    "stay-eze-terrace": "Eze village",
    "stay-iceland-retreat": "Iceland landscape hotel",
    "stay-udaipur-suite": "Udaipur palace hotel",
    "stay-mallorca-finca": "Mallorca countryside",
    "stay-andes-lodge": "Sacred Valley Peru",
    "stay-seychelles-room": "Seychelles beach",
    "stay-hvar-house": "Hvar Croatia",
    "stay-franschhoek-manor": "Franschhoek wine",
    "stay-kyoto-ryokan": "Kyoto ryokan",
    "edit-table-coast": "Amalfi restaurant terrace",
    "edit-riad-door": "Moroccan door",
    "edit-infinity-pool": "infinity pool sea",
    "edit-sail-deck": "sailboat Mediterranean",
    "edit-ravello-garden": "Ravello garden",
    "edit-suite-linen": "hotel room window",
    "edit-olive-grove": "Provence olive trees",
    "edit-positano-steps": "Positano street",
    "pkg-hvar-islands-detail": "Hvar Croatia",
    "edit-tea-bowl": "Japanese ceramic bowl",
    "edit-palace-marble": "Jaipur palace interior",
    "journal-morning-positano": "Positano",
    "journal-moss-kyoto": "Kyoto garden",
    "journal-dawn-mara": "Maasai Mara sunrise",
    "journal-terrace-ubud": "Ubud Bali",
    "journal-dusk-marrakech": "Marrakech",
    "journal-black-sand": "Reynisfjara",
    "journal-vines-stellenbosch": "Stellenbosch",
    "journal-sunset-oia": "Oia sunset",
    "journal-andes-salt": "Maras Peru",
    "journal-lagoon-still": "Maldives lagoon",
    "journal-hill-town-eze": "Eze France",
    "journal-lake-wanaka-morning": "Lake Wanaka",
}


def write_manifest(records: list[dict], failures: list[dict]) -> None:
    photos = []
    for record in records:
        slot = record["slot"]
        source = record["source"]
        photos.append(
            {
                "id": slot["id"],
                "group": slot["group"],
                "role": slot["role"],
                "aspect": slot["aspect"],
                "alt": slot["alt"],
                "destination": slot.get("destination"),
                "package": slot.get("package"),
                "place": slot.get("place"),
                "files": record["variants"],
                "attribution": {
                    "title": source.get("objectName") or source["title"],
                    "artist": source["artist"],
                    "license": source["license"],
                    "licenseUrl": source["licenseUrl"],
                    "source": source["pageUrl"],
                    "file": source["url"],
                    "credit": f"{source.get('objectName') or source['title']} by {source['artist']}, {source['license']}, via Wikimedia Commons",
                },
                "technical": {
                    "sha256": record["sha256"],
                    "original": record["original"],
                    "sourceWidth": source["width"],
                    "sourceHeight": source["height"],
                    "mime": source["mime"],
                },
            }
        )
    manifest = {
        "project": "AURA",
        "brand": {
            "name": "AURA",
            "descriptor": "Curated Journeys",
            "tagline": "Beyond the ordinary.",
            "title": "AURA — Luxury Travel & Curated Journeys",
        },
        "pipeline": {
            "source": "Wikimedia Commons",
            "licensePolicy": "Public domain, CC0, CC BY, and CC BY-SA only. NC and ND excluded.",
            "formats": ["image/webp"],
            "treatment": "Center-weighted cover crop, no upscaling, WebP quality 84.",
        },
        "counts": {
            "photographs": len(photos),
            "failures": len(failures),
        },
        "failures": failures,
        "photographs": photos,
    }
    DATA.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    (PUBLIC / "attribution.json").write_text(
        json.dumps(
            [{"id": photo["id"], "alt": photo["alt"], "files": photo["files"], "attribution": photo["attribution"]} for photo in photos],
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def main() -> None:
    import sys

    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--fresh", action="store_true")
    args = parser.parse_args()

    slots = build_slots()
    if args.limit:
        slots = slots[: args.limit]
    print(f"slots {len(slots)}", flush=True)
    assert len(DESTINATIONS) == 20
    assert len(PACKAGES) == 50

    DATA.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    cache = load_cache()
    used: set[int] = set()
    records: list[dict] = []
    failures: list[dict] = []
    if args.fresh and PROGRESS_PATH.exists():
        PROGRESS_PATH.unlink()
    done_ids: set[str] = set()
    if PROGRESS_PATH.exists():
        for line in PROGRESS_PATH.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            records.append(record)
            done_ids.add(record["slot"]["id"])
            pageid = (record.get("source") or {}).get("pageid")
            if pageid:
                used.add(pageid)
    queue = [(slot, 0) for slot in slots if slot["id"] not in done_ids]

    print(f"fetching {len(queue)} photographs, resuming {len(done_ids)}", flush=True)
    with ThreadPoolExecutor(max_workers=2) as executor:
        pending = {}
        while queue or pending:
            while queue and len(pending) < 2:
                slot, attempt = queue.pop(0)
                item = choose(slot, cache, used)
                if not item:
                    print(f"GAP  {slot['id']} ({slot['query']})", flush=True)
                    failures.append({"id": slot["id"], "query": slot["query"], "error": "no licensed candidate"})
                    continue
                used.add(item["pageid"])
                future = executor.submit(process_slot, slot, item)
                pending[future] = (slot, attempt, item["pageid"])
            if not pending:
                break
            done, _ = wait(pending, return_when=FIRST_COMPLETED)
            for future_done in done:
                slot, attempt, _pageid = pending.pop(future_done)
                try:
                    record = future_done.result()
                except Exception as exc:  # noqa: BLE001
                    if attempt < 4:
                        print(f"RETRY {slot['id']} {exc}", flush=True)
                        queue.append((slot, attempt + 1))
                    else:
                        print(f"FAIL {slot['id']} {exc}", flush=True)
                        failures.append({"id": slot["id"], "query": slot["query"], "error": str(exc)})
                    continue
                records.append(record)
                with PROGRESS_PATH.open("a", encoding="utf-8") as progress:
                    progress.write(json.dumps(record, ensure_ascii=False) + "\n")
                source = record["source"]
                print(f"[{len(records)}/{len(slots)}] {slot['id']} <= {source['title'][:72]}", flush=True)
                if len(records) % 8 == 0:
                    write_manifest(records, failures)

    write_manifest(records, failures)
    print(f"DONE photographs={len(records)} failures={len(failures)}", flush=True)


if __name__ == "__main__":
    main()
