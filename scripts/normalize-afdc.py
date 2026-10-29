#!/usr/bin/env python3
"""Normalize a downloaded AFDC response; do not download or store API secrets.
Usage: python3 scripts/normalize-afdc.py /path/outside/repo/afdc.json --output /tmp/proposed-supply.json
Review the diff and rerun enrichment/validation before replacing published data.
"""
import argparse, hashlib, json
from pathlib import Path
from datetime import datetime, timezone

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('input', type=Path)
p.add_argument('--output', required=True, type=Path)
args=p.parse_args()
raw=args.input.read_bytes(); data=json.loads(raw)
assert len(data['fuel_stations']) == data['total_results'], 'Truncated source response'
stations=[]
for s in data['fuel_stations']:
    assert s['country']=='US' and s['status_code']=='E' and s['access_code']=='public' and s['ev_dc_fast_num'] > 0, 'Unexpected source filters'
    stations.append(dict(id=s['id'],name=s['station_name'],lat=s['latitude'],lon=s['longitude'],address=s['street_address'],city=s['city'],state=s['state'],network=s['ev_network'],dcPorts=s['ev_dc_fast_num'],connectors=s.get('ev_connector_types',[]),confirmed=s['date_last_confirmed'],updated=s['updated_at'],restricted=s.get('restricted_access',False)))
result={'meta':{'url':'https://developer.nlr.gov/api/alt-fuel-stations/v1.json','filters':dict(fuel_type='ELEC',status='E',access='public',ev_charging_level='dc_fast',country='US',limit='all'),'returned':len(stations),'totalResults':data['total_results'],'rawSha256':hashlib.sha256(raw).hexdigest(),'scope':'US public available DC fast records; not real-time operational verification'},'retrievedAt':datetime.now(timezone.utc).isoformat(),'stations':stations}
args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'Wrote {len(stations)} normalized records to {args.output.name}; review before publication.')
