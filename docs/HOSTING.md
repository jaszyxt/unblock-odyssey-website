# Hosting the Website

The website is a folder of plain files — no build step, no server, no database — so hosting it is free
almost anywhere. This page records what we use today, what the free and low-cost options look like,
and the concrete steps to upgrade if we ever need more.

## Current setup

- **Live at**: https://jaszyxt.github.io/unblock-odyssey-website/
- **Published from**: https://github.com/jaszyxt/unblock-odyssey-website (public repo, GitHub Pages serving `main` at `/`)
- **Cost**: $0
- **Deploy flow**: copy `website/` to a temp folder → `git init` → commit → push to that repo. A `.nojekyll` file is added so Pages serves every path verbatim.
- **Why it works**: the site is static HTML + CSS + ES modules with all content pre-generated into `data/`. There is nothing to compute on a server, so a CDN-backed static host is all we need.

Updates follow the same flow: re-run `python website/tools/sync_from_game.py`, copy `website/`, push.

## What a visit actually costs in bandwidth

Measured in a real browser (local server, fresh profile):

| What | Payload |
|---|---|
| First visit to the home page | **~442 KB** (26 requests) |
| After also opening a puzzle | ~447 KB cumulative |
| Whole `website/` folder on disk | ~1.1 MB |

The largest single file is `data/manifest.json` at **~244 KB** — over half of the whole first load.
Breaking it down by content (not file size):

| Part of the manifest | Size |
|---|---|
| Embedded `firstPuzzle` body for each of the 70 packs | ~72 KB |
| Metadata for all 70 packs (counts, grids, difficulty ranges, titles) | ~27 KB |
| The 7 featured samples' full puzzle bodies | ~7 KB |
| Actual content subtotal | **~106 KB** |

The gap between 106 KB of content and 244 KB on disk is **pretty-printing** — the sync script writes
the manifest with 2-space indentation. So the cheapest possible bandwidth win, if we ever need one, is
to serve `data/manifest.json` minified (a ~140 KB saving on every first visit), and a deeper one is to
stop embedding `firstPuzzle` data for all 70 packs and fetch it only when a pack page is opened.

Because a visit costs roughly **0.5 MB**, the free tiers translate to a lot of visitors:

| Free bandwidth | Roughly this many visits |
|---|---|
| 10 GB (Firebase Spark) | ~20,000 |
| 15 GB (Netlify free credits) | ~30,000 |
| 100 GB (GitHub Pages soft limit; Cloudflare, Azure, Vercel) | ~200,000 |
| 1 TB (AWS CloudFront always-free egress) | ~2,000,000 |

At advert-site scale every option below is more than enough.

## Free and low-cost options (2026 snapshot)

| Service | Free tier | Bandwidth | Custom domain + SSL | Notes |
|---|---|---|---|---|
| **GitHub Pages** (current) | Free for public repos | ~100 GB/mo (soft) | Yes | Microsoft-run, very reliable; already live; nothing to configure |
| **Cloudflare Pages** | Free | Unmetered static requests (see caveat below) | Yes | Lowest latency worldwide; 500 builds/mo; best free upgrade |
| **Azure Static Web Apps** | Free plan | 100 GB/mo | Yes | $9/app/mo for Standard if we ever need API functions |
| **Vercel (Hobby)** | Free | ~100 GB/mo | Yes | Best developer experience, but **non-commercial use only** |
| **AWS S3 + CloudFront** | ~$0–1/mo | 1 TB/mo egress in the always-free tier | Yes (ACM cert) | Cheapest at real scale; by far the most setup work |
| **Netlify (Free)** | Free | ~15 GB/mo (new credit system) | Yes | Simplest UI, but the stingiest free tier now; sites pause when credits run out |
| **Firebase Hosting (Spark)** | Free | ~10 GB/mo | Yes | Tightest free bandwidth; fine only for very small sites |

Paid reference points if we outgrow free tiers: Netlify $9/mo (1,000 credits) or $20/mo Pro, Azure
Static Web Apps Standard $9/app/mo, CloudFront $0.085/GB after the free tier, Firebase Blaze $0.15/GB.

