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

## Rebuild the PDF

The optional publishing dependency is Python `reportlab` (the interactive app requires none). Run `python3 scripts/build-brief.py --font /path/to/licensed-chinese-font.ttf`. The script uses a local Unicode font if available, otherwise a standard Chinese CID font. Confirm exactly two pages and inspect rendered glyphs and table/footer boundaries before publishing `downloads/charge-atlas-brief.pdf`. Raw documents and other PDFs remain excluded from Git.

The PDF embeds the SHA-256 of its candidate input. CI rejects a stale PDF after candidate data changes; rebuild it as part of the same reviewed update.
