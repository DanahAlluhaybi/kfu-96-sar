# وين راحت الـ96 ريال حقتك؟

A booth experience we built for Saudi National Day 96 at King Faisal University, run by the Finance Club (نادي المالية).

Visitors scan a QR code, pick where they would have spent 96 SAR (coffee, food, shopping, gifts...), and then see where everyone else's went, next to official national spending figures from that week.

**Live:** https://kfu-96-sar.vercel.app

## Pages

| Route | What it is |
|---|---|
| `/` | The visitor flow: landing, pick, results. Arabic by default with an English switch. |
| `/wall` | The booth TV. Rotates between an intro, live results, official figures and the takeaway. `?rotate=1` also flips the language every 20s. |
| `/poster` | Printable A4 poster with the QR code. |
| `/admin` | Password-protected dashboard: stats, responses, CSV export, official data editor. |

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind, Recharts for the admin charts, Supabase for storage (plain REST, no SDK), and Claude for the one-line insight.

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in the admin values
npm run dev
```

If `SUPABASE_URL` is empty, answers are saved to `.data/db.json`, which is enough for testing or a single laptop at a booth. If `ANTHROPIC_API_KEY` is empty, the insight uses a set of built-in lines instead.

### Fonts

The design uses the Thmanyah font family, which can't be redistributed, so the font files aren't in this repo. Download them from [font.thmanyah.com](https://font.thmanyah.com) and drop the `.woff2` files into `public/fonts/thmanyah/` (see the README in that folder). Without them it falls back to IBM Plex Sans Arabic.

## Supabase

1. Create a project and run `supabase/schema.sql` in the SQL editor.
2. Put the project URL in `SUPABASE_URL` and the service role key in `SUPABASE_SERVICE_ROLE_KEY`.

The service key is only ever read on the server. RLS is on with no policies, so the public anon key can't read or write anything.

## Deploying

We deploy with the Vercel CLI (`npx vercel --prod`) so the local font files get uploaded too. Add the variables from `.env.example` in the Vercel project settings, and set `NEXT_PUBLIC_SITE_URL` to the real domain so the QR codes point to the right place.

## How the data works

There are two separate datasets and they never get mixed:

- **Booth answers**: what visitors picked. Only percentages are ever shown publicly, never counts, raw rows or anyone's free text.
- **Official figures**: national numbers from SAMA, the Ministry of Commerce and GEA, each with its source, period and publication date. These live in `data/national-day-stats.json` and can be edited from the admin.

Each visitor sees up to three official figures, picked by how close they are to National Day and how related they are to what they chose. A figure is only labelled "National Day" if the source itself says so.

## The AI insight

The model gets aggregated percentages and the official figures, nothing else. Whatever it writes goes through `validateInsight` in `lib/insight.ts`: if the line contains any number that isn't in the data it was given, it's thrown away and a built-in line is used instead. It regenerates at most once every 45 seconds per language.

"Something else" write-ins are grouped by a normalised form (so "قهوه" and "القهوة" count as one), and a theme is only passed to the model after three separate people have written it.

There's also an admin analyst (`lib/analyst.ts`) that uses Claude tool calls to turn the booth data into a planning report for future events. Every number in the report has to come from a tool output it cites, or the item is dropped. It's built but not shown in the dashboard right now.

## Security

- `/admin` and `/api/admin` are behind `middleware.ts`, and every admin route checks the session again.
- Sessions are an HMAC-signed, httpOnly, `SameSite=Strict` cookie.
- Login is limited to 5 tries a minute. Submissions are validated, sanitised, rate limited and have a honeypot.
- The CSV export escapes anything that Excel would read as a formula.

## Project layout

```
app/          pages and API routes
components/   UI (public flow, wall, admin)
lib/          data, stats, AI, auth, translations
data/         official national day figures (seed)
supabase/     database schema
```
