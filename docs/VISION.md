# Lynia: the art of giving

> Every gift has a hand behind it. Every hand holds a line. Every line reaches the next one.

## 1. The problem

Giving today is a leap into the dark:

- **We give "into a hole".** We rarely know how much of our €20 reaches the project, whether the children were actually fed, or when.
- **Giving is solitary.** Apps like ShareTheMeal made giving easy, but they don't put the people who give together. Someone in Nice who funds school meals has no idea that the person next door did the same.
- **Nothing stays with you.** After the payment there is a receipt, not a feeling of belonging.

## 2. The idea

Every donation is represented by a piece of art, and every piece of art is a hand.

1. You choose a **concrete cause** (food arriving in a region, books in classrooms, rebuilding a children's home…) and see **before paying** exactly what your €10, €30 or €500 becomes.
2. You **photograph your palm**. On your phone it becomes a numbered print of the current edition: the first edition is *Ligne de Vie*, after Miryan Klein.
3. You trace your own **life line**. It becomes a translucent thread of energy that leaves your palm at both edges.
4. Your hand **lands in your neighbourhood** on a living map and holds the line of the nearest hand: the person next door in Nice, then the next, across Europe, the Middle East and Africa (EMEA). Together, the whole community forms **one unbroken line**.
5. You **follow your euros** until someone on the ground confirms, with evidence, what they became.
6. You **share your hand**: not "I gave", but "I hold the line".
7. After a year, the **anniversary** unveils the whole map: every hand, every connection, what each cause achieved. Then the line **passes to a new artist**, and the community carries on.

## 3. Why *Ligne de Vie*, and why Miryan Klein

What public sources say:

- **The artist.** Born in Lyon on 5 August 1951. Self-taught, she was drawn to drawing, painting and classical dance before turning to figurative painting and sculpture. She works with "poor" and very contemporary materials, above all **neon** and **fibre optics**. In her "no painting" works, **light replaces pigment**. She lives and works in Nice (a studio at Mont-Boron, previously at the Régina in Cimiez) and in Normandy. Since 2001 she has shown internationally, including at the Armory Show in New York. Her work sets a need to bear witness to the absurdities of our society alongside a stubborn optimism: she refuses to accept the drifts of the system as fate.
- **The artwork.** The City of Nice chose her to decorate a stretch of the **tram line 2** construction hoardings. *Ligne de Vie* was installed around **Square Durandy**, facing the Romain Gary heritage library, along about a hundred metres of **rue Gubernatis**. It shows photographs of **about twenty anonymous hands, hers among them**. The **life lines** of the palms are joined to one another by a **translucent thread of energy**, forming one long line of life. The image echoes the tram line, which also connects people to one another.

Why it fits this platform almost perfectly:

| *Ligne de Vie* (Nice, tram line 2 hoardings) | Lynia |
| --- | --- |
| Anonymous hands, the artist's own among them | Every donor's hand, anonymous by default |
| Life lines joined by a translucent energy thread | Each traced life line runs off the print and joins the neighbour's on the map |
| Laid along a tram line that connects people | Laid across EMEA, connecting people who give |
| Light as material (neon, fibre optics) | A glowing, luminous line: the visual language of the whole product |
| Witness + optimism | Radical transparency + a community that acts |

The work was already a participatory metaphor for solidarity in public space. Lynia extends it: one hand per gift, and a line that grows beyond Nice.

**Before launch (non-negotiable):** a written licence agreement with Miryan Klein. It must cover reproduction and adaptation of *Ligne de Vie*, use of her name and her real signature, her **moral right** (droit moral: she must be able to approve how the prints look), her remuneration or share, and what happens to the prints after the edition ends. Until that is signed, the prototype says "d'après" (after) her work and never shows her signature. Ask her too for the original photographs and the exact date of the installation. The best launch event would be at Durandy, on tram line 2.

## 4. What is in this repository (prototype)

A working, dependency-free web prototype. Run it with `npm start`.

| Screen | What it proves |
| --- | --- |
| **Home** | The manifesto, the edition, live totals, an example of the per-euro breakdown and the tracking stages |
| **Give** (5 steps) | Cause → amount with a live breakdown → hand photo and life-line tracing → city → confirm |
| **My hand** | The numbered print with its certificate, the "Where is this gift?" tracker, what the euros became, and a share card (amount hidden by default) |
| **The line** | A map of EMEA with every hand joined to its nearest neighbours (a minimum spanning tree), sparks travelling along the connections, a filter by cause, and a zoom to your own hand |
| **Causes / Cause** | The catalogue, progress, concrete units funded, monthly proof, and where the community comes from |
| **Anniversary** | Edition totals, total km of line, what each cause achieved, a replay of the year, and the hand-over to Edition 02 |

All causes, partners and community data are **demo data** and are labelled as such. No payment is taken.

## 5. Cataloguing causes

### Six pillars

People who give to the same kind of cause find each other through a pillar, and each pillar has a colour. That colour appears as a strand twisted around the energy line on every print, and on the map.

| Pillar | Verb | Examples |
| --- | --- | --- |
| Nourish | feeds | food parcels, school meals, emergency food |
| Learn | teaches | books, classrooms, scholarships, digital access |
| Shelter | shelters | orphanages and children's homes, housing, refuges |
| Heal | heals | mobile clinics, medicines, maternal health |
| Water | quenches | boreholes, sanitation, hygiene |
| Rebuild | rebuilds | reconstruction after earthquakes, floods and conflict |

### Admission criteria (every cause, no exceptions)

1. **A named field partner.** A registered non-profit with published accounts, checked for sanctions and for good governance.
2. **A concrete unit with a published cost.** For example, one school meal = €0.45, and the cost is justified by invoices from the previous period.
3. **A goal and an end date.** "Rebuild the dormitory, €120,000, by June", not "support our work".
4. **A monthly settlement cycle.** Gifts are pooled, transferred, spent and then **verified** with evidence (delivery notes, invoices, photos, registers), at least once a month.
5. **Independent verification.** At least a yearly audit or a third-party field visit, with spot-checks in between.
6. **Local and far away.** Each edition keeps a balance between local causes (in the donors' own cities, like food parcels in Nice) and international ones, so that the community exists in both places.

### Research across EMEA

Build the catalogue from established intermediaries, not from scratch:

- **National umbrella foundations** that host projects (in France, the "fondation abritante" model).
- **Cross-border giving networks.** Transnational Giving Europe lets donors in one EU country give tax-efficiently to a charity in another.
- **Charity evaluators and labels** in each country (in France, Don en Confiance).

Start with **5–8 causes** for the pilot edition. Add causes only when the evidence pipeline for each one is running.

## 6. Radical transparency: "Where is my €20?"

- **Every gift is split before payment**, and the same numbers are published afterwards: card fees, platform share (5% in the prototype), the partner's running costs, and what reaches the programme. See `app/js/core/impact.js`.
- **Ring-fenced account per cause.** Money is never mixed across causes.
- **Four stages per gift:** Received → Sent to partner → On the ground → Verified. The dates come from each cause's monthly batch, and verification carries its evidence. See `app/js/core/ledger.js`.
- **Public ledger.** Each print carries a certificate code (for example `LV01-0181-CC08-AB89`). In production it is signed by the platform and can be checked publicly. That makes a shared image proof of belonging, not a boast.
- **Concrete units everywhere.** Donors see "≈ 95 school meals", not "€42.83".

## 7. Community mechanics

- **The line.** Each hand connects to its nearest neighbour, so neighbours meet first. Mathematically it is a minimum spanning tree over all the hands (`app/js/core/geo.js`), which makes it a single connected line with the shortest total length. Its length in km becomes a shared number to grow ("our line is 25,795 km long").
- **Privacy by default.** We only ever ask for a **city**, never an address, and we **do not use IP addresses**: they are personal data under GDPR and often inaccurate. The hand is shifted by a stable 0.6–3 km so it shows a neighbourhood, never a home. There are no names on the map; showing the hand at all is opt-in.
- **Pillar circles.** Everyone holding a Nourish line in the Nice area can be invited to the same distribution day or event. Real-world action is the point.
- **Sharing.** The card says "Je tiens la ligne" and shows the hand, the city and the cause. The amount only appears if the donor chooses.
- **Anniversary and editions.** After 12 months: the unveiling (an online map plus, ideally, a physical exhibition in Nice), a report per cause, then **Edition 02** with a new artist chosen with the community. Hands from past editions stay on the map, and the new line starts from them.

## 8. The art pipeline

**Today (prototype, all on the device):**

1. Crop the photo, then soften it with a slight blur. Fine palm-print ridges are **deliberately removed**, because palm prints can be biometric data.
2. Apply a duotone "print" treatment in the spirit of the hoarding photographs, with grain and a vignette.
3. The donor traces their life line. It is smoothed, then extended off both edges so it can meet the neighbour.
4. The energy line is layered glow with a white core, a pillar-coloured strand twisted around it, and stable sparks. Then a caption: *Ligne de Vie*, d'après Miryan Klein, Édition 01, Main n° 0181, city and pillar, certificate.
5. **The raw photo is never uploaded or stored.** Only the finished print is kept.

**Production (with the artist):**

- **Hand-landmark detection on the device** (for example MediaPipe Hands) suggests where the life line runs and checks that the photo really shows an open palm.
- An **artist-approved style**: Miryan Klein defines the palette, the line and the framing. If a generative model is used, it is trained **only** with her explicit consent on her own material, and she signs off the output.
- **Her real signature** appears only under licence, applied to a master template she approves, and never generated.
- **Moderation** of uploads (no faces, no offensive content), done automatically on the device where possible.

## 9. Legal and compliance checklist

- **Legal structure.** In France, this could be an association or an endowment fund (fonds de dotation) in its own right, or hosting by an existing foundation. Tax receipts require the receiving entity to be eligible (organisme d'intérêt général).
- **Tax relief.** French donors can deduct 66% of gifts to eligible organisations (75% for help to people in difficulty, up to an annual cap), within income limits. Other EMEA countries have their own rules, and cross-border giving goes through networks like Transnational Giving Europe. Check the current figures each year.
- **The art is a thank-you, not a sale.** If the donor "buys" the art, the gift can lose its tax status. A counterpart must stay symbolic and small relative to the gift (in France, roughly a quarter of the gift with a low euro ceiling; check the current figures). The print is therefore a numbered keepsake. **No resale, and no NFT or crypto sale.**
- **Payments.** Use a regulated payment provider, and have funds go directly to the entity entitled to receive gifts. The platform never holds donors' money outside ring-fenced accounts.
- **GDPR.** Hand photos are processed on the device, and only the stylised print is stored. Location is the city only, with consent. Donors need clear notices, rights to delete their data and their hand, a processor agreement with any vendor, and a DPIA before launch.
- **Artist's rights.** See section 3: the licence, moral right and remuneration must be settled before any public use.
- **Partners.** Due diligence, sanctions screening, and grant agreements with reporting obligations that match the monthly proof cycle.

## 10. Architecture (production)

- **App:** a progressive web app (this prototype, extended). Camera access, on-device image processing, and installable on phones.
- **API:** the donation, cause, batch and evidence ledger, in Postgres with PostGIS. The map uses a precomputed spanning line, updated incrementally as hands join.
- **Payments:** a PSP with a connected account per partner or cause, webhooks feeding the ledger, and tax receipts generated automatically.
- **Storage:** the print only (around 100 KB), in a CDN. Certificates are signed with the edition key.
- **Partner portal:** partners upload monthly evidence, which a verifier reviews before a batch is marked "Verified".
- **Open data:** the public ledger (aggregates, batches and evidence) is exportable.

## 11. Roadmap

1. **Now:** this prototype. Use it to show the idea to Miryan Klein, to partners and to the first supporters.
2. **Pilot, Nice:** the licence is signed, 3–5 causes (at least one in Nice), a legal structure and a PSP. Launch on tram line 2 / Durandy.
3. **EMEA:** more cities and partners, FR/EN (then AR) interface, local circles and events.
4. **Anniversary:** unveiling the map, a physical exhibition, the yearly impact report, then Edition 02 with a new artist.

## 12. Open questions for you

1. Is Miryan Klein already on board, and who will lead the conversation about the licence?
2. Which **causes and partners** do you already have in mind for the pilot?
3. **Legal home:** create a new association or endowment fund, or partner with an existing foundation?
4. Should the platform keep a **share** (5% in the prototype), or be funded separately, by sponsors or by the artist's edition?
5. **Language:** French first, English first, or both from day one?
6. The **anniversary**: online only, or a physical exhibition too (the original street, a gallery)?

## Sources

- cimiez.com, "Miryan Klein à la croisée des lignes": https://www.cimiez.com/miryan-klein-a-la-croisee-des-lignes/
- Miryan Klein, official site: https://www.miryanklein.com/ · works: https://www.miryanklein.com/portfolio · press: https://www.miryan-klein.com/presse.html
- Art Côte d'Azur, "Miryan Klein : Douce violence": https://www.artcotedazur.fr/artistes,181/art-contemporain,183/miryan-klein-douce-violence,4279?lang=fr
- Art Côte d'Azur, artist page: https://www.artcotedazur.fr/artistes,181/art-contemporain,183/miryan-klein,10440.html
- "Miryan Klein, l'art au féminin": https://www.french-riviera-property.com/fr/articles-detail/2032-miryan-klein-lart-au-feminin.cfm
- UMAM, "UMAM 70 ans. Miryan Klein, L'invitation #7": http://umamfrance.blogspot.com/2016/02/marseille-umam-70-ans-miryan-klein.html
- Métropole Nice Côte d'Azur, tram line 2, Durandy station: https://projets-transports.nicecotedazur.org/ligne-2/tunnel-les-stations-souterraines/historique-section-souterraine/station-durandy/
- Map data: Natural Earth (public domain), via world-atlas (ISC licence).
