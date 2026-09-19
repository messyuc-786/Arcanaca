// Downloads the 78-card Rider-Waite-Smith deck from Wikimedia Commons (public domain,
// 1909 Pamela Colman Smith deck) into public/deck/, keyed by each card's imageCode so
// cardImageUrl() in src/data/cards.js can serve them locally instead of depending on a
// third-party host at runtime.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {cards} from '../src/data/cards.js';

const CACHE_PATH=new URL('.urlmap-cache.json',import.meta.url);

const MAJOR_NAMES=['Fool','Magician','High Priestess','Empress','Emperor','Hierophant','Lovers','Chariot','Strength','Hermit','Wheel of Fortune','Justice','Hanged Man','Death','Temperance','Devil','Tower','Star','Moon','Sun','Judgement','World'];
const SUIT_PREFIX={Wands:'Wands',Cups:'Cups',Swords:'Swords',Pentacles:'Pents'};

function wikiFilenameFor(card){
  if(card.arcana==='Major') return `RWS Tarot ${String(card.number).padStart(2,'0')} ${MAJOR_NAMES[card.number]}.jpg`;
  return `${SUIT_PREFIX[card.suit]}${String(card.number).padStart(2,'0')}.jpg`;
}

async function resolveUrls(filenames){
  const map={};
  for(let i=0;i<filenames.length;i+=50){
    const batch=filenames.slice(i,i+50);
    const url=new URL('https://commons.wikimedia.org/w/api.php');
    url.search=new URLSearchParams({action:'query',titles:batch.map(f=>`File:${f}`).join('|'),prop:'imageinfo',iiprop:'url',format:'json'}).toString();
    let res,attempt=0;
    while(true){
      res=await fetch(url);
      if(res.ok) break;
      attempt++;
      if(attempt>4) throw new Error(`Commons API failed: ${res.status}`);
      await new Promise(r=>setTimeout(r,attempt*2000));
    }
    const data=await res.json();
    for(const page of Object.values(data.query.pages)){
      const title=page.title.replace(/^File:/,'');
      if(!page.imageinfo) throw new Error(`No image found for ${title}`);
      map[title]=page.imageinfo[0].url.split('?')[0];
    }
  }
  return map;
}

const filenames=cards.map(wikiFilenameFor);
// Cache the resolved Commons URLs locally: the lookup API is rate-limited and the file
// URLs are stable, so re-running this script (e.g. after a fresh clone) doesn't need to
// re-resolve every filename if a recent cache is already present.
let urlMap;
if(existsSync(CACHE_PATH)){
  urlMap=JSON.parse(await readFile(CACHE_PATH,'utf8'));
}else{
  urlMap=await resolveUrls(filenames);
  await writeFile(CACHE_PATH,JSON.stringify(urlMap,null,2));
}
await mkdir('public/deck',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let downloaded=0,skipped=0;
for(const card of cards){
  const dest=`public/deck/${card.imageCode}.jpg`;
  if(existsSync(dest)){skipped++;continue}
  const filename=wikiFilenameFor(card);
  const url=urlMap[filename];
  let res,attempt=0;
  while(true){
    res=await fetch(url);
    if(res.ok) break;
    attempt++;
    if(attempt>5) throw new Error(`Failed to download ${card.name} from ${url}: ${res.status}`);
    await sleep(attempt*3000);
  }
  await writeFile(dest,Buffer.from(await res.arrayBuffer()));
  console.log(card.name);
  downloaded++;
  await sleep(600);
}
console.log(`Downloaded ${downloaded} cards, ${skipped} already present, ${downloaded+skipped}/${cards.length} total in public/deck/.`);
