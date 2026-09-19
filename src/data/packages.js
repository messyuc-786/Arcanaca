// Data-driven spread definitions. Every field the engine and UI need (id, name, card count,
// positions) lives here — src/engine/tarot.js's createPackageReading/drawPackageCard and
// main.js's package screens are generic over this array and never branch per spread id.
// `category` is descriptive metadata only (for a future filtered catalog view); it has no
// effect on reading behavior or card integrity.
export const packages=[
{id:'question',name:'The Question',subtitle:'A focused three-card reading',category:'decision',cards:3,positions:['Question','Challenge','Guidance'],description:'A direct spread for one clearly stated question.'},
{id:'connection',name:'The Connection',subtitle:'Explore a relationship dynamic',category:'relationship',cards:5,positions:['You','The Other','The Dynamic','The Tension','The Guidance'],description:'A relationship spread focused on dynamics and reflection, not claims about another person’s private behavior.'},
{id:'path',name:'The Path',subtitle:'Work, direction and priorities',category:'career',cards:5,positions:['Current Ground','Strength','Obstacle','Opportunity','Guidance'],description:'A practical spread for exploring work and direction.'},
{id:'crossroads',name:'The Crossroads',subtitle:'Examine a decision',category:'decision',cards:5,positions:['Current Situation','Option A','Option B','What to Consider','Guidance'],description:'Compare symbolic themes around a choice without predicting the outcome.'},
{id:'year',name:'The Year Ahead',subtitle:'A twelve-part reflective spread',category:'self-reflection',cards:12,positions:['January','February','March','April','May','June','July','August','September','October','November','December'],description:'A month-by-month reflective spread; not a promise of future events.'},
{id:'deep-dive',name:'Deep Dive',subtitle:'An extended Tarot exploration',category:'self-reflection',cards:10,positions:['Core','Challenge','Root','Past','Present','Near Influence','Self','Environment','Hope/Fear','Guidance'],description:'An extended symbolic reading using a ten-card structure.'},
{id:'celtic-cross',name:'The Celtic Cross',subtitle:'The classic ten-card Tarot spread',category:'self-reflection',cards:10,positions:['The Heart of the Matter','The Challenge','The Foundation','The Recent Past','What Crowns You','The Near Future','Your Attitude','External Influences','Hopes and Fears','The Outcome'],description:'The most traditional Tarot spread — a broad, structured look at a situation from its roots to where it may be heading.'}
];
