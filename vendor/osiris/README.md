Osiris map integration

Upstream: https://github.com/simplifaisoul/osiris
Revision: d972d9af5c6f45aebf6d60b8a60f229a8abbe2f1
License: MIT (see LICENSE).

Reused map projection and camera control modules, country centroids and worker preparation script. The community globe adapts the OsirisMap initialization, worker setup, WebGL fallbacks and GeoJSON layer approach for Super El Nino. Unrelated OSINT tools and feeds are not included.

Place lookup data: GeoNames cities15000 snapshot downloaded 2026-10-01, https://download.geonames.org/export/dump/cities15000.zip. Licensed CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Modified to compact ID, name, ASCII name, country/admin code, coordinates and population tuples, ordered by population. Coordinates are approximate settlement markers, not exact addresses. Country markers use the approximate Osiris centroids.
