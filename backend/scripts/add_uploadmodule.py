import re,sys
p='src/app.module.ts'
s=open(p,'r',encoding='utf8').read()
if 'UploadModule' in s:
    print('UploadModule already present in src/app.module.ts')
    sys.exit(0)
# add import after last import line
lines=s.splitlines()
last_import_idx=0
for i,l in enumerate(lines):
    if l.strip().startswith('import '):
        last_import_idx=i
import_line="import { UploadModule } from './upload/upload.module';"
lines.insert(last_import_idx+1, import_line)
s2="\n".join(lines)
# insert UploadModule into imports array if found
m=re.search(r'imports\s*:\s*\[', s2)
if not m:
    print('Could not find imports array in src/app.module.ts — please add UploadModule manually')
    open(p,'w',encoding='utf8').write(s2)
    sys.exit(1)
# best-effort insert before closing bracket of imports array
idx = m.end()
depth=0
pos=None
for i in range(idx, len(s2)):
    if s2[i] == '[':
        depth += 1
    elif s2[i] == ']':
        if depth==0:
            pos = i
            break
        else:
            depth -= 1
if pos is None:
    s2 = s2.replace('imports: [', 'imports: [\\n    UploadModule,', 1)
else:
    s2 = s2[:pos] + '\n    UploadModule,' + s2[pos:]
open(p,'w',encoding='utf8').write(s2)
print('Inserted UploadModule import and added to imports array in src/app.module.ts')
