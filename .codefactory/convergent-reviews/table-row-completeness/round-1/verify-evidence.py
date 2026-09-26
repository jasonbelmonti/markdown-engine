from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path.cwd(); d=root/'.codefactory/convergent-reviews/table-row-completeness/round-1'; e=root/'docs/validation/table-row-completeness/implementation'
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
metadata=json.loads((d/'metadata.json').read_text()); manifest=json.loads((d/'reviewed-head.json').read_text())
assert hashfile(d/'reviewed-head.json')==metadata['reviewed_head']['sha256']
assert hashfile(d/'packet.md')==metadata['packet_sha256']
for group in ['files','dist']:
 for path,digest in manifest[group].items(): assert hashfile(root/path)==digest,path
reg=json.loads((e/'regression-state.json').read_text())
assert reg['before']==reg['after']
for group in ['after','dist']:
 for path,digest in reg[group].items(): assert hashfile(root/path)==digest,path
assert all(x['exit']==0 for x in reg['commands']) and len(reg['commands'])==6
assert 'Tests  722 passed (722)' in (e/'regression.log').read_text()
focus=json.loads((e/'focused-state.json').read_text())
assert focus['before']==focus['after'] and all(x['exit']==0 for x in focus['commands'])
# Later docs/script additions are rechecked by the final full regression gate.
focus_differences=[p for p,h in focus['after'].items() if not (root/p).exists() or hashfile(root/p)!=h]
assert set(focus_differences)<=set(['docs/contracts/declarative-validation.md','package.json','scripts/check-declarative-validation-contract-docs.mjs'])
examples=json.loads((e/'examples-state.json').read_text())
for entry in examples['records']:
 assert entry['exit']==entry['expectedExit']
 for path,h in entry['inputs'].items(): assert hashfile(root/path)==h,path
 report=json.loads((e/(entry['name']+'.json')).read_text())
 assert report['valid']==(entry['expectedExit']==0)
ref=examples['consumerReference']; rp=Path(ref['root'])
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=rp,text=True).strip()==ref['head']
for p,h in ref['hashes'].items(): assert hashfile(rp/p)==h,p
commands=[['git','diff','--check'],['npx','tsc','-p','tsconfig.declarative-validation-contract.json']]
checks=[]
for command in commands:
 r=subprocess.run(command,cwd=root,text=True,capture_output=True)
 checks.append({'command':command,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr})
 assert r.returncode==0,checks[-1]
for group in ['files','dist']:
 for path,digest in manifest[group].items(): assert hashfile(root/path)==digest,path
result={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewedHead':metadata['reviewed_head'],'packetSha256':metadata['packet_sha256'],'frozenFilesVerified':len(manifest['files']),'distFilesVerified':len(manifest['dist']),'regressionEvidenceApplicable':True,'focusedRuntimeEvidenceApplicable':True,'focusedSubsequentChangesRecheckedByRegression':focus_differences,'consumerReportsVerified':len(examples['records']),'consumerReferenceUnchanged':True,'freshChecks':checks}
(d/'supervisor-evidence.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
