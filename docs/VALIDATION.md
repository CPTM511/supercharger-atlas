# Release verification — v0.2.0, 2026-10-30

These checks cover the research product and arithmetic. They do not establish commercial feasibility.

## Evidence and calculation coverage

- Round one reviewed all 20 previous shortlist properties and 3 replacement prospects. The other 14 reserves retain earlier evidence; no new site review is claimed for them. Public identity and supply checks do not establish land rights, available grid capacity, complete project costs or paying demand.
- Reused the same-date frozen AFDC inventory with recorded query scope and response hashes: 15,882 public E/DCFC records and 643 P/T records. This is not a live charging test. Recomputed every available coordinate's nearest Tesla E-record distance and 10-mile DCFC-record count against the normalized government snapshot.
- Validated 37 unique properties, 169 resolvable source references, evidence labels, review coverage, English canonical analysis, translated review fields, and both hard-gated lists. Both qualified counts are zero. A source reference count is not a count of independently verified commercial facts.
- Fourteen model tests cover energy/cost reconciliation, break-even math, nonpositive unit contribution, zero-volume costs, duplicate demand charges, invalid inputs, distance units, CSV formula escaping, construction/ramp/replacement cash flows, holding costs, model horizon and evidence-first qualification. A favorable optimistic case cannot rescue the required downside tests; thresholds use unrounded values.
- A separate standard-library Python implementation independently recomputed all 111 scenarios from their published inputs, including regional rate binding, construction holding cost, cash flow, NPV and project payback. No JavaScript model code is imported into this audit.

## Product checks

- Actual browser checks covered English default, both lenses, qualified/rejected empty states, pending-list search and no matches, site selection, nearby-supply overlay, three-property comparison and refusal of a fourth, translated site detail, scenario tables and policy, and locale-specific PDF links.
- Compared Mansfield's visible calculations with the model: base annual free cash about $51,090, no recovery within the modeled horizon, and optimistic project payback about 4.77 years. These are assumed-condition results, not verified returns.
- Checked the general sandbox's separate-demand and all-in modes, reset and invalid zero-stall input. All-in mode removes separate demand charges. It remains clearly separate from the selected site's scenario.
- Actual English CSV export reported 37 sites. Static export checks covered both locales, 38 rows including the header and 118 fields per row. This release does not claim a separately inspected browser-saved CSV file.
- Mobile inspection at 390 pixels exposed page overflow from the new tables. The grid minimum and detail sizing were corrected. Both English and Chinese then measured a 390-pixel page width; wide tables scroll inside their own containers. Desktop and mobile layouts were visually inspected. No console warning/error appeared in the final local smoke check.
- Both generated PDF briefs contain exactly two pages. Text extraction and all four rendered pages were inspected for glyphs, missing text, clipping, tables and footers. Each PDF embeds its candidate-data SHA-256, and CI rejects a stale English or Chinese brief. The validated download path is the generated PDF; native browser print is optional.

## Publication boundary

The public file set is limited to product code, public-source records, analysis, tests and generated public briefs. Private application material and raw working notes remain outside this repository. No personal CV is used by the product or PDF generator. Commits use a GitHub noreply identity.

Source status can change after the snapshot. No site visit, owner consent, utility application, binding quote, measured demand or commercial return has been represented as completed. Further evidence can change qualification; tests cannot fill those gaps.
