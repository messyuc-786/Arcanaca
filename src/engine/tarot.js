import {cards} from '../data/cards.js';

export const POSITIONS=['Situation','Challenge','Guidance'];

export function shuffleDeck(input=cards){const deck=[...input];for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}

export function createReading(question=''){return{question:question.trim(),deck:shuffleDeck(),selected:[]}}

export function drawCard(state,cardId,position){
  if(!POSITIONS.includes(position))throw new Error('Invalid spread position');
  if(state.selected.length>=3)throw new Error('Spread already complete');
  if(state.selected.some(c=>c.id===cardId))throw new Error('Card already selected');
  const card=state.deck.find(c=>c.id===cardId);if(!card)throw new Error('Card is not in the current deck');
  const orientation=Math.random()<.5?'Upright':'Reversed';
  return{...state,selected:[...state.selected,{...card,orientation,position}]};
}

// Position-role classification: maps any spread position label (from the core reading or
// any Phase 2 package) to a small set of interpretive roles, so the same card produces
// genuinely different contextual framing depending on where it was drawn. Pattern-based
// rather than an exhaustive per-package map, so it also generalizes to future spreads.
const POSITION_RULES=[
  [/^(situation|current situation|current ground|question|core|present|the heart of the matter)$/i,'situation','what is currently surrounding this question'],
  [/^(challenge|the challenge|obstacle|the tension|tension|root|hope\/fear|hopes and fears)$/i,'challenge','the tension, blockage, or obstacle most worth acknowledging'],
  [/^(guidance|the guidance|direction|the outcome)$/i,'guidance','what the symbolism invites you to consider moving forward'],
  [/^(opportunity)$/i,'opportunity','where openness, potential, or room to grow may be available'],
  [/^(strength|the foundation)$/i,'strength','an inner resource or steadiness already available to you'],
  [/^(you|your attitude)$/i,'self','how you yourself show up in this situation'],
  [/^(the other)$/i,'other','how the other side of this dynamic is symbolically represented — not a claim about their private thoughts or actions'],
  [/^(the dynamic)$/i,'dynamic','the shared pattern or energy moving between both sides'],
  [/^(self)$/i,'self','your own role or self-concept within this pattern'],
  [/^(environment|external influences)$/i,'environment','the external conditions or influences surrounding the situation'],
  [/^(option a|option b)$/i,'option','the symbolic themes bound up in choosing this path'],
  [/^(what to consider|what you may be missing)$/i,'blindspot','a factor that may be easy to overlook from where you stand'],
  [/^(past|near influence|the recent past)$/i,'past','an influence already shaping the present'],
  [/^(the near future|what crowns you)$/i,'timeframe','what may be coming into view or already taking shape above the situation'],
  [/^(january|february|march|april|may|june|july|august|september|october|november|december)$/i,'timeframe','the themes likely to color this period'],
];
function positionRole(position){
  const rule=POSITION_RULES.find(([re])=>re.test(String(position).trim()));
  return rule?{role:rule[1],text:rule[2]}:{role:'general',text:'the focus of this specific position in the spread'};
}

// Layer 2 (traditional meaning) + Layer 3 (spread position) + Layer 4 (question context).
// The traditional meaning is returned verbatim from the card's canonical data and is never
// rewritten by position or question — only the separate `positionContext`/`questionContext`
// fields are built from it. Card identity, orientation and meaning are read-only inputs here;
// this function has no way to alter card, orientation, or selection.
export function buildCardReading(card,orientation,position,question){
  const reversed=orientation==='Reversed';
  const traditionalMeaning=reversed?card.reversedMeaning:card.uprightMeaning;
  const keywords=reversed?card.reversedKeywords:card.uprightKeywords;
  const themes=(reversed?card.reversedThemes:card.uprightThemes)||keywords;
  const {text:positionText}=positionRole(position);
  const positionLabel=String(position).replace(/^the\s+/i,'');
  const positionContext=`In the ${positionLabel} position, ${card.name} (${orientation}) points attention toward ${positionText}.`;
  const keyword=keywords[0];
  const questionContext=question&&question.trim()
    ?`For “${question.trim()}”, consider how ${keyword} — as it shows up ${reversed?'in its reversed, more inward form':'in its upright form'} — relates to this position, without treating the card as a certain prediction.`
    :`Consider how ${keyword} relates to this position, without treating the card as a certain prediction.`;
  return{
    card,orientation,position,
    traditionalMeaning,
    keywords,themes,
    positionContext,questionContext,
    interpretation:`${positionContext} ${questionContext}`,
    // kept for backward compatibility with earlier callers/tests that read `.contextual`
    contextual:`${positionContext} ${questionContext}`
  };
}

