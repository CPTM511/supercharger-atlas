const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; } };
const formatNumber = (value, digits = 1) => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : '待核';
const formatMoney = (value) => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '无法计算';
const short = (value, count) => { const text = String(value ?? ''); return text.length > count ? `${text.slice(0, count)}…` : text; };
const sourceLink = (source, label) => { const url = safeURL(source?.url); return url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label || source.title || source.id)} ↗</a>` : escapeHTML(label || source?.title || source?.id || '来源待核'); };
const getRank = (candidate, mode = state.mode) => { const rank = candidate?.ranks?.[mode]; return Number.isInteger(rank) && rank >= 1 && rank <= 10 ? rank : null; };
const hasCoordinates = (candidate) => typeof candidate.lat === 'number' && Number.isFinite(candidate.lat) && typeof candidate.lon === 'number' && Number.isFinite(candidate.lon) && Math.abs(candidate.lat) <= 90 && Math.abs(candidate.lon) <= 180;
const mapURL = (candidate) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${candidate.name} ${candidate.address} ${candidate.city} ${candidate.state}`)}`;
const state = { mode: 'network', data: null, sources: new Map(), selected: null, comparison: new Set(), map: null, markers: new Map(), timer: null, economics: null, defaultScenario: null, previousDemand: null, supplyLayer: null, neighborhood: false };
const lensDescriptions = {
  network: '优先审视走廊缺口、补充覆盖与服务便利。排序是下一步尽调的先后次序，不是建设成功率。',
  investor: '优先审视可验证的商业条件与下行风险。这里是投资尽调名单，不是已经证明盈利的项目；收益需要独立报价和需求验证。'
};
const kindLabels = { fact: ['事实', 'fact'], inference: ['推断', 'inference'], assumption: ['假设', 'assumption'], unknown: ['未知', 'unknown'] };
const inputDefinitions = [
  { key: 'stalls', label: '充电枪数量', unit: '枪', min: 1, max: 200, step: 1 },
  { key: 'sessionsPerStallDay', label: '每天每枪充电次数', unit: '次', min: 0, step: 0.1 },
  { key: 'kwhPerSession', label: '单次充电电量', unit: 'kWh', min: 0.1, step: 0.1 },
  { key: 'retailPerKwh', label: '充电销售单价', unit: '$/kWh', min: 0, step: 0.01 },
  { key: 'energyPerKwh', label: '购电能量单价', unit: '$/kWh', min: 0, step: 0.01 },
  { key: 'lossFraction', label: '购电至交付损耗率', unit: '%', min: 0, max: 99, step: 0.1, scale: 100 },
  { key: 'servicePerKwh', label: '平台与服务费用', unit: '$/kWh', min: 0, step: 0.01 },
  { key: 'demandPerKwMonth', label: '月需量单价', unit: '$/kW', min: 0, step: 0.5 },
  { key: 'billedPeakKw', label: '每月计费峰值功率', unit: 'kW', min: 0, step: 10 },
  { key: 'fixedMonthly', label: '固定经营支出', unit: '$/月', min: 0, step: 100 },
  { key: 'capex', label: '总建设及接网投资', unit: '$', min: 1, step: 1 }
];
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(state.timer); state.timer = setTimeout(() => { $('toast').hidden = true; }, 3500); }
function visibleCandidates() {
  if (!state.data) return [];
  const query = $('search').value.trim().toLocaleLowerCase();
  const region = $('state-filter').value;
  return state.data.candidates.filter((candidate) => ($('show-pool').checked || getRank(candidate) !== null) && (!region || candidate.state === region) && (!query || [candidate.name, candidate.address, candidate.city, candidate.state].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)))).sort((a, b) => (getRank(a) ?? 99) - (getRank(b) ?? 99) || String(a.name).localeCompare(String(b.name)));
}
function initializeMap() {
  if (!window.L) { $('map-fallback').hidden = false; $('map-status').textContent = '地图组件不可用；仍可通过站点详情中的地址链接查看地图。'; return; }
  try {
    state.map = window.L.map('map', { scrollWheelZoom: false, zoomControl: true }).setView([38.8, -98.5], 4);
    state.supplyLayer = window.L.layerGroup().addTo(state.map);
    const tiles = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors' }).addTo(state.map);
    tiles.on('tileerror', () => { $('map-status').textContent = '部分底图未能加载，标记仍依照坐标显示。距离是直线距离，非驾车距离。'; });
    new ResizeObserver(() => state.map?.invalidateSize()).observe($('map'));
  } catch { $('map-fallback').hidden = false; $('map-status').textContent = '地图暂不可用，请使用完整地址和外部地图链接。'; }
}
function clearNeighborhood() {
  state.supplyLayer?.clearLayers(); state.neighborhood = false;
  $('map-supply-legend').hidden = true; $('map-nearby').setAttribute('aria-pressed', 'false');
  $('map-status').textContent = '地图距离以直线测量；不代表驾车距离或可用电网容量。';
}
function fitMap() {
  if (!state.map) return;
  clearNeighborhood();
  const coordinates = visibleCandidates().filter(hasCoordinates).map((candidate) => [candidate.lat, candidate.lon]);
  if (coordinates.length) state.map.fitBounds(coordinates, { padding: [35, 35], maxZoom: coordinates.length === 1 ? 11 : 6 });
  else state.map.setView([38.8, -98.5], 4);
}
function markerIcon(candidate) { return window.L.divIcon({ className: 'atlas-marker', html: `<div class="atlas-pin ${state.mode === 'investor' ? 'investor' : ''} ${state.selected === candidate.id ? 'active' : ''}"><span>${getRank(candidate) ?? '·'}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 30] }); }
function showNeighborhood() {
  if (!state.map) return;
  const candidate = state.data?.candidates.find((item) => item.id === state.selected);
  if (!candidate || !hasCoordinates(candidate)) return;
  const supplies = (candidate.nearby || []).filter(hasCoordinates);
  if (!supplies.length) { toast('该地址暂无可绘制的周边供给坐标。'); return; }
  state.supplyLayer.clearLayers(); state.neighborhood = true;
  for (const site of supplies) {
    const status = String(site.status || '').toUpperCase().replace(/^AFDC\s+/, '').split(/\s|\//)[0];
    const open = ['OPEN', 'OPEN_LIMITED', 'OPEN_LIMITED_HOURS', 'EXPANDING', 'E'].includes(status);
    const uncertain = ['PLAN', 'VOTING'].includes(status);
    const building = ['CONSTRUCTION', 'PERMIT', 'P'].includes(status);
    const color = open ? '#687a83' : building || uncertain ? '#bb7e17' : '#9a7770';
    const marker = window.L.circleMarker([site.lat, site.lon], { radius: uncertain ? 7 : 6, color, weight: 2, fillColor: color, fillOpacity: uncertain ? 0 : 0.7 }).addTo(state.supplyLayer);
    const tooltip = document.createElement('span'); tooltip.textContent = `${site.name} · ${site.status || '未知状态'} · ${formatNumber(site.distanceMiles)} mi`;
    marker.bindTooltip(tooltip, { direction: 'top' });
  }
  $('map-supply-legend').hidden = false; $('map-nearby').setAttribute('aria-pressed', 'true');
  state.map.fitBounds([[candidate.lat, candidate.lon], ...supplies.map((site) => [site.lat, site.lon])], { padding: [40, 40], maxZoom: 12 });
  $('map-status').textContent = '仅显示该地址的已收录邻近记录；PLAN/VOTING 是待核线索，不代表承诺建设。距离均为直线距离。';
}
function renderMap() {
  if (!state.map) return;
  for (const marker of state.markers.values()) marker.remove();
  state.markers.clear();
  for (const candidate of visibleCandidates().filter(hasCoordinates)) {
    const marker = window.L.marker([candidate.lat, candidate.lon], { icon: markerIcon(candidate), title: `${candidate.name}, ${candidate.city}`, keyboard: true, alt: candidate.name }).addTo(state.map);
    const tooltip = document.createElement('span'); tooltip.textContent = `${getRank(candidate) ? `${getRank(candidate)}. ` : ''}${candidate.name} · ${candidate.city}`;
    marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -27] });
    marker.on('click', () => selectCandidate(candidate.id, true));
    state.markers.set(candidate.id, marker);
  }
  fitMap();
}
function renderList() {
  const candidates = visibleCandidates();
  const previousScroll = $('candidate-list').scrollTop;
  $('result-count').textContent = `${candidates.length} 个地址${$('show-pool').checked ? ' · 完整候选池' : ' · 当前 Top 10'}`;
  if (!candidates.length) { $('candidate-list').innerHTML = '<div class="empty-state">没有符合筛选条件的地址。<br>试试清空搜索或切换到完整候选池。</div>'; return; }
  $('candidate-list').innerHTML = candidates.map((candidate) => `<div class="candidate-row ${state.selected === candidate.id ? 'selected' : ''}" data-candidate-id="${escapeHTML(candidate.id)}"><div class="candidate-rank">${getRank(candidate) ? String(getRank(candidate)).padStart(2, '0') : '—'}</div><div><button type="button" class="candidate-select" data-select="${escapeHTML(candidate.id)}" aria-pressed="${state.selected === candidate.id}">${escapeHTML(candidate.name)}</button><p class="candidate-location">${escapeHTML(candidate.city)}, ${escapeHTML(candidate.state)}${hasCoordinates(candidate) ? '' : ' · 定位待核'}</p><p class="candidate-brief">${escapeHTML(candidate.thesis?.[state.mode] || candidate.rankRationale?.[state.mode] || '该视角尚无充分证据，保留在候选池。')}</p><div class="candidate-meta"><span class="candidate-type">${escapeHTML(candidate.type || candidate.status || '尽调候选')}</span><label class="compare-check"><input type="checkbox" data-compare="${escapeHTML(candidate.id)}" ${state.comparison.has(candidate.id) ? 'checked' : ''} aria-label="比较 ${escapeHTML(candidate.name)}">比较</label></div></div></div>`).join('');
  $('candidate-list').scrollTop = previousScroll;
}
function selectCandidate(id, fromMap = false) {
  const candidate = state.data?.candidates.find((item) => item.id === id);
  if (!candidate) return;
  state.selected = id;
  for (const row of $('candidate-list').querySelectorAll('.candidate-row')) { const active = row.dataset.candidateId === id; row.classList.toggle('selected', active); row.querySelector('.candidate-select')?.setAttribute('aria-pressed', String(active)); }
  for (const [markerId, marker] of state.markers) { const match = state.data.candidates.find((item) => item.id === markerId); marker.setIcon(markerIcon(match)); marker.setZIndexOffset(markerId === id ? 1000 : 0); }
  if (state.map && hasCoordinates(candidate) && !fromMap) state.map.panTo([candidate.lat, candidate.lon], { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  renderDetail(candidate);
  if (state.neighborhood) showNeighborhood();
  if (fromMap) { const row = Array.from($('candidate-list').querySelectorAll('.candidate-row')).find((node) => node.dataset.candidateId === id); row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}
function renderDetail(candidate) {
  $('map-nearby').disabled = !hasCoordinates(candidate) || !(candidate.nearby || []).some(hasCoordinates);
  const rank = getRank(candidate);
  const metrics = candidate.metrics || {};
  const sourceIds = [...new Set([...(candidate.sourceIds || []), ...(candidate.facts || []).flatMap((fact) => fact.sourceIds || [])])];
  const facts = (candidate.facts || []).map((fact) => { const [label, badge] = kindLabels[fact.kind] || kindLabels.unknown; return `<li><span class="badge badge-${badge}">${label}</span><div>${escapeHTML(fact.claim)}${(fact.sourceIds || []).map((id) => { const source = state.sources.get(id); const url = safeURL(source?.url); return url ? `<a class="inline-source" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(source.title)}">[${escapeHTML(id)}] ↗</a>` : ''; }).join('')}</div></li>`; }).join('');
  const list = (items, empty) => `<ul>${(items?.length ? items : [empty]).map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
  const nearby = candidate.nearby?.length ? `<h4 class="detail-subheading">邻近供给 / 核查线索</h4><table class="nearby-table"><thead><tr><th scope="col">站点</th><th scope="col">来源状态</th><th scope="col">直线英里</th><th scope="col">枪数</th></tr></thead><tbody>${candidate.nearby.map((site) => `<tr><td>${sourceLink(site, site.name)}</td><td>${escapeHTML(site.status || '未知')}</td><td>${formatNumber(site.distanceMiles)}</td><td>${formatNumber(site.stalls, 0)}</td></tr>`).join('')}</tbody></table>` : '';
  $('site-detail').innerHTML = `<div class="detail-topline"><p class="eyebrow">${state.mode === 'network' ? 'NETWORK FIT' : 'INVESTMENT CASE'} / ${rank ? `PRIORITY ${String(rank).padStart(2, '0')}` : 'CANDIDATE POOL'}</p><span class="badge badge-unknown">${escapeHTML(candidate.status || '需进一步尽调')}</span></div><h3 class="detail-name">${escapeHTML(candidate.name)}</h3><p class="detail-address">${escapeHTML(candidate.address)}${candidate.address?.includes(candidate.city) ? '' : `, ${escapeHTML(candidate.city)}, ${escapeHTML(candidate.state)}`} <a href="${escapeHTML(mapURL(candidate))}" target="_blank" rel="noopener noreferrer">打开地图 ↗</a></p><p class="detail-thesis">${escapeHTML(candidate.thesis?.[state.mode] || '该视角尚无足够证据支持进入 Top 10。')}</p><div class="detail-metrics"><div><span>最近运营超充站</span><strong>${formatNumber(metrics.nearestOpenMiles)}</strong><small>${Number.isFinite(metrics.nearestOpenMiles) ? 'mi' : ''}</small></div><div><span>最近新增供给线索</span><strong>${formatNumber(metrics.nearestPipelineMiles)}</strong><small>${Number.isFinite(metrics.nearestPipelineMiles) ? 'mi' : ''}</small></div><div><span>10mi 内公共 DCFC 记录</span><strong>${formatNumber(metrics.dcfcWithin10Miles, 0)}</strong><small>${Number.isFinite(metrics.dcfcWithin10Miles) ? '处' : ''}</small></div></div><p class="metric-note">距离为坐标间直线距离；不代表实际驾车路线。${escapeHTML(candidate.coordinateQuality || '物业定位精度仍需核实。')} 地址定位不代表已获批停车区域。DCFC 记录包含 Tesla，不保证连接器兼容或达到 150kW。未知值不会按零处理。</p>${candidate.rankRationale?.[state.mode] ? `<h4 class="detail-subheading">为什么放在这个位置</h4><p class="small">${escapeHTML(candidate.rankRationale[state.mode])}</p>` : ''}<h4 class="detail-subheading">支持判断的证据</h4><ul class="fact-list">${facts || '<li><span class="badge badge-unknown">未知</span><div>尚无可列出的已核证据。</div></li>'}</ul><div class="risk-block"><strong>最强反证 / 为什么可能不应该选这里</strong><p>${escapeHTML(candidate.counterargument || '尚需补充独立反证检查。')}</p></div><div class="detail-two-col"><div><h4 class="detail-subheading">下一步必须核实</h4>${list(candidate.unknowns, '接网容量、场地使用权、许可与实际需求均须核实。')}</div><div><h4 class="detail-subheading">出现这些情况就淘汰</h4>${list(candidate.killCriteria, '关键落地条件无法获得验证时，停止推进。')}</div></div>${nearby}<div class="source-links"><h4>来源与时间</h4>${sourceIds.map((id) => { const source = state.sources.get(id); return source ? `<div class="source-link">${sourceLink(source, `[${id}] ${source.title}`)}<span>${escapeHTML(source.publisher || '')}<br>读取 ${escapeHTML(source.retrievedDate || '未记录')}</span></div>` : `<div class="source-link"><span>来源 ${escapeHTML(id)} 尚未解析</span></div>`; }).join('') || '<p class="small">来源索引尚待补全。</p>'}</div>`;
}
function refresh() {
  const candidates = visibleCandidates();
  if (!candidates.some((candidate) => candidate.id === state.selected)) state.selected = candidates[0]?.id || null;
  renderList(); renderMap();
  const selected = state.data?.candidates.find((candidate) => candidate.id === state.selected);
  if (selected) renderDetail(selected); else { $('site-detail').innerHTML = '<div class="empty-state">当前筛选下没有地址。清空筛选即可继续查看研究。</div>'; $('map-nearby').disabled = true; }
  renderComparison();
}
function changeMode(mode) {
  state.mode = mode;
  for (const button of document.querySelectorAll('[data-mode]')) { const active = button.dataset.mode === mode; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; }
  $('lens-panel').setAttribute('aria-labelledby', `lens-${mode}`);
  $('lens-description').textContent = lensDescriptions[mode];
  refresh();
}
function renderComparison() {
  const candidates = Array.from(state.comparison).map((id) => state.data?.candidates.find((candidate) => candidate.id === id)).filter(Boolean);
  $('compare-section').hidden = !candidates.length;
  if (!candidates.length) return;
  const row = (title, getValue) => `<tr><th scope="row">${title}</th>${candidates.map((candidate) => `<td>${getValue(candidate)}</td>`).join('')}</tr>`;
  $('compare-table').innerHTML = `<table class="comparison-table"><thead><tr><th scope="col">${state.mode === 'network' ? '网络视角' : '投资视角'}</th>${candidates.map((candidate) => `<th scope="col"><button class="comparison-remove" data-remove="${escapeHTML(candidate.id)}" type="button" aria-label="移除 ${escapeHTML(candidate.name)}">×</button>${escapeHTML(candidate.name)}<small>${escapeHTML(candidate.city)}, ${escapeHTML(candidate.state)}</small></th>`).join('')}</tr></thead><tbody>${row('两种优先级', (candidate) => `网络 ${getRank(candidate, 'network') ?? '未入选'} / 投资 ${getRank(candidate, 'investor') ?? '未入选'}`)}${row('完整地址', (candidate) => `${escapeHTML(candidate.address)}<br><a href="${escapeHTML(mapURL(candidate))}" target="_blank" rel="noopener noreferrer">查看地图 ↗</a>`)}${row('主要判断', (candidate) => escapeHTML(candidate.thesis?.[state.mode] || '证据不足'))}${row('运营超充距离', (candidate) => `${formatNumber(candidate.metrics?.nearestOpenMiles)}${Number.isFinite(candidate.metrics?.nearestOpenMiles) ? ' mi · 直线' : ''}`)}${row('新增供给线索距离', (candidate) => `${formatNumber(candidate.metrics?.nearestPipelineMiles)}${Number.isFinite(candidate.metrics?.nearestPipelineMiles) ? ' mi · 直线' : ''}`)}${row('最强反证', (candidate) => escapeHTML(candidate.counterargument || '待核'))}${row('待核实条件', (candidate) => (candidate.unknowns || []).map(escapeHTML).join('<br>'))}${row('证据', (candidate) => (candidate.sourceIds || []).map((id) => sourceLink(state.sources.get(id), id)).join(' · '))}</tbody></table>`;
}
function toggleComparison(id, checked) {
  if (checked && state.comparison.size >= 3 && !state.comparison.has(id)) { toast('最多同时比较 3 个地址，请先移除一个。'); renderList(); return; }
  if (checked) state.comparison.add(id); else state.comparison.delete(id);
  renderComparison();
}
async function exportCSV() {
  if (!state.data) return;
  const columns = ['研究日期', '视角', '尽调优先级', '场地', '详细地址', '城市', '州', '纬度', '经度', '定位说明', '类型', '状态', '推荐理由', '最强反证', '待核实', '淘汰条件', '最近运营超充直线英里', '最近管线直线英里', '10mi内公共DCFC记录', '证据链接'];
  const records = visibleCandidates().map((candidate) => [state.data.meta?.asOf || '', state.mode, getRank(candidate) || '', candidate.name, candidate.address, candidate.city, candidate.state, candidate.lat ?? '', candidate.lon ?? '', candidate.coordinateQuality || '', candidate.type || '', candidate.status || '', candidate.thesis?.[state.mode] || '', candidate.counterargument || '', (candidate.unknowns || []).join('；'), (candidate.killCriteria || []).join('；'), candidate.metrics?.nearestOpenMiles ?? '未知', candidate.metrics?.nearestPipelineMiles ?? '未知', candidate.metrics?.dcfcWithin10Miles ?? '未知', (candidate.sourceIds || []).map((id) => state.sources.get(id)?.url).filter(Boolean).join(' | ')]);
  const { csvCell: cell } = await import('./model.js');
  const csv = '\ufeff' + [columns, ...records].map((record) => record.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `charge-atlas-${state.mode}-${String(state.data.meta?.asOf || 'snapshot').slice(0, 10)}.csv`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`已导出 ${records.length} 个地址，包含证据链接与未知项。`);
}
function renderPrintSummary() {
  if (!state.data) return;
  $('print-summary').innerHTML = ['network', 'investor'].map((mode, index) => {
    const candidates = state.data.candidates.filter((candidate) => getRank(candidate, mode) !== null).sort((a, b) => getRank(a, mode) - getRank(b, mode));
    return `<section class="print-page"><div class="print-head"><h1>CHARGE ATLAS / ${mode === 'network' ? '网络选址' : '投资尽调'}</h1><span>${escapeHTML(state.data.meta?.asOf)} · ${index + 1} / 2</span></div><p>${escapeHTML(lensDescriptions[mode])}</p><table class="print-table"><thead><tr><th>#</th><th>具体场地与地址</th><th>推荐理由（摘要）</th><th>主要反证（摘要）</th></tr></thead><tbody>${candidates.map((candidate) => `<tr><td>${getRank(candidate, mode)}</td><td><strong>${escapeHTML(candidate.name)}</strong><small>${escapeHTML(candidate.address)}</small></td><td>${escapeHTML(short(candidate.thesis?.[mode] || '', 100))}<small>来源：${escapeHTML((candidate.sourceIds || []).join(', '))}</small></td><td>${escapeHTML(short(candidate.counterargument || '', 75))}</td></tr>`).join('')}</tbody></table><p class="print-footer">独立公开资料研究，不代表 Tesla 认可、可建设性确认或实际回报预测。接网、场地使用权、许可和需求需继续验证。完整证据、来源 URL、候选池与方法见交互产品和随附数据。版本 ${escapeHTML(state.data.meta?.version || '未标记')}。</p></section>`;
  }).join('');
}
function populateStudyMetadata() {
  const { meta = {}, candidates, sources } = state.data;
  $('snapshot-date').textContent = meta.asOf || '日期待核';
  $('pool-count').textContent = formatNumber(meta.poolCount ?? candidates.length, 0);
  $('network-count').textContent = candidates.filter((candidate) => getRank(candidate, 'network') !== null).length;
  $('investor-count').textContent = candidates.filter((candidate) => getRank(candidate, 'investor') !== null).length;
  $('source-count').textContent = sources.length;
  $('footer-version').textContent = `${meta.version || '未标记版本'} · ${meta.asOf || '日期待核'}`;
  $('ledger-count').textContent = `${sources.length} 条`;
  const region = $('state-filter');
  for (const value of [...new Set(candidates.map((candidate) => candidate.state).filter(Boolean))].sort()) { const option = document.createElement('option'); option.value = value; option.textContent = value; region.append(option); }
  $('limitations').innerHTML = `${meta.description ? `<p>${escapeHTML(meta.description)}</p>` : ''}<ul>${(meta.limitations || ['本研究是候选场地初筛，公开证据不能替代现场、产权与电力核验。']).map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
  $('source-list').innerHTML = sources.map((source) => `<div class="source-record"><div class="source-record-id">${escapeHTML(source.id)}</div><div>${sourceLink(source)}<p>${escapeHTML(source.publisher || '来源未标记')} · 发布/更新 ${escapeHTML(source.publishedDate || '未知')} · 读取 ${escapeHTML(source.retrievedDate || '未记录')} · ${escapeHTML(source.kind || '来源类型未标记')}</p>${source.notes ? `<p>${escapeHTML(source.notes)}</p>` : ''}</div></div>`).join('');
}
function markScenarioPreset(preset) {
  for (const button of document.querySelectorAll('[data-preset]')) button.setAttribute('aria-pressed', String(button.dataset.preset === preset));
  const name = {conservative:'保守示例', base:'基准示例', optimistic:'乐观示例'}[preset] || '自定义假设';
  $('scenario-label').textContent = `${name} · 未测得需求`;
}
function applyPreset(preset) {
  if (!state.defaultScenario) return;
  const overrides = {conservative:{sessionsPerStallDay:2,retailPerKwh:0.40,energyPerKwh:0.18},base:{sessionsPerStallDay:4,retailPerKwh:0.45,energyPerKwh:0.14},optimistic:{sessionsPerStallDay:8,retailPerKwh:0.50,energyPerKwh:0.10}}[preset];
  if (!overrides) return;
  const values = {...state.defaultScenario,...overrides,billedPeakKw:500,tariffMode:'energy_only'};
  $('tariff-mode').value = 'energy_only';
  for (const definition of inputDefinitions) { const element = $(`scenario-${definition.key}`); element.disabled = false; element.value = String(values[definition.key] * (definition.scale || 1)); }
  state.previousDemand = null; syncTariffMode(); markScenarioPreset(preset); updateEconomics();
}
function renderSensitivity(input) {
  const sessions = [2,4,6,8], prices = [0.35,0.45,0.55];
  $('sensitivity-table').innerHTML = `<table class="sensitivity-table"><thead><tr><th scope="col">每天每枪次数</th>${prices.map((price)=>`<th scope="col">$${price.toFixed(2)} / kWh</th>`).join('')}</tr></thead><tbody>${sessions.map((count)=>`<tr><th scope="row">${count} 次 / 枪 / 日</th>${prices.map((price)=>{const result=state.economics({...input,sessionsPerStallDay:count,retailPerKwh:price});return `<td class="${result.operatingCash<0?'negative':'positive'}">${formatMoney(result.operatingCash)}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
  $('sensitivity-note').textContent = input.tariffMode === 'fully_burdened' ? '所有组合均是假设。综合电价在表中被固定，但现实中的平均综合电价会随销量变化；此表仅供机械条件对照，不能作为跨利用率电费预测。' : '按当前其他输入不变，比较每天每枪充电次数与售价组合。所有组合都是假设，不代表实际需求；计费峰值功率也被固定。';
}
function renderScenarioInputs() {
  $('scenario-inputs').innerHTML = inputDefinitions.map((definition) => `<label for="scenario-${definition.key}">${escapeHTML(definition.label)}<span class="input-unit"><input type="number" id="scenario-${definition.key}" name="${definition.key}" value="${Number(state.defaultScenario[definition.key]) * (definition.scale || 1)}" min="${definition.min}" ${definition.max !== undefined ? `max="${definition.max}"` : ''} step="${definition.step}" required inputmode="decimal"><span>${escapeHTML(definition.unit)}</span></span></label>`).join('');
}
function syncTariffMode() {
  if (!state.defaultScenario) return;
  const bundled = $('tariff-mode').value === 'fully_burdened';
  const demand = $('scenario-demandPerKwMonth');
  const peak = $('scenario-billedPeakKw');
  if (bundled) { if (!demand.disabled) state.previousDemand = demand.value; demand.value = '0'; }
  else if (demand.disabled) demand.value = state.previousDemand ?? String(state.defaultScenario.demandPerKwMonth);
  demand.disabled = bundled; peak.disabled = bundled;
  $('tariff-note').textContent = bundled ? '综合电价已含需量费，因此单列需量费设为零。平均综合电价随利用率变化，不能机械外推到不同销量；本模式仅供条件测试。' : '能量单价只含购电能量费用，需量费另算，避免遗漏或重复。';
}
function updateEconomics() {
  if (!state.economics) return;
  const input = {};
  try {
    for (const definition of inputDefinitions) { const element = $(`scenario-${definition.key}`); if (!element.validity.valid || !Number.isFinite(element.valueAsNumber)) throw new Error(`请为“${definition.label}”输入有效数字。`); input[definition.key] = element.valueAsNumber / (definition.scale || 1); }
    input.tariffMode = $('tariff-mode').value;
    const output = state.economics(input);
    if (!Number.isFinite(output.operatingCash)) throw new Error('参数不能生成有效结果，请检查输入。');
    $('scenario-error').hidden = true;
    $('cash-result').textContent = formatMoney(output.operatingCash);
    $('cash-result').style.color = output.operatingCash < 0 ? '#ffb29a' : '#f5c86c';
    $('breakeven-result').textContent = Number.isFinite(output.breakEvenSessionsPerStallDay) ? formatNumber(output.breakEvenSessionsPerStallDay, 2) : '无法盈亏平衡';
    $('payback-result').textContent = Number.isFinite(output.simplePaybackYears) && output.simplePaybackYears > 0 ? formatNumber(output.simplePaybackYears, 1) : '无法回收';
    const rows = [['年交付电量', `${formatNumber(output.annualKwh, 0)} kWh`, ''], ['充电销售收入', formatMoney(output.revenue), 'revenue'], [input.tariffMode === 'fully_burdened' ? '综合电费（含需量及损耗）' : '购电成本（含损耗）', formatMoney(output.energyCost), ''], ['平台与服务成本', formatMoney(output.serviceCost), ''], ['电力需量成本', formatMoney(output.demandCost), ''], ['固定经营成本', formatMoney(output.fixedCost), '']];
    renderSensitivity(input);
    $('cost-breakdown').innerHTML = rows.map(([label, value, className]) => `<div class="cost-row ${className}"><span>${label}</span><strong>${value}</strong></div>`).join('');
  } catch (error) { $('scenario-error').textContent = error.message || '输入有误，请检查参数。'; $('scenario-error').hidden = false; $('cash-result').textContent = '请检查输入'; $('breakeven-result').textContent = '—'; $('payback-result').textContent = '—'; $('cost-breakdown').innerHTML = ''; $('sensitivity-table').innerHTML = '<p class="empty-state">输入有效参数后显示敏感性分析。</p>'; }
}
async function initializeEconomics() {
  try {
    const module = await import('./model.js');
    if (typeof module.calculateEconomics !== 'function' || !module.DEFAULT_SCENARIO) throw new Error('缺少计算模块');
    state.economics = module.calculateEconomics; state.defaultScenario = module.DEFAULT_SCENARIO;
    $('tariff-mode').value = state.defaultScenario.tariffMode || 'energy_only';
    renderScenarioInputs(); syncTariffMode(); updateEconomics();
  } catch { $('scenario-error').textContent = '计算模块暂不可用。选址资料仍可浏览；本页不会用示例结果替代计算。'; $('scenario-error').hidden = false; $('reset-scenario').disabled = true; }
}
function attachEvents() {
  for (const button of document.querySelectorAll('[data-mode]')) { button.addEventListener('click', () => changeMode(button.dataset.mode)); button.addEventListener('keydown', (event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const mode = event.key === 'Home' ? 'network' : event.key === 'End' ? 'investor' : state.mode === 'network' ? 'investor' : 'network'; changeMode(mode); $(`lens-${mode}`).focus(); } }); }
  $('search').addEventListener('input', refresh); $('state-filter').addEventListener('change', refresh); $('show-pool').addEventListener('change', refresh);
  $('candidate-list').addEventListener('click', (event) => { const button = event.target.closest('[data-select]'); if (button) selectCandidate(button.dataset.select); });
  $('candidate-list').addEventListener('change', (event) => { if (event.target.matches('[data-compare]')) toggleComparison(event.target.dataset.compare, event.target.checked); });
  $('compare-table').addEventListener('click', (event) => { const button = event.target.closest('[data-remove]'); if (button) { state.comparison.delete(button.dataset.remove); renderComparison(); renderList(); } });
  $('clear-comparison').addEventListener('click', () => { state.comparison.clear(); renderComparison(); renderList(); });
  $('map-nearby').addEventListener('click', showNeighborhood);
  $('map-reset').addEventListener('click', () => { fitMap(); $('map-status').textContent = '地图距离以直线测量；不代表驾车距离或可用电网容量。'; }); $('csv-button').addEventListener('click', exportCSV);
  window.addEventListener('beforeprint', renderPrintSummary);
  $('tariff-mode').addEventListener('change', () => { syncTariffMode(); markScenarioPreset(null); updateEconomics(); });
  $('scenario-form').addEventListener('input', (event) => { if (event.target.id !== 'tariff-mode') { markScenarioPreset(null); updateEconomics(); } }); $('scenario-form').addEventListener('submit', (event) => event.preventDefault());
  for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => applyPreset(button.dataset.preset));
  $('reset-scenario').addEventListener('click', () => { if (state.defaultScenario) { $('tariff-mode').value = state.defaultScenario.tariffMode || 'energy_only'; renderScenarioInputs(); syncTariffMode(); markScenarioPreset('base'); updateEconomics(); toast('已恢复示例假设；这些数值不是场地预测或供应商报价。'); } });
}
async function load() {
  attachEvents(); initializeMap(); initializeEconomics();
  try {
    const response = await fetch('./data/candidates.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.candidates) || !Array.isArray(data.sources)) throw new Error('数据结构不完整');
    state.data = data; state.sources = new Map(data.sources.map((source) => [source.id, source]));
    populateStudyMetadata(); refresh(); renderPrintSummary();
  } catch (error) {
    $('data-error').textContent = '研究数据暂时无法载入。请通过本地 HTTP 服务或已部署网页打开，并确认 data/candidates.json 可访问；本页面不会填充虚构地址。'; $('data-error').hidden = false;
    $('candidate-list').innerHTML = '<div class="empty-state">数据未载入，无法生成候选名单。</div>'; $('result-count').textContent = '数据不可用'; $('csv-button').disabled = true; $('snapshot-date').textContent = '快照不可用';
  }
}
load();
