"""Retain actual CLI reports and the fixture-authored expected outcomes."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[4]
out=Path(__file__).resolve().parent
fixtures=root/'fixtures/declarative-validation/examples/table-rows-complete'
records=[]

def run(name, binary, file, profile, expected):
    inputs={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [file,profile]}
    command=[*binary,'validate','--file',str(file),'--profile',str(profile),'--format','json']
    result=subprocess.run(command,cwd=root,text=True,capture_output=True)
    (out/(name+'.json')).write_text(result.stdout)
    report=json.loads(result.stdout)
    assert result.returncode == expected, (name,result.stderr)
    assert report['valid'] == (expected == 0),name
    assert not result.stderr, result.stderr
    assert inputs == {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [file,profile]}
    records.append({'name':name,'command':command,'expectedExit':expected,'exit':result.returncode,'valid':report['valid'],'inputs':inputs})

for entry in json.loads((fixtures/'oracle.json').read_text()):
    run('oracle-'+entry['name'],['node','dist/cli/index.js'],fixtures/(entry['name']+'.md'),fixtures/'shape.yaml',0 if entry['valid'] else 1)
for name,file,profile,expected in [('consumer-legacy','consumer-missing','legacy',0),('consumer-opt-in','consumer-missing','profile',1),('consumer-repaired','consumer-repaired','profile',0)]:
    run(name,['node','dist/cli/index.js'],fixtures/(file+'.md'),fixtures/(profile+'.yaml'),expected)
run('baseline-installed-legacy',['/Users/jasonbelmonti/.local/bin/markdown-engine'],fixtures/'consumer-missing.md',fixtures/'legacy.yaml',0)
reference=Path('/Users/jasonbelmonti/Documents/Development/delegation-planner/.worktrees/bounded-context-task')
refpaths=['skills/delegation-planner/scripts/artifact_structure.py','tests/test_structure.py','skills/delegation-planner/references/bundle-format.md','skills/delegation-planner/validation/fixtures/missing-dynamic-row-cell.md']
assert (reference/refpaths[-1]).read_bytes() == (fixtures/'consumer-missing.md').read_bytes()
(out/'examples-state.json').write_text(json.dumps({'records':records,'consumerReference':{'root':str(reference),'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=reference,text=True).strip(),'hashes':{p:hashlib.sha256((reference/p).read_bytes()).hexdigest() for p in refpaths}}},indent=2)+'\n')
print('Verified and retained',len(records),'CLI reports; consumer source copied unchanged.')
