/* Self-contained Node tests for pure domain logic. npm install supplies TypeScript. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const project=path.join(__dirname,'..');
function loadTS(relative) {
  const source=fs.readFileSync(path.join(project,relative),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',compiled)(require,module,module.exports);
  return module.exports;
}
const {validAge,goalFor,scoreHours,validHours,localDay,isDuplicateDay}=loadTS('src/services/sleepRules.ts');
const {advanceGreenhouse}=loadTS('src/services/growth.ts');
const {newGreenhouse}=loadTS('src/domain/models.ts');
function check(name,fn) {fn();console.log('PASS',name);}
check('Age rules parent 18–99, child 5–17',()=>{
  assert.equal(validAge(17,'parent'),false);assert.equal(validAge(18,'parent'),true);assert.equal(validAge(99,'parent'),true);
  assert.equal(validAge(4,'child'),false);assert.equal(validAge(5,'child'),true);assert.equal(validAge(17,'child'),true);assert.equal(validAge(18,'child'),false);
});
check('Child goal brackets',()=>{
  assert.deepEqual([5,6,12,13,17].map(x=>goalFor(x,'child').min),[10,9,9,8,8]);
});
check('Adult goal brackets',()=>{
  assert.deepEqual([18,60,61,64,65,99].map(x=>goalFor(x,'parent').max),[null,null,9,9,8,8]);
});
check('Sleep scores inside, below, and above ranges',()=>{
  assert.equal(scoreHours(5,10,'child').score,100);
  assert.equal(scoreHours(5,0,'child').score,0);
  assert.equal(scoreHours(5,5,'child').score,50);
  assert.equal(scoreHours(15,12,'child').score,83);
  assert.equal(scoreHours(25,8,'parent').score,100);
  assert.equal(validHours(-1),false);assert.equal(validHours(24.1),false);assert.equal(validHours(0),true);
  assert.throws(()=>scoreHours(14,25,'child'));
});
check('Duplicate daily entries are detected per child',()=>{
  assert.equal(isDuplicateDay([{day:'2026-10-16'}],'2026-10-16'),true);
  assert.equal(isDuplicateDay([{day:'2026-10-16'}],'2026-10-17'),false);
});
check('Date uses local day format',()=>{
  assert.equal(localDay(new Date(2026,9,16)), '2026-10-16');
});
check('Seven perfect days complete exactly one plant',()=>{
  let g=newGreenhouse();
  for(let n=0;n<7;n++)g=advanceGreenhouse(g,100,100,String(n),'2026-10-16').greenhouse;
  assert.equal(g.completedPlants.length,1);
  assert.equal(g.completedPlants[0].plantType,'sunflower');
  assert.equal(g.currentPlantType,'tulip');
  assert.ok(g.growthPercent < 1e-8);
});
check('Partial points reduce growth and surplus carries over',()=>{
  const start={...newGreenhouse(),growthPercent:95};
  const next=advanceGreenhouse(start,100,50,'x','2026-10-16');
  assert.equal(next.greenhouse.completedPlants.length,1);
  assert.ok(next.greenhouse.growthPercent>2);
  assert.ok(next.greenhouse.growthPercent<3);
});
check('Consent and local-only implementation present',()=>{
  for(const target of ['src/app/privacy.tsx','src/app/settings.tsx','src/app/history.tsx','src/app/sleep-entry.tsx','src/data/persistence.native.ts','src/data/persistence.web.ts']) {
    assert.equal(fs.existsSync(path.join(project,target)),true,target);
  }
});

check('Policy documents have structured, complete sections', () => {
  const { POLICY_DOCUMENTS, POLICY_VERSIONS } = loadTS('src/constants/policies.ts');
  for (const key of ['terms', 'privacy', 'health', 'research']) {
    const d = POLICY_DOCUMENTS[key];
    assert.equal(d.key, key);
    assert.equal(d.version, POLICY_VERSIONS[key]);
    assert.ok(d.introduction.length >= 60);
    assert.ok(d.sections.length >= 5);
    assert.ok(d.sections.every(s => s.heading.length && s.paragraphs.every(p => p.length > 35)));
  }
});
check('One exact university-approval note appears in the app', () => {
  const note = 'Development copies only. Auburn must approve final materials before research collection or release.';
  const root = path.join(project, 'src');
  let occurrences = 0;
  function scan(dir) {
    for (const file of fs.readdirSync(dir, {withFileTypes:true})) {
      const full = path.join(dir, file.name);
      if (file.isDirectory()) scan(full);
      else if (/\.(tsx?|jsx?)$/.test(file.name)) {
        const text=fs.readFileSync(full,'utf8');
        occurrences += text.split(note).length-1;
        assert.ok(!/DEVELOPMENT DRAFT|pending Auburn review|not university-approved/i.test(text), full);
      }
    }
  }
  scan(root);
  assert.equal(occurrences,1);
});
