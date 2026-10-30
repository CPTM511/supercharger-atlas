# Local evidence and conditional investment tests

As of 2026-10-30 · v0.8.0

New local evidence narrows identity, utility and traffic questions. Retail analogues support testing demand, while current demand charges weaken generic low-electricity-cost cases. No site is investment-ready.

The dated tariff cases retain v0.7 gross costs, prices, ramp, losses and stress factors; they replace the supplier all-in electricity proxy with published charges and explicit peak assumptions. They are incomplete-bill sensitivities, not full-cost forecasts.

No probability of investment success is estimated. All transfer cases assume every reference session is billable; observed paid mix and session energy are missing. Tariff taxes, reactive power, bespoke fees and control costs are unresolved, so positive results are conditional and can overstate returns. Existing investment admission is unchanged.

## What changed for the five properties

### H-E-B at Ronald Reagan Blvd

19348 Ronald W. Reagan Blvd, Georgetown, TX 78628

Parcel uncertainty reduced; electricity underwriting becomes more demanding. First priority remains conditional on a costed load profile.

- **direct:** WCAD parcel R600635 matches the retailer address; appraisal owner is BAR W MARKETPLACE LLC. County and official retailer records support Georgetown 78628; a City of Austin record uses Leander 78641 for the same store #774. **Limit:** This reduces the postal-alias concern, not legal title, charging rights or validation of the vendor map point. [TX8-WCAD](https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query?where=QuickRefID%3D%27R600635%27&outFields=%2A&returnGeometry=false&f=json) · [TX8-WCAD-POINT](https://services1.arcgis.com/Xff0bbfp6vwIWmlU/ArcGIS/rest/services/WCAD_Tax_Parcels/FeatureServer/0/query?geometry=-97.82446%2C30.63307&geometryType=esriGeometryPoint&inSR=4326&outFields=%2A&returnGeometry=false&f=json) · [TX8-HEB-RON](https://www.heb.com/heb-store/tx/georgetown/h-e-b-at-ronald-reagan-blvd-774) · [TX8-ALIAS](https://services.austintexas.gov/edims/document.cfm?id=432989)
- **direct:** TxDOT station 246HP1483 on Ronald Reagan reports 23,799 AADT for 2025, versus 25,021 in 2024; the point is about 348 m from the retained site coordinate. **Limit:** Roadway volume is not EV traffic, store visits or paid sessions. Do not add adjacent SH29 counts or assume demand growth. [V8-TRAFFIC-246HP1483](https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_AADT_Annuals_(Public_View)/FeatureServer/0/query?where=TRFC_STATN_ID%3D%27246HP1483%27&outFields=%2A&returnGeometry=true&outSR=4326&f=json)
- **inference:** PUCT published polygons indicate PEC at the retained point. Current PEC Large Power rates include monthly peak charges and transmission charges that change after a new account establishes its summer 4CP. **Limit:** PUCT labels its boundaries unofficial. Meter identity, capacity/date, municipal fees, tax and the actual interval profile remain unverified; a 600 kW model parameter is not an offered service. [TX8-heb-ronaldreagan-COOP_DIST](https://services6.arcgis.com/N6Lzvtb46cpxThhu/arcgis/rest/services/COOP_DIST/FeatureServer/310/query?geometry=-97.82446%2C30.63307&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=%2A&returnGeometry=false&f=json) · [TX8-PEC](https://mypec.com/large-power-rates/) · [TX8-PEC-TARIFF](https://mypec.com/wp-content/uploads/tariff/Tariff_and_Business_Rules.pdf)
- **direct:** PEC connection rules can require applicant-funded feeder, transformer and substation work. The economic-development discount requires at least 2.2 million qualifying kWh and agreements; the four-post vendor reference is below that energy threshold. **Limit:** No complete connection or EPC quote, award or lease was obtained. No discount is booked. Store-meter aggregation cannot be assumed. [TX8-PEC-TARIFF](https://mypec.com/wp-content/uploads/tariff/Tariff_and_Business_Rules.pdf)

**Next evidence:** Obtain a landlord-approved charger boundary, PEC meter and service design, 15-minute load/4CP assumptions, and a complete cost ledger before ordering a study.

### WinCo Foods Puyallup

9518 176th Street East, Puyallup, WA 98375

Retail hypothesis retained; ordinary high-demand tariff weakens the case. Prioritize tariff eligibility and peak design before treating this as a high-priority build.

- **direct:** The facility point intersects parcel 6025500020 in a public historical GIS copy; a 2021 county hearing names WINCO FOODS LLC and the same parcel. **Limit:** 2018 GIS edit and 2020/2021 assessment records are historical leads, not current title, parking control or a charger layout. [v8-soundtransit-parcel](https://rtamaps2.soundtransit.org/arcgis/rest/services/PAR_RegionalWM/MapServer/1) · [v8-pierce-winco-2021](https://www.piercecountywa.gov/DocumentCenter/View/105799/Clerks-Record-of-Hearings-for-April-22-2021)
- **inference:** Pierce County provider polygons return PSE at the Ecology facility point. October 2026 Schedule 26 secondary charges include $0.121947/grid-kWh, $436.32/month, plus winter/summer demand of $17.47/$10.26 per kW-month. **Limit:** Mapped provider is conditional. Municipal taxes, reactive charges and special service terms are not priced; peak kW is assumed, not reserved capacity. [v8-wa-ecology-facility](https://apps.ecology.wa.gov/facilitysite/FacilitySite/FacilitySiteReport/99997721) · [v8-pierce-utility](https://services2.arcgis.com/1UvBaQ5y1ubjUPmd/ArcGIS/rest/services/Electric_Service_Providers/FeatureServer/0) · [v8-pse-summary-oct2026](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/summ_elec_prices_2026_10_01.pdf?rev=f1d6671ff2354c20be285ff3fc3cba8e) · [v8-pse-sch26](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/Electric/elec_sch_026.pdf?rev=82644dff99c14632a145d10c81e69524&sc_lang=en)
- **direct:** WSDOT returns 2025 AADT of 43,000 on nearby SR161 MP20.26–21.34 and 44,000 at counter MP21.69, about 1.1 km northeast of the facility. **Limit:** These overlap and must not be added. They are corridor traffic, not entrance counts or EV demand. Layer description says 2023 while returned features explicitly say 2025; unverified county 28,500-year alignment is excluded. [v8-wsdot-counts](https://data.wsdot.wa.gov/arcgis/rest/services/Shared/TrafficData/FeatureServer/0) · [v8-wsdot-sections](https://data.wsdot.wa.gov/arcgis/rest/services/Shared/TrafficData/FeatureServer/1)
- **direct:** Schedule 558 current eligibility includes charging stations but participation is capped at 35 delivery points or 3 MW. PSE customer-owned public charging support advertises up to 50% and $40,000/port, subject to program and eligible-cost limits. **Limit:** Enrollment headroom, owner authority, design/equipment acceptance and written offer are unverified. Four-port $160,000 is only a conditional ceiling; separate upgrade allowances are not automatically additive. Payment follows installation and evidence. [v8-pse-sch558](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/Electric/elec_sch_558.pdf?rev=87772680b92f4babbc63d0f5cabb225f&sc_lang=en) · [v8-pse-public](https://www.pse.com/en/pages/electric-cars/Public-Charging)

**Next evidence:** Confirm the actual PSE account and separately metered charging design, then compare ordinary service with an accepted Schedule 558 plan using interval loads and the cost of controls.

### Elgin H-E-B

1080 West Hwy 290, Elgin, TX 78621

Road context is clearer, but utility overlap and parcel-level access still prevent a site-specific bill. Retain as conditional second priority.

- **direct:** TxDOT US290 station 11H88 reports 40,613 AADT in 2025, versus 47,046 in 2024, about 274 m from the retained point. **Limit:** Annualized road traffic is not charging demand; no locally matched EV share or capture rate was obtained. [V8-TRAFFIC-11H88](https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/TxDOT_AADT_Annuals_(Public_View)/FeatureServer/0/query?where=TRFC_STATN_ID%3D%2711H88%27&outFields=%2A&returnGeometry=true&outSR=4326&f=json)
- **inference:** PUCT polygons intersect both Bluebonnet and Oncor. Official H-E-B uses WEST while CapMetro lists the same #475 store and phone with EAST. **Limit:** Neither an electricity provider nor engineering-record identity is resolved. Do not transplant PEC rates or merge older East-labeled engineering costs. [TX8-heb-elgin-COOP_DIST](https://services6.arcgis.com/N6Lzvtb46cpxThhu/arcgis/rest/services/COOP_DIST/FeatureServer/310/query?geometry=-97.38423%2C30.34614&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=%2A&returnGeometry=false&f=json) · [TX8-heb-elgin-IOU](https://services6.arcgis.com/N6Lzvtb46cpxThhu/arcgis/rest/services/IOU/FeatureServer/300/query?geometry=-97.38423%2C30.34614&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=%2A&returnGeometry=false&f=json) · [TX8-HEB-ELGIN](https://www.heb.com/heb-store/tx/elgin/elgin-h-e-b-475) · [TX8-CAPMETRO](https://www.capmetro.org/retailers)
- **direct:** The preliminary US290 configuration retains signalized Lee Dildy/11th Street intersections and non-tolled frontage lanes; final schematic/environmental decision is only planned for early 2028. **Limit:** This does not establish the H-E-B driveway or right-of-way outcome. The large schematic could not be inspected in this pass; no parcel clearance is claimed. [TX8-ELGIN-ROAD](https://290extensionproject.com/project-configuration/) · [TX8-ELGIN-NOTICE](https://www.txdot.gov/projects/hearings-meetings/austin/2026/us290-from-sh130-to-east-of-sh95-south-092926.html) · [TX8-ELGIN-SCHEDULE](https://290extensionproject.com/openhouse/)

**Next evidence:** Resolve meter/provider and a parcel-level roadway overlay before commissioning a utility or EPC estimate.

### WinCo Foods Edmonds

21900 Highway 99, Edmonds, WA 98026

Expansion/redesign hypothesis unchanged. The newly checked published commercial rebate is Level 2, not evidence of DCFC funding.

- **direct:** Snohomish PUD commercial EV rebate page specifies qualifying Level 2 ENERGY STAR equipment. **Limit:** Do not book this as DCFC capital support. This does not prove that no other support exists; existing operator rights, reusable assets and spare capacity remain unresolved. [V8-SNOPUD-COMMERCIAL](https://www.snopud.com/save-energy/electric-vehicles/commercial/)

**Next evidence:** Obtain existing operator/host rights, as-built equipment and paid-energy records, then quote incremental work rather than a new full station.

### WinCo Foods Medford

251 E Barnett Rd, Medford, OR 97501

Recovery/redesign hypothesis retained. A conditional upgrade rebate route is clearer, but Tesla equipment eligibility is not established.

- **direct:** Pacific Power allows qualifying upgrades/expansions subject to prior funding. For eligible ≥150 kW ports the rebate is up to 75% of qualifying cost, capped at $30,000/port and normally $100,000/site. **Limit:** Four ports do not automatically earn $120,000. Larger amounts need preapproval; listed equipment/network and actual paid invoices are required. No affirmative Tesla V4 listing or award was established. [V8-PACIFIC-REBATE](https://www.pacificpower.net/savings-energy-choices/electric-vehicles/business-charger-rebates.html) · [V8-PACIFIC-ELIGIBLE](https://www.pacificpower.net/content/dam/pcorp/documents/en/pacificpower/savings-energy-choices/electric-vehicles/PacifiCorp_EPRI_Vetted_Product_List.pdf)

**Next evidence:** Resolve cancellation, asset/operator rights and eligible equipment before comparing a complete recovery quote with the new-build case.

## External references and transfer limits

### retail

A Q4 2025 study of 4,105 non-Tesla high-power stations reports median sessions of 42/site/day near grocery stores and 9 overall.

Reported analytics, not audited sales; Paren separately discloses proprietary session modeling, while this older cohort counting method is unpublished. Grocery sample size, port mix, paid fraction and kWh are unpublished; prevalence inconsistencies are excluded. Publishers share one dataset. [V8-RETAIL-REPORT](https://electricera.tech/the-state-of-retail-first-ev-charging-report) · [V8-PAREN-RETAIL](https://www.paren.app/blog/where-ev-drivers-charge-retail-location-and-performance) · [V8-PAREN-METHOD](https://www.paren.app/reports/us-ev-fast-charging-q2-2026)

### selected

Selected Publix Cambridge Square example reports median 59 sessions/site/day across five ports; retained AFDC data matches the five-port Atlanta address.

Selected successful comparator, not a local matched sample. Transferring its whole-site count onto four posts is a separate assumption, not measured per-port demand. [V8-RETAIL-REPORT](https://electricera.tech/the-state-of-retail-first-ev-charging-report) · [V8-CAMBRIDGE-OWNER](https://www.regencycenters.com/property/detail/133/Cambridge-Square)

### cost

Iowa DOT lists Tesla project budgets of $493,904 at Shelby and $624,920 at Lamoni separately from grants of $345,732.80 and $437,444.

2024 award-stage nominal budgets, not invoices or matching local four-post quotes. The program requires at least four concurrent 150 kW ports; exact design, excluded works and operating-cost allocation are unreconciled. No subsidy is transferred. [V8-IOWA-COST](https://iowadot.gov/transportation-development/local-systems/grant-programs/electric-vehicle-ev-plan/2024-awards)

### duration

A completed EVgo California retail-project report states that opening took more than two years. A two-year total construction sensitivity is now shown alongside the one-year base case.

A grantee report from another state, not the local connection schedule. Public report lists collected data fields but not a usable paid-demand/cost series. [V8-CEC-RETAIL](https://www.energy.ca.gov/sites/default/files/2025-09/CEC-600-2025-030.pdf)

## Dated tariff and demand tests

Four posts. The unchanged v0.7 three scenarios set gross capital at $634,500 / $564,000 / $517,000; demand at 70% / 100% / 120% of the vendor reference. Published utility components are stressed by +25% only in the conservative case. No grants enter the scenarios. Joint required energy solves both base and conservative rules with downside energy at 70% of the base; it is an optimistic subtotal boundary because unpriced charges remain.

9 / 42 / 59 are external reported station-session references, not local quantiles. Transfer to four posts at assumed 22 or 35 billable kWh/session; 100% of sessions are assumed paid. The 59-session source has five ports, so its four-post transfer assumes different throughput per post. Base cost and dated tariff are held fixed; these are alternatives, not the conservative/base/optimistic investment cases.

The utility fields below are modeled subtotals. Taxes, reactive charges, bespoke obligations and control costs are unresolved, so displayed cash and NPV can overstate returns. Holding dated rates constant is a sensitivity, not a rate guarantee. Gross design costs and replacement are preserved.

### H-E-B at Ronald Reagan Blvd — PEC · 600 kW monthly / 150 kW 4CP

Uniform energy across local clock hours is assumed (122 summer, 153 shoulder, 90 winter days), not measured. A full first operating year on new-account energy TCOS is a startup-calendar assumption; actual transition is January after the first 4CP summer. Later years hold the stated previous-summer 4CP and current rates constant. Sales/franchise taxes, bespoke charges and control costs are excluded. Lower 4CP requires feasible interval operations and may reduce sales. [TX8-PEC](https://mypec.com/large-power-rates/) · [TX8-PEC-TARIFF](https://mypec.com/wp-content/uploads/tariff/Tariff_and_Business_Rules.pdf)

Published components and scenario assumptions:

```json
{
  "uniformHourTou": 0.058683113698630135,
  "firstYearEnergyTcos": 0.020688,
  "peakKw": 600,
  "peakRate": 6.74,
  "established4cpKw": 150,
  "4cpRate": 6.11,
  "basicMonthly": 150
}
```

| Scenario | Delivered kWh/post/day | Annual utility subtotal, stabilized | Payback from first spend | NPV at 10% |
|---|---:|---:|---:|---:|
| conservative | 211.40 | $103,293 | Not recovered within 10 operating years | $-771,823 |
| base | 302.00 | $91,767 | 9.91 | $-221,144 |
| optimistic | 362.40 | $97,855 | 5.60 | $94,372 |

Joint base-demand boundary under fixed base/downside costs: **707.59 kWh/post/day**; downside volume is 70% of this. This is an optimistic subtotal boundary, not observed demand or a complete investment pass. The peak-power energy ceiling is only a necessary engineering bound, not queue/dispatch feasibility.

| External station-session reference/day | Assumed billable kWh/session | Derived kWh/post/day on four posts | Payback | NPV |
|---:|---:|---:|---:|---:|
| 9 | 22 | 49.50 | Not recovered within 10 operating years | $-891,743 |
| 9 | 35 | 78.75 | Not recovered within 10 operating years | $-814,059 |
| 42 | 22 | 231.00 | Not recovered within 10 operating years | $-409,708 |
| 42 | 35 | 367.50 | 7.13 | $-47,187 |
| 59 | 22 | 324.50 | 8.70 | $-161,388 |
| 59 | 35 | 516.25 | 4.67 | $347,869 |

Two-year construction stress, other base inputs fixed: payback 11.08; NPV $-263,730.

### H-E-B at Ronald Reagan Blvd — PEC · 600 kW monthly / 600 kW 4CP

Uniform energy across local clock hours is assumed (122 summer, 153 shoulder, 90 winter days), not measured. A full first operating year on new-account energy TCOS is a startup-calendar assumption; actual transition is January after the first 4CP summer. Later years hold the stated previous-summer 4CP and current rates constant. Sales/franchise taxes, bespoke charges and control costs are excluded. Lower 4CP requires feasible interval operations and may reduce sales. [TX8-PEC](https://mypec.com/large-power-rates/) · [TX8-PEC-TARIFF](https://mypec.com/wp-content/uploads/tariff/Tariff_and_Business_Rules.pdf)

Published components and scenario assumptions:

```json
{
  "uniformHourTou": 0.058683113698630135,
  "firstYearEnergyTcos": 0.020688,
  "peakKw": 600,
  "peakRate": 6.74,
  "established4cpKw": 600,
  "4cpRate": 6.11,
  "basicMonthly": 150
}
```

| Scenario | Delivered kWh/post/day | Annual utility subtotal, stabilized | Payback from first spend | NPV at 10% |
|---|---:|---:|---:|---:|
| conservative | 211.40 | $144,536 | Not recovered within 10 operating years | $-958,983 |
| base | 302.00 | $124,761 | Not recovered within 10 operating years | $-378,180 |
| optimistic | 362.40 | $130,849 | 7.30 | $-66,450 |

Joint base-demand boundary under fixed base/downside costs: **822.76 kWh/post/day**; downside volume is 70% of this. This is an optimistic subtotal boundary, not observed demand or a complete investment pass. The peak-power energy ceiling is only a necessary engineering bound, not queue/dispatch feasibility.

| External station-session reference/day | Assumed billable kWh/session | Derived kWh/post/day on four posts | Payback | NPV |
|---:|---:|---:|---:|---:|
| 9 | 22 | 49.50 | Not recovered within 10 operating years | $-1,048,778 |
| 9 | 35 | 78.75 | Not recovered within 10 operating years | $-971,095 |
| 42 | 22 | 231.00 | Not recovered within 10 operating years | $-566,744 |
| 42 | 35 | 367.50 | 9.62 | $-204,223 |
| 59 | 22 | 324.50 | Not recovered within 10 operating years | $-318,423 |
| 59 | 35 | 516.25 | 5.29 | $190,833 |

Two-year construction stress, other base inputs fixed: payback Not recovered within 10 operating years; NPV $-406,489.

### WinCo Foods Puyallup — PSE 26 secondary · 600 kW monthly peak

Same 600 kW billed peak in every month; six winter and six summer months. Conditional secondary service above 350 kW. Excludes reactive energy, municipal tax and special contracts; not a full bill or connection offer. Rates held constant, not a ten-year guarantee. [v8-pse-summary-oct2026](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/summ_elec_prices_2026_10_01.pdf?rev=f1d6671ff2354c20be285ff3fc3cba8e) · [v8-pse-sch26](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/Electric/elec_sch_026.pdf?rev=82644dff99c14632a145d10c81e69524&sc_lang=en)

Published components and scenario assumptions:

```json
{
  "energy": 0.121947,
  "basicMonthly": 436.32,
  "winterDemand": 17.47,
  "summerDemand": 10.26,
  "peakKw": 600
}
```

| Scenario | Delivered kWh/post/day | Annual utility subtotal, stabilized | Payback from first spend | NPV at 10% |
|---|---:|---:|---:|---:|
| conservative | 208.60 | $185,947 | Not recovered within 10 operating years | $-1,246,455 |
| base | 298.00 | $167,483 | Not recovered within 10 operating years | $-699,616 |
| optimistic | 357.60 | $179,967 | Not recovered within 10 operating years | $-449,948 |

Joint base-demand boundary under fixed base/downside costs: **1364.47 kWh/post/day**; downside volume is 70% of this. This is an optimistic subtotal boundary, not observed demand or a complete investment pass. The peak-power energy ceiling is only a necessary engineering bound, not queue/dispatch feasibility.

| External station-session reference/day | Assumed billable kWh/session | Derived kWh/post/day on four posts | Payback | NPV |
|---:|---:|---:|---:|---:|
| 9 | 22 | 49.50 | Not recovered within 10 operating years | $-1,180,770 |
| 9 | 35 | 78.75 | Not recovered within 10 operating years | $-1,124,135 |
| 42 | 22 | 231.00 | Not recovered within 10 operating years | $-829,343 |
| 42 | 35 | 367.50 | Not recovered within 10 operating years | $-565,047 |
| 59 | 22 | 324.50 | Not recovered within 10 operating years | $-648,305 |
| 59 | 35 | 516.25 | Not recovered within 10 operating years | $-277,032 |

Two-year construction stress, other base inputs fixed: payback Not recovered within 10 operating years; NPV $-698,704.

Unawarded capital sensitivity only: $160,000 received at the end of the first operating year, after gross costs are paid; eligibility requires at least twice this amount of qualifying cost, a compatible design and an actual offer. At vendor volume: payback Not recovered within 10 operating years, NPV $-567,384. At the 42-session/35-kWh transfer: payback Not recovered within 10 operating years, NPV $-432,816. Booked award remains $0; no grid-upgrade allowance is stacked and no conservative pass is inferred.

### WinCo Foods Puyallup — PSE 558 trial · 200 kW peak / 600 kW off-peak

Conditional demand-only RG3 enrollment, not approved. Two separate monthly demand maxima are charged. Holding peak hours (16:00–21:00 except holidays) to 200 kW while retaining sales requires a costed control/queue design. Control costs and lost sessions are excluded. Normalized demand rate is only the stated component sum divided by 600, not a published tariff rate. [v8-pse-summary-oct2026](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/summ_elec_prices_2026_10_01.pdf?rev=f1d6671ff2354c20be285ff3fc3cba8e) · [v8-pse-sch558](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/Electric/elec_sch_558.pdf?rev=87772680b92f4babbc63d0f5cabb225f&sc_lang=en) · [v8-pse-public](https://www.pse.com/en/pages/electric-cars/Public-Charging)

Published components and scenario assumptions:

```json
{
  "energy": 0.04874,
  "basicMonthly": 287.69,
  "peakRate": 16.85,
  "offPeakRate": 5.07,
  "peakKw": 200,
  "offPeakKw": 600
}
```

| Scenario | Delivered kWh/post/day | Annual utility subtotal, stabilized | Payback from first spend | NPV at 10% |
|---|---:|---:|---:|---:|
| conservative | 208.60 | $122,325 | Not recovered within 10 operating years | $-920,521 |
| base | 298.00 | $105,344 | Not recovered within 10 operating years | $-360,250 |
| optimistic | 357.60 | $110,334 | 7.10 | $-51,598 |

Joint base-demand boundary under fixed base/downside costs: **800.33 kWh/post/day**; downside volume is 70% of this. This is an optimistic subtotal boundary, not observed demand or a complete investment pass. The peak-power energy ceiling is only a necessary engineering bound, not queue/dispatch feasibility.

| External station-session reference/day | Assumed billable kWh/session | Derived kWh/post/day on four posts | Payback | NPV |
|---:|---:|---:|---:|---:|
| 9 | 22 | 49.50 | Not recovered within 10 operating years | $-1,009,495 |
| 9 | 35 | 78.75 | Not recovered within 10 operating years | $-933,075 |
| 42 | 22 | 231.00 | Not recovered within 10 operating years | $-535,298 |
| 42 | 35 | 367.50 | 8.99 | $-178,670 |
| 59 | 22 | 324.50 | Not recovered within 10 operating years | $-291,015 |
| 59 | 35 | 516.25 | 5.26 | $209,962 |

Two-year construction stress, other base inputs fixed: payback Not recovered within 10 operating years; NPV $-390,189.

Unawarded capital sensitivity only: $160,000 received at the end of the first operating year, after gross costs are paid; eligibility requires at least twice this amount of qualifying cost, a compatible design and an actual offer. At vendor volume: payback Not recovered within 10 operating years, NPV $-228,019. At the 42-session/35-kWh transfer: payback 6.93, NPV $-46,439. Booked award remains $0; no grid-upgrade allowance is stacked and no conservative pass is inferred.

## Decision boundary

No current enforceable site rights, calibrated local paid-demand forecast, complete design-matched EPC quote or firm connection capacity/date was obtained. None of the five advances to investment-ready status. A reported retail-session benchmark is useful for a testable hypothesis; it is not a customer order or a statistical success probability. Existing 37 investment decisions remain pending, not rejected.

Ronald Reagan remains the first identity-resolved investigation, subject to actual peak/4CP and total cost. Puyallup should first prove an affordable tariff/peak design or stop the proposed high-peak scope. Elgin requires utility and final access resolution. Edmonds and Medford remain incremental redesign/recovery investigations.

The prior vendor-only figures remain accessible as historical reference; this local review supersedes their investigation narrative where evidence conflicts. No outreach, applications, fees or private-background publication occurred.
