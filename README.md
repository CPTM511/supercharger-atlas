# Charge Atlas

**Evidence-led US charging-site screening. English first. Chinese available in the application.**

[Open the product](https://cptm511.github.io/supercharger-atlas/) · [English research brief](downloads/charge-atlas-brief.pdf) · [Chinese research brief](downloads/charge-atlas-brief-zh.pdf)

## Current conclusion — v0.7.0

**Five field-verification hypotheses, zero investment-ready projects.** The discovery shortlist is now separate from the strict investment gate. All 37 original properties remain pending, not formally rejected; a shared downside stress is not a local demand forecast.

Investigate **WinCo Puyallup** and **H-E-B Ronald Reagan** first. **H-E-B Elgin** requires an access/roadway screen; **WinCo Edmonds** and **WinCo Medford** require an existing-project redesign or recovery scope. This is a qualitative diligence order, not a predicted-return ranking or a national optimum. [Inspect the hypotheses, counter-evidence and field tests](docs/FIELD-HYPOTHESES.md).

Fresh Tesla configurator observations plus a retained same-day Edmonds observation provide five address entries, but only three distinct vendor input sets. These are location-conditioned projections, not local paid-session records. The reported four-city 4–7 year paybacks likewise came from a media configurator experiment, not realized project returns. Approximately 35 kWh per session is stated by Tesla's current tooltip; the product now works primarily in kWh per post per calendar day.

Each hypothesis has conservative/base/optimistic four-post working cases, all inputs and transfer limits, and independently recomputed required-energy and maximum-complete-cost conditions. The 70%/100%/120% demand cases and cost allowances were fixed before inspecting results; they are not statistical confidence bounds. Neither higher utilization nor a four-post supplier illustration automatically passes the unchanged gates. The original regional stress scenarios remain available and unchanged.

The new evidence also exposes a vendor geocoding mismatch at Ronald Reagan, potential road-access changes at Elgin, and a weaker unsubsidized new-build case at Medford. Precise traffic figures without a verified year/location match were not converted into charging demand.

The prior [incentives and ownership review](docs/INCENTIVES-AND-OWNERSHIP.md) remains available: Machias has a conditional grant-led route, WA/OR have fuel-credit mechanisms, and ownership determines who receives revenue or support. No unverified incentive, merchant benefit or reuse saving is admitted. The original stress model's shared conservative revenue of $51,392 remains below its $60,000 fixed-cost assumption; that does not establish real operating losses at 37 properties.

No owner outreach, record request, utility application or paid study was performed. Private background and raw research material remain outside this repository.

Both the network-value and investor lenses now require:

- Verified site control, grid/tariff, complete costs, demand/pricing, permits/access and commercial terms.
- Base-case payback within **6 years** and conservative-case payback within **8 years**, measured from first capital spend.
- Nonnegative base NPV at a **10% real discount rate**, with **10 operating years after construction**, and positive conservative cash after the replacement allowance.

These are explicit underwriting choices, **not an industry standard, Tesla investment policy or a promised return**. [Read the derivation and limitations](docs/ECONOMICS.md).

## What the product does

- Explore five field hypotheses with measured-aggregate versus vendor-projection distinctions, local counter-evidence and explicit verification conditions.
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

[Methodology](docs/METHODOLOGY.md) · [Economics](docs/ECONOMICS.md) · [Field hypotheses](docs/FIELD-HYPOTHESES.md) · [Current support review](docs/INCENTIVES-AND-OWNERSHIP.md) · [Prior evidence recovery](docs/EVIDENCE-RECOVERY.md) · [Prior feasibility review](docs/FEASIBILITY-ROUND-3.md) · [Earlier 37 reassessments](docs/SITE-REASSESSMENT.md) · [Earlier review](docs/REVIEW-ROUND-1.md) · [Data sources](docs/DATA-SOURCES.md) · [AI workflow](docs/AI-WORKFLOW.md) · [Update procedure](docs/UPDATING.md) · [Validation scope](docs/VALIDATION.md)

Original code and analysis are MIT licensed; third-party materials retain their own rights. This is independent research with no Tesla affiliation or endorsement.
