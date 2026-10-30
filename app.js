import { t, localized, localField, getLanguage, setLanguage, applyTranslations } from './i18n.js';

const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; } };
const formatNumber = (value, digits = 1) => Number.isFinite(value) ? new Intl.NumberFormat(getLanguage() === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: digits }).format(value) : t('unknown');
const formatMoney = (value) => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : t('cannotCalculate');
const field = (object, key) => localField(object, key);
const listField = (object, key) => { const value = field(object, key); return Array.isArray(value) ? value.map(localized) : []; };
const lensField = (candidate, key, mode = state.mode) => localized(field(candidate, key)?.[mode]);
const hasCoordinates = (candidate) => typeof candidate.lat === 'number' && Number.isFinite(candidate.lat) && typeof candidate.lon === 'number' && Number.isFinite(candidate.lon) && Math.abs(candidate.lat) <= 90 && Math.abs(candidate.lon) <= 180;
const mapURL = (candidate) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${candidate.name} ${candidate.address} ${candidate.city} ${candidate.state}`)}`;
const state = { mode: 'network', data: null, sources: new Map(), selected: null, comparison: new Set(), map: null, markers: new Map(), timer: null, economics: null, defaultScenario: null, previousDemand: null, supplyLayer: null, neighborhood: false, preset: 'base', loadError: false, mapError: false };
const scenarios = ['conservative', 'base', 'optimistic'];
const inputDefinitions = [
  { key: 'stalls', unitKey: 'unit_stalls', min: 1, max: 200, step: 1 },
  { key: 'sessionsPerStallDay', unitKey: 'unit_sessions', min: 0, step: 0.1 },
  { key: 'kwhPerSession', unit: 'kWh', min: 0.1, step: 0.1 },
  { key: 'retailPerKwh', unit: '$/kWh', min: 0, step: 0.01 },
  { key: 'energyPerKwh', unit: '$/kWh', min: 0, step: 0.01 },
  { key: 'lossFraction', unit: '%', min: 0, max: 99, step: 0.1, scale: 100 },
  { key: 'servicePerKwh', unit: '$/kWh', min: 0, step: 0.01 },
  { key: 'demandPerKwMonth', unit: '$/kW', min: 0, step: 0.5 },
  { key: 'billedPeakKw', unit: 'kW', min: 0, step: 10 },
  { key: 'fixedMonthly', unitKey: 'unit_month', min: 0, step: 100 },
  { key: 'capex', unit: '$', min: 1, step: 1 }
];
const sourceLink = (source, label) => { const title = label || localized(source?.title) || source?.id || t('sourcePending'); const url = safeURL(source?.url); return url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(title)} ↗</a>` : escapeHTML(title); };
const sourceRefs = (ids = []) => ids.map((id) => sourceLink(state.sources.get(id), String(id))).join(' · ');
// A legacy rank or a favorable scenario must never promote an unverified site.
const decision = (candidate) => {
  const value = candidate?.review?.decision;
  if (value === 'rejected') return 'rejected';
  if (value === 'qualified' && candidate?.economics?.hurdle?.passed === true) return 'qualified';
  return 'pending';
};
const getRank = (candidate, mode = state.mode) => { const rank = candidate?.ranks?.[mode]; return decision(candidate) === 'qualified' && Number.isInteger(rank) && rank >= 1 ? rank : null; };
const previousRank = (candidate, mode = state.mode) => { const rank = candidate?.previousRanks?.[mode]; return Number.isInteger(rank) && rank >= 1 ? rank : null; };
const badge = (status) => `<span class="badge status-${escapeHTML(status)}">${t(status)}</span>`;
const statusCounts = () => (state.data?.candidates || []).reduce((counts, candidate) => { counts[decision(candidate)]++; return counts; }, { qualified: 0, pending: 0, rejected: 0 });
const priorityLabel = (candidate, mode = state.mode) => getRank(candidate, mode) ? t('qualifiedRank', { rank: getRank(candidate, mode) }) : previousRank(candidate, mode) ? t('historicalPriority', { rank: previousRank(candidate, mode) }) : t('historicalUnranked');
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(state.timer); state.timer = setTimeout(() => { $('toast').hidden = true; }, 3500); }
function visibleCandidates() {
  if (!state.data) return [];
  const query = $('search').value.trim().toLocaleLowerCase();
  const region = $('state-filter').value;
  const pool = $('status-filter').value;
  return state.data.candidates.filter((candidate) => (pool === 'all' || decision(candidate) === pool) && (!region || candidate.state === region) && (!query || [candidate.name, candidate.address, candidate.city, candidate.state, field(candidate, 'type')].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)))).sort((a, b) => (getRank(a) ?? previousRank(a) ?? 999) - (getRank(b) ?? previousRank(b) ?? 999) || String(a.name).localeCompare(String(b.name)));
}
function initializeMap() {
  if (!window.L) { state.mapError = true; $('map-fallback').hidden = false; $('map-status').textContent = t('mapFallback'); return; }
  try {
    state.map = window.L.map('map', { scrollWheelZoom: false, zoomControl: true }).setView([38.8, -98.5], 4);
    state.supplyLayer = window.L.layerGroup().addTo(state.map);
    const tiles = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(state.map);
    tiles.on('tileerror', () => { $('map-status').textContent = t('mapTileError'); });
    if (window.ResizeObserver) new ResizeObserver(() => state.map?.invalidateSize()).observe($('map'));
  } catch { state.mapError = true; $('map-fallback').hidden = false; $('map-status').textContent = t('mapFallback'); }
}
function clearNeighborhood() {
  state.supplyLayer?.clearLayers(); state.neighborhood = false;
  $('map-supply-legend').hidden = true; $('map-nearby').setAttribute('aria-pressed', 'false');
  $('map-status').textContent = t(state.mapError ? 'mapFallback' : 'mapCaveat');
}
function fitMap() {
  if (!state.map) return;
  clearNeighborhood();
  const coordinates = visibleCandidates().filter(hasCoordinates).map((candidate) => [candidate.lat, candidate.lon]);
  if (coordinates.length) state.map.fitBounds(coordinates, { padding: [35, 35], maxZoom: coordinates.length === 1 ? 11 : 6 });
  else state.map.setView([38.8, -98.5], 4);
}
function markerIcon(candidate) { return window.L.divIcon({ className: 'atlas-marker', html: `<div class="atlas-pin ${state.mode === 'investor' ? 'investor' : ''} ${state.selected === candidate.id ? 'active' : ''}"><span>${getRank(candidate) ?? '·'}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 30] }); }
function supplyStatus(site) {
  const raw = String(site.status || '');
  const code = raw.toUpperCase().replace(/^AFDC\s+/, '').split(/\s|\//)[0];
  const keys = { OPEN: 'open', E: 'open', OPEN_LIMITED: 'supplyOpenLimited', OPEN_LIMITED_HOURS: 'supplyOpenLimited', EXPANDING: 'open', PLAN: 'supplyPlanned', PLANNED: 'supplyPlanned', VOTING: 'supplyVoting', PERMIT: 'supplyPermit', P: 'supplyPlanned', CONSTRUCTION: 'supplyConstruction', T: 'supplyTemporary', CLOSED: 'supplyClosed' };
  return `${keys[code] ? t(keys[code]) : localized(field(site, 'status')) || t('supplyUnknown')}${site.sourceType === 'community' ? ` · ${t('supplyCommunity')}` : site.sourceType === 'afdc' ? ` · ${t('supplyAFDC')}` : ''}`;
}
function showNeighborhood() {
  if (!state.map) return;
  const candidate = state.data?.candidates.find((item) => item.id === state.selected);
  if (!candidate || !hasCoordinates(candidate)) return;
  const supplies = (candidate.nearby || []).filter(hasCoordinates);
  if (!supplies.length) { toast(t('noNearbyCoordinates')); return; }
  state.supplyLayer.clearLayers(); state.neighborhood = true;
  for (const site of supplies) {
    const status = String(site.status || '').toUpperCase().replace(/^AFDC\s+/, '').split(/\s|\//)[0];
    const open = ['OPEN', 'OPEN_LIMITED', 'OPEN_LIMITED_HOURS', 'EXPANDING', 'E'].includes(status);
    const uncertain = ['PLAN', 'PLANNED', 'VOTING'].includes(status);
    const color = open ? '#687a83' : ['CONSTRUCTION', 'PERMIT', 'P'].includes(status) || uncertain ? '#bb7e17' : '#9a7770';
    const marker = window.L.circleMarker([site.lat, site.lon], { radius: uncertain ? 7 : 6, color, weight: 2, fillColor: color, fillOpacity: uncertain ? 0 : 0.7 }).addTo(state.supplyLayer);
    const tooltip = document.createElement('span'); tooltip.textContent = `${site.name} · ${supplyStatus(site)} · ${formatNumber(site.distanceMiles)} mi`;
    marker.bindTooltip(tooltip, { direction: 'top' });
  }
  $('map-supply-legend').hidden = false; $('map-nearby').setAttribute('aria-pressed', 'true');
  state.map.fitBounds([[candidate.lat, candidate.lon], ...supplies.map((site) => [site.lat, site.lon])], { padding: [40, 40], maxZoom: 12 });
  $('map-status').textContent = t('mapNeighborhood');
}
function renderMap() {
  if (!state.map) return;
  for (const marker of state.markers.values()) marker.remove();
  state.markers.clear();
  for (const candidate of visibleCandidates().filter(hasCoordinates)) {
    const marker = window.L.marker([candidate.lat, candidate.lon], { icon: markerIcon(candidate), title: `${candidate.name}, ${candidate.city}`, keyboard: true, alt: candidate.name }).addTo(state.map);
    const tooltip = document.createElement('span'); tooltip.textContent = `${candidate.name} · ${t(decision(candidate))}`;
    marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -27] }); marker.on('click', () => selectCandidate(candidate.id, true)); state.markers.set(candidate.id, marker);
  }
  fitMap();
}
function renderList() {
  const candidates = visibleCandidates();
  const previousScroll = $('candidate-list').scrollTop;
  $('result-count').textContent = t('results', { count: candidates.length, pool: t($('status-filter').value === 'all' ? 'allPools' : $('status-filter').value) });
  if (!candidates.length) { $('candidate-list').innerHTML = `<div class="empty-state">${t($('status-filter').value === 'qualified' ? 'noQualified' : 'noMatches')}</div>`; return; }
  $('candidate-list').innerHTML = candidates.map((candidate) => `<div class="candidate-row ${state.selected === candidate.id ? 'selected' : ''}" data-candidate-id="${escapeHTML(candidate.id)}"><div class="candidate-rank">${getRank(candidate) ? String(getRank(candidate)).padStart(2, '0') : '—'}</div><div><button type="button" class="candidate-select" data-select="${escapeHTML(candidate.id)}" aria-pressed="${state.selected === candidate.id}">${escapeHTML(candidate.name)}</button><p class="candidate-location">${escapeHTML(candidate.city)}, ${escapeHTML(candidate.state)}${hasCoordinates(candidate) ? '' : ` · ${t('coordinatePending')}`}</p><p class="candidate-brief">${escapeHTML(lensField(candidate, 'thesis') || lensField(candidate, 'rankRationale') || t('noThesis'))}</p><p class="historical-priority">${escapeHTML(priorityLabel(candidate))}</p><div class="candidate-meta">${badge(decision(candidate))}<label class="compare-check"><input type="checkbox" data-compare="${escapeHTML(candidate.id)}" ${state.comparison.has(candidate.id) ? 'checked' : ''} aria-label="${escapeHTML(t('compareAria', { name: candidate.name }))}">${t('compare')}</label></div></div></div>`).join('');
  $('candidate-list').scrollTop = previousScroll;
}
function selectCandidate(id, fromMap = false) {
  const candidate = state.data?.candidates.find((item) => item.id === id); if (!candidate) return;
  state.selected = id;
  for (const row of $('candidate-list').querySelectorAll('.candidate-row')) { const active = row.dataset.candidateId === id; row.classList.toggle('selected', active); row.querySelector('.candidate-select')?.setAttribute('aria-pressed', String(active)); }
  for (const [markerId, marker] of state.markers) { const match = state.data.candidates.find((item) => item.id === markerId); marker.setIcon(markerIcon(match)); marker.setZIndexOffset(markerId === id ? 1000 : 0); }
  if (state.map && hasCoordinates(candidate) && !fromMap) state.map.panTo([candidate.lat, candidate.lon], { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  renderDetail(candidate); if (state.neighborhood) showNeighborhood();
  if (fromMap) Array.from($('candidate-list').querySelectorAll('.candidate-row')).find((node) => node.dataset.candidateId === id)?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function renderReview(candidate) {
  const review = candidate.review;
  const checks = review?.checks || [];
  return `<section class="site-review" aria-labelledby="review-heading"><div class="detail-section-heading"><h4 id="review-heading">${t(review?.round === 0 ? 'carriedReviewTitle' : 'reviewTitle')}</h4>${badge(decision(candidate))}</div><p class="small">${t('reviewIntro')}</p>${review?.reason ? `<p class="review-reason">${escapeHTML(localized(review.reason))}</p>` : ''}${review?.reviewedAt ? `<p class="small muted">${t('reviewedAt')} ${escapeHTML(review.reviewedAt)}</p>` : ''}${checks.length ? `<div class="table-scroll"><table class="review-table"><thead><tr><th scope="col">${t('check')}</th><th scope="col">${t('status')}</th><th scope="col">${t('finding')}</th><th scope="col">${t('evidenceLinks')}</th></tr></thead><tbody>${checks.map((check) => `<tr><th scope="row">${escapeHTML(localized(check.label) || check.category)}</th><td>${badge(['verified', 'conflict', 'unknown', 'unavailable'].includes(check.status) ? check.status : 'unknown')}</td><td>${escapeHTML(localized(check.finding))}</td><td>${sourceRefs(check.sourceIds) || '—'}</td></tr>`).join('')}</tbody></table></div>` : `<p class="small">${t('noReview')}</p>`}</section>`;
}
function inputLabel(key) { const value = t(`input_${key}`); return value.startsWith('input_') ? key.replace(/([a-z])([A-Z])/g, '$1 $2') : value; }
function inputValue(key, value) {
  if (value == null) return t('unknown');
  if (key === 'tariffMode') return t(value === 'fully_burdened' ? 'fullyBurdened' : 'energyOnly');
  if (['lossFraction', 'discountRate', 'annualSustainingCapexFraction', 'sustainingCapexFraction', 'firstYearRamp', 'rampYear1Fraction', 'rampYear2Fraction'].includes(key)) return `${formatNumber(value * 100, 1)}%`;
  if (['fixedMonthly', 'preOpeningMonthly'].includes(key)) return `${formatMoney(value)} ${t('perMonth')}`;
  if (['capex', 'annualSustainingCapex'].includes(key)) return formatMoney(value);
  if (['retailPerKwh', 'energyPerKwh', 'servicePerKwh'].includes(key)) return `$${formatNumber(value, 3)}/kWh`;
  if (key === 'demandPerKwMonth') return `$${formatNumber(value, 2)}/kW`;
  if (key === 'kwhPerSession') return `${formatNumber(value)} kWh`;
  if (key === 'billedPeakKw') return `${formatNumber(value)} kW`;
  if (typeof value === 'object') return Array.isArray(value) ? value.map((item) => formatNumber(item, 2)).join(' / ') : escapeHTML(localized(value));
  return typeof value === 'number' ? formatNumber(value, 2) : localized(value);
}
const outputRows = [
  { key: 'preOpeningHoldingCost', label: 'preOpeningHoldingCost', format: formatMoney },
  { key: 'annualKwh', label: 'annualEnergy', format: (v) => Number.isFinite(v) ? `${formatNumber(v, 0)} kWh` : t('unknown') },
  { key: 'revenue', label: 'annualRevenue', format: formatMoney },
  { key: 'energyCost', label: 'annualEnergyCost', format: formatMoney },
  { key: 'serviceCost', label: 'serviceCost', format: formatMoney },
  { key: 'demandCost', label: 'annualDemand', format: formatMoney },
  { key: 'fixedCost', label: 'annualFixedCost', format: formatMoney },
  { key: 'operatingCash', label: 'annualCash', format: formatMoney },
  { key: 'annualSustainingCapex', label: 'sustainingCapex', format: formatMoney },
  { key: 'stabilizedFreeCash', label: 'stabilizedFreeCash', format: formatMoney },
  { key: 'breakEvenSessionsPerStallDay', label: 'breakeven', format: (v) => Number.isFinite(v) ? `${formatNumber(v, 2)} ${t('sessionsUnit')}` : t('noBreakeven') },
  { key: 'projectPaybackYears', label: 'projectPayback', format: (v) => Number.isFinite(v) ? `${formatNumber(v, 1)} ${t('years')}` : t('projectNoPayback') },
  { key: 'npv', label: 'npv', format: formatMoney },
  { key: 'requiredSessionsForBaseGate', label: 'requiredSessions', baseOnly: true, format: (v) => Number.isFinite(v) ? `${formatNumber(v, 2)} ${t('sessionsUnit')}` : t('noFiniteBaseVolume') }
];
function renderSiteEconomics(candidate) {
  const economics = candidate.economics;
  if (!economics?.scenarios) return `<section class="site-economics"><h4 class="detail-subheading">${t('siteEconomics')}</h4><p class="small">${t('noEconomics')}</p></section>`;
  const available = scenarios.filter((key) => economics.scenarios[key]);
  const keys = [...new Set(available.flatMap((key) => Object.keys(economics.scenarios[key].inputs || {})))];
  const row = (label, getValue, className = '') => `<tr class="${className}"><th scope="row">${escapeHTML(label)}</th>${scenarios.map((scenario) => `<td>${economics.scenarios[scenario] ? getValue(economics.scenarios[scenario], scenario) : t('scenarioUnavailable')}</td>`).join('')}</tr>`;
  const outputs = outputRows.filter((row) => available.some((key) => row.key in (economics.scenarios[key].outputs || {})));
  const assumptions = economics.assumptions || [];
  const hurdle = economics.hurdle;
  return `<section class="site-economics" aria-labelledby="site-economics-heading"><div class="detail-section-heading"><h4 id="site-economics-heading">${t('siteEconomics')}</h4><span class="badge badge-assumption">${t('assumption')}</span></div><p class="small">${t('siteEconomicsIntro')}</p><p class="scenario-basis">${t('siteScenarioBasis')}</p>${economics.note ? `<p class="small">${escapeHTML(localized(economics.note))}</p>` : ''}<div class="table-scroll"><table class="site-economics-table"><caption class="sr-only">${t('siteEconomics')} · ${escapeHTML(candidate.name)} · ${t('moneyUSD')}</caption><thead><tr><th scope="col">${t('scenarioMetric')}</th>${scenarios.map((key) => `<th scope="col">${t(key)}</th>`).join('')}</tr></thead><tbody><tr class="table-group"><th colspan="4">${t('inputGroup')}</th></tr>${keys.map((key) => row(inputLabel(key), (scenario) => escapeHTML(inputValue(key, scenario.inputs?.[key])))).join('')}<tr class="table-group"><th colspan="4">${t('outputGroup')}</th></tr>${outputs.map((definition) => row(t(definition.label), (scenario, scenarioKey) => { if (definition.baseOnly && scenarioKey !== 'base') return '—'; const value = scenario.outputs?.[definition.key] ?? (definition.baseOnly ? economics.requiredSessionsForBaseGate : undefined); return `<span class="${typeof value === 'number' && value < 0 ? 'negative' : ''}">${definition.format(value)}</span>`; }, ['projectPaybackYears', 'npv', 'stabilizedFreeCash'].includes(definition.key) ? 'key-output' : '')).join('')}</tbody></table></div><p class="small muted">${t('projectPaybackNote')}</p><p class="small muted base-volume-note">${t('baseVolumeNote')}</p>${hurdle ? `<div class="hurdle-result ${hurdle.passed ? 'scenario-pass' : 'scenario-fail'}"><strong>${t(hurdle.passed ? 'scenarioGatePass' : 'scenarioGateFail')}</strong><p>${escapeHTML(localized(hurdle.reason))}</p>${state.data.policy?.description ? `<p>${escapeHTML(localized(state.data.policy.description))}</p><p>${sourceRefs(state.data.policy.sourceIds)}</p>` : ''}<small>${t('scenarioGateCaveat')}</small></div>` : ''}${assumptions.length ? `<details class="assumptions-details"><summary>${t('assumptionsTitle')} <span aria-hidden="true">＋</span></summary><div class="table-scroll"><table class="assumptions-table"><thead><tr><th scope="col">${t('check')}</th><th scope="col">${t('range')}</th><th scope="col">${t('basis')}</th></tr></thead><tbody>${assumptions.map((item) => `<tr><th scope="row">${escapeHTML(localized(item.label) || inputLabel(item.key))}</th><td>${escapeHTML(item.valueOrRange == null ? t('unknown') : localized(item.valueOrRange))}<br><span class="badge badge-${['fact', 'inference', 'assumption'].includes(item.kind) ? item.kind : 'unknown'}">${t(['fact', 'inference', 'assumption'].includes(item.kind) ? item.kind : 'unknown')}</span></td><td>${escapeHTML(localized(item.note))}${item.sourceIds?.length ? `<br>${sourceRefs(item.sourceIds)}` : ''}</td></tr>`).join('')}</tbody></table></div></details>` : ''}</section>`;
}
function renderDetail(candidate) {
  $('map-nearby').disabled = !hasCoordinates(candidate) || !(candidate.nearby || []).some(hasCoordinates);
  const metrics = candidate.metrics || {};
  const canonicalFacts = candidate.facts || [];
  const translatedFacts = getLanguage() === 'zh' && candidate.zh?.facts ? candidate.zh.facts : canonicalFacts;
  const facts = canonicalFacts.map((fact, index) => ({ ...fact, ...(typeof translatedFacts[index] === 'object' ? translatedFacts[index] : { claim: translatedFacts[index] || fact.claim }) }));
  const sourceIds = [...new Set([...(candidate.sourceIds || []), ...facts.flatMap((fact) => fact.sourceIds || []), ...(candidate.review?.checks || []).flatMap((check) => check.sourceIds || []), ...(candidate.economics?.assumptions || []).flatMap((item) => item.sourceIds || [])])];
  const factHTML = facts.map((fact) => { const kind = ['fact', 'inference', 'assumption'].includes(fact.kind) ? fact.kind : 'unknown'; return `<li><span class="badge badge-${kind}">${t(kind)}</span><div>${escapeHTML(localized(fact.claim))}${(fact.sourceIds || []).map((id) => { const source = state.sources.get(id); const url = safeURL(source?.url); return url ? `<a class="inline-source" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(localized(source.title))}">[${escapeHTML(id)}] ↗</a>` : ''; }).join('')}</div></li>`; }).join('');
  const list = (items, empty) => `<ul>${(items.length ? items : [empty]).map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
  const nearby = candidate.nearby?.length ? `<h4 class="detail-subheading">${t('nearbyHeading')}</h4><div class="table-scroll"><table class="nearby-table"><thead><tr><th scope="col">${t('site')}</th><th scope="col">${t('sourceStatus')}</th><th scope="col">${t('straightMiles')}</th><th scope="col">${t('stalls')}</th></tr></thead><tbody>${candidate.nearby.map((site) => `<tr><td>${sourceLink(site, site.name)}</td><td>${escapeHTML(supplyStatus(site))}</td><td>${formatNumber(site.distanceMiles)}</td><td>${formatNumber(site.stalls, 0)}</td></tr>`).join('')}</tbody></table></div>` : '';
  $('site-detail').innerHTML = `<div class="detail-topline"><p class="eyebrow">${t(state.mode === 'network' ? 'networkTag' : 'investorTag')}</p>${badge(decision(candidate))}</div><h3 class="detail-name">${escapeHTML(candidate.name)}</h3><p class="detail-address">${escapeHTML(candidate.address)}${candidate.address?.includes(candidate.city) ? '' : `, ${escapeHTML(candidate.city)}, ${escapeHTML(candidate.state)}`} <a href="${escapeHTML(mapURL(candidate))}" target="_blank" rel="noopener noreferrer">${t('openMap')}</a></p><p class="detail-thesis">${escapeHTML(lensField(candidate, 'thesis') || t('noThesis'))}</p><div class="history-note"><strong>${escapeHTML(priorityLabel(candidate))}</strong><span>${t('historicalNote')}</span></div><div class="detail-metrics"><div><span>${t('nearestOpen')}</span><strong>${formatNumber(metrics.nearestOpenMiles)}</strong><small>${Number.isFinite(metrics.nearestOpenMiles) ? 'mi' : ''}</small></div><div><span>${t('nearestPipeline')}</span><strong>${formatNumber(metrics.nearestPipelineMiles)}</strong><small>${Number.isFinite(metrics.nearestPipelineMiles) ? 'mi' : ''}</small></div><div><span>${t('localDCFC')}</span><strong>${formatNumber(metrics.dcfcWithin10Miles, 0)}</strong><small>${Number.isFinite(metrics.dcfcWithin10Miles) ? t('records') : ''}</small></div></div><p class="metric-note">${t('metricNote')} ${escapeHTML(field(candidate, 'coordinateQuality'))}</p>${renderReview(candidate)}${renderSiteEconomics(candidate)}${lensField(candidate, 'rankRationale') ? `<h4 class="detail-subheading">${t('researchRationale')}</h4><p class="small">${escapeHTML(lensField(candidate, 'rankRationale'))}</p>` : ''}<h4 class="detail-subheading">${t('evidence')}</h4><ul class="fact-list">${factHTML || `<li>${badge('unknown')}<div>${t('noFacts')}</div></li>`}</ul><div class="risk-block"><strong>${t('strongestCounter')}</strong><p>${escapeHTML(field(candidate, 'counterargument') || t('counterPending'))}</p></div><div class="detail-two-col"><div><h4 class="detail-subheading">${t('verifyNext')}</h4>${list(listField(candidate, 'unknowns'), t('defaultUnknowns'))}</div><div><h4 class="detail-subheading">${t('stopConditions')}</h4>${list(listField(candidate, 'killCriteria'), t('defaultStop'))}</div></div>${nearby}<div class="source-links"><h4>${t('sourceTime')}</h4>${sourceIds.map((id) => { const source = state.sources.get(id); return source ? `<div class="source-link">${sourceLink(source, `[${id}] ${localized(source.title)}`)}<span>${escapeHTML(source.publisher || '')}<br>${t('retrieved')} ${escapeHTML(source.retrievedDate || t('notRecorded'))}</span></div>` : `<div class="source-link"><span>${escapeHTML(t('sourceUnresolved', { id }))}</span></div>`; }).join('') || `<p class="small">${t('noSources')}</p>`}</div>`;
}
function refresh({ map = true } = {}) {
  const candidates = visibleCandidates();
  if (!candidates.some((candidate) => candidate.id === state.selected)) state.selected = candidates[0]?.id || null;
  renderList(); if (map) renderMap();
  const selected = state.data?.candidates.find((candidate) => candidate.id === state.selected);
  if (selected) renderDetail(selected); else { $('site-detail').innerHTML = `<div class="empty-state">${t($('status-filter').value === 'qualified' ? 'noQualified' : 'noMatches')}</div>`; $('map-nearby').disabled = true; }
  renderComparison();
}
function changeMode(mode) {
  state.mode = mode; state.selected = null;
  for (const button of document.querySelectorAll('[data-mode]')) { const active = button.dataset.mode === mode; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; }
  $('lens-panel').setAttribute('aria-labelledby', `lens-${mode}`); $('lens-description').textContent = t(`${mode}Description`); refresh();
}
function renderComparison() {
  const candidates = Array.from(state.comparison).map((id) => state.data?.candidates.find((candidate) => candidate.id === id)).filter(Boolean);
  $('compare-section').hidden = !candidates.length; if (!candidates.length) return;
  const row = (title, getValue) => `<tr><th scope="row">${title}</th>${candidates.map((candidate) => `<td>${getValue(candidate)}</td>`).join('')}</tr>`;
  const siteOutput = (candidate, key, formatter) => { const output = candidate.economics?.scenarios?.base?.outputs; return output ? formatter(output[key]) : t('unknown'); };
  $('compare-table').innerHTML = `<table class="comparison-table"><thead><tr><th scope="col">${t(`${state.mode}Short`)}</th>${candidates.map((candidate) => `<th scope="col"><button class="comparison-remove" data-remove="${escapeHTML(candidate.id)}" type="button" aria-label="${escapeHTML(t('remove', { name: candidate.name }))}">×</button>${escapeHTML(candidate.name)}<small>${escapeHTML(candidate.city)}, ${escapeHTML(candidate.state)}</small></th>`).join('')}</tr></thead><tbody>${row(t('currentQualification'), (candidate) => `${badge(decision(candidate))}<p>${escapeHTML(localized(candidate.review?.reason))}</p>`)}${row(t('historicalOrder'), (candidate) => `${t('networkShort')}: ${previousRank(candidate, 'network') ?? t('noRank')}<br>${t('investorShort')}: ${previousRank(candidate, 'investor') ?? t('noRank')}`)}${row(t('fullAddress'), (candidate) => `${escapeHTML(candidate.address)}<br><a href="${escapeHTML(mapURL(candidate))}" target="_blank" rel="noopener noreferrer">${t('openMap')}</a>`)}${row(t('thesis'), (candidate) => escapeHTML(lensField(candidate, 'thesis') || t('noThesis')))}${row(t('nearestOpen'), (candidate) => `${formatNumber(candidate.metrics?.nearestOpenMiles)}${Number.isFinite(candidate.metrics?.nearestOpenMiles) ? ` mi · ${t('straightLine')}` : ''}`)}${row(`${t('base')} · ${t('annualCash')}`, (candidate) => siteOutput(candidate, 'operatingCash', formatMoney))}${row(`${t('base')} · ${t('projectPayback')}`, (candidate) => siteOutput(candidate, 'projectPaybackYears', (value) => Number.isFinite(value) ? `${formatNumber(value, 1)} ${t('years')}` : t('projectNoPayback')))}${row(`${t('base')} · ${t('npv')}`, (candidate) => siteOutput(candidate, 'npv', formatMoney))}${row(t('strongestCounter'), (candidate) => escapeHTML(field(candidate, 'counterargument') || t('unknown')))}${row(t('verifyNext'), (candidate) => listField(candidate, 'unknowns').map(escapeHTML).join('<br>'))}${row(t('evidence'), (candidate) => sourceRefs(candidate.sourceIds))}</tbody></table><p class="small muted comparison-caveat">${t('siteScenarioBasis')} ${t('scenarioGateCaveat')}</p>`;
}
function toggleComparison(id, checked) {
  if (checked && state.comparison.size >= 3 && !state.comparison.has(id)) { toast(t('compareLimit')); renderList(); return; }
  if (checked) state.comparison.add(id); else state.comparison.delete(id); renderComparison();
}
async function exportCSV() {
  if (!state.data) return;
  try {
    const candidates = visibleCandidates();
    const inputKeys = [...new Set(candidates.flatMap((candidate) => scenarios.flatMap((scenario) => Object.keys(candidate.economics?.scenarios?.[scenario]?.inputs || {}))))];
    const availableOutputs = outputRows.filter((row) => candidates.some((candidate) => scenarios.some((scenario) => row.key in (candidate.economics?.scenarios?.[scenario]?.outputs || {}))));
    const columns = ['date', 'lens', 'currentQualification', 'decisionReason', 'qualifiedRankHeader', 'historicalOrder', 'site', 'fullAddress', 'city', 'state', 'latitude', 'longitude', 'coordinateQuality', 'type', 'thesis', 'strongestCounter', 'verifyNext', 'stopConditions', 'nearestOpen', 'nearestPipeline', 'localDCFC', 'evidenceLinks', 'siteScenarioBasis', 'baseVolumeAssumptionNote'].map((key) => t(key));
    for (const scenario of scenarios) columns.push(...inputKeys.map((key) => `${t(scenario)} · ${t('assumption')} · ${inputLabel(key)}`), ...availableOutputs.filter((definition) => !definition.baseOnly || scenario === 'base').map((definition) => `${t(scenario)} · ${t(definition.label)}`));
    const records = candidates.map((candidate) => {
      const record = [state.data.meta?.asOf || '', t(`${state.mode}Short`), t(decision(candidate)), localized(candidate.review?.reason), getRank(candidate) ?? '', previousRank(candidate) ?? '', candidate.name, candidate.address, candidate.city, candidate.state, candidate.lat ?? '', candidate.lon ?? '', field(candidate, 'coordinateQuality'), field(candidate, 'type'), lensField(candidate, 'thesis'), field(candidate, 'counterargument'), listField(candidate, 'unknowns').join(' | '), listField(candidate, 'killCriteria').join(' | '), candidate.metrics?.nearestOpenMiles ?? t('unknown'), candidate.metrics?.nearestPipelineMiles ?? t('unknown'), candidate.metrics?.dcfcWithin10Miles ?? t('unknown'), (candidate.sourceIds || []).map((id) => state.sources.get(id)?.url).filter(Boolean).join(' | '), t('siteScenarioBasis'), t('baseVolumeNote')];
      for (const scenario of scenarios) { const values = candidate.economics?.scenarios?.[scenario]; record.push(...inputKeys.map((key) => { const value = values?.inputs?.[key]; return key === 'tariffMode' && value ? t(value === 'fully_burdened' ? 'fullyBurdened' : 'energyOnly') : Array.isArray(value) ? value.join(' | ') : value ?? t('unknown'); }), ...availableOutputs.filter((definition) => !definition.baseOnly || scenario === 'base').map((definition) => values?.outputs?.[definition.key] ?? (definition.baseOnly ? candidate.economics?.requiredSessionsForBaseGate ?? t('noFiniteBaseVolume') : definition.key === 'projectPaybackYears' ? t('projectNoPayback') : t('unknown')))); }
      return record;
    });
    const { csvCell } = await import('./model.js');
    const csv = '\ufeff' + [columns, ...records].map((record) => record.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `charge-atlas-${state.mode}-${$('status-filter').value}-${getLanguage()}-${String(state.data.meta?.asOf || 'snapshot').slice(0, 10)}.csv`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast(t('exportSuccess', { count: records.length }));
  } catch { toast(t('exportError')); }
}
function renderPrintSummary() {
  if (!state.data) return;
  const counts = statusCounts();
  $('print-summary').innerHTML = ['network', 'investor'].map((mode, index) => {
    const candidates = [...state.data.candidates].filter((candidate) => previousRank(candidate, mode) !== null || getRank(candidate, mode) !== null).sort((a, b) => (getRank(a, mode) ?? previousRank(a, mode)) - (getRank(b, mode) ?? previousRank(b, mode))).slice(0, 10);
    return `<section class="print-page"><div class="print-head"><h1>CHARGE ATLAS / ${t(mode)}</h1><span>${escapeHTML(state.data.meta?.asOf)} · ${index + 1} / 2</span></div><p><strong>${t('qualificationSummary', counts)}</strong><br>${t('historicalNote')}</p><table class="print-table"><thead><tr><th>${t('historicalOrder')}</th><th>${t('site')} / ${t('fullAddress')}</th><th>${t('thesis')}</th><th>${t('currentQualification')}</th></tr></thead><tbody>${candidates.map((candidate) => `<tr><td>${previousRank(candidate, mode) ?? '—'}</td><td><strong>${escapeHTML(candidate.name)}</strong><small>${escapeHTML(candidate.address)}</small></td><td>${escapeHTML(lensField(candidate, 'thesis', mode))}<small>${escapeHTML((candidate.sourceIds || []).join(', '))}</small></td><td>${t(decision(candidate))}<small>${escapeHTML(localized(candidate.review?.reason))}</small></td></tr>`).join('')}</tbody></table><p class="print-footer">${t('printDisclaimer')} ${escapeHTML(state.data.meta?.version || '')}.</p></section>`;
  }).join('');
}
function populateStudyMetadata() {
  const { meta = {}, candidates, sources } = state.data;
  const counts = statusCounts();
  $('snapshot-date').textContent = meta.asOf || t('notRecorded'); $('pool-count').textContent = formatNumber(meta.poolCount ?? candidates.length, 0);
  $('network-count').textContent = candidates.filter((candidate) => getRank(candidate, 'network') !== null).length; $('investor-count').textContent = candidates.filter((candidate) => getRank(candidate, 'investor') !== null).length; $('source-count').textContent = sources.length;
  $('qualification-count').textContent = t('qualificationSummary', counts); $('qualification-explanation').textContent = `${t(counts.qualified ? 'qualificationSome' : 'qualificationZero')} ${Number.isInteger(meta.reviewedThisRound) && Number.isInteger(meta.carriedForward) ? t('reviewCoverage', { fresh: meta.reviewedThisRound, carried: meta.carriedForward }) : ''}`;
  $('footer-version').textContent = `${meta.version || ''} · ${meta.asOf || t('notRecorded')}`; $('ledger-count').textContent = t('ledgerCount', { count: sources.length });
  const region = $('state-filter'); const selectedRegion = region.value;
  region.innerHTML = `<option value="">${t('allStates')}</option>${[...new Set(candidates.map((candidate) => candidate.state).filter(Boolean))].sort().map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('')}`; region.value = selectedRegion;
  const limitations = listField(meta, 'limitations');
  $('limitations').innerHTML = `${field(meta, 'description') ? `<p>${escapeHTML(field(meta, 'description'))}</p>` : ''}<ul>${limitations.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
  const policy = state.data.policy || state.data.qualificationPolicy;
  $('qualification-policy').innerHTML = policy?.description ? `<h4>${t('policyTitle')}</h4><p>${escapeHTML(localized(policy.description))}</p>` : '';
  $('source-list').innerHTML = sources.map((source) => { const typeLabel = t(`source_${source.kind}`); return `<div class="source-record"><div class="source-record-id">${escapeHTML(source.id)}</div><div>${sourceLink(source)}<p>${escapeHTML(source.publisher || t('notRecorded'))} · ${t('published')} ${escapeHTML(source.publishedDate || t('unknown'))} · ${t('retrieved')} ${escapeHTML(source.retrievedDate || t('notRecorded'))} · ${escapeHTML(typeLabel.startsWith('source_') ? source.kind || t('unknown') : typeLabel)}</p>${field(source, 'notes') ? `<p><span class="source-note-label">${t('sourceNotesOriginal')}</span> ${escapeHTML(field(source, 'notes'))}</p>` : ''}</div></div>`; }).join('');
}
function markScenarioPreset(preset) {
  state.preset = preset;
  for (const button of document.querySelectorAll('[data-preset]')) button.setAttribute('aria-pressed', String(button.dataset.preset === preset));
  $('scenario-label').textContent = preset ? t('exampleLabel', { name: t(preset) }) : t('customLabel');
}
function applyPreset(preset) {
  if (!state.defaultScenario) return;
  const overrides = { conservative: { sessionsPerStallDay: 2, retailPerKwh: 0.40, energyPerKwh: 0.18 }, base: { sessionsPerStallDay: 4, retailPerKwh: 0.45, energyPerKwh: 0.14 }, optimistic: { sessionsPerStallDay: 8, retailPerKwh: 0.50, energyPerKwh: 0.10 } }[preset];
  if (!overrides) return;
  const values = { ...state.defaultScenario, ...overrides, billedPeakKw: 500, tariffMode: 'energy_only' }; $('tariff-mode').value = 'energy_only';
  for (const definition of inputDefinitions) { const element = $(`scenario-${definition.key}`); element.disabled = false; element.value = String(values[definition.key] * (definition.scale || 1)); }
  state.previousDemand = null; syncTariffMode(); markScenarioPreset(preset); updateEconomics();
}
function renderSensitivity(input) {
  const sessions = [2, 4, 6, 8], prices = [0.35, 0.45, 0.55];
  $('sensitivity-table').innerHTML = `<table class="sensitivity-table"><thead><tr><th scope="col">${t('input_sessionsPerStallDay')}</th>${prices.map((price) => `<th scope="col">$${price.toFixed(2)} / kWh</th>`).join('')}</tr></thead><tbody>${sessions.map((count) => `<tr><th scope="row">${t('presetSessions', { count })}</th>${prices.map((price) => { const result = state.economics({ ...input, sessionsPerStallDay: count, retailPerKwh: price }); return `<td class="${result.operatingCash < 0 ? 'negative' : 'positive'}">${formatMoney(result.operatingCash)}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  $('sensitivity-note').textContent = t(input.tariffMode === 'fully_burdened' ? 'sensitivityAllIn' : 'sensitivityNote');
}
function renderScenarioInputs(preserve = false) {
  const values = Object.fromEntries(inputDefinitions.map((definition) => [definition.key, preserve && $(`scenario-${definition.key}`) ? $(`scenario-${definition.key}`).value : String(Number(state.defaultScenario[definition.key]) * (definition.scale || 1))]));
  const disabled = $('scenario-demandPerKwMonth')?.disabled;
  $('scenario-inputs').innerHTML = inputDefinitions.map((definition) => `<label for="scenario-${definition.key}">${escapeHTML(inputLabel(definition.key))}<span class="input-unit"><input type="number" id="scenario-${definition.key}" name="${definition.key}" value="${escapeHTML(values[definition.key])}" min="${definition.min}" ${definition.max !== undefined ? `max="${definition.max}"` : ''} step="${definition.step}" required inputmode="decimal" ${disabled && ['demandPerKwMonth', 'billedPeakKw'].includes(definition.key) ? 'disabled' : ''}><span>${escapeHTML(definition.unitKey ? t(definition.unitKey) : definition.unit)}</span></span></label>`).join('');
}
function syncTariffMode() {
  if (!state.defaultScenario) return;
  const bundled = $('tariff-mode').value === 'fully_burdened', demand = $('scenario-demandPerKwMonth'), peak = $('scenario-billedPeakKw');
  if (bundled) { if (!demand.disabled) state.previousDemand = demand.value; demand.value = '0'; } else if (demand.disabled) demand.value = state.previousDemand ?? String(state.defaultScenario.demandPerKwMonth);
  demand.disabled = bundled; peak.disabled = bundled; $('tariff-note').textContent = t(bundled ? 'allInNote' : 'energyOnlyNote');
}
function updateEconomics() {
  if (!state.economics) return;
  const input = {};
  try {
    for (const definition of inputDefinitions) { const element = $(`scenario-${definition.key}`); if (!element.validity.valid || !Number.isFinite(element.valueAsNumber)) throw new Error(t('inputError', { label: inputLabel(definition.key) })); input[definition.key] = element.valueAsNumber / (definition.scale || 1); }
    input.tariffMode = $('tariff-mode').value; let output;
    try { output = state.economics(input); } catch { throw new Error(t('invalidResult')); }
    if (!Number.isFinite(output.operatingCash)) throw new Error(t('invalidResult'));
    $('scenario-error').hidden = true; $('cash-result').textContent = formatMoney(output.operatingCash); $('cash-result').style.color = output.operatingCash < 0 ? '#ffb29a' : '#f5c86c';
    $('breakeven-result').textContent = Number.isFinite(output.breakEvenSessionsPerStallDay) ? formatNumber(output.breakEvenSessionsPerStallDay, 2) : t('noBreakeven');
    $('payback-result').textContent = Number.isFinite(output.simplePaybackYears) && output.simplePaybackYears > 0 ? formatNumber(output.simplePaybackYears, 1) : t('noPayback');
    const rows = [['annualEnergy', `${formatNumber(output.annualKwh, 0)} kWh`, ''], ['annualRevenue', formatMoney(output.revenue), 'revenue'], [input.tariffMode === 'fully_burdened' ? 'bundledEnergyCost' : 'energyCost', formatMoney(output.energyCost), ''], ['serviceCost', formatMoney(output.serviceCost), ''], ['demandCost', formatMoney(output.demandCost), ''], ['fixedCost', formatMoney(output.fixedCost), '']];
    renderSensitivity(input); $('cost-breakdown').innerHTML = rows.map(([label, value, className]) => `<div class="cost-row ${className}"><span>${t(label)}</span><strong>${value}</strong></div>`).join('');
  } catch (error) { $('scenario-error').textContent = error.message || t('invalidResult'); $('scenario-error').hidden = false; $('cash-result').textContent = t('checkInputs'); $('breakeven-result').textContent = '—'; $('payback-result').textContent = '—'; $('cost-breakdown').innerHTML = ''; $('sensitivity-table').innerHTML = `<p class="empty-state">${t('sensitivityInvalid')}</p>`; }
}
async function initializeEconomics() {
  try {
    const module = await import('./model.js'); if (typeof module.calculateEconomics !== 'function' || !module.DEFAULT_SCENARIO) throw new Error();
    state.economics = module.calculateEconomics; state.defaultScenario = module.DEFAULT_SCENARIO; $('tariff-mode').value = state.defaultScenario.tariffMode || 'energy_only'; renderScenarioInputs(); syncTariffMode(); updateEconomics();
  } catch { $('scenario-error').textContent = t('calculatorUnavailable'); $('scenario-error').hidden = false; $('reset-scenario').disabled = true; }
}
function changeLanguage(language) {
  setLanguage(language); document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; document.title = t('pageTitle'); document.querySelector('meta[name="description"]').content = t('pageDescription'); applyTranslations();
  for (const button of document.querySelectorAll('[data-language]')) button.setAttribute('aria-pressed', String(button.dataset.language === language));
  for (const node of document.querySelectorAll('[data-preset-count]')) node.textContent = t('presetSessions', { count: node.dataset.presetCount });
  $('print-button').href = language === 'zh' ? './downloads/charge-atlas-brief-zh.pdf' : './downloads/charge-atlas-brief.pdf';
  $('lens-description').textContent = t(`${state.mode}Description`); markScenarioPreset(state.preset); $('toast').hidden = true;
  if (state.data) {
    populateStudyMetadata(); refresh({ map: false }); renderPrintSummary();
    for (const [id, marker] of state.markers) {
      const candidate = state.data.candidates.find((item) => item.id === id);
      const tooltip = document.createElement('span'); tooltip.textContent = `${candidate.name} · ${t(decision(candidate))}`; marker.setTooltipContent(tooltip);
    }
    if (state.neighborhood) showNeighborhood();
  }
  if (state.defaultScenario) { renderScenarioInputs(true); syncTariffMode(); updateEconomics(); }
  if (state.loadError) renderLoadError();
  if (state.mapError) $('map-status').textContent = t('mapFallback');
  if (state.map) { const zoomIn = document.querySelector('.leaflet-control-zoom-in'); const zoomOut = document.querySelector('.leaflet-control-zoom-out'); if (zoomIn) { zoomIn.title = t('zoomIn'); zoomIn.setAttribute('aria-label', t('zoomIn')); } if (zoomOut) { zoomOut.title = t('zoomOut'); zoomOut.setAttribute('aria-label', t('zoomOut')); } }
}
function renderLoadError() { $('data-error').textContent = t('dataError'); $('data-error').hidden = false; $('candidate-list').innerHTML = `<div class="empty-state">${t('noData')}</div>`; $('result-count').textContent = t('dataUnavailable'); $('csv-button').disabled = true; $('snapshot-date').textContent = t('snapshotUnavailable'); }
function attachEvents() {
  for (const button of document.querySelectorAll('[data-language]')) button.addEventListener('click', () => changeLanguage(button.dataset.language));
  for (const button of document.querySelectorAll('[data-mode]')) { button.addEventListener('click', () => changeMode(button.dataset.mode)); button.addEventListener('keydown', (event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const mode = event.key === 'Home' ? 'network' : event.key === 'End' ? 'investor' : state.mode === 'network' ? 'investor' : 'network'; changeMode(mode); $(`lens-${mode}`).focus(); } }); }
  $('search').addEventListener('input', () => refresh()); $('state-filter').addEventListener('change', () => refresh()); $('status-filter').addEventListener('change', () => refresh());
  $('candidate-list').addEventListener('click', (event) => { const button = event.target.closest('[data-select]'); if (button) selectCandidate(button.dataset.select); });
  $('candidate-list').addEventListener('change', (event) => { if (event.target.matches('[data-compare]')) toggleComparison(event.target.dataset.compare, event.target.checked); });
  $('compare-table').addEventListener('click', (event) => { const button = event.target.closest('[data-remove]'); if (button) { state.comparison.delete(button.dataset.remove); renderComparison(); renderList(); } });
  $('clear-comparison').addEventListener('click', () => { state.comparison.clear(); renderComparison(); renderList(); }); $('map-nearby').addEventListener('click', showNeighborhood); $('map-reset').addEventListener('click', fitMap); $('csv-button').addEventListener('click', exportCSV); window.addEventListener('beforeprint', renderPrintSummary);
  $('tariff-mode').addEventListener('change', () => { syncTariffMode(); markScenarioPreset(null); updateEconomics(); }); $('scenario-form').addEventListener('input', (event) => { if (event.target.id !== 'tariff-mode') { markScenarioPreset(null); updateEconomics(); } }); $('scenario-form').addEventListener('submit', (event) => event.preventDefault());
  for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => applyPreset(button.dataset.preset));
  $('reset-scenario').addEventListener('click', () => { if (state.defaultScenario) { $('tariff-mode').value = state.defaultScenario.tariffMode || 'energy_only'; state.previousDemand = null; renderScenarioInputs(); syncTariffMode(); markScenarioPreset('base'); updateEconomics(); toast(t('resetToast')); } });
}
async function load() {
  attachEvents(); initializeMap(); changeLanguage('en'); initializeEconomics();
  try {
    const response = await fetch('./data/candidates.json', { cache: 'no-store' }); if (!response.ok) throw new Error();
    const data = await response.json(); if (!Array.isArray(data.candidates) || !Array.isArray(data.sources)) throw new Error();
    state.data = data; state.sources = new Map(data.sources.map((source) => [source.id, source])); $('status-filter').value = statusCounts().qualified ? 'qualified' : 'pending'; populateStudyMetadata(); refresh(); renderPrintSummary();
  } catch { state.loadError = true; renderLoadError(); }
}
load();
