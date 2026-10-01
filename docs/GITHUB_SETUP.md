# Super El Nino source and hosting

The website currently runs on ChatGPT Sites. The source can be maintained in a separate GitHub repository. GitHub contains application code and immutable schema migrations, not the live database or secrets.

## Checks

Use Node 22 or later and the pnpm version in package.json. Install dependencies, run `node node_modules/typescript/bin/tsc --noEmit`, `node tests/run.mjs`, `node scripts/prepare-map-worker.mjs`, and `pnpm build`.

## Current publication

Publishing the GitHub repository does not itself deploy this Site. Sites publishing uses its source workflow and connector; keep the existing project identity and database. GitHub-to-production deployment has not been configured.

## Later Cloudflare deployment

Before enabling deployment on pushes to main, provision D1, apply existing migrations and plan a data export/import. Cloudflare also needs production identity/authentication: the current application trusts authenticated identity headers injected by Sites. Never accept those headers directly from browser clients. Configure secrets in the deployment provider rather than committing them. Retain the Osiris MIT license and GeoNames attribution.

## Map contribution flow

Right-click the globe to start a contribution at the selected coordinates. The toolbar Contribute button selects the map centre, including on mobile. Address/GPS pins can use exact coordinates when the contributor explicitly chooses to publish them; otherwise coordinates round to two decimals. Address labels are supplied by the contributor; street address geocoding is not configured.
