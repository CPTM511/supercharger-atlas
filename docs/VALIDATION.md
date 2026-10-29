# Release verification — 2026-10-30

The checks below cover the frozen research product, not commercial feasibility.

- Reconciled complete AFDC downloads with reported totals: 15,882 public E/DCFC records and 643 P/T records. Truncated initial downloads were discarded. The raw-response hashes and query scope are recorded in `data/provenance.json`.
- Validated 37 unique properties, two complete Top 10 rankings, 111 resolvable source IDs, geographic coordinate bounds, and required evidence/risk fields. Recomputed every candidate's nearest Tesla E-record distance and 10-mile DCFC-record count against the frozen government snapshot.
- Reviewed property identity and conflicting supply evidence. Corrected a north/south address mismatch, existing/temporarily unavailable charging assets, an existing permit, and an overlap between two Austin-area candidates. Property coordinates remain approximate where stated.
- Eight automated tests cover energy/cost reconciliation, break-even math, non-positive unit contribution, zero-volume costs, duplicate demand charges, invalid inputs, distance units and CSV formula escaping. Numeric longitude values remain numeric in CSV.
- Browser checks covered both Top 10 views, full 37-property view, search/no-result handling, map and nearby supply, comparison, scenario presets, the all-in electricity toggle and zero-volume behavior. A 390-pixel viewport showed no horizontal page overflow. No browser console warnings/errors were observed in the final smoke check.
- A browser CSV download contained 10 investor records and all 20 expected columns. This exposed numeric longitude escaping, which was corrected by using the tested shared CSV serializer.
- Native printing could not be fully inspected through the embedded browser. The primary summary action therefore links to a fixed PDF instead. The generated PDF was checked to contain exactly two pages, extracted for missing text, and visually inspected for glyph, clipping, table and footer problems. Print CSS remains an optional browser convenience, not the validated download path.
- Reviewed the public file set for private-document formats, local user paths, personal contact patterns and credential patterns. The public PDF was generated only from public candidate data, with a generic author field. Git commits use GitHub's noreply identity.

No utility capacity, host consent, installed cost, actual utilization, realized sales price or investment return has been verified. Tests cannot fill these gaps. Source URLs and station status can change after the snapshot date.
