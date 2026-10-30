# Charge Atlas

**Evidence-led US charging-site screening. English first. Chinese available in the application.**

[Open the product](https://cptm511.github.io/supercharger-atlas/) · [English research brief](downloads/charge-atlas-brief.pdf) · [Chinese research brief](downloads/charge-atlas-brief-zh.pdf)

## Current conclusion — v0.3.0

**Zero properties qualify under either investment-gated lens.** The former two Top 10 lists are now historical research priorities in the pending pool, not approved investment recommendations. The threshold was not relaxed to fill a list.

Round two investigated all 37 properties, including the former shortlists and reserves. New claim-level records identify direct sources, secondary reports, inferences, estimates and unresolved research attempts. Ownership, parcel, lease, access and utility findings improve the decision basis; they do not establish project consent. Missing site rights, utility capacity, scoped costs, measured paying demand and contractual terms prevent qualification. No outreach, site visit or utility application is represented as completed.

Both the network-value and investor lenses now require:

- Verified site control, grid/tariff, complete costs, demand/pricing, permits/access and commercial terms.
- Base-case payback within **6 years** and conservative-case payback within **8 years**, measured from first capital spend.
- Nonnegative base NPV at a **10% real discount rate**, with **10 operating years after construction**, and positive conservative cash after the replacement allowance.

These are explicit underwriting choices, **not an industry standard, Tesla investment policy or a promised return**. [Read the derivation and limitations](docs/ECONOMICS.md).

## What the product does

- Switch between network and investor lenses, and between qualified, pending and excluded pools.
- Inspect exact property addresses, existing supply, new evidence, its geographic scope and limitations, missing evidence and source links.
- Review conservative/base/optimistic calculations for every property, including capital, operating costs, construction holding costs, ramp, replacement allowance, NPV and payback.
- Inspect before/after cash flow and payback, an observed-network throughput comparison, and conditional published-tariff sensitivities for six properties.
- Compare up to three properties, export the current view to CSV, or download a two-page brief.
- Switch the application between English and Chinese. English is the default on each page load.

**The per-property numbers are regional-benchmark stress scenarios, not site forecasts.** Electricity varies by state using official commercial averages; unmeasured demand and unquoted construction costs remain shared assumptions. Same-state main outputs remain identical where no defensible parcel inputs exist. The conservative session-energy assumption is now 22 kWh, anchored to an older non-Tesla paid-session sample; it is not a calibrated forecast. Separate utility subtotals expose actual published demand and fixed charges while flagging incomplete bills. All 37 reference scenario sets fail the combined numeric hurdle; missing evidence independently blocks admission. A failed hypothetical case does not prove that the actual parcel must lose money.

## Reproduce and update

Requires Node.js 22+ and Python 3. No package installation, secret API key or paid service is needed to run the application or checks.

```sh
npm start
# http://127.0.0.1:4173
npm run check
```

The app uses frozen public-source data and vendored Leaflet. Map tiles come from OpenStreetMap with attribution. It has no login, analytics, uploads or AI API calls, and uses no persistent application storage. The optional PDF generator uses ReportLab and a licensed local Unicode font.

[Methodology](docs/METHODOLOGY.md) · [Economics](docs/ECONOMICS.md) · [All 37 reassessments](docs/SITE-REASSESSMENT.md) · [Earlier review](docs/REVIEW-ROUND-1.md) · [Data sources](docs/DATA-SOURCES.md) · [AI workflow](docs/AI-WORKFLOW.md) · [Update procedure](docs/UPDATING.md) · [Validation scope](docs/VALIDATION.md)

Original code and analysis are MIT licensed; third-party materials retain their own rights. This is independent research with no Tesla affiliation or endorsement.
