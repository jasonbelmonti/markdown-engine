"""Capture a local verification gate with before/after content fingerprints."""
from pathlib import Path
import hashlib, json, subprocess, sys
root = Path(__file__).resolve().parents[4]
out = Path(__file__).resolve().parent
name = sys.argv[1]

def manifest():
    files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).decode().split('\0')
    paths = [root/f for f in files if f and not f.startswith('docs/validation/table-row-completeness/implementation/')]
    paths += [root/'node_modules/.package-lock.json']
    paths += list((root/'node_modules/cmark-gfm').rglob('*.node'))
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(set(paths)) if p.is_file()}

before = manifest()
commands = {
 'focused': [['npm', 'run', 'build'], ['npx', 'vitest', 'run',
    'tests/declarative-validation-table-rows-complete.test.ts',
    'tests/declarative-validation-table-rows-complete-config.test.ts',
    'tests/declarative-validation-table-rows-complete-cli.test.ts', '--exclude=.worktrees/**'],
    ['npx', 'tsc', '-p', 'tsconfig.declarative-validation-contract.json']],
 'regression': [['npm', 'run', 'typecheck'], ['npm', 'test'],
    ['npm', 'run', 'docs:declarative-validation-contract'],
    ['npm', 'run', 'docs:rich-ir-contract'], ['node', 'scripts/check-boundaries.mjs'],
    ['npm', 'run', 'audit:declarative-validation-boundary']],
}[name]
results = []
with (out/(name+'.log')).open('w') as log:
    for command in commands:
        result = subprocess.run(command, cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        log.write('$ '+ ' '.join(command)+'\n'+result.stdout+'\nexit: '+str(result.returncode)+'\n')
        log.flush()
        results.append({'command':command,'exit':result.returncode})
        print(' '.join(command), 'exit:', result.returncode, flush=True)
        if result.returncode: break
state = {'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
         'node':subprocess.check_output(['node','--version'],text=True).strip(),
         'npm':subprocess.check_output(['npm','--version'],text=True).strip(),
         'commands':results, 'before':before, 'after':manifest(),
         'dist':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((root/'dist').rglob('*')) if p.is_file()}}
(out/(name+'-state.json')).write_text(json.dumps(state,indent=2)+'\n')
assert state['before'] == state['after'], 'Source inputs changed during checks'
sys.exit(next((r['exit'] for r in results if r['exit']),0))
