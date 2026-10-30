# Charge Atlas

**Evidence-led US charging-site screening. English first. Chinese available in the application.**

[Open the product](https://cptm511.github.io/supercharger-atlas/) · [English research brief](downloads/charge-atlas-brief.pdf) · [Chinese research brief](downloads/charge-atlas-brief-zh.pdf)

## Current conclusion — v0.6.0

**Zero investment-ready projects in this selected pool does not mean the United States has no suitable charging sites.** All 37 remain pending; none is formally rejected. Financial and evidence gates are unchanged.

The latest review found material support routes previously missing from the analysis: Machias is named in an open Maine round with up to $600,000 eligible capital reimbursement plus capped, temporary electricity support; Washington and Oregon have conditional clean-fuel credit mechanisms; other routes include utility rebates, tax measures and commercial cofunding. None is a verified award for a candidate. Funding exhaustion, equipment approval, contracts, tax capacity, deadlines and benefit expiry are explicit. [Read the incentives and ownership review](docs/INCENTIVES-AND-OWNERSHIP.md).

Tesla's public configurator also offers a four-post option. Its Edmonds illustration showed $470,000 upfront versus $940,000 for eight posts, with an indicative five-year payback. The supplier assumes 7% yearly utilization growth, no parking rent and other conditions unlike this project's flat-demand stress cases. Neither figure is a complete site quote or a guaranteed return. Tesla-owned networks, third-party charging owners and property hosts have different cash flows.

Each of the 37 records now includes researched support routes and separate capital-support/volume sensitivities. A capital reimbursement is a dated receipt; it does not reduce the gross asset replacement reserve or remove recurring losses. The Machias example separately caps its five-year electricity support and exposes cash after expiry. Positive sensitivities remain assumptions and do not qualify a site.

The original 37-property scenario inputs and results remain unchanged: only 14 distinct state-based main sets underlie them. Common conservative revenue is $51,392/year, below $60,000/year fixed costs before other expenses. That is a stress-case result, not evidence that every real charging business loses money. A validated project needs matched design, demand, tariff and contractual evidence.

No owner outreach, record request, utility application or paid study was performed. All private background and raw research material remains outside this repository.

Both the network-value and investor lenses now require:

- Verified site control, grid/tariff, complete costs, demand/pricing, permits/access and commercial terms.
- Base-case payback within **6 years** and conservative-case payback within **8 years**, measured from first capital spend.
- Nonnegative base NPV at a **10% real discount rate**, with **10 operating years after construction**, and positive conservative cash after the replacement allowance.

These are explicit underwriting choices, **not an industry standard, Tesla investment policy or a promised return**. [Read the derivation and limitations](docs/ECONOMICS.md).

## What the product does

- Switch between network and investor lenses, and between qualified, pending and excluded pools.
- Explore researched incentive restrictions and dated reimbursement/volume sensitivities without treating possible support as awarded money.
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

[Methodology](docs/METHODOLOGY.md) · [Economics](docs/ECONOMICS.md) · [Current support review](docs/INCENTIVES-AND-OWNERSHIP.md) · [Prior evidence recovery](docs/EVIDENCE-RECOVERY.md) · [Prior feasibility review](docs/FEASIBILITY-ROUND-3.md) · [Earlier 37 reassessments](docs/SITE-REASSESSMENT.md) · [Earlier review](docs/REVIEW-ROUND-1.md) · [Data sources](docs/DATA-SOURCES.md) · [AI workflow](docs/AI-WORKFLOW.md) · [Update procedure](docs/UPDATING.md) · [Validation scope](docs/VALIDATION.md)

Original code and analysis are MIT licensed; third-party materials retain their own rights. This is independent research with no Tesla affiliation or endorsement.
