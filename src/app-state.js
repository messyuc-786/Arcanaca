export const SCREENS=['home','question','spread','shuffle','select','reveal','reading','packages','package-question','package-select','package-reveal','package-reading','about','how','readings','reading-detail','shared','decks'];
export function nextPosition(selectedCount){return ['Situation','Challenge','Guidance'][selectedCount]||null}
export function canReveal(selectedCount){return selectedCount>0&&selectedCount<=3}
export function nextAfterReveal(selectedCount){return selectedCount<3?'select':'reading'}
export function resetState(){return{screen:'home',question:'',reading:null,packageId:null,packageReading:null,revealedIndex:null,language:'en',readingDetailId:null,sharedPayload:null,deckId:'rws',menuOpen:false}}
