# OSIRIS reuse and upstream-sync model

Research resolution for [Determine a viable OSIRIS reuse and upstream-sync model](https://github.com/RobinHoodO/super-el-nino/issues/9), 2026-11-07.

Baselines: [Super El Niño `87c33fe`](https://github.com/RobinHoodO/super-el-nino/commit/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9) and [OSIRIS `3c7815b`](https://github.com/simplifaisoul/osiris/commit/3c7815badcb95b16a36d960d131c4f87c9267ce5). Statements below marked **Fact** come from those revisions, their Git history, or the linked primary documentation. **Decision** and **Inference** are the recommended interpretation of that evidence.

## Decision

Adopt a **versioned Super El Niño → OSIRIS public-map adapter** as the product boundary. Super El Niño and D1 remain the sole system of record for contributions, communities, plans, tasks, membership, moderation, messages, identity, and location consent. The adapter publishes only a consented, moderated projection for display on the planet map.

Until upstream exposes a stable external-layer extension or publishes a map-core package, run a **thin integration fork of OSIRIS as a separately deployed, embedded/mounted map surface**. Limit the fork to loading the adapter's GeoJSON feed and emitting a small, origin-checked selection/navigation event contract back to Super El Niño. This is a temporary delivery vehicle for the adapter, not a second domain backend.

Do not make OSIRIS SDK ingest authoritative. Do not import OSIRIS as a subtree or submodule, and do not fold its full application source into Super El Niño. Preserve the existing selective MIT-attributed helper snapshot only where those low-level helpers remain useful.

```text
Super El Niño D1 (authoritative records)
        |
        v
privacy + moderation projection
        |
        v
versioned public-map adapter (pull/ETag; no secrets)
        |
        v
thin OSIRIS integration fork (renderer + live context)
        |
        v
embedded/mounted map; actions return to Super El Niño
```

## Evidence

### License and maintainer boundary

- **Fact:** OSIRIS is MIT-licensed. Copying, modifying, distributing, and sublicensing are permitted, provided the copyright and permission notice remain in copies or substantial portions ([license at the baseline](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/LICENSE)). This permits a fork, selective extraction, and an embedded deployment; it does not remove attribution obligations or separately license third-party feeds, datasets, trademarks, or services.
- **Fact:** The OSIRIS repository is public, but the authenticated GitHub repository response on 2026-11-07 reported `pull: true` and `push: false` for RobinHoodO. Upstream mutation and release timing therefore remain with `simplifaisoul`; changes require a fork and, if desired, an upstream pull request. GitHub documents a fork as the owned copy used to propose changes and documents explicit upstream syncing ([fork documentation](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo?tool=cli), [sync documentation](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork)).
- **Fact:** OSIRIS is an application, not a published library: its package is named `osiris`, marked `private: true`, and has no package exports ([`package.json`](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/package.json)).
- **Fact:** Super El Niño has no root repository license at its baseline, while its existing OSIRIS-derived snapshot preserves the upstream MIT notice and records the source revision ([vendor notice](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/vendor/osiris/README.md), [vendor license](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/vendor/osiris/LICENSE)). Any future copied substantial portion must keep that notice. This is an engineering reading, not legal advice.

### Map modularity

- **Fact:** OSIRIS describes a single Next.js client combining MapLibre, HUD panels, and reconnaissance tools over many application API routes ([architecture](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/README.md#architecture)). At the baseline, `src/app/page.tsx` is 2,464 lines and `src/components/OsirisMap.tsx` is 3,521 lines.
- **Fact:** `OsirisMap` accepts a broad unversioned `data: any` object plus more than thirty layer, navigation, drawing, terrain, ArcGIS, LIDAR, transit, and OI props ([prop surface](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/components/OsirisMap.tsx#L59-L133)). It directly registers many feed-specific MapLibre sources, layers, click handlers, popups, and controls. The page supplies those props from a large application-owned state graph ([render boundary](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/page.tsx#L1614-L1664)).
- **Fact:** Super El Niño already demonstrates a narrower selective-extraction seam. Its globe owns community behavior, D1-derived records, filters, and consent-aware location fields, while reusing OSIRIS-derived projection/camera helpers and MapLibre setup ([community map](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/components/global-map.tsx), [vendor notice](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/vendor/osiris/README.md)).
- **Inference:** A clean map-core package can be designed, but it cannot be consumed from current upstream without first extracting and stabilizing a new boundary. Doing that only downstream would create a large, conflict-prone patch. The thin external-layer hook is the smaller interim patch and the better candidate to contribute upstream.

### SDK ingest suitability

- **Fact:** The SDK's normalized entity is a geospatial observation/track with one position, threat/classification fields, source attribution, rendering hints, and an open property bag ([entity type](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/lib/sdk/types.ts#L48-L101)). It has no first-class owner, membership, plan/task hierarchy, assignment, moderation workflow, visibility policy, location-consent provenance, message privacy, version, or audit history.
- **Fact:** `/api/sdk/ingest` authenticates one shared key and stores normalized entities in a process-global `Map`. The store is capped at 20,000 entities; the in-memory ingest log keeps only the last 100 batches ([store and limits](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/ingest/route.ts#L17-L38), [write path](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/ingest/route.ts#L114-L202)). There is no database, replay cursor, deletion/tombstone protocol, TTL, per-record authorization, or durable audit log.
- **Fact:** The SSE endpoint reads that same process memory, pushes at five-second intervals, and sends at most 500 entities per event with a `truncated` flag ([stream implementation](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/stream/route.ts#L13-L27), [update behavior](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/api/sdk/stream/route.ts#L71-L91)).
- **Fact:** At this revision, the main OSIRIS page builds `sdk_entities` from its own flight, maritime, earthquake, GDELT, and news data ([page fusion effect](https://github.com/simplifaisoul/osiris/blob/3c7815badcb95b16a36d960d131c4f87c9267ce5/src/app/page.tsx#L1335-L1412)). It does not subscribe to `/api/sdk/stream`; GitNexus found no application caller of `PolybolosClient.ingestOsirisData`. The SDK stream is therefore an available integration endpoint, not a complete external-record-to-main-map path at this baseline.
- **Fact:** Super El Niño already persists the missing coordination semantics in D1 tables and enforces ownership, membership, assignment, moderation, and private-message rules in its data layer ([schema](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/db/schema.ts), [coordination policy](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/lib/coordination.ts)). Its existing map endpoint already emits only visible entries and consent-aware place data ([map projection](https://github.com/RobinHoodO/super-el-nino/blob/87c33fe6d857c63e5157a1c7ea76f84a9a4eeae9/app/api/map/route.ts)).
- **Decision:** SDK ingest may be used only as a disposable display cache after the main-map consumer is completed and with deterministic repopulation from D1. It is not suitable for persistent coordination records or as the synchronization authority.

## Seam assessment

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Published/extracted map package | **Future target, unavailable now** | Best long-term dependency shape, but upstream has no package boundary and extraction from the current monolith would be a substantial patch. |
| Unmodified embedded OSIRIS app | **Context-only** | Preserves upstream intact, but current app has no complete custom coordination-layer path and cannot own Super El Niño writes, auth, consent, or moderation. |
| Thin integration fork + embedded/mounted app | **Viable interim renderer** | Keeps OSIRIS as the planet map while containing divergence to an external-layer loader and event bridge. Requires disciplined upstream syncing. |
| Full product fork | **Reject** | Legally possible, but product-level divergence across the 2,464-line page, 3,521-line map, APIs, and feeds would make upstream intake expensive. |
| Git subtree/submodule | **Reject as a seam** | These pin or transport another repository; they do not create an API boundary or reduce coupling. Official Git documentation describes submodules as a recorded gitlink and subtree as a source-history merge mechanism ([submodules](https://www.kernel.org/pub/software/scm/git/docs/gitsubmodules.html), [subtree merge](https://www.kernel.org/pub/software/scm/git/docs/howto/using-merge-subtree.html)). |
| Existing selective copied helpers | **Keep narrowly** | Proven and attributable for stable primitives, but it does not deliver the full OSIRIS live-context map and should not grow into a manual copy of the app. |
| New adapter contract | **Adopt** | Keeps domain authority and privacy in Super El Niño, gives OSIRIS one stable feed, and allows the renderer to be replaced or upgraded independently. |

## Adapter contract

The first contract should be deliberately smaller than either application's internal model:

- A versioned, cacheable pull endpoint such as `/api/map/osiris/v1`, returning GeoJSON plus `schemaVersion`, `generatedAt`, and a stable source cursor/ETag. Pull avoids placing an ingest secret in browser code and makes a restarted renderer rebuild from the authority.
- Stable public feature IDs and only the fields the map needs: contribution kind, public title/summary, status, phase, category, public location precision, consented geometry, moderation state already reduced to visible/not emitted, and `updatedAt`.
- Never emit private messages, account/contact identifiers, unconsented exact coordinates, hidden records, membership internals, or task assignment identity. A public map feature is a projection, not a copy of the coordination record.
- Map selection and “add here” actions return to Super El Niño through an allowlisted, origin-checked event contract. Super El Niño performs authentication, precision choice, authorization, validation, and the D1 write.
- Version the adapter independently. The renderer must accept current and previous (`N` and `N-1`) schema versions during a rollout. Add streaming only after a snapshot/replay contract exists; polling with ETag is the safer first release.

## Upstream-sync operating model

### Pinning units

1. **Source pin:** exact OSIRIS upstream commit SHA used as the base of the thin fork. Do not track `master` or `latest` in production.
2. **Contract pin:** adapter schema major/minor version, tested against that OSIRIS source pin.
3. **Deployment pin:** immutable image digest built from the fork commit. A mutable GHCR tag may be a discovery aid, never the production lock.

### Cadence and process

**Fact:** Git history through `3c7815b` contains 360 commits since 2026-05-12, including 28 in the preceding 30 days and 97 in the preceding 90 days. The map is moving too quickly for ad hoc source copying, while continuously merging every upstream commit would create operational churn.

**Decision:** watch upstream weekly; batch a candidate sync monthly or before a Super El Niño release; process dependency/security fixes immediately. Never auto-merge or auto-deploy.

For each sync:

1. Keep an unmodified mirror of `upstream/master`. Create a candidate from the chosen upstream SHA and reapply the small integration patch stack. Record old and new SHAs and review the whole upstream range.
2. Review changes to the map/page, dependency manifests, license/notices, SDK routes, deployment files, and any third-party feed or privacy behavior. Explicitly reject unrelated upstream capabilities rather than exposing them by default.
3. Run the compatibility gate below. Only then update the source pin, adapter compatibility table, and immutable deployment digest.
4. If the patch stack stops being small or repeated conflicts land in `OsirisMap`, pause syncing and pursue the upstream extension/package seam rather than normalizing permanent divergence.

### Compatibility gate

- OSIRIS deterministic tests, lint, and production build at the candidate SHA.
- Adapter schema/fixture tests for `N` and `N-1`, stable IDs, updates, removals, and empty/partial/error responses.
- Privacy negative tests proving hidden records, private contact/message data, member identity, and unconsented exact coordinates cannot appear.
- Integration smoke test proving snapshot load, refresh, feature selection, and “add here” event routing; if SDK ingest remains as an optional cache, prove restart/repopulation and truncation handling.
- Origin/CORS/CSP and `postMessage` source/origin validation for the embedded boundary.
- Visual regression or recorded browser QA for globe/flat projection, clusters, layer ordering, popups, mobile layout, and degraded feed behavior.
- License/notice and third-party source review for any newly enabled upstream layer.

### Rollback unit

Rollback OSIRIS as one immutable deployment/image to the previous known-good SHA/digest. Do not cherry-pick runtime files during an incident. Roll back the adapter independently; `N`/`N-1` support prevents a synchronized emergency rollback. Super El Niño's D1 records are unaffected because no authority moved into OSIRIS.

## Principal risks and exits

- **Upstream churn and monolith conflicts:** bounded by the thin patch stack, monthly batching, and a stop condition. Exit by upstreaming a generic external GeoJSON/source-layer hook or a published map-core package.
- **Embed boundary complexity:** iframe/mounting can complicate navigation, accessibility, CSP, and responsive layout. Keep the bridge small and typed; ticket the deployment topology separately.
- **Privacy leakage:** a map projection can reveal more than intended even without explicit identity. Make precision reduction and moderation part of the server-side adapter and test absence, not just presence.
- **Third-party feeds:** MIT covers OSIRIS code, not every upstream service or dataset. Enable only layers whose terms, attribution, reliability, and emergency-context risk have been reviewed.
- **Maintainer dependency:** RobinHoodO cannot push upstream. Keep the fork operable without acceptance, but offer the generic extension hook upstream so the long-term maintenance burden can shrink.

The recommendation is viable now because it uses OSIRIS as the visible planet-map runtime without asking its transient SDK to become a coordination database. It is maintainable only while the fork stays thin and the adapter remains the durable boundary.
