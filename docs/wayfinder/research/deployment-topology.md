# Deployment, migration, and rollback topology

Research resolution for [Determine the deployment, migration, and rollback topology](https://github.com/RobinHoodO/super-el-nino/issues/13).

Baselines: Super El Niño [`87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9`](https://github.com/RobinHoodO/super-el-nino/tree/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9) and OSIRIS [`3c7815badcb95b16a36d960d131c4f87c9267ce5`](https://github.com/simplifaisoul/osiris/tree/3c7815badcb95b16a36d960d131c4f87c9267ce5). Repository observations below are **facts** at those commits. Topology and release guidance are **recommendations/inferences** from those facts and the linked platform documentation.

## Decision

Run one product as **separate, independently releasable runtimes**:

1. A thin OSIRIS integration surface runs as its existing Node 22/Next.js standalone container. It owns the globe, public OSINT aggregation, and disposable feed caches.
2. The existing Super El Niño Cloudflare Worker remains the coordination service and the only service bound to the existing D1 database. It owns identity, contributions, private messages, memberships, plans/tasks, moderation, consent, and MCP actions.
3. A small versioned Super-to-OSIRIS public-map adapter exposes a deny-by-default public projection. OSIRIS reads it; OSIRIS never receives a D1 binding or privileged coordination credential.
4. A Cloudflare route/ingress may give the product one hostname and route coordination paths to the Worker and map/feed paths to the OSIRIS origin. It is a router, not a third data owner. Cloudflare recommends Routes when a Worker fronts an external origin and Custom Domains when the Worker itself is the origin ([routing documentation](https://developers.cloudflare.com/workers/configuration/routing/)).

```text
browser
  -> Cloudflare ingress
       -> OSIRIS integration (Node/Next, immutable image)
       -> Super Worker (auth, writes, MCP, public-map adapter)
              -> existing Super D1 (only durable coordination store)
```

This preserves a single product experience without forcing both applications into one process.

## Why a single runtime is not viable at these baselines

**Facts.** Super is built through Vinext/Vite for a Cloudflare Worker, imports its database from `cloudflare:workers`, and binds assets plus one D1 database in Wrangler ([package](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/package.json), [Wrangler config](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/wrangler.jsonc), [storage binding](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/lib/storage.ts)). OSIRIS is a Next.js 16 application built as a Node 22 standalone image; it explicitly externalizes `ws` and `onnxruntime-web`, reads and writes filesystem caches, opens Node HTTP/TCP/WebSocket connections, and serves long-lived SSE streams ([package](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/package.json), [Next config](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/next.config.ts), [Dockerfile](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/Dockerfile), [filesystem cache](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/lib/cctv-snapshot.ts), [WebSocket route](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/maritime/route.ts), [SSE route](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/stream/route.ts)).

Next.js documents Node and Docker as full-feature deployment targets while adapters may vary in compatibility ([Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)). Cloudflare's Node compatibility layer implements only a subset of Node APIs ([Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)); its Vinext migration guide requires an explicit compatibility check and documents ignored/partial features ([Vinext migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/vercel-to-workers/nextjs/)).

**Inference.** Putting OSIRIS on Workers would be a port with behavioral risk, not a deployment change. Putting Super inside OSIRIS's Node process would require replacing or remotely proxying its D1 binding and trust boundary. Neither is justified for the first combined release. Revisit only after a measured compatibility project demonstrates parity for every required OSIRIS route and feed.

## Data boundaries

| Boundary | May contain | Must not contain |
| --- | --- | --- |
| Super Worker + D1 | Accounts, password hashes, session hashes, attempt counters, owner IDs, all contribution fields, places/consent precision, messages, memberships, plans/tasks, reports, moderation and administration records | OSIRIS's disposable feed cache |
| Versioned public-map adapter | Moderated public feature ID, display-safe type/category/phase/status, approved public label/content, consent-safe point/area, update time, adapter schema version | Email, password/session material, owner ID, private contact, messages, membership, private tasks, reports/moderation notes, admin data, or an unconsented exact location |
| OSIRIS runtime/browser feed | Existing public OSINT plus the public-map projection; short-lived cache only | Raw D1 rows, coordination write capability, Super auth cookies/tokens, private coordination payloads |
| Release/control plane | Exact Git SHAs, image digest, Worker version ID, adapter schema version, D1 schema generation | Application records or secrets in Git/release metadata |

**Facts.** Super's current D1 schema contains the sensitive domains above ([schema](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/db/schema.ts)). Its current public map route already selects a smaller set from moderated-visible entries and omits auth, ownership, contact, messages and tasks ([map route](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/app/api/map/route.ts)). Approximate map selections are rounded; exact coordinates require explicit publication consent ([geography logic](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/lib/geography.ts)).

OSIRIS's Polybolos ingestion is not durable storage: it keeps entities in a `globalThis` in-memory `Map`, caps it at 20,000, and streams a truncated view over SSE ([ingest route](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/ingest/route.ts), [stream route](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/stream/route.ts)).

**Recommendation.** Do not push coordination records through Polybolos. The dedicated adapter must be a read-only public projection over Super's own authorization/moderation rules. Start with `Cache-Control: no-store`; add short public caching only after the privacy ticket defines which fields are irrevocably public. Logs and analytics must omit cookies, bodies, exact coordinates and adapter payloads. The definitive field list belongs to [Define the coordination domain model and public map projection](https://github.com/RobinHoodO/super-el-nino/issues/10) and the privacy rules to [Define identity, privacy, trust, and moderation boundaries](https://github.com/RobinHoodO/super-el-nino/issues/11).

## D1 migration path

There is **no database move in the recommended topology**. Preserve the current D1 database ID and binding; move only traffic and UI integration. Baseline documentation says the Cloudflare database had the complete schema but no records copied from the separate managed Sites deployment at that time; actual production tables, migration ledger and row counts must be re-inventoried immediately before cutover ([hosting notes](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/docs/GITHUB_SETUP.md)).

The repository has immutable Drizzle SQL `0000`-`0005`, while the documented production procedure applied at least `0005` with raw `wrangler d1 execute`, not Wrangler's migration ledger ([auth migration runbook](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/docs/NATIVE_AUTH.md)). Wrangler migrations record applied filenames in `d1_migrations`; applying them can capture a backup and rolls back a failing individual migration ([D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/)). Therefore:

1. Read-only inventory `sqlite_schema`, any `d1_migrations` table, per-table counts, binding/database IDs and the current Time Travel bookmark. Do not infer migration state from files alone.
2. Diff the live schema against Drizzle `0000`-`0005`. Do not replay any historical file already represented in the schema.
3. Establish a deployment ledger for **post-baseline** migrations only (or reconcile the existing ledger after the schema diff). Test it first against a dedicated staging D1 populated with synthetic privacy edge cases.
4. Use expand/contract migrations: additive nullable/defaulted structures first; deploy N/N-1-compatible code; backfill in bounded, resumable batches; remove old structures only in a later release after the rollback window.
5. Capture the production Time Travel bookmark immediately before applying a migration, record it in the private release log, apply the migration, verify schema/count invariants, and only then promote code.

D1 Time Travel supports point-in-time restore but overwrites the database in place and cancels in-flight queries, so it is a last-resort data recovery tool, not the normal application rollback ([Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)).

## Cutover

1. Create a release manifest pinning the Super SHA/Worker version, OSIRIS SHA/image digest, adapter schema, D1 schema generation, and ingress configuration. Never deploy an unpinned `latest` image.
2. Bring up a staging Super Worker with a separate staging D1 and the adapter at schema `vN`; run positive fixtures plus negative tests proving every forbidden field is absent.
3. Build the thin OSIRIS integration at the pinned upstream commit, then run OSIRIS tests/lint/build, adapter fixtures, privacy tests, SSE/overlay smoke tests, and visual QA.
4. Upload the Super Worker version without production traffic and smoke-test its version URL. If a gradual rollout is used, keep browser requests version-affine to avoid HTML/asset skew ([Workers versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/), [version affinity](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/version-affinity/)).
5. Deploy OSIRIS blue/green beside the current instance, check process health and representative critical feeds/overlays, then switch ingress. OSIRIS's current health route explicitly checks only that the process responds, not upstream feeds ([health route](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/health/route.ts)). Do not use the current `deploy.sh` for this cutover: it stops the old compose stack before rebuilding and has no readiness or automatic rollback gate ([deploy script](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/deploy.sh)).
6. Enable the public-map layer for a bounded cohort, monitor adapter 4xx/5xx, Worker errors, auth/write success, OSIRIS feed readiness and privacy telemetry, then promote. Retain the prior Worker version, OSIRIS image and ingress config for the rollback window.

Any privacy-negative-test failure, cross-account data exposure, write/auth regression, or schema invariant failure is an immediate stop and rollback condition.

## Rollback matrix

| Failure | First action | Data action |
| --- | --- | --- |
| OSIRIS UI/feed/overlay regression | Route to the prior immutable OSIRIS image/digest | None; OSIRIS owns no coordination state |
| Public-map adapter regression | Disable the layer or roll the adapter/Worker to its prior N/N-1-compatible version | Leave D1 intact |
| Super Worker/auth/write regression | `wrangler rollback` to the prior recorded Worker version; keep bindings unchanged | Leave additive schema in place; old code must tolerate it |
| Suspected privacy disclosure | Disable the adapter at ingress, purge any public cache, restrict affected logs, investigate | Do not restore D1 unless its canonical data was corrupted |
| Verified destructive D1 corruption | Put writes into maintenance/read-only mode and restore the recorded Time Travel bookmark | Restore only with explicit incident approval; account for legitimate writes after the bookmark |

Cloudflare Worker rollback changes the active code deployment but does not roll back D1 or other bound storage ([rollback documentation](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)). That is why every cutover migration must preserve compatibility with the previous Worker.

## Version updates

The transport choice (fork, subtree/package, or another reuse form) belongs to [Determine a viable OSIRIS reuse and upstream-sync model](https://github.com/RobinHoodO/super-el-nino/issues/9). This topology is transport-independent and requires:

- an exact OSIRIS commit pin and immutable image digest, plus an independently versioned adapter schema;
- a weekly upstream watch, reviewed monthly/pre-release syncs, and an urgent security path, with a human-reviewed change every time and no auto-merge/deploy;
- OSIRIS tests/lint/build, adapter fixtures, privacy-negative tests, SSE/overlay smoke, and visual QA before promotion;
- adapter compatibility across N and N-1 so the OSIRIS image and Super Worker can roll back independently;
- one release manifest exposed through a diagnostic endpoint or deployment metadata. The existing OSIRIS workflow publishes `latest`, semver and SHA tags, but a digest is the deployment identity ([publish workflow](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/.github/workflows/docker-publish.yml)). Super Worker versions should continue to be tagged with the exact Git SHA as its runbook already prescribes.

Longer term, prefer an upstream generic GeoJSON/source-layer extension or published map-core over a growing integration fork. Until that exists, roll back the whole immutable OSIRIS integration deployment rather than trying to patch it in place.

## Resolved answer

The combined product should present one routed experience but keep OSIRIS and Super as separate runtimes. Super/D1 remains the sole durable coordination system of record; OSIRIS consumes only a versioned, moderated public projection. Cutover is additive and blue/green, normal rollback is code/route rollback without D1 restore, and every release pins both runtimes plus the adapter contract so each can move or roll back independently.
