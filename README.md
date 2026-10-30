# Charge Atlas

**Evidence-led US charging-site screening. English first. Chinese available in the application.**

[Open the product](https://cptm511.github.io/supercharger-atlas/) · [English research brief](downloads/charge-atlas-brief.pdf) · [Chinese research brief](downloads/charge-atlas-brief-zh.pdf)

## Current conclusion — v0.5.0

**Zero investment-ready projects in this selected pool does not mean the United States has no suitable charging sites.** All 37 remain pending; none is formally rejected. Financial and evidence gates are unchanged.

Round four pursued the ten previous evidence priorities. It recovered Edmonds' original charging-design record, Colebrook funding/reporting requirements, a recent single-driver Austin observation, and current Georgia/Oregon conditional funding routes. None establishes a complete current paid-demand series, design-matched quote or firm incremental utility capacity/date. The other 27 retain earlier records. [Read the evidence recovery and decision audit](docs/EVIDENCE-RECOVERY.md).

The review explains the universal stress failure: 37 addresses share only 14 distinct state-based main scenario sets. Common conservative revenue is $51,392/year, already below $60,000/year fixed costs before other expenses. This is a stress-case result, not evidence that all real sites lose money. New-build demand needs matched paid analogues and local capture/diversion validation; a station cannot supply its own pre-opening sales.

Three completed California sites form a contractor-reported operational comparison, outside the candidate rankings. Their reliability and cost limitations remain explicit. No owner outreach, record request, utility application or paid study was performed.

Both the network-value and investor lenses now require:

- Verified site control, grid/tariff, complete costs, demand/pricing, permits/access and commercial terms.
- Base-case payback within **6 years** and conservative-case payback within **8 years**, measured from first capital spend.
- Nonnegative base NPV at a **10% real discount rate**, with **10 operating years after construction**, and positive conservative cash after the replacement allowance.

These are explicit underwriting choices, **not an industry standard, Tesla investment policy or a promised return**. [Read the derivation and limitations](docs/ECONOMICS.md).

## What the product does

- Switch between network and investor lenses, and between qualified, pending and excluded pools.
- Inspect exact property addresses, existing supply, new evidence, its geographic scope and limitations, missing evidence and source links.
- Review conservative/base/optimistic calculations for every property, including capital, operating costs, construction holding costs, ramp, replacement allowance, NPV and payback.
- Inspect prior/current feasibility, available evidence and acquisition routes for all 37 properties; filter to the 10 focused reviews.
- Calculate the paid volume and one-variable cost/delay limits needed to meet the unchanged rules. These are conditional algebraic boundaries, not observed demand or feasible capacity guarantees.
- Inspect before/after cash flow and payback, an observed-network throughput comparison, and conditional published-tariff sensitivities.
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

[Methodology](docs/METHODOLOGY.md) · [Economics](docs/ECONOMICS.md) · [Current evidence recovery](docs/EVIDENCE-RECOVERY.md) · [Prior feasibility review](docs/FEASIBILITY-ROUND-3.md) · [Earlier 37 reassessments](docs/SITE-REASSESSMENT.md) · [Earlier review](docs/REVIEW-ROUND-1.md) · [Data sources](docs/DATA-SOURCES.md) · [AI workflow](docs/AI-WORKFLOW.md) · [Update procedure](docs/UPDATING.md) · [Validation scope](docs/VALIDATION.md)

Original code and analysis are MIT licensed; third-party materials retain their own rights. This is independent research with no Tesla affiliation or endorsement.
