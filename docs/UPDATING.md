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

Maintain bilingual source-linked records in `data/hypotheses.json`; preserve original financial/evidence decisions. Run `node scripts/build-hypotheses.mjs` after earlier builders, then rebuild both briefs and run `node scripts/version-assets.mjs` and `npm run check`. Earlier builders stamp their historical version, so the hypothesis builder must run last for this release. Do not upgrade vendor projections, same-region duplicates or author-selected haircuts to measured local forecasts.
