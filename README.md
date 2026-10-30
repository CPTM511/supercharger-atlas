# Charge Atlas

**Evidence-led US charging-site screening. English first. Chinese available in the application.**

[Open the product](https://cptm511.github.io/supercharger-atlas/) · [English research brief](downloads/charge-atlas-brief.pdf) · [Chinese research brief](downloads/charge-atlas-brief-zh.pdf)

## Current conclusion — v0.8.0

**Five field-verification hypotheses, zero investment-ready projects.** New parcel, traffic, utility and retail-comparator evidence makes the hypotheses more specific. Current demand charges also weaken the earlier generic electricity-cost assumptions. All 37 original properties remain pending, not formally rejected. This does not establish that profitable US charging locations do not exist. [Read the latest evidence, calculations and remaining verification requirements](docs/LOCAL-VALIDATION.md).

| Property | Current investigation decision |
|---|---|
| H-E-B Ronald Reagan, TX | First conditional priority: parcel identity and the postal alias are better resolved. Confirm PEC service, actual peak/4CP demand and complete costs. |
| WinCo Puyallup, WA | Downgraded from joint first priority: establish an affordable tariff and peak-control design before advancing the proposed build. |
| H-E-B Elgin, TX | Conditional second priority: road context is clearer, but utility-provider overlap and parcel-level access remain unresolved. |
| WinCo Edmonds, WA | Retain an expansion/redesign investigation; existing rights, assets and paid demand must be established. |
| WinCo Medford, OR | Retain a recovery/redesign investigation; resolve operator rights, cancellation history and equipment-specific support eligibility. |

This is an evidence-acquisition order, not a predicted-return ranking or a national optimum. The new financial tests cover **two addresses and four tariff/load profiles**: two PEC profiles for Ronald Reagan, and ordinary PSE service versus a conditional trial profile for Puyallup. Published charges are combined with explicit assumed peaks. These are utility **subtotals**, with taxes, some fees and control costs unresolved; no service capacity or complete bill has been obtained. Positive optimistic or analogue-transfer cases do not pass the combined conservative/base and evidence gates.

A Q4 2025 retail study reports median **42 sessions per station per day near grocery stores**, versus 9 overall. That is reported analytics across an external cohort, not 42 paid orders at any candidate, and the local paid fraction and session energy remain unknown. The selected 59-session comparator has five ports; transferring it to four posts is an additional assumption. These references support explicit demand tests, not a calibrated forecast or success probability.

The [v0.7 field hypotheses](docs/FIELD-HYPOTHESES.md) remain available as historical vendor-based reference: five address entries, three distinct vendor input sets, and four-post conservative/base/optimistic cases. Their 70%/100%/120% volume factors are assumptions, not statistical confidence bounds. The latest local review supersedes their investigation narrative where evidence conflicts. The original regional stress scenarios and all admission rules remain unchanged.

The [incentives and ownership review](docs/INCENTIVES-AND-OWNERSHIP.md) also remains available. New local checks distinguish conditional PSE support, an Edmonds Level 2 rebate that cannot be booked for DC fast charging, and Medford upgrade support with unresolved Tesla eligibility. An unawarded Puyallup reimbursement sensitivity preserves gross cost and payment timing; the booked award remains **$0**. The original stress model's shared conservative revenue of $51,392 remains below its $60,000 fixed-cost assumption; that does not establish real operating losses at 37 properties.

Public-source verification is not field verification, an engineering approval or a binding commercial offer. No owner outreach, record request, utility application or paid study was performed. Private background and raw research material remain outside this repository.

Both the network-value and investor lenses now require:

- Verified site control, grid/tariff, complete costs, demand/pricing, permits/access and commercial terms.
- Base-case payback within **6 years** and conservative-case payback within **8 years**, measured from first capital spend.
- Nonnegative base NPV at a **10% real discount rate**, with **10 operating years after construction**, and positive conservative cash after the replacement allowance.

These are explicit underwriting choices, **not an industry standard, Tesla investment policy or a promised return**. [Read the derivation and limitations](docs/ECONOMICS.md).

## What the product does

- Read a generated English research snapshot and report links even before interactive data loads.
- Explore five field hypotheses with measured-aggregate versus vendor-projection distinctions, local counter-evidence and explicit verification conditions.
- Review the latest five-property evidence update and four dated utility-subtotal profiles for two addresses, including external retail-transfer, construction-delay and conditional reimbursement tests.
- Switch between network and investor lenses, and between qualified, pending and excluded pools.
- Explore researched incentive restrictions and dated reimbursement/volume sensitivities without treating possible support as awarded money.
- Inspect exact property addresses, existing supply, new evidence, its geographic scope and limitations, missing evidence and source links.
- Review conservative/base/optimistic calculations for every property, including capital, operating costs, construction holding costs, ramp, replacement allowance, NPV and payback.
- Inspect prior/current feasibility, available evidence and acquisition routes for all 37 properties; filter to the 10 focused reviews.
- Calculate the paid volume and one-variable cost/delay limits needed to meet the unchanged rules. These are conditional algebraic boundaries, not observed demand or feasible capacity guarantees.
- Inspect before/after cash flow and payback, an observed-network throughput comparison, and conditional published-tariff sensitivities.
- Compare up to three properties, export the current view to CSV, or download a two-page brief.
- Switch the application between English and Chinese. English is the default on each page load.

**The original 37-property numbers are regional-benchmark stress scenarios, not site forecasts.** Electricity varies by state using official commercial averages; unmeasured demand and unquoted construction costs remain shared assumptions. Same-state main outputs remain identical where no defensible parcel inputs exist. Their conservative session-energy assumption is 22 kWh, anchored to an older non-Tesla paid-session sample. Separate local tests use published utility components and assumed loads, without claiming complete bills or replacing the original scenarios. All 37 reference scenario sets fail the combined numeric hurdle; missing evidence independently blocks admission. A failed hypothetical case does not prove that the actual parcel must lose money.

## Reproduce and update

Requires Node.js 22+ and Python 3. No package installation, secret API key or paid service is needed to run the application or checks.

```sh
npm start
# http://127.0.0.1:4173
npm run check
```

The app uses frozen public-source data and vendored Leaflet. Map tiles come from OpenStreetMap with attribution. It has no login, analytics, uploads or AI API calls, and uses no persistent application storage. The optional PDF generator uses ReportLab and a licensed local Unicode font.

[Latest local evidence and tests](docs/LOCAL-VALIDATION.md) · [Methodology](docs/METHODOLOGY.md) · [Economics](docs/ECONOMICS.md) · [Prior field hypotheses](docs/FIELD-HYPOTHESES.md) · [Support review](docs/INCENTIVES-AND-OWNERSHIP.md) · [Prior evidence recovery](docs/EVIDENCE-RECOVERY.md) · [Prior feasibility review](docs/FEASIBILITY-ROUND-3.md) · [Earlier 37 reassessments](docs/SITE-REASSESSMENT.md) · [Earlier review](docs/REVIEW-ROUND-1.md) · [Data sources](docs/DATA-SOURCES.md) · [AI workflow](docs/AI-WORKFLOW.md) · [Update procedure](docs/UPDATING.md) · [Validation scope](docs/VALIDATION.md)

Original code and analysis are MIT licensed; third-party materials retain their own rights. This is independent research with no Tesla affiliation or endorsement.