// Layer 5: cross-card synthesis. Looks at the whole spread — orientations, positions,
// suits, Major Arcana emphasis, and recurring or contrasting themes — rather than
// concatenating each card's individual reading.
function analyzeSpread(readings){
  const majors=readings.filter(r=>r.card.arcana==='Major');
  const minors=readings.filter(r=>r.card.arcana==='Minor');
  const suitCounts={};
  for(const r of minors){suitCounts[r.card.suit]=(suitCounts[r.card.suit]||0)+1}
  const dominantSuit=Object.entries(suitCounts).sort((a,b)=>b[1]-a[1])[0];
  const reversedCount=readings.filter(r=>r.orientation==='Reversed').length;
  const themeCounts=new Map();
  for(const r of readings){for(const theme of r.themes){themeCounts.set(theme,(themeCounts.get(theme)||0)+1)}}
  const recurringThemes=[...themeCounts.entries()].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).map(([theme])=>theme);
  const allThemes=[...new Set(readings.flatMap(r=>r.themes))];
  return{majors,minors,dominantSuit,reversedCount,recurringThemes,allThemes};
}

function buildStory(readings,question,spreadLabel){
  const{majors,dominantSuit,reversedCount,recurringThemes}=analyzeSpread(readings);
  const first=readings[0],last=readings[readings.length-1];
  const sentences=[];
  sentences.push(majors.length===0
    ?`None of the cards drawn for this ${spreadLabel} are Major Arcana, suggesting the spread centers on everyday, situational patterns rather than a sweeping life theme.`
    :majors.length===1
      ?`${majors[0].card.name} appears in the ${majors[0].position} position as the spread's one Major Arcana card, marking that position as the most significant life-theme influence here.`
      :`${majors.length} of the ${readings.length} cards drawn (${majors.map(m=>m.card.name).join(', ')}) are Major Arcana, suggesting this ${spreadLabel} touches on larger, more significant themes rather than only day-to-day detail.`
  );
  if(dominantSuit&&dominantSuit[1]>=2){
    sentences.push(`A recurring presence of ${dominantSuit[0]} (${dominantSuit[1]} card${dominantSuit[1]>1?'s':''}) points toward ${dominantSuit[0]==='Cups'?'emotional currents':dominantSuit[0]==='Wands'?'action and momentum':dominantSuit[0]==='Swords'?'thought and decision-making':'practical, material concerns'} running through the spread.`);
  }
  if(recurringThemes.length){
    sentences.push(`The theme of ${recurringThemes[0]} surfaces in more than one card, which is worth paying particular attention to.`);
  }
  if(reversedCount>=Math.ceil(readings.length/2)&&readings.length>1){
    sentences.push(`With ${reversedCount} of ${readings.length} cards reversed, this spread leans toward inward, less visible expressions of its themes rather than outward action.`);
  }
  sentences.push(`${first.card.name} in ${first.position} and ${last.card.name} in ${last.position} frame the arc of this reading.`);
  sentences.push(`For “${question||'your question'}”, treat this as a framework for reflection — not a guaranteed outcome.`);
  return sentences.join(' ');
}

function buildHighlights(readings){
  const{recurringThemes,allThemes}=analyzeSpread(readings);
  const ordered=[...recurringThemes,...allThemes.filter(t=>!recurringThemes.includes(t))];
  return ordered.slice(0,8);
}

function buildReflection(readings){
  const{majors,recurringThemes}=analyzeSpread(readings);
  const prompts=[];
  if(recurringThemes.length){
    prompts.push(`${recurringThemes[0]} shows up more than once in this spread — where do you already recognize it in your situation?`);
  }
  if(majors.length){
    prompts.push(`${majors[0].card.name} stood out as Major Arcana in the ${majors[0].position} position — what would it mean to take that position more seriously?`);
  }
  const first=readings[0],last=readings[readings.length-1];
  prompts.push(`What would change if you approached ${first.card.name} (${first.position}) with more awareness?`);
  if(last!==first){prompts.push(`What practical step would let you explore the guidance of ${last.card.name} (${last.position})?`)}
  return prompts.slice(0,4);
}

export function buildSynthesis(selected,question){
  const readings=selected.map(c=>buildCardReading(c,c.orientation,c.position,question));
  return{
    readings,
    story:buildStory(readings,question,'3-card reading'),
    themes:buildHighlights(readings),
    reflection:buildReflection(readings)
  };
}

export function createPackageReading(question='', packageDefinition){
  if(!packageDefinition || !Array.isArray(packageDefinition.positions) || packageDefinition.positions.length!==packageDefinition.cards) throw new Error('Invalid package definition');
  return {question:question.trim(),packageId:packageDefinition.id,packageName:packageDefinition.name,positions:[...packageDefinition.positions],cardCount:packageDefinition.cards,deck:shuffleDeck(),selected:[]};
}

export function drawPackageCard(state,cardId){
  if(state.selected.length>=state.cardCount) throw new Error('Package reading is complete');
  if(state.selected.some(c=>c.id===cardId)) throw new Error('Card already selected');
  const card=state.deck.find(c=>c.id===cardId); if(!card) throw new Error('Card is not in the current deck');
  const position=state.positions[state.selected.length];
  const orientation=Math.random()<.5?'Upright':'Reversed';
  return {...state,selected:[...state.selected,{...card,orientation,position}]};
}

export function buildPackageSynthesis(state){
  const readings=state.selected.map(c=>buildCardReading(c,c.orientation,c.position,state.question));
  return{
    readings,
    story:buildStory(readings,state.question,`${state.packageName} spread`),
    themes:buildHighlights(readings),
    reflection:buildReflection(readings)
  };
}
