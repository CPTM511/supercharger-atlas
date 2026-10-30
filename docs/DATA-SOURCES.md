# Sources, provenance and reuse

The source ledger in `data/candidates.json` identifies what each source supports, the date it was read, its origin and access limitations. A source count is not a count of independent confirmations. Search-only leads are labeled unverified and are not promoted to verified facts.

| Source | Use | Limits |
| --- | --- | --- |
| [DOE AFDC API](https://developer.nlr.gov/docs/transportation/alt-fuel-stations-v1/all/) | Frozen US public DC-fast E records; additional P/T check | Not live operational testing; individual confirmation dates differ; co-located records may duplicate physical properties |
| [AFDC collection methods](https://afdc.energy.gov/stations/charging-networks) | Understand network API, CSV and manual update cadence | Different networks have different freshness |
| [Tesla](https://www.tesla.com/findus) | Official location pages and commercial program descriptions | Some location URLs were unavailable; failures do not establish absence; corporate performance claims are not independently audited |
| [supercharge.info](https://supercharge.info/about) | Community pipeline and status leads | Explicitly not provided or validated by Tesla; PLAN, VOTING, PERMIT and CONSTRUCTION are distinct |
| Property owners / local authorities | Business identity, address, hours and project records | Business presence is not land control or a commitment to host charging |
| [US Census geocoder](https://geocoding.geo.census.gov/geocoder/) | Address matching where owner coordinates unavailable | Address-range interpolation is not rooftop, entrance or stall accuracy; direction mismatches must be rejected |
| [AFDC vehicle registrations](https://afdc.energy.gov/vehicle-registration) | 2025 state-level context | Rounded light-duty counts; regional context cannot establish site-level charging demand |
| [Washington DOL open data](https://data.wa.gov/Transportation/Electric-Vehicle-Population-Data/f6w7-q2d2) | Aggregated city-level BEV/PHEV context | This project uses aggregate queries only; no vehicle identifiers or person-level records |
| [NCTCOG registration data](https://dfwcleancities.nctcog.org/registration-data-and-maps) | Dated Texas city adoption context | EV category is not assumed identical to BEV; city boundaries are not property catchment areas |
| Filed utility tariffs / IRS | Cost structure and time-sensitive assumptions | Parcel eligibility, full bills and project-specific tax treatment require confirmation |

Version 0.2 adds official EIA regional price benchmarks, investment-policy primary sources and a round-one review ledger. `data/economics-policy.json` records the benchmark period and explicitly chosen scenario parameters. `data/review-round.json` separates newly reviewed properties from carried-forward reserves. None of the new source counts implies a signed quote or independent confirmation.

## Frozen data

`data/provenance.json` records query filters, retrieval time, row counts and hashes of the downloaded raw responses. `data/supply-snapshot.json` contains selected factual government fields, without station contact phone numbers. All 15,882 E records were parsed and the API total checked before calculations.

The full community dataset and source-page copies are not redistributed. Relevant community-derived facts are attributed next to each property. Original third-party prose, maps, photographs and source PDFs are not relicensed by this project. Links point to the original publishers.

`data/state-ev-context.json` contains public aggregate registration counts and a defined share calculation. No data from private resumes, employment documents, personal correspondence or private research files is part of the public product.

## Display and licensing

Leaflet 1.9.4 is vendored under its BSD-2-Clause license (`vendor/leaflet/LICENSE`); release checks verify its published integrity hash. OpenStreetMap tiles and attribution remain under the upstream terms. The project MIT license covers original code and analysis, not upstream datasets or trademarks. Preserve attribution, check upstream terms for additional uses and do not imply government, retailer or Tesla endorsement.
