# Charge Atlas

**Evidence-led US Supercharger location screening — two objectives, two independent Top 10 lists.**

An interactive research product for comparing Tesla network fit with third-party charging investment conditions. Each property includes an address, source-linked facts, competing supply, counterevidence, unresolved conditions and reasons to stop.

The rankings prioritize **further due diligence within a deliberately screened candidate pool**. They are not a claim to have optimized every US parcel, established actual charging demand, secured site rights or verified investment returns. This is independent research, with no Tesla affiliation or endorsement.

[Open the interactive product](https://cptm511.github.io/supercharger-atlas/) · [Download the two-page brief](downloads/charge-atlas-brief.pdf)

## Use

Requires Node.js 22+ for checks and Python 3 for the development server. No package installation, API key or paid service is needed to run the snapshot.

```sh
npm start
# Open http://127.0.0.1:4173
npm run check
```

Use the two tabs to change the decision lens, select a property on the map or list, inspect nearby supply, compare up to three properties, export CSV or download a verified two-page PDF shortlist. The economics sandbox uses explicit, editable assumptions and includes adverse cases. It never silently assigns those inputs to the selected property.

Map tiles are loaded from OpenStreetMap with attribution. If tiles are unavailable, the data, sources and comparisons remain usable. The Leaflet library is pinned and vendored. There are no trackers, accounts, cookies, uploads or AI API calls in the application.

## What is reproducible

- A frozen, normalized US public DC-fast inventory from DOE AFDC, with source query and raw-response hash.
- Independent great-circle distance calculations and station-record counts, not driving distances, live availability or compatible high-power capacity.
- Candidate facts with a source ledger and an explicit distinction between facts, inferences and assumptions.
- Investment arithmetic, CSV escaping and edge-case tests; data validation independently recomputes supply metrics.

Read [methodology](docs/METHODOLOGY.md), [source and reuse notes](docs/DATA-SOURCES.md), [economics](docs/ECONOMICS.md), [AI workflow](docs/AI-WORKFLOW.md) and [updating the research](docs/UPDATING.md), and [executed validation](docs/VALIDATION.md).

## Project structure

```text
index.html / styles.css / app.js  Interactive client
model.js                         Auditable economics and distance formulas
data/candidates.json             Properties, ranks, facts, risks and source ledger
data/supply-snapshot.json         Frozen normalized government supply records
data/provenance.json              Retrieval scope and integrity metadata
scripts/                         Review-oriented update and validation tools
tests/                           Calculation and boundary checks
docs/                            Methodology, limitations and iteration process
```

Original code and analysis use the MIT license. Third-party materials retain their own rights; see [LICENSE](LICENSE) and [data sources](docs/DATA-SOURCES.md).
