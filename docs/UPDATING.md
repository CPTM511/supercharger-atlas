# Updating the product

Updates are explicit, reviewed changes. This release creates no recurring scraping or research schedule and requires no paid API.

1. Record the decision-changing trigger: new station/permit, corrected address, new local demand evidence, tariff change, quote or site constraint.
2. Reopen the original source and record its date, what changed and the strongest conflicting evidence. If an API is used, obtain its data under the provider's terms; keep raw downloads and credentials outside the repository.
3. For a new complete AFDC E response, normalize to a proposed file:

   ```sh
   python3 scripts/normalize-afdc.py /path/to/afdc.json --output /tmp/proposed-supply.json
   ```

4. Review query scope, completeness and record changes. Replace `data/supply-snapshot.json` only after review. Recompute metrics into a proposed candidate file:

   ```sh
   node scripts/enrich-supply.mjs /tmp/proposed-candidates.json
   ```

5. Independently refresh P/T records and community pipeline near affected properties. The metric script intentionally does not claim these are current or silently change ranks. Update nearby records, source ledger and provenance. Recheck live source URLs that previously failed.
6. Check every changed coordinate against the written address, city, directional prefix and ZIP. A successful geocode is insufficient if it matched the wrong side of a road.
7. Reconsider both rankings and counterarguments. Compare nearby candidate properties for overlapping catchments before proposing multiple builds. Explain promotions, demotions and removals in `CHANGELOG.md`.
8. Run `npm run check`, browser-test affected interactions, and rebuild and visually inspect the two-page brief if its contents changed. Review staged files and complete Git history for unintended files and local paths, credentials or personal material before pushing.

When evidence is unchanged, do not repeat full research solely to create a new timestamp. Keep an honest as-of date and distinguish source freshness from local calculation time.

## Next evidence that would materially improve a decision

- Real driving routes, access-side restrictions and matched DOT traffic counts.
- Site-specific charging demand, including overnight home-charging access and competing station utilization.
- Owner consent, leased stalls and exclusivity constraints.
- Utility service territory confirmation, load profile, capacity, construction schedule and complete tariff eligibility.
- Written equipment, installation and lease terms; flood/drainage, accessibility and permit review.

These are research and project-development gates. They are not claimed completed by the software tests.

## Recompute economics

Update `data/economics-policy.json` only when evidence or an explicitly approved policy changes. Keep every unmeasured input labeled as an assumption. Run `node scripts/rebuild-economics.mjs` followed by `node scripts/rebuild-diligence-economics.mjs`; it recomputes all three cases and evidence decisions, and clears ranks. Only a separately reviewed qualified subset may be ranked afterward. Never change the thresholds to fill ten positions. Run `python3 scripts/verify-economics.py` for an independent arithmetic check.

## Rebuild the PDF

The optional publishing dependency is Python `reportlab` (the interactive app requires none). Run `python3 scripts/build-brief.py --lang en --font /path/to/licensed-chinese-font.ttf` and repeat with `--lang zh`. The script uses a local Unicode font if available, otherwise a standard Chinese CID font. Confirm exactly two pages and inspect rendered glyphs and table/footer boundaries before publishing both files in `downloads/`. Raw documents and other PDFs remain excluded from Git.

The PDF embeds the SHA-256 of its candidate input. CI rejects a stale PDF after candidate data changes; rebuild it as part of the same reviewed update.

## Claim-level diligence

Maintain `data/evidence-round-2.json` with one record per property and exact source URLs, retrieval/source dates, evidence class, claim scope, limitations and unsuccessful attempts. A failed fetch is not evidence that a record or permit does not exist. Do not translate tax ownership into a signed charger lease or a city service-area map into spare electrical capacity. Synchronize each candidate's `diligence` record and run `node scripts/build-reassessment.mjs` to regenerate the reassessment report. Retain round-one records and prior results as historical evidence.

After editing CSS or JavaScript, run `node scripts/version-assets.mjs` before validation and publication. It versions first-party stylesheet, app and nested module URLs by content hash, avoiding stale mixed releases in returning browsers.


## Availability and focused feasibility review

Preserve `data/previous-results-v0.3.2.json` as the immutable comparison baseline. Investigate every existing candidate's demand/cost/grid availability before selecting a bounded focused subset. Selection is an information-acquisition choice, not an investment rank. Keep raw downloads and any owner/operator confidential records outside this public repository.

With reviewed bilingual availability/deep-investigation records in a private directory, run `node scripts/build-feasibility.mjs /path/to/reviewed-records`, then `node scripts/build-feasibility-report.mjs`. This explicit import requires all 37 scans and exactly the selected 10 deep records. Rebuild the main and tariff calculations before importing the new round; importing adds inverse conditions without overwriting evidence with assumptions. Never run an old economic rebuild alone after import: it resets the derived inverse fields.

Run `python3 scripts/verify-inverse.py` for independent deadline-balance and discounted-cash equations. It checks null boundaries as well as numeric results. Source fitness and actual acquisition remain manual research tasks; numeric agreement does not prove data truth. Review unqualified-to-qualified changes explicitly, and preserve both policy and private-data boundaries.

## Evidence recovery follow-up

Maintain `data/acquisition-round-4.json` as the reviewed claim-level source. Distinguish new, historical/different-scope, inaccessible and unsubmitted records. Keep the previous availability round intact; carried-forward properties must not imply fresh investigation.

Run `node scripts/build-acquisition.mjs` to synchronize acquisition records, new sources, version and the English recovery report. Existing source metadata is preserved; explicitly reconcile corrections in both ledgers. This importer refuses a decision change or financial-input use; future fully evidenced input changes require a separately reviewed model update. Rebuild both briefs, version assets, run checks and inspect bilingual/mobile behavior. Raw documents and unsent requests stay outside the public repository.

