const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const { confirmInstruction, canSchedule, answerFromInstruction } = load('lib/carePlan.ts')
const draft = { id:'d',personId:'p',text:'Llevar estudios',sourceId:'doc',sourceDate:'2026-09-15',professional:'Profesional ficticio',status:'draft',confirmedBy:null,confirmedAt:null,dueAt:'2026-10-01T10:00:00-03:00' }
test('draft cannot schedule or be presented as confirmed instruction',()=>{assert.equal(canSchedule(draft),false);assert.match(answerFromInstruction(draft),/no está confirmada/)})
test('confirmation preserves source and exact text and enables task',()=>{const result=confirmInstruction(draft,'actor','2026-09-21T10:00:00Z');assert.equal(canSchedule(result),true);assert.equal(result.text,draft.text);assert.equal(draft.status,'draft');assert.match(answerFromInstruction(result),/Fuente: doc/)})
test('missing provenance or actor prevents confirmation',()=>{for(const key of ['sourceId','sourceDate','professional','personId','text'])assert.throws(()=>confirmInstruction({...draft,[key]:''},'actor','2026-09-21T10:00:00Z'));assert.throws(()=>confirmInstruction(draft,'','2026-09-21T10:00:00Z'))})
test('superseded indication and invalid dates cannot generate a task',()=>{const confirmed=confirmInstruction(draft,'actor','2026-09-21T10:00:00Z');assert.equal(canSchedule({...confirmed,status:'superseded'}),false);assert.equal(canSchedule({...confirmed,dueAt:'tomorrow'}),false);assert.throws(()=>confirmInstruction({...draft,status:'superseded'},'actor','2026-09-21T10:00:00Z'))})
