# Economics and the shared investment gate

## Policy and its basis

Both lenses apply the same gate. Base project payback must be at most 6 years from first spend; conservative payback at most 8 years. Base NPV must be nonnegative at a chosen 10% real, unlevered, pre-income-tax hurdle, and conservative stabilized cash after the replacement allowance must be positive. The model includes 10 operating years after construction, with no residual value, grant or real growth. A shorter enforceable site or service term must shorten the horizon before admission.

A historical [NREL EV technology-cost study](https://docs.nlr.gov/docs/fy18osti/70485.pdf), printed page 27/PDF page 39, used a 10-year EVSE lifetime and acknowledged uncertainty in actual life. This is a planning precedent, not a current V4 warranty or an observed replacement interval. The [Joint Office return white paper](https://driveelectric.gov/files/evse-rate-of-return.pdf) explains why costs, utilization, capital and pricing context affect returns; it does not prescribe a universal minimum investor return. NEVI return ceilings are not minimum merchant-investor hurdles.

Ten equal annual cash receipts discounted at 10% have a present-value factor of 6.1446. Without construction or ramp, a 6-year cash recovery leaves modest headroom against that factor. Construction, ramp and replacement costs can erase it, so the separate NPV test is mandatory. The 8-year downside cap retains recovery before the end of the assumed asset horizon; downside NPV is displayed but is not required to clear 10%. Neither 6/8 years nor 10% is an empirical industry standard. They are transparent risk-policy choices and are not changed to obtain a desired number of winners.

Constant 2026-dollar cash flows use a real discount rate, following the consistency principle discussed in [CBO's discount-rate guidance](https://www.cbo.gov/publication/60815). Ten percent is not a CBO-prescribed rate. Financing, income taxes, tax shields and terminal value are excluded; this is not equity IRR or a lender underwriting model.

## Per-property scenarios and input fitness

Every property has three calculations. The only consistently available regional price input is the [EIA January–August 2026 state commercial mean](https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_b), released October 23, 2026. It is a revenue/sales average, **not a charging tariff**. EIA's [technical notes](https://www.eia.gov/electricity/monthly/pdf/technotes.pdf) explain that revenues include demand, fixed and other charges. Adding a separate demand fee to this proxy would double count part of the bill.

Conservative/base/optimistic electricity factors are 2×/1.5×/1× that mean. These are chosen sensitivities, not observed EV load-shape adjustments or statistical bounds. Actual low-utilization bills can exceed them. [Tesla's October 2026 utility-cost explanation](https://www.tesla.com/learn/higher-supercharger-site-utilization-increases-profits) explains why effective cost changes with usage and peak demand. This proxy cannot substitute for a complete tariff and measured load profile.

Other inputs are explicit assumptions:

| Input | Conservative | Base | Optimistic |
|---|---:|---:|---:|
| Stalls | 8 | 8 | 8 |
| Stabilized sessions/stall/calendar day | 2 | 4 | 8 |
| Delivered kWh/session | 22 | 40 | 40 |
| Realized price/delivered kWh | $0.40 | $0.45 | $0.50 |
| Service fee/delivered kWh | $0.10 | $0.10 | $0.10 |
| Grid-to-delivered loss | 12% | 8% | 5% |
| Initial capex | $1,269,000 | $1,128,000 | $1,034,000 |
| Fixed cost per month, including construction | $5,000 | $2,500 | $1,500 |
| Construction years | 1.5 | 1 | 0.75 |
| First operating-year volume vs. stabilized | 50% | 75% | 100% |
| Annual uncovered replacement allowance / capex | 2% | 1.5% | 1% |

The capital anchor comes from one [Tesla public-estimator illustration](https://www.tesla.com/supercharger-for-business/get) inspected on October 30: $500,000 hardware plus eight times $55,000 installation, or $940,000 before this model's 35%/20%/10% unpriced-cost allowances. This was not a quote for any candidate. Allowances do not prove that land, grid, tax or construction scope is fully priced. The actual project can cost more than the conservative case.

The service fee is also an illustration. [Tesla's business-model explanation](https://www.tesla.com/learn/supercharger-for-business) separates owner and Tesla responsibilities; included equipment maintenance and payment processing must not be charged again. The additional replacement allowance is a hypothetical deduction for uncovered site assets, not a second Tesla service charge or a verified replacement schedule. Its scope must be reconciled to the contract.

No local session volume, capture rate or realized price has been measured. City registration totals are not converted into sales. Same-state properties share results intentionally. A uniquely precise output for each parcel would manufacture information that the evidence does not contain.

## Calculation

```text
Q = stalls × stabilized sessions/day × 365 × kWh/session
Grid = Q / (1-loss)
Revenue = Q × realized price
Energy = Grid × all-in proxy rate
Service = Q × service fee
Fixed = monthly fixed cost × 12
Steady operating cash = Revenue - Energy - Service - Fixed
Replacement allowance = capex × annual allowance fraction
Steady free cash = Steady operating cash - Replacement allowance
Construction holding cost = monthly pre-opening cost × 12 × construction years
```

Capex is paid at time zero. Construction holding cost is assumed paid through construction and discounted at its midpoint. There is no charging revenue before commissioning. First-year volume and variable costs use the ramp factor; fixed costs and replacement allowance are not ramped down. Each operating year's free cash is discounted at its year-end time after construction.

Project payback is the first nonnegative cumulative cash balance, with uniform within-year cash accrual for interpolation. It includes initial capital, construction holding costs, ramp and the annual replacement allowance. If no recovery occurs within the modeled construction plus 10 operating years, the product shows no recovery within horizon. `capex / steady operating cash` remains only a simple calculator diagnostic; it does not determine qualification.

The inverse base-volume diagnostic changes only sessions while keeping the other base inputs fixed. It ignores physical throughput constraints and does not predict feasible demand. A nonpositive unit contribution has no finite demand solution. Very high required volume is a reason to investigate the assumptions, not evidence that such volume is achievable.

## Evidence overrides attractive scenarios

Even a numeric pass cannot qualify a property without verified site control, connection/capacity/tariff, scoped total costs, measured demand and attainable price, permits/access, and enforceable commercial terms. A signed lease must cover construction, recovery and an acceptable buffer; renewal is not assumed. Unknown evidence remains pending. An evidenced fatal conflict or a fully evidenced economic failure is excluded. Hypothetical failure alone is not proof of actual parcel insolvency.

The network lens uses the same third-party charging-revenue model as requested. It does not claim to know Tesla's internal installation costs, strategic network value or cost of capital. An ordinary host-rent arrangement is a different business model.

## Incentives and tariff examples

The [IRS current 30C page](https://www.irs.gov/credits-deductions/alternative-fuel-vehicle-refueling-property-credit) ends the stated in-service eligibility period on June 30, 2026. A new October 2026 project cannot simply assume the old credit. No incentive is counted here.

[Clark Public Utilities](https://www.clarkpublicutilities.com/about-cpu/public-documents/current-electric-water-rates/) and [Snohomish PUD's 2026 tariff](https://www.snopud.com/wp-content/uploads/2025/10/ElectricRates_2026.pdf) show why parcel eligibility, fixed charges, demand, minimum bills, resale permission and expiration matter. They were inspected as tariff examples, not assigned as verified service contracts to the candidates.

## Round-two refinement

The conservative 22 kWh/session is an **analogue-informed assumption**, based on the [DOE EVWATTS paid-session summary](https://www.energy.gov/cmei/vehicles/articles/fotw-1319-december-4-2023-ev-charging-paid-dc-fast-charging-stations-average). Its self-selected June 2020–June 2023 sample excludes Tesla Superchargers. It does not establish local demand or a statistical downside percentile. Base/optimistic 40 kWh remain assumptions. Keeping the old 40 kWh conservative case is possible from `data/previous-results-v0.2.json`; the app displays the change.

[EVgo's filed Q2 2026 results](https://www.sec.gov/Archives/edgar/data/1821159/000182115926000017/exhibit991evgoearningsrele.htm) report 276 kWh/stall/day for its owned public network. The product compares the mathematically required base sales volume with that observation. It is neither a maximum nor evidence that a candidate can capture that volume. It is not calculated by dividing network energy by the combined ending stall count, which includes different ownership models.

The [Joint Office 2022–2023 report, Appendix G.3](https://driveelectric.gov/files/nevi-annual-report-2022-2023.pdf) modeled $149,667 per port, including five-year maintenance and fixed station costs allocated over six ports. This historical model is a cost-scope cross-check, not an observed invoice, current V4 quote or a new capex input. Grants are not treated as total installed cost. No complete candidate EPC or connection quote was obtained.

`data/tariff-sensitivities.json` adds six-property, three-case **published-charge subtotal** tests. Clark Schedule 134 uses energy, monthly fixed and demand charges. Snohomish uses current standard Schedule 20 with the first 100 kW demand exemption, a daily fixed charge and connected-load minimum, rather than extending the temporary 20EV discount beyond 2030. NHEC uses the IND delivery-plus-supply schedule and its first 60 kW demand exemption.

These tests assume 1,200/500/300 kW billed peaks, uniform monthly energy and current rates held constant in real terms. Peaks are not measured loads or utility capacity offers. Snohomish's assumed connected load remains 1,200 kW in all cases. A lower billed peak does not shrink the connected-load minimum. The annual minimum formula assumes a uniform monthly load profile; it is not a replay of interval meter data.

Unresolved riders, taxes, power-factor penalties, resale permission, meter eligibility and connection scope are disclosed beside each result. Subtotals do not replace the main EIA screening scenarios or clear an evidence gate. Neither scenario family is a full utility bill or investment forecast. Complex PGE/PEC/Cowlitz tariff boundaries and expired/proposed rates remain evidence findings where an honest bill cannot be reconstructed from available load data.

`model.js` computes these charges without adding demand to the all-in EIA proxy. `scripts/verify-economics.py` independently recomputes all 111 main scenarios and 18 tariff sensitivities.
