/** Recompute government supply metrics without silently changing editorial ranks. */
import fs from 'node:fs';
import {haversineMiles} from '../model.js';
const args=process.argv.slice(2);
const output=args[0];
if (!output) throw new Error('Usage: node scripts/enrich-supply.mjs /tmp/proposed-candidates.json');
const data=JSON.parse(fs.readFileSync(new URL('../data/candidates.json',import.meta.url)));
const supply=JSON.parse(fs.readFileSync(new URL('../data/supply-snapshot.json',import.meta.url))).stations;
for (const c of data.candidates) {
  if (!Number.isFinite(c.lat)||!Number.isFinite(c.lon)) continue;
  const all=supply.map(s=>({...s,distance:haversineMiles(c,s)})).sort((a,b)=>a.distance-b.distance);
  c.metrics.nearestOpenMiles=Math.round(all.find(s=>s.network==='Tesla').distance*10)/10;
  c.metrics.dcfcWithin10Miles=all.filter(s=>s.distance<=10).length;
  c.nearby=c.nearby.filter(n=>n.sourceType!=='afdc');
  const selected=[...all.filter(s=>s.network==='Tesla').slice(0,2),...all.filter(s=>s.network!=='Tesla').slice(0,2)];
  c.nearby.push(...selected.map(s=>({name:`${s.name} (${s.network})`,status:'AFDC E / available in database',lat:s.lat,lon:s.lon,distanceMiles:Math.round(s.distance*10)/10,stalls:s.dcPorts,url:`https://afdc.energy.gov/stations/#/station/${s.id}`,sourceType:'afdc',sourceId:s.id,confirmed:s.confirmed})));
}
fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n');
console.log('Wrote proposed metrics. Recheck planned/temporarily unavailable supply, primary sources and ranking rationales before release.');
