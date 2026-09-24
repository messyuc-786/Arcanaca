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

// Everyday-life translation + reflection layer. Maps a card's own themes/keywords to one
// of a small set of relatable human situations (never invented per-card — the same
// vocabulary the card's own traditional themes already use), then renders hedged,
// non-deterministic language ("you may...", "this can sometimes reflect...") rather than
// dictionary definitions or predictions. Deliberately pattern-based like positionRole()
// above, so it scales to all 78 cards without hand-authoring 78 separate essays.
const LIFE_SITUATIONS=[
  [/uncertain|confus|ambigu|doubt|indecision|illusion/i,'uncertain',
    (k)=>`Sometimes this can reflect the experience of not having a clear picture yet — when ${k} is present but the next step still feels foggy, and you're piecing things together with incomplete information.`,
    (k)=>`In its reversed form, this may point to confusion that's starting to lift, or to a moment where you're realizing you've been unsure about something you assumed was settled.`],
  [/restrict|stuck|blocked|delay|stagnat|paraly|bound/i,'stuck',
    (k)=>`You may recognize this as the feeling of being stuck — knowing something needs to shift, while overthinking, fear, or circumstance makes the first move feel harder than it probably needs to be.`,
    (k)=>`Reversed, this can sometimes describe the early movement out of that stuck feeling — a small opening appearing, even if the way forward isn't fully clear yet.`],
  [/wait|patience|rest|pause|reflect/i,'waiting',
    (k)=>`This can sometimes speak to a season of waiting — where the honest answer right now may be that nothing is fully resolved yet, and that's not the same as nothing happening.`,
    (k)=>`In reverse, this may reflect impatience with that waiting, or a sense that you're being pulled to act before you're actually ready.`],
  [/love|union|partnership|connection|relationship|romance|attraction/i,'connection',
    (k)=>`You might recognize this in how a relationship or connection actually feels day to day — the parts that feel steady, and the parts that still feel like they're being figured out.`,
    (k)=>`Reversed, this can sometimes point toward imbalance in that connection, or a mismatch between how two people are each experiencing the same situation.`],
  [/change|transition|transformation|new beginning|upheaval|rebirth/i,'change',
    (k)=>`This can sometimes reflect being in the middle of a change you didn't fully choose, or one you chose but are still adjusting to — where the old way of doing things no longer quite fits.`,
    (k)=>`In reverse, this may describe resistance to a change that feels necessary, or change that's happening more slowly and internally than it looks from the outside.`],
  [/confidence|courage|strength|assertion|power|will/i,'confidence',
    (k)=>`You may notice this showing up as a quiet test of confidence — a moment where trusting your own judgment matters more than having outside confirmation that you're right.`,
    (k)=>`Reversed, this can sometimes reflect self-doubt, or strength that's being used to hold something together rather than to move forward.`],
  [/boundary|protection|isolation|withdrawal|solitude/i,'boundaries',
    (k)=>`This can sometimes relate to boundaries — noticing where you've been giving more access, time, or energy than actually feels sustainable.`,
    (k)=>`In reverse, this may point to a boundary that's become a wall, or withdrawal that's protecting you but also isolating you.`],
  [/hope|renewal|faith|inspiration|optimism/i,'hope',
    (k)=>`You might recognize this as a small return of hope or perspective — not a guarantee that things resolve a certain way, just a sense that they can.`,
    (k)=>`Reversed, this can sometimes reflect hope that feels harder to access right now, or disappointment that's made it harder to trust that things will improve.`],
  [/loneliness|isolation|solitude|abandon/i,'loneliness',
    (k)=>`This can sometimes describe a quieter kind of loneliness — not necessarily being alone, but feeling unseen or misunderstood in a specific situation.`,
    (k)=>`In reverse, this may point toward reconnecting after a period of distance, or recognizing support that was there but hard to notice.`],
  [/choice|decision|crossroads|dilemma|option/i,'decision',
    (k)=>`You may recognize this as the weight of a decision that keeps circling back — where every option has a real cost, and waiting for total certainty may not be realistic.`,
    (k)=>`Reversed, this can sometimes reflect a decision you've quietly already made, even if you haven't said it out loud yet.`],
  [/growth|learning|wisdom|maturity|lesson/i,'growth',
    (k)=>`This can sometimes reflect a slower kind of growth — the sort that only becomes obvious in hindsight, rather than a single visible turning point.`,
    (k)=>`In reverse, this may point to a lesson that's resurfacing because it wasn't fully absorbed the first time it appeared.`],
  [/loss|grief|disappointment|sadness|regret|ending/i,'loss',
    (k)=>`You might recognize this as processing a disappointment or ending — where it's still reasonable to feel its weight even if, logically, you understand why it happened.`,
    (k)=>`Reversed, this can sometimes reflect the beginning of acceptance, or grief that's easing without fully disappearing.`],
  [/overthink|anxiety|worry|mental|obsess|racing/i,'overthinking',
    (k)=>`This can sometimes reflect a mind that won't stop turning something over — replaying the same question without landing anywhere new.`,
    (k)=>`In reverse, this may point to that mental noise starting to quiet, or to catching yourself mid-spiral more often than before.`],
  [/work|career|ambition|achievement|labor|effort|success/i,'work',
    (k)=>`You may recognize this in a work or effort-related situation — where the amount you're putting in doesn't yet match the clarity you have about where it's leading.`,
    (k)=>`Reversed, this can sometimes reflect burnout, or effort that's being spent in a direction that no longer feels worth it.`],
];
export function lifeSituation(card,reversed){
  const themes=(reversed?card.reversedThemes:card.uprightThemes)||[];
  const keywords=(reversed?card.reversedKeywords:card.uprightKeywords)||[];
  const haystack=[...themes,...keywords].join(' ');
  const match=LIFE_SITUATIONS.find(([re])=>re.test(haystack));
  const keyword=keywords[0]||themes[0]||'this card’s themes';
  if(!match)return reversed
    ?`In its reversed form, this can sometimes reflect a more internal or delayed version of ${keyword} — present, but not yet outwardly visible.`
    :`You may recognize ${keyword} showing up in an ordinary, everyday way — not as a dramatic event, but as something quietly present in how a situation feels.`;
  const[,,upright,reversedText]=match;
  return reversed?reversedText(keyword):upright(keyword);
}
export function whatToConsider(card,reversed,positionRole_){
  const keywords=(reversed?card.reversedKeywords:card.uprightKeywords)||[];
  const keyword=keywords[0]||'what this card is highlighting';
  const byRole={
    situation:`you might consider naming, as plainly as you can, what's actually true about the situation right now — separate from what you're assuming or fearing`,
    challenge:`you might consider which part of this is genuinely outside your control, and which part you've been treating as fixed when it may not be`,
    guidance:`you might consider one small, low-stakes step that doesn't require the whole path to be figured out first`,
    opportunity:`you might consider what taking this opportunity would actually cost you, and whether that trade still feels worth it`,
    strength:`you might consider where you've already handled something similar before, even if it doesn't feel that way right now`,
    self:`you might consider how your own role in this has been shifting, separate from anyone else's part in it`,
    other:`you might consider what you can only observe from your side of this, without assuming you know the other person's private reasoning`,
    dynamic:`you might consider what pattern keeps repeating between the people involved, rather than focusing only on the most recent moment`,
    environment:`you might consider which outside pressures are genuinely relevant here, and which ones you've been giving more weight than they deserve`,
    option:`you might consider what you'd choose if you removed the fear of choosing wrong, at least as a thought experiment`,
    blindspot:`you might consider asking someone you trust what they notice about this situation that you might be too close to see`,
    past:`you might consider what from this past influence is still useful to carry forward, and what may be worth setting down`,
    timeframe:`you might consider treating this as one possible chapter rather than the whole story`,
    general:`you might consider sitting with ${keyword} for a moment before deciding what, if anything, it's asking of you`
  };
  const possibility=byRole[positionRole_]||byRole.general;
  return `Rather than a fixed answer, ${possibility} — without needing the entire situation figured out at once.`;
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
  const {role,text:positionText}=positionRole(position);
  const positionLabel=String(position).replace(/^the\s+/i,'');
  const positionContext=`In the ${positionLabel} position, ${card.name} (${orientation}) points attention toward ${positionText}.`;
  const keyword=keywords[0];
  const questionContext=question&&question.trim()
    ?`For “${question.trim()}”, consider how ${keyword} — as it shows up ${reversed?'in its reversed, more inward form':'in its upright form'} — relates to this position, without treating the card as a certain prediction.`
    :`Consider how ${keyword} relates to this position, without treating the card as a certain prediction.`;
  return{
    card,orientation,position,role,
    traditionalMeaning,
    keywords,themes,
    positionContext,questionContext,
    // Layers 6/7 — everyday-life translation and a possibility (never instruction) framed
    // suggestion. Reflective/hedged by construction (see LIFE_SITUATIONS templates above),
    // never a prediction or directive.
    everydayLife:lifeSituation(card,reversed),
    whatToConsider:whatToConsider(card,reversed,role),
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

// "What You Might Notice" — 2-4 observations generated from the actual spread's real
// analysis (analyzeSpread), never a static paragraph. Distinct from buildReflection
// (which asks questions) and buildHighlights (which just lists theme words).
function buildNoticings(readings){
  const{majors,dominantSuit,reversedCount,recurringThemes}=analyzeSpread(readings);
  const notes=[];
  if(majors.length>=2){
    notes.push(`More than one Major Arcana card appeared here — ${majors.map(m=>m.card.name).join(' and ')} — which can suggest this reading is carrying more weight than an ordinary day-to-day question.`);
  }
  if(dominantSuit&&dominantSuit[1]>=2){
    const flavor=dominantSuit[0]==='Cups'?'emotional currents':dominantSuit[0]==='Wands'?'action, drive, and momentum':dominantSuit[0]==='Swords'?'thinking, decisions, and mental noise':'practical, day-to-day concerns';
    notes.push(`${dominantSuit[1]} cards from ${dominantSuit[0]} appeared, pointing toward ${flavor} running underneath more than one part of this spread.`);
  }
  if(recurringThemes.length){
    notes.push(`The theme of ${recurringThemes[0]} shows up more than once — worth noticing where it's already present in how you're thinking about this.`);
  }
  if(readings.length>1&&reversedCount>=Math.ceil(readings.length/2)){
    notes.push(`With ${reversedCount} of ${readings.length} cards reversed, this spread leans inward — toward something still being processed internally rather than acted on outwardly.`);
  } else if(reversedCount===0&&readings.length>1){
    notes.push(`Every card in this spread is upright, which can point toward things being fairly visible and out in the open right now, rather than hidden or held back.`);
  }
  if(notes.length===0){
    notes.push(`Each card here points in a slightly different direction without one single dominant theme — it may be more useful to read them side by side than to look for one unifying answer.`);
  }
  return notes.slice(0,4);
}

// "The Story Between Your Cards" — relationships between specific card pairs (support,
// contrast, tension, progression, repetition, balance), derived from real shared/opposed
// themes, arcana, and orientation. Only reported when a pair actually shows one of these
// patterns — never manufactured for pairs with nothing meaningful in common.
function cardRelationship(a,b){
  const sharedTheme=a.themes.find(t=>b.themes.includes(t));
  if(sharedTheme){
    return `${a.card.name} (${a.position}) and ${b.card.name} (${b.position}) both carry a thread of ${sharedTheme} — a repetition worth paying attention to rather than treating as a coincidence.`;
  }
  if(a.orientation!==b.orientation){
    const up=a.orientation==='Upright'?a:b,rev=a.orientation==='Reversed'?a:b;
    return `${up.card.name} (${up.position}) and ${rev.card.name} (${rev.position}) sit in contrast — one oriented outward and visible, the other reversed and more internal, which may point to a tension between how a situation looks and how it actually feels.`;
  }
  if(a.card.arcana==='Major'&&b.card.arcana==='Major'){
    return `${a.card.name} (${a.position}) and ${b.card.name} (${b.position}), both Major Arcana, suggest a movement from ${a.themes[0]} toward ${b.themes[0]} running through this reading.`;
  }
  if(a.card.suit&&b.card.suit&&a.card.suit!==b.card.suit){
    return `${a.card.name} (${a.position}) and ${b.card.name} (${b.position}) draw on different energies — ${a.themes[0]} alongside ${b.themes[0]} — which can create a kind of balance between two different parts of the same situation.`;
  }
  return null;
}
function buildRelationships(readings){
  if(readings.length<2)return[];
  const pairs=[];
  for(let i=0;i<readings.length-1;i++){
    const rel=cardRelationship(readings[i],readings[i+1]);
    if(rel)pairs.push(rel);
    if(pairs.length>=3)break;
  }
  return pairs;
}

// "What Remains Your Choice" — the closing statement returning agency to the user. Fixed
// language by design (this is a philosophy statement, not something that should vary card
// to card), but kept as its own function/field so the UI renders it deliberately rather
// than folding it into the story paragraph.
function buildAgency(){
  return 'The cards can offer another perspective, but they don’t make the decision for you. Take what resonates, leave what doesn’t, and decide what feels right for you.';
}

export function buildSynthesis(selected,question){
  const readings=selected.map(c=>buildCardReading(c,c.orientation,c.position,question));
  return{
    readings,
    story:buildStory(readings,question,'3-card reading'),
    themes:buildHighlights(readings),
    reflection:buildReflection(readings),
    noticings:buildNoticings(readings),
    relationships:buildRelationships(readings),
    agency:buildAgency()
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
    reflection:buildReflection(readings),
    noticings:buildNoticings(readings),
    relationships:buildRelationships(readings),
    agency:buildAgency()
  };
}
