# Charge Atlas

**Evidence-led US charging-site screening. English first. Chinese available in the application.**

[Open the product](https://cptm511.github.io/supercharger-atlas/) · [English research brief](downloads/charge-atlas-brief.pdf) · [Chinese research brief](downloads/charge-atlas-brief-zh.pdf)

## Current conclusion — v0.9.0

**Ronald Reagan remains a conditional investigation, not an investment-ready project.** Five nearby operator locations now have verified public configurations, but none supplied a public historical paid-session or billed-energy series. The proposed 59 sessions/day, 35 billed kWh/session and 150 kW 4CP remain assumptions with different levels of support. All 37 candidate properties remain pending; zero are qualified and none is formally rejected. [Read the focused evidence, calculations and acquisition limits](docs/RONALD-VALIDATION.md).

| Assumption | Current assessment |
|---|---|
| 59 paid sessions/site/day | Unverified high-demand target. The original five-port comparator implies 47.2 sessions/day on four posts at unchanged per-port throughput; maintaining 59 requires 25% more per port. |
| 35 billed kWh/session | Plausible against a federal aggregate of about 37.8 kWh/session, but not established for nearby paid retail charging. |
| 150 kW 4CP with a 600 kW monthly peak | Technically conceivable; no site-specific control agreement, fail-safe, dispatch record or cost was obtained. Continuous 150 kW limiting is a different operating design. |
| $564,000 complete base capital cost | Still unquoted. Historical nearby construction filings omit or leave unresolved material scope; they cannot justify lowering the budget. |

At the assumed $0.51/kWh realized price, 59 × 35 still produces a **4.67-year base-case payback** and approximately **+$348,000 NPV** under the 150 kW 4CP case. But the paired conservative case—41.3 sessions/day, higher costs and slower opening/ramp—does not recover capital within ten operating years. **The combined numeric hurdle still fails.** Holding the comparator's per-port throughput gives 47.2 × 35 and **6.07 years**: a positive NPV does not waive the six-year base payback rule.

The main unresolved commercial question is paid energy **at the assumed price**, not 4CP alone. Under the same 59 × 35 target, a 600 kW 4CP still gives a conditional 5.29-year base payback. Conversely, 22 kWh/session gives 8.70 years, and an assumed $0.40/kWh realization gives 7.74 years. These one-variable tests are not a calibrated forecast, should not be combined as if all favorable assumptions were independently attainable, and exclude unpriced costs.

A continuous 150 kW grid cap would require 16.20 equivalent full-power hours to serve the target's daily energy at the assumed 15% loss. If all sales occurred within the store's 17-hour opening window, this consumes 95.27% of theoretical energy capacity before arrival variability or queue effects. Written 24/7 charger access, an accepted control design and interval demand data remain missing.

The product now provides the five nearby comparisons, three target-centered scenarios, 4CP miss cases, session-energy and price sensitivities, port normalization, a complete-cost reconciliation and specific acquisition paths. Source facts, company claims, derived bounds and assumptions stay separate. No public estimate becomes a signed EPC quote or a utility capacity commitment.

The [v0.8 five-property local review](docs/LOCAL-VALIDATION.md), [v0.7 vendor-based field hypotheses](docs/FIELD-HYPOTHESES.md), and [incentives and ownership review](docs/INCENTIVES-AND-OWNERSHIP.md) remain available as earlier evidence. Puyallup still needs an affordable tariff/control design; Elgin needs utility and access resolution; Edmonds and Medford remain expansion/recovery investigations. They were not freshly reinvestigated in this focused round. No grant, credit or reuse saving has been admitted.

Public-source verification is not field verification, engineering approval or a binding commercial offer. No owner/operator outreach, data purchase, utility application or paid study was performed. Private background and raw research remain outside this repository.

Both the network-value and investor lenses now require:

- Verified site control, grid/tariff, complete costs, demand/pricing, permits/access and commercial terms.
- Base-case payback within **6 years** and conservative-case payback within **8 years**, measured from first capital spend.
- Nonnegative base NPV at a **10% real discount rate**, with **10 operating years after construction**, and positive conservative cash after the replacement allowance.

These are explicit underwriting choices, **not an industry standard, Tesla investment policy or a promised return**. [Read the derivation and limitations](docs/ECONOMICS.md).

## What the product does

- Inspect the focused Ronald Reagan demand, 4CP and complete-cost review, with nearby comparator limitations and conditional target tests.
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

[Latest Ronald Reagan review](docs/RONALD-VALIDATION.md) · [Five-site local evidence](docs/LOCAL-VALIDATION.md) · [Methodology](docs/METHODOLOGY.md) · [Economics](docs/ECONOMICS.md) · [Prior field hypotheses](docs/FIELD-HYPOTHESES.md) · [Support review](docs/INCENTIVES-AND-OWNERSHIP.md) · [Prior evidence recovery](docs/EVIDENCE-RECOVERY.md) · [Prior feasibility review](docs/FEASIBILITY-ROUND-3.md) · [Earlier 37 reassessments](docs/SITE-REASSESSMENT.md) · [Earlier review](docs/REVIEW-ROUND-1.md) · [Data sources](docs/DATA-SOURCES.md) · [AI workflow](docs/AI-WORKFLOW.md) · [Update procedure](docs/UPDATING.md) · [Validation scope](docs/VALIDATION.md)

Original code and analysis are MIT licensed; third-party materials retain their own rights. This is independent research with no Tesla affiliation or endorsement.
