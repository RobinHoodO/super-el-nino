import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {GET} from '../app/research/[[...path]]/route';

const canonical='https://citizen-infra.github.io/senri/el-nino/research-library/';
const legacyPaths=[
  '/research',
  '/research/legacy-overview.html',
  '/research/resources.md',
  '/research/videos/example.md',
];

for(const path of legacyPaths){
  const response=await GET();
  assert.equal(response.status,308,path+' must redirect permanently');
  assert.equal(response.headers.get('location'),canonical,path+' must use the canonical library');
}

const hub=readFileSync('app/hub.tsx','utf8');
const researchLinks=hub.match(/<a[^>]*href=\{RESEARCH_LIBRARY_URL\}[^>]*>/g)??[];
assert.equal(researchLinks.length,2,'Desktop and mobile Research controls must both be links');
assert.ok(researchLinks.every(link=>!link.includes('target=')),'Research links must use same-tab navigation');
assert.ok(!hub.includes('ResearchLibrary'),'The legacy ResearchLibrary component must not ship in Hub');
assert.ok(!existsSync('components/research-library.tsx'),'The duplicate research component must be removed');
assert.ok(!existsSync('public/research'),'Legacy public research assets must be removed');

console.log('Passed: canonical research links, catch-all 308 redirect and legacy asset removal.');
