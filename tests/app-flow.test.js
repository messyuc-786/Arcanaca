import test from 'node:test';
import assert from 'node:assert/strict';
import {SCREENS,nextPosition,canReveal,nextAfterReveal,resetState} from '../src/app-state.js';
import {copy} from '../src/i18n.js';

test('i18n: English and Hindi copy define exactly the same set of keys',()=>{
  assert.deepEqual(Object.keys(copy.en).sort(),Object.keys(copy.hi).sort());
});
const APPROVED_SCREENS=['home','question','spread','shuffle','select','reveal','reading','packages','package-question','package-select','package-reveal','package-reading','about','how','readings','reading-detail','shared','decks'];
test('app exposes all approved screens without a one-card reading',()=>{assert.deepEqual(SCREENS,APPROVED_SCREENS);assert.equal(SCREENS.includes('one-card'),false)})
test('three-card flow advances by position',()=>{assert.equal(nextPosition(0),'Situation');assert.equal(nextPosition(1),'Challenge');assert.equal(nextPosition(2),'Guidance');assert.equal(nextPosition(3),null);assert.equal(nextAfterReveal(1),'select');assert.equal(nextAfterReveal(3),'reading');assert.equal(canReveal(0),false);assert.equal(canReveal(2),true)})
test('reset returns to home with no reading state',()=>{assert.deepEqual(resetState(),{screen:'home',question:'',reading:null,packageId:null,packageReading:null,revealedIndex:null,language:'en',readingDetailId:null,sharedPayload:null,deckId:'rws',menuOpen:false})})


test('package flow has package select, question, deck, reveal, and reading screens',()=>{
  assert.deepEqual(SCREENS,APPROVED_SCREENS);
});

test('reading history flow has a list screen and a detail screen',()=>{
  assert.ok(SCREENS.includes('readings'));
  assert.ok(SCREENS.includes('reading-detail'));
});

test('package reset clears selected package and package reading',()=>{
  const reset=resetState();
  assert.equal(reset.packageId,null);
  assert.equal(reset.packageReading,null);
});
