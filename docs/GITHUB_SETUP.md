# Super El Nino source and hosting

The canonical authenticated website runs on the Cloudflare Worker. See [native account security, migration and rollback](NATIVE_AUTH.md). The older ChatGPT Sites deployment is maintained separately. The source can be maintained in a separate GitHub repository. GitHub contains application code and immutable schema migrations, not the live database or secrets.

## Checks

Use Node 22 or later and the pnpm version in package.json. Install dependencies, run `node node_modules/typescript/bin/tsc --noEmit`, `node tests/run.mjs`, `node scripts/prepare-map-worker.mjs`, and `pnpm build`.

## Current publication

The ChatGPT Sites deployment remains available at `super-el-nino.vibethrivbe.chatgpt.site`. A Cloudflare Worker deployment is also live in the Thrivbe account at `https://super-el-nino.thrivbe.workers.dev`.

Cloudflare uses the committed `wrangler.jsonc` configuration and the `super-el-nino` D1 database. The D1 database has the complete schema from `drizzle/`, but intentionally has no copied community records, private messages, contacts, or other live data.

Deploy the checked-out source with Node 22+, after building it, through the Thrivbe Cloudflare credentials:

```sh
oprun --env-file /Users/robinsverd/Thrivbe-AI/Thrivbe-OS/.env -- pnpm deploy:cloudflare
```

The Cloudflare wrapper strips ChatGPT Sites identity headers before the app sees a request. This prevents browser clients from spoofing a user identity, and the app now authenticates ordinary email/password accounts using server-side D1 sessions. Never accept those headers directly from browser clients. Configure secrets in the deployment provider rather than committing them. Retain the Osiris MIT license and GeoNames attribution.

## Map contribution flow

Right-click the globe to start a contribution at the selected coordinates. The toolbar Contribute button selects the map centre, including on mobile. Address/GPS pins can use exact coordinates when the contributor explicitly chooses to publish them; otherwise coordinates round to two decimals. Address labels are supplied by the contributor; street address geocoding is not configured.