## Recommendation

1. **Stay on GitHub Pages for now.** It is free, reliable, already set up, and our traffic is nowhere near its limits.
2. **Add a custom domain** when we want a proper URL (see Upgrade path A). Keep GitHub Pages as the host; a domain costs roughly $10/year.
3. **Cloudflare Pages is the best free upgrade** if we ever want faster worldwide delivery or a host with build-on-push automation (see Upgrade path B).
4. **Good combination**: GitHub Pages for hosting + Cloudflare for DNS. Both free, both well proven.

## Upgrade path A — custom domain on GitHub Pages

1. Buy a domain (Cloudflare Registrar, Porkbun, or Namecheap; roughly $10/year).
2. In the published repo, add a `CNAME` file at the repo root containing just the domain (for example `play.unblockodyssey.com`).
3. At the DNS provider:
   - Subdomain (for example `play.`): add a `CNAME` record pointing to `jaszyxt.github.io`.
   - Apex domain (for example `unblockodyssey.com`): add `A` records to GitHub Pages' IPs (see GitHub's docs for the current list).
4. In the repo's Settings → Pages, set the custom domain and tick **Enforce HTTPS** (the certificate is issued automatically).
5. Keep deploying exactly as before — copy `website/`, commit, push.

## Upgrade path B — move to Cloudflare Pages (free)

1. Create a Cloudflare account and open **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub and pick the `unblock-odyssey-website` repo.
3. Build settings: **no build command**, output directory `/` (the repo root already contains the finished site).
4. Deploy — Cloudflare gives a `*.pages.dev` URL; every future push to `main` redeploys automatically.
5. Add the custom domain under the project's **Custom domains** tab if wanted.
6. Optional: delete the Pages site on GitHub to avoid two copies being live, or keep both during a trial period.

## What to avoid

- **Netlify's free plan** — the 2026 credit system works out to roughly 15 GB of bandwidth and **pauses the site** when credits run out. A bad surprise for an always-on advert.
- **Vercel Hobby** — free, but its terms restrict the plan to non-commercial projects. An app-promo site could be argued either way; not worth the risk.
- **Firebase Spark** — only ~10 GB/mo, the tightest of the bunch.

## Re-verify before deciding

Hosting terms change often, and we caught one concrete conflict while researching: one source reported
that Cloudflare announced a 100 GB/month cap on its free tier (effective mid-2026), while several others
stated no bandwidth cap exists. We did not find an official Cloudflare announcement either way, so treat
that row as unconfirmed.

Before committing to a change, check the provider's own pricing page:

- GitHub Pages: https://docs.github.com/pages
- Cloudflare Pages: https://developers.cloudflare.com/pages/ and https://www.cloudflare.com/plans/
- Azure Static Web Apps: https://azure.microsoft.com/pricing/details/app-service/static/
- Vercel: https://vercel.com/pricing
- AWS CloudFront: https://aws.amazon.com/cloudfront/pricing/
- Netlify: https://www.netlify.com/pricing/
- Firebase Hosting: https://firebase.google.com/pricing

## Sources

Research captured 2026-09-20:

- [Vercel vs Netlify vs Cloudflare Pages comparison — SpeedVitals](https://speedvitals.com)
- [Static hosting alternatives 2026 — bootstrap.build](https://bootstrap.build)
- [Vercel vs Netlify vs Cloudflare Pages — Digital Applied](https://www.digitalapplied.com)
- [Cloudflare Pages limits — official docs](https://developers.cloudflare.com/pages/platform/limits)
- [Azure Static Web Apps pricing — Microsoft](https://azure.microsoft.com/pricing/details/app-service/static/)
- [Netlify pricing](https://www.netlify.com/pricing/)
- [Firebase pricing — Google](https://firebase.google.com/pricing)
- [Reported Cloudflare free-tier bandwidth cap (unconfirmed) — pravinkumar.co](https://www.pravinkumar.co)
- [Low-traffic static hosting cost comparison — customjs.space](https://www.customjs.space)