## Support and ownership review

Maintain `data/support-review.json` as the round-five source, mechanism and applicability ledger. Program presence is not parcel eligibility or an award; preserve unavailable windows, equipment requirements, credit ownership, tax capacity and stacking limits. After an explicitly reviewed change run `node scripts/build-support.mjs`, regenerate both briefs, then `node scripts/version-assets.mjs` and `npm run check`. The support builder preserves original scenarios and qualification. Changing an actual investment input requires separate evidence and review, not a sensitivity control. Do not subtract an assumed reimbursement from gross asset cost or count temporary operating support forever.

## Field hypotheses

Maintain bilingual source-linked records in `data/hypotheses.json`; preserve original financial/evidence decisions. Run `node scripts/build-hypotheses.mjs` after earlier builders. For v0.8, follow it with the local-validation builder below before rebuilding briefs or assets; earlier builders stamp historical versions. Do not upgrade vendor projections, same-region duplicates or author-selected haircuts to measured local forecasts.

## Local evidence and conditional tariff tests

Maintain `data/local-validation.json` with bilingual findings, exact source dates and locations, provider/account limits, transfer assumptions and acquisition requirements. Keep source facts separate from inferred territory, hypothetical peak loads and incomplete utility bills. A reported session is not automatically a paid order; a service polygon is not a capacity commitment. Preserve the original scenarios and all formal admission decisions unless new, separately reviewed evidence justifies a change.

The current financial scope is two addresses and four profiles, not five newly measured site forecasts. Reconcile every tariff component with its actual schedule and meter class. For PEC, preserve the transition from new-account energy TCOS to previous-summer 4CP billing. For the PSE trial, verify enrollment and model both demand maxima. Price control equipment, lost sales, taxes and other omitted charges before presenting a complete bill or project forecast. Do not extend temporary or unawarded benefits indefinitely.

Run the derived builders in this order after reviewing source and model changes:

```sh
node scripts/build-hypotheses.mjs
node scripts/build-local-validation.mjs
node scripts/build-static-snapshot.mjs
# Rebuild and visually inspect both PDFs using the commands above.
node scripts/version-assets.mjs
npm run check
```

The local-validation builder regenerates candidate review records, local tariff calculations and `docs/LOCAL-VALIDATION.md`, and stamps v0.8. The static-snapshot builder must keep the product page's non-JavaScript summary synchronized with the current version, counts and investigation decisions. Verify that static text is readable before JavaScript loads and that the interactive English/Chinese views agree after loading. Do not let a loading placeholder imply that the qualified count or current conclusion is unknown.

Independently recompute the changed cash flows, tariff transition, demand-transfer units and joint base/downside boundaries. Review positive cases against omitted charges, control feasibility, complete design costs and remaining evidence gates. Run only applicable additional checks; do not claim source verification, field work or successful deployment from software tests. Review the final staged diff for private documents, raw research, local paths and unsupported statements before the authorized publication.


## Focused Ronald Reagan review

Maintain bilingual source and scope records in `data/ronald-validation.json`. After earlier builders, run `node scripts/build-ronald-validation.mjs`, then `node scripts/build-static-snapshot.mjs`, rebuild both briefs, version assets and run `npm run check`. The focused builder stamps the current v0.9 version; do not run a historical builder afterward without rebuilding the focused layer.

Preserve operator configuration versus paid-transaction distinctions, five-port versus four-post normalization, price-volume compatibility, annual 4CP averaging, separate monthly maxima and incomplete-cost boundaries. The continuous-cap energy check is not a queue simulation. Do not replace a missing operating series with check-in counts, spot availability or metropolitan modeled utilization. Cost registrations are not all-in invoices. Update qualified status only through the unchanged evidence and numeric gates after a separately reviewed evidence package.


## Current ten-location follow-up priorities

Maintain the approved public-only `data/followup-priorities.json` (EN/ZH). Network and third-party ranks are permutations within the same selected ten, not qualified investment ranks. Every record needs a project scope, rationale, next checks, downgrade/stop condition and resolvable retained sources. Never copy private acquisition plans or inquiry letters into the repository.

Run `node scripts/build-followup.mjs` after any earlier data builders, then rebuild both PDF languages, `node scripts/build-static-snapshot.mjs`, `node scripts/version-assets.mjs`, and `npm run check`. The builder generates `docs/FOLLOWUP-PRIORITIES.md` and embeds the records without changing financial inputs, evidence admission or qualified ranks. Compare these fields against the pre-edit data separately. Check all three table orders, the two explorer lenses, historical-filter exclusivity, a recovery-site detail, translation, export and the public-file boundary before release. Publication requires the user's applicable authorization.


## Homepage summary and interface-only releases

`home-summary.js` renders two compact sections before Site explorer. Headline financial values and ranks are taken from canonical retained data; short editorial reasons must remain consistent with the full site records. Keep round-by-round overview material in GitHub documentation rather than restoring it above the explorer. Per-site evidence and all later product functions remain available.

For a presentation-only change, do not rerun research or economic builders or refresh the research as-of date. Update the package/interface release, rebuild the static snapshot and asset hashes, and run the required checks. Leave data files, prior research reports, model code and the downloadable briefs unchanged unless the user's scope explicitly includes them. The footer continues to identify the research snapshot. Compare the Site explorer-to-end HTML and existing styles/functions against the baseline, then verify English/Chinese summary rendering, table orders, detail navigation and the retained interactive flows before publication.
