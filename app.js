/* ========= Config ========= */
const TEAM_ID = 57;
let   GENDER  = "mens-college-basketball";
const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball";

/* ===== Your live services ===== */
const NETLIFY_ODDS_FN = "https://gatorshoop.netlify.app/.netlify/functions/odds";
const SUPABASE_URL  = "https://rydpaqzentkqlwjgxpbt.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHBhcXplbnRrcWx3amd4cGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDczOTgsImV4cCI6MjA3Nzg4MzM5OH0.dyw38h9QOLHXLaERz9aG-3fvup70lKoDaFfzEBTNqjg";

/* ===== Supabase client ===== */
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* Photos (hero) */
const CHAMPIONSHIP_PHOTOS = [
  "https://img.youtube.com/vi/igDpFxg60qU/maxresdefault.jpg",
  "https://img.youtube.com/vi/ww6n-Y9ygeg/maxresdefault.jpg",
  "https://img.youtube.com/vi/kuPmLVeXXac/maxresdefault.jpg",
  "https://img.youtube.com/vi/2Skv3IYAdUE/maxresdefault.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"
];

/* ---- Roster fallback ---- */
/* UF official headshots (Sidearm). Add more as needed. */
const UF_HEADSHOTS = {
  "Alex Condon": "https://images.sidearmdev.com/resize?height=300&type=webp&url=https%3A%2F%2Fdxbhsrqyrr690.cloudfront.net%2Fsidearm.nextgen.sites%2Fgatorzone.com%2Fimages%2F2025%2F9%2F12%2FCONDON_ALEX_FLORIDA_21_M1NWw.jpg",
  // Add more known ones the same way, e.g.:
  // "Boogie Fland": "<UF headshot url>",
  // "Thomas Haugh": "<UF headshot url>",
  // ...
};
/* Link to official UF profile (so users can tap through to verify) */
function ufProfileUrl(fullName){
  // simple slug builder: "First Last" -> "first-last"
  const slug = String(fullName||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-");
  return `https://floridagators.com/sports/mens-basketball/roster/${slug}`;
}
const ROSTER_FALLBACK = [
  { id:"4576218", number:"0",  fullName:"Boogie Fland",      position:"G",  classYear:"So.", height:"6'3\"",  weight:"185" },
  { id:"4684980", number:"1",  fullName:"Xaivian Lee",       position:"G",  classYear:"Sr.", height:"6'4\"",  weight:"180" },
  { id:"4683741", number:"3",  fullName:"Micah Handlogten",  position:"C",  classYear:"Sr.", height:"7'1\"",  weight:"260" },
  { id:"5112570", number:"4",  fullName:"Alex Lloyd",        position:"G",  classYear:"Fr.", height:"6'3\"",  weight:"180" },
  { id:"5107057", number:"9",  fullName:"Rueben Chinyelu",   position:"C",  classYear:"Jr.", height:"6'10\"", weight:"265" },
  { id:"5107071", number:"10", fullName:"Thomas Haugh",      position:"F",  classYear:"Jr.", height:"6'9\"",  weight:"215" },
  { id:"5120826", number:"11", fullName:"CJ Ingram",         position:"G",  classYear:"Fr.", height:"6'6\"",  weight:"205" },
  { id:"5113579", number:"12", fullName:"Viktor Mikic",      position:"C",  classYear:"So.", height:"6'11\"", weight:"260" },
  { id:"5114450", number:"20", fullName:"Isaiah Brown",      position:"G",  classYear:"So.", height:"6'4\"",  weight:"210" },
  { id:"5107073", number:"21", fullName:"Alex Condon",       position:"F/C",classYear:"Jr.", height:"6'11\"", weight:"236" },
  { id:"5107207", number:"23", fullName:"AJ Brown",          position:"G",  classYear:"R-Jr.", height:"6'4\"", weight:"210" },
  { id:"5107056", number:"32", fullName:"Olivier Rioux",     position:"C",  classYear:"R-Fr.", height:"7'9\"", weight:"305" }
];

/* ========= DOM ========= */
const $ = (q)=>document.querySelector(q);
const scheduleList = $("#scheduleList");
const rosterList   = $("#rosterList");
const propsWrap    = $("#propsList");
const refreshBtn   = $("#refreshBtn");
const genderSelect = $("#gender");
const newsList     = $("#newsList");
const ticketsList  = $("#ticketsList");
const heroImg      = $("#heroImg");
const prevBtn      = $("#prevBtn");
const nextBtn      = $("#nextBtn");
const propGameSelect   = $("#propGameSelect");
const propPlayerSelect = $("#propPlayerSelect");
const makePropsBtn     = $("#makePropsBtn");
const gameOddsDiv    = $("#gameOdds");
const playerPropsDiv = $("#playerProps");
const lbName = $("#lbName");
const lbSave = $("#lbSave");
const leaderboardDiv = $("#leaderboard");

/* ========= Utils ========= */
function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
async function getJSON(url){ const r=await fetch(url); if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); }
function toGCalDate(dt){ return dt.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"); }
function addHours(date, h){ const d=new Date(date); d.setHours(d.getHours()+h); return d; }
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:"medium", timeStyle:"short"}); }
function nrm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
const GATORS = "florida gators";

/* Robust image */
function safeImg(src, alt, fallback="https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"){
  const img=document.createElement("img");
  img.alt=alt||""; img.loading="lazy"; img.decoding="async"; img.referrerPolicy="no-referrer";
  img.src=src; img.onerror=()=>{ img.onerror=null; img.src=fallback; img.style.objectFit="contain"; };
  return img;
}

/* ========= Tabs ========= */
function activateTab(which){
  const ids=["schedule","roster","props","stats","news","tickets"];
  ids.forEach(id=>{
    $("#tab-"+id)?.setAttribute("aria-selected", String(id===which));
    $("#panel-"+id)?.classList.toggle("active", id===which);
  });
}
document.addEventListener("click",(e)=>{
  const b=e.target.closest(".tab"); if(!b) return;
  e.preventDefault(); activateTab(b.id.replace("tab-",""));
});

/* ========= Hero ========= */
let heroIndex=0;
function setHero(i){
  const arr=CHAMPIONSHIP_PHOTOS;
  heroIndex=(i+arr.length)%arr.length;
  const src=arr[heroIndex];
  heroImg.loading="lazy"; heroImg.decoding="async"; heroImg.referrerPolicy="no-referrer";
  heroImg.onerror=()=>{
    const yt=/img\.youtube\.com\/vi\/([^/]+)\//.exec(src);
    if(yt){ heroImg.onerror=null; heroImg.src=`https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`; heroImg.style.objectFit="cover"; return; }
    heroImg.onerror=null; heroImg.src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"; heroImg.style.objectFit="contain";
  };
  heroImg.src=src;
}
prevBtn.addEventListener("click",()=>setHero(heroIndex-1));
nextBtn.addEventListener("click",()=>setHero(heroIndex+1));

/* ========= ESPN parse ========= */
function parseSchedule(data){
  const events=data?.events??[];
  return events.map(ev=>{
    const comp=ev.competitions?.[0];
    const competitors=comp?.competitors??[];
    const home=competitors.find(c=>c.homeAway==="home");
    const away=competitors.find(c=>c.homeAway==="away");
    const isHome=String(home?.team?.id)===String(TEAM_ID);
    const selfSide=isHome?home:away; const oppSide=isHome?away:home;
    const statusType=comp?.status?.type; const status=statusType?.shortDetail||statusType?.description||"Scheduled";
    const oppTeam=oppSide?.team??{}; const logo=oppTeam?.logos?.[0]?.href;
    const myScore=Number(selfSide?.score); const oppScore=Number(oppSide?.score);
    return { id:ev.id, date:ev.date, opponent:oppTeam.displayName??"Opponent", isHome,
      venue:comp?.venue?.fullName, tv:comp?.broadcasts?.[0]?.names?.[0], status,
      myScore:isNaN(myScore)?undefined:myScore, oppScore:isNaN(oppScore)?undefined:oppScore, opponentLogo:logo };
  }).sort((a,b)=> new Date(a.date)-new Date(b.date));
}
function parseRoster(data){
  const groups=data?.team?.athletes??[]; const players=[];
  for(const g of groups){ for(const it of (g.items??[])){
    let stats={ ppg:0,rpg:0,apg:0,fgp:0,tpp:0,ftp:0,spg:0,bpg:0,topg:0,mpg:0 };
    const season=(it.statistics??[]).find(s=>String(s.name||"").toLowerCase().includes("season"));
    const cats=season?.splits?.categories??[];
    for(const cat of cats){ for(const st of (cat.stats??[])){ const nm=st.name, val=Number(st.value);
      if(nm==="pointsPerGame")stats.ppg=val; if(nm==="reboundsPerGame")stats.rpg=val; if(nm==="assistsPerGame")stats.apg=val;
      if(nm==="fieldGoalPct")stats.fgp=val; if(nm==="threePointPct")stats.tpp=val; if(nm==="freeThrowPct")stats.ftp=val;
      if(nm==="stealsPerGame")stats.spg=val; if(nm==="blocksPerGame")stats.bpg=val; if(nm==="turnoversPerGame")stats.topg=val;
      if(nm==="minutesPerGame")stats.mpg=val;
    } }
    // strong headshot path (works even when ESPN omits headshot.href)
    const pid = String(it.id||"");
    const head = it.headshot?.href || (pid ? `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${pid}.png` : "");
    players.push({ id:pid, fullName:it.displayName, position:it.position?.abbreviation, number:it.jersey,
      classYear:it.class, headshot:head, stats, height:it.displayHeight, weight:it.displayWeight });
  } }
  players.sort((a,b)=> a.fullName.localeCompare(b.fullName));
  return players;
}

/* ========= Simple Elo (fun) ========= */
function buildElo(games){ let elo=1500,K=18; for(const g of games){ if(g.myScore!=null&&g.oppScore!=null){ const diff=g.myScore-g.oppScore, res=diff>0?1:diff<0?0:0.5; const exp=1/(1+Math.pow(10,(1500-elo)/400)); const margin=Math.min(10,Math.abs(diff))/10; elo=elo+K*(res-exp)*(1+margin*0.6); } } return elo; }
function predictWinProb(eloSelf,isHome){ const home= isHome?50:0, opp=1500; return 1/(1+Math.pow(10,((opp-(eloSelf+home))/400))); }

/* ========= Calendar ========= */
function perGameCalendarLinks(game){
  const title=`Florida Gators ${game.isHome?"vs":"@"} ${game.opponent}`;
  const start=new Date(game.date), end=addHours(start,2);
  const loc=game.venue||"TBD"; const details=`TV: ${game.tv||"TBD"} — Auto-generated from Gator Hoops`;
  const uid=`${game.id}@gatorhoops`, dtS=toGCalDate(start), dtE=toGCalDate(end);
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GatorHoops//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
    `UID:${uid}`,`DTSTAMP:${toGCalDate(new Date())}`,`DTSTART:${dtS}`,`DTEND:${dtE}`,
    `SUMMARY:${title}`,`DESCRIPTION:${details}`,`LOCATION:${loc}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
  const icsUrl=URL.createObjectURL(new Blob([ics],{type:"text/calendar;charset=utf-8"}));
  const g=new URL("https://www.google.com/calendar/render"); g.searchParams.set("action","TEMPLATE"); g.searchParams.set("text",title); g.searchParams.set("dates",`${dtS}/${dtE}`); g.searchParams.set("details",details); g.searchParams.set("location",loc); g.searchParams.set("sf","true"); g.searchParams.set("output","xml");
  const o=new URL("https://outlook.live.com/calendar/0/deeplink/compose"); o.searchParams.set("subject",title); o.searchParams.set("startdt",start.toISOString()); o.searchParams.set("enddt",end.toISOString()); o.searchParams.set("body",details); o.searchParams.set("location",loc);
  return { icsUrl, gcalUrl:g.toString(), outlookUrl:o.toString(), fname:`${title.replace(/\s+/g,'_')}.ics` };
}
function calendarMenu(game){
  const L=perGameCalendarLinks(game);
  const w=el(`<div class="cal-wrap">
    <button class="btn" type="button">Add to Calendar ▾</button>
    <div class="cal-menu" style="display:none;position:absolute;z-index:100;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 6px 18px rgba(10,12,16,.12);overflow:hidden">
      <a href="${L.icsUrl}" download="${L.fname}" style="display:block;padding:10px 12px;text-decoration:none;color:#111"> Apple/Outlook (.ics)</a>
      <a href="${L.gcalUrl}" target="_blank" rel="noopener" style="display:block;padding:10px 12px;text-decoration:none;color:#111">Google Calendar</a>
      <a href="${L.outlookUrl}" target="_blank" rel="noopener" style="display:block;padding:10px 12px;text-decoration:none;color:#111">Outlook (web)</a>
    </div>
  </div>`);
  const b=w.querySelector("button"); const m=w.querySelector(".cal-menu");
  b.addEventListener("click",(e)=>{ e.stopPropagation(); m.style.display=(m.style.display==="block"?"none":"block"); });
  document.addEventListener("click",()=> m.style.display="none");
  return w;
}
function buildAllGamesICS(games){
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GatorHoops//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  for(const g of games){ const s=new Date(g.date), e=addHours(s,2), title=`Florida Gators ${g.isHome?"vs":"@"} ${g.opponent}`, loc=g.venue||"TBD", desc=`TV: ${g.tv||"TBD"} — Auto-generated from Gator Hoops`;
    lines.push("BEGIN:VEVENT",`UID:${g.id}@gatorhoops`,`DTSTAMP:${toGCalDate(new Date())}`,`DTSTART:${toGCalDate(s)}`,`DTEND:${toGCalDate(e)}`,`SUMMARY:${title}`,`DESCRIPTION:${desc}`,`LOCATION:${loc}`,"END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return URL.createObjectURL(new Blob([lines.join("\r\n")],{type:"text/calendar;charset=utf-8"}));
}

/* ========= Tickets ========= */
function ticketUrl(opponent, iso){
  const d=new Date(iso); const yyyy=d.getUTCFullYear(), mm=String(d.getUTCMonth()+1).padStart(2,'0'), dd=String(d.getUTCDate()).padStart(2,'0');
  const dateStr=`${yyyy}-${mm}-${dd}`;
  const teams=`Florida Gators vs ${opponent}`;
  const q=`${teams} ${dateStr} Gainesville`;
  const seatgeek=`https://seatgeek.com/search?search=${encodeURIComponent(q)}`;
  const ticketmaster=`https://www.ticketmaster.com/search?q=${encodeURIComponent(q)}`;
  const vivid=`https://www.vividseats.com/search?search=${encodeURIComponent(q)}`;
  const google=`https://www.google.com/search?q=${encodeURIComponent(`${teams} tickets ${dateStr}`)}`;
  return { seatgeek, ticketmaster, vivid, google };
}

/* ========= Next game ========= */
function msUntil(date){ return +date - Date.now(); }
function formatCountdown(ms){ if(ms<=0)return"Tip-off!"; const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60),ss=s%60; if(d>0)return`${d}d ${h}h ${m}m`; if(h>0)return`${h}h ${m}m ${ss}s`; return`${m}m ${ss}s`; }
let countdownTimer=null;
function renderNextGameCard(game){
  const wrap=$("#nextGame"); wrap.innerHTML="";
  if(!game){ wrap.innerHTML=`<div class="note">No upcoming games found.</div>`; return; }
  const start=new Date(game.date); const tix=ticketUrl(game.opponent, game.date);
  const card=el(`<div class="next-card">
    <div class="logo"></div>
    <div class="next-left">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div style="font-weight:800">Next: ${game.isHome?"vs":"@"} ${game.opponent}</div>
        ${game.tv?`<span class="pill"><span class="pill-dot"></span>${game.tv}</span>`:""}
        ${game.venue?`<span class="pill gray"><span class="pill-dot"></span>${game.venue}</span>`:""}
      </div>
      <div class="meta">${fmtDate(game.date)}</div>
      <div id="cd" class="countdown">—</div>
      <div class="next-actions">
        <a class="btn" target="_blank" rel="noopener" href="${tix.seatgeek}">SeatGeek</a>
        <a class="btn" target="_blank" rel="noopener" href="${tix.ticketmaster}">TM</a>
        <a class="btn" target="_blank" rel="noopener" href="${tix.vivid}">Vivid</a>
        <a class="btn" target="_blank" rel="noopener" href="${tix.google}">Google</a>
      </div>
    </div>
  </div>`);
  const logoNode = game.opponentLogo ? safeImg(game.opponentLogo.replace(/\.svg($|\?)/i,".png"), `${game.opponent} logo`) : safeImg("", "logo");
  logoNode.className="logo"; card.querySelector(".logo").replaceWith(logoNode);
  wrap.appendChild(card);
  const cd=card.querySelector("#cd"); function tick(){ cd.textContent=formatCountdown(msUntil(start)); }
  tick(); if(countdownTimer) clearInterval(countdownTimer); countdownTimer=setInterval(tick,1000);
}

/* ========= Renderers ========= */
function renderSchedule(list){
  scheduleList.innerHTML=""; window._latestGames=list;
  const next=list.find(g=> new Date(g.date) > new Date()); renderNextGameCard(next);
  const elo=buildElo(list.filter(g=>g.myScore!=null&&g.oppScore!=null));

  for(const g of list){
    const right=(g.myScore!=null&&g.oppScore!=null)?`<div class="score">${g.myScore}-${g.oppScore}</div>`:`<div class="meta">${g.status}</div>`;
    const tv=g.tv?`<span class="pill"><span class="pill-dot"></span>${g.tv}</span>`:"";
    const venue=g.venue?`<span class="pill gray"><span class="pill-dot"></span>${g.venue}</span>`:"";
    let pred=""; if(g.myScore==null||g.oppScore==null){ const p=predictWinProb(elo,g.isHome); pred=`<div class="meta">Prediction: <b>${Math.round(p*100)}%</b> win</div>`; }

    const card=el(`<div class="card">
      <div class="row">
        <div class="logo"></div>
        <div style="flex:1;min-width:200px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <div style="font-weight:800;overflow-wrap:anywhere">${g.isHome?"vs":"@"} ${g.opponent}</div>${tv} ${venue}
          </div>
          <div class="meta">${fmtDate(g.date)}</div>${pred}
        </div>
        <div class="right">${right}</div>
      </div>
      <div class="card-actions" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"></div>
    </div>`);
    const logoNode = g.opponentLogo ? safeImg(g.opponentLogo.replace(/\.svg($|\?)/i,".png"), `${g.opponent} logo`) : safeImg("", "logo");
    logoNode.className="logo"; card.querySelector(".logo").replaceWith(logoNode);

    const actions=card.querySelector(".card-actions");
    actions.appendChild(calendarMenu(g));
    const t=ticketUrl(g.opponent, g.date);
    actions.appendChild(el(`<a class="btn" target="_blank" rel="noopener" href="${t.seatgeek}">SeatGeek</a>`));
    actions.appendChild(el(`<a class="btn" target="_blank" rel="noopener" href="${t.ticketmaster}">TM</a>`));
    actions.appendChild(el(`<a class="btn" target="_blank" rel="noopener" href="${t.vivid}">Vivid</a>`));
    actions.appendChild(el(`<a class="btn" target="_blank" rel="noopener" href="${t.google}">Google</a>`));

    scheduleList.appendChild(card);
  }
}
function rosterHeadshotUrl(p){
  // Priority: UF official > ESPN headshot > UF logo fallback
  if (UF_HEADSHOTS[p.fullName]) return UF_HEADSHOTS[p.fullName];
  if (p.headshot) return p.headshot;
  const id = String(p.id||"");
  if (/^\d+$/.test(id)) return `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${id}.png`;
  return "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg";
}
}
function renderRoster(players){
  rosterList.innerHTML="";
  if(!players.length){ rosterList.appendChild(el(`<div class="meta">No players found.</div>`)); return; }
  for(const p of players){
    const s=p.stats||{};
    const imgSrc = rosterHeadshotUrl(p) || "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg";
    const card=el(`
      <div class="card">
        <div class="row">
          <img class="logo" alt="" src="${imgSrc}" onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg'">
          <div style="flex:1;min-width:220px">
            <div style="font-weight:800;overflow-wrap:anywhere">
  <a href="${ufProfileUrl(p.fullName)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${p.fullName}</a>
</div>
            <div class="meta">${p.number?("#"+p.number+" "):""}${p.position??""} ${p.classYear?("· "+p.classYear):""} ${p.height?("· "+p.height):""}${p.weight?(" / "+p.weight):""}</div>
            <div class="statgrid" style="margin-top:6px">
              <div class="stat"><div class="t">PPG</div><div class="v">${(s.ppg??0).toFixed(1)}</div></div>
              <div class="stat"><div class="t">RPG</div><div class="v">${(s.rpg??0).toFixed(1)}</div></div>
              <div class="stat"><div class="t">APG</div><div class="v">${(s.apg??0).toFixed(1)}</div></div>
              <div class="stat"><div class="t">FG%</div><div class="v">${(s.fgp??0).toFixed(1)}</div></div>
              <div class="stat"><div class="t">3P%</div><div class="v">${(s.tpp??0).toFixed(1)}</div></div>
              <div class="stat"><div class="t">FT%</div><div class="v">${(s.ftp??0).toFixed(1)}</div></div>
            </div>
          </div>
        </div>
      </div>
    `);
    rosterList.appendChild(card);
  }
}

/* ===== Stats ===== */
function renderLeaders(players){
  const leaders=$("#leaders"); leaders.innerHTML="";
  const by=(k)=>[...players].sort((a,b)=>(b.stats?.[k]??0)-(a.stats?.[k]??0))[0];
  const cats=[["ppg","PPG"],["rpg","RPG"],["apg","APG"],["tpp","3P%"],["fgp","FG%"],["ftp","FT%"]];
  for(const [k,lab] of cats){
    const p=by(k)||{fullName:"—",stats:{[k]:0}};
    leaders.appendChild(el(`<div class="stat"><div class="t">${lab}</div><div class="v">${p.fullName}<br>${(p.stats?.[k]??0).toFixed(1)}</div></div>`));
  }
}
function renderTeamPtsChart(games){
  const ctx=$("#teamPtsChart").getContext("2d");
  const completed=games.filter(g=>g.myScore!=null&&g.oppScore!=null);
  if(!completed.length){ ctx.font="14px system-ui"; ctx.fillText("No completed games yet", 10, 22); return; }
  new Chart(ctx,{ type:"line", data:{ labels:completed.map((g,i)=>`G${i+1}`), datasets:[{ label:"Gators Pts", data:completed.map(g=>g.myScore) }]}, options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }});
}

/* ===== Props system (book lines first, then smart fallback, plus optional overrides) ===== */

// --- math helpers for fallback lines ---
function normCdf(x){ const t=1/(1+0.2316419*Math.abs(x)), d=0.3989423*Math.exp(-x*x/2);
  let p=1-d*(1.330274429*t - 1.821255978*t*t + 1.781477937*t**3 - 0.356563782*t**4 + 0.319381530*t**5);
  return x<0?1-p:p;
}
function overProb(value, mean, sd){ sd=Math.max(sd||0.01,0.01); const z=(value-mean)/sd; return 1-normCdf(z); }

// Build a line from recent form + season mean (no more 0.5 default).
function buildSmartLine(stats){
  // Expect: { seasonAvg, recentAvg } in points; fallbacks safe
  const season = Number(stats?.seasonAvg||0);
  const recent = Number(stats?.recentAvg||0);
  const base = recent > 0 ? (0.65*recent + 0.35*season) : season;
  // round to 0.5 steps, clamp to sensible min
  const raw  = Math.max(1.5, base);
  return Math.round(raw*2)/2; // 0.5 granularity
}

// Estimate variance for probability display
function estimateSd(avg){ return Math.max(0.7, avg*0.45); }

// Try to pull sportsbook player lines from Netlify odds fn (if available)
async function fetchSportsbookPlayerLines(oddsEventId){
  const out={ points:new Map(), rebounds:new Map(), assists:new Map() };
  try{
    const r = await fetch(`${NETLIFY_ODDS_FN}?type=player&eventId=${encodeURIComponent(oddsEventId)}&region=us&_=${Date.now()}`);
    if(!r.ok) return out;
    const data = await r.json();
    const book = (data.bookmakers||[])[0]; if(!book) return out;
    for(const mkt of (book.markets||[])){
      const key=mkt.key||"";
      const bucket = key.includes("points") ? out.points
                   : key.includes("rebounds") ? out.rebounds
                   : key.includes("assists")  ? out.assists
                   : null;
      if(!bucket) continue;
      for(const o of (mkt.outcomes||[])){
        const name=(o.description||o.participant||o.player||o.team||o.name||"").trim();
        const line=(o.point!=null)?Number(o.point):null;
        if(name && line!=null) bucket.set(name, line);
      }
    }
  }catch{ /* ignore */ }
  return out;
}

// Optional: read manual overrides from Supabase (so you can paste tonight’s props)
async function fetchOverrides(eventId){
  try{
    const { data, error } = await sb
      .from("props_overrides")
      .select("player_name,stat,line")
      .eq("event_id", eventId);
    if(error || !data) return [];
    return data; // [{player_name, stat:'points'|'rebounds'|'assists', line:Number}]
  }catch{ return []; }
}

// Helper: pick line priority => overrides > sportsbook > smart fallback
function chooseLine(playerName, stat, sportsbookBuckets, overrides, smartLine){
  const key = (s)=>String(s||"").trim().toLowerCase();
  const ovr = overrides.find(o => key(o.player_name)===key(playerName) && key(o.stat)===key(stat));
  if(ovr?.line!=null) return { line:Number(ovr.line), source:"Override" };
  const bucket = stat==="points" ? sportsbookBuckets?.points
               : stat==="rebounds" ? sportsbookBuckets?.rebounds
               : stat==="assists"  ? sportsbookBuckets?.assists
               : null;
  if(bucket){
    for(const [n,v] of bucket.entries()){
      if(key(n)===key(playerName)) return { line:Number(v), source:"Sportsbook" };
    }
    // soft match
    for(const [n,v] of bucket.entries()){
      const nn=key(n), pp=key(playerName);
      if(nn.includes(pp)||pp.includes(nn)) return { line:Number(v), source:"Sportsbook" };
    }
  }
  return { line: smartLine, source:"Model" };
}
}
function overProb(value, mean, sd){ sd=Math.max(sd||0.01,0.01); const z=(value-mean)/sd; return 1-normCdf(z); }
function makeLine(avg){ if(!avg||avg<=0) return 0.5; return Math.max(0.5, Math.round(avg/0.5)*0.5); }
function defaultSd(avg){ return Math.max(0.6, avg*0.4); }

/* ===== Leaderboard ===== */
function getUserId(){ let id=localStorage.getItem("gh_user_id"); if(!id){ id=crypto.randomUUID(); localStorage.setItem("gh_user_id",id);} return id; }
async function upsertUserName(name){ const uid=getUserId(); localStorage.setItem("gh_name",name); await sb.from("users").upsert({ id: uid, name }, { onConflict: "id" }); }
async function renderLeaderboard(){
  if(!leaderboardDiv) return;
  leaderboardDiv.innerHTML="<div class='note'>Loading…</div>";
  const { data, error } = await sb.from("lb").select("*").limit(20);
  if(error){ leaderboardDiv.innerHTML="<div class='note'>Error loading leaderboard.</div>"; return; }
  if(!data?.length){ leaderboardDiv.innerHTML="<div class='note'>No picks yet — be the first!</div>"; return; }
  const wrap=el(`<div class="list"></div>`);
  wrap.appendChild(el(`<div class="lb"><div class="h">#</div><div class="h">Name</div><div class="h">Correct</div><div class="h">Accuracy</div></div>`));
  data.forEach((row,i)=>{
    wrap.appendChild(el(`<div class="lb">
      <div class="cell">${i+1}</div>
      <div class="cell">${row.name}</div>
      <div class="cell">${row.correct}/${row.attempts}</div>
      <div class="cell">${Number(row.pct||0).toFixed(1)}%</div>
    </div>`));
  });
  leaderboardDiv.innerHTML=""; leaderboardDiv.appendChild(wrap);
}
if(lbSave){ lbSave.addEventListener("click", async ()=>{ const name=(lbName.value||"").trim().slice(0,40); if(!name) return alert("Enter a display name"); await upsertUserName(name); renderLeaderboard(); alert("Saved!"); }); }
document.addEventListener("DOMContentLoaded", ()=>{ const pre=localStorage.getItem("gh_name"); if(pre&&lbName) lbName.value=pre; });

/* ===== Odds mapping ===== */
function dateOnlyUTC(iso){ const d=new Date(iso); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
function daysApart(aIso, bIso){ const da=dateOnlyUTC(aIso), db=dateOnlyUTC(bIso); return Math.round(Math.abs(da-db)/86400000); }
function mapOddsEventToSched(event, sched){
  const home=nrm(event.home_team), away=nrm(event.away_team);
  if(home!==GATORS && away!==GATORS) return null;
  const opp = home===GATORS ? away : home;
  let best=null, gapBest=99;
  for(const g of sched){
    if(nrm(g.opponent)!==opp) continue;
    const gap=daysApart(g.date, event.commence_time || g.date);
    if(gap<gapBest){ best=g; gapBest=gap; }
  }
  return best && gapBest<=3 ? { match:best } : null;
}
window._oddsPlayerCache = {};

/* Pull player props and cache per event */
async function renderPropsCards(){
  const playersAll = window._rosterPlayers||[];
  const selectedEventId = propGameSelect.value;

  // Try to map ESPN event -> odds event id (for sportsbook pull)
  const oddsEventId = await findOddsEventIdForEspnEvent(selectedEventId);
  const sportsbook = oddsEventId ? await fetchSportsbookPlayerLines(oddsEventId) : null;
  const overrides  = await fetchOverrides(selectedEventId);

  // Which players did user pick?
  const ids=[...propPlayerSelect.selectedOptions].map(o=>o.value);
  const selected = playersAll.filter(p=>ids.includes(p.id));
  propsWrap.innerHTML="";
  if(!selected.length){
    propsWrap.innerHTML=`<div class="note">Pick at least one player, then tap Generate.</div>`;
    return;
  }

  selected.forEach(p=>{
    // Build smart line from season + “recent” (here we estimate recent using season if no game log available)
    const seasonAvg = Number(p.stats?.ppg||0);
    const recentAvg = Number(p.stats?.recentPpg||p.stats?.ppg||0);
    const smart = buildSmartLine({ seasonAvg, recentAvg });

    // Priority: overrides > sportsbook > smart
    const chosen = chooseLine(p.fullName, "points", sportsbook, overrides, smart);
    const sd     = estimateSd(seasonAvg||smart);
    const probO  = Math.round(overProb(chosen.line, seasonAvg||smart, sd)*100);

    const div=el(`<div class="prop-card">
      <div>
        <div class="prop-title">${p.fullName}</div>
        <div class="prop-meta">${chosen.source} line: ${chosen.line.toFixed(1)} pts · Season ${(seasonAvg||0).toFixed(1)} PPG</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="toggle" data-player="${p.id}" data-line="${chosen.line}">
          <button data-type="under">Under ${chosen.line.toFixed(1)}</button>
          <button data-type="over" class="active">Over ${chosen.line.toFixed(1)}</button>
        </div>
        <div class="prop-meta">Over: <b id="prob-${p.id}">${probO}%</b></div>
      </div>
    </div>`);

    // Save to leaderboard on pick
    div.querySelector(".toggle").addEventListener("click", async (e)=>{
      const btn=e.target.closest("button"); if(!btn) return;
      div.querySelectorAll(".toggle button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const prob = btn.dataset.type==="over" ? probO : (100-probO);
      div.querySelector(`#prob-${p.id}`).textContent=`${prob}%`;
      try{
        const uid=getUserId();
        const name=localStorage.getItem("gh_name")||`Fan-${uid.slice(0,6)}`;
        await upsertUserName(name);
        await sb.from("prop_picks").insert({ user_id:uid, event_id:selectedEventId, player_id:p.id, line:Number(chosen.line), choice:btn.dataset.type });
      }catch{}
    });

    propsWrap.appendChild(div);
  });
}

/* ===== Odds UI ===== */
async function loadGameOdds(){
  if(!gameOddsDiv) return;
  gameOddsDiv.innerHTML="<div class='note'>Loading odds…</div>";
  try{
    const res=await fetch(`${NETLIFY_ODDS_FN}?type=game&region=us&_=${Date.now()}`);
    if(!res.ok){ gameOddsDiv.innerHTML="<div class='note'>No odds available right now.</div>"; return; }
    const odds=await res.json(); const sched=window._latestGames||[]; const rows=[];
    const gatorEvents=(odds||[]).filter(ev=>{ const h=nrm(ev.home_team), a=nrm(ev.away_team); return h===GATORS || a===GATORS; });

    gatorEvents.forEach(event=>{
      const link=mapOddsEventToSched(event, sched); if(!link) return;
      const match=link.match; const book=(event.bookmakers||[])[0]; if(!book) return;
      const markets={}; for(const m of (book.markets||[])) markets[m.key]=m;
      const h2h=markets.h2h?.outcomes||[], spreads=markets.spreads?.outcomes||[], totals=markets.totals?.outcomes||[];

      const card=el(`
        <div class="card" style="cursor:pointer" title="Tap to view player props for this game">
          <div class="row">
            <div style="flex:1;min-width:200px">
              <div style="font-weight:800;overflow-wrap:anywhere">${match.isHome?"vs":"@"} ${match.opponent}</div>
              <div class="meta">${fmtDate(match.date)} · Source: ${book.title}</div>
            </div>
          </div>
          <div class="odds-row" style="margin-top:8px">
            <span class="odds-chip"><b>Moneyline</b> · ${h2h.map(o=>`${o.name}: ${o.price>0?"+":""}${o.price}`).join(" · ")||"—"}</span>
            <span class="odds-chip"><b>Spread</b> · ${spreads.map(o=>`${o.name} ${o.point>0?"+":""}${o.point} (${o.price>0?"+":""}${o.price})`).join(" · ")||"—"}</span>
            <span class="odds-chip"><b>Totals</b> · ${totals.map(o=>`${o.name} ${o.point} (${o.price>0?"+":""}${o.price})`).join(" · ")||"—"}</span>
          </div>
        </div>
      `);
      card.addEventListener("click", async ()=>{
        await cachePlayerOddsLines(event.id);
        propGameSelect.value=match.id;
        await renderPropsCards();
        await loadPlayerProps(event.id);
      });
      rows.push(card);
    });
    gameOddsDiv.innerHTML= rows.length?"":"<div class='note'>No Gators games with odds yet.</div>";
    rows.forEach(r=>gameOddsDiv.appendChild(r));
  }catch(e){
    gameOddsDiv.innerHTML=`<div class='note'>Failed to load odds (${String(e)}).</div>`;
  }
}
async function loadPlayerProps(oddsEventId){
  if(!playerPropsDiv) return;
  playerPropsDiv.innerHTML="<div class='note'>Loading player props…</div>";
  try{
    const res=await fetch(`${NETLIFY_ODDS_FN}?type=player&eventId=${encodeURIComponent(oddsEventId)}&region=us&_=${Date.now()}`);
    if(!res.ok){ playerPropsDiv.innerHTML="<div class='note'>No player props available.</div>"; return; }
    const data=await res.json(); const book=(data.bookmakers||[])[0];
    if(!book){ playerPropsDiv.innerHTML="<div class='note'>No player prop markets yet.</div>"; return; }
    const blocks=[];
    for(const mkt of (book.markets||[])){
      const title=mkt.key.replace("player_","Player ").replace("_"," ");
      const list=el(`<div class="card"><div style="font-weight:800;margin-bottom:6px">${title}</div></div>`);
      (mkt.outcomes||[]).forEach(o=>{
        list.appendChild(el(`<div class="row"><div style="flex:1">${o.name||o.description||o.participant||"Player"}</div><div class="meta">${o.point!=null?`Line: ${o.point}`:""}</div><div class="right">${o.price>0?"+":""}${o.price||""}</div></div>`));
      });
      blocks.push(list);
    }
    playerPropsDiv.innerHTML = blocks.length ? "" : "<div class='note'>No player props posted yet.</div>";
    blocks.forEach(b=>playerPropsDiv.appendChild(b));
  }catch(e){ playerPropsDiv.innerHTML=`<div class='note'>Failed to load player props (${String(e)}).</div>`; }
}

/* ===== Props (prefer sportsbook lines) ===== */
function byOddsLine(fullName, bucketMap){
  if(!bucketMap) return null; const target=nrm(fullName);
  for(const [k,v] of bucketMap.entries()){ if(nrm(k)===target) return v; }
  for(const [k,v] of bucketMap.entries()){ if(nrm(k).includes(target)||target.includes(nrm(k))) return v; }
  return null;
}
async function renderPropsCards(){
  const playersAll=window._rosterPlayers||[];
  const selectedEventId=propGameSelect.value;
  const oddsEventId= await findOddsEventIdForEspnEvent(selectedEventId);
  let oddsLines=null; if(oddsEventId) oddsLines=await cachePlayerOddsLines(oddsEventId);

  const ids=[...propPlayerSelect.selectedOptions].map(o=>o.value);
  const selected=playersAll.filter(p=>ids.includes(p.id));
  propsWrap.innerHTML="";
  if(!selected.length){ propsWrap.innerHTML=`<div class="note">Pick at least one player, then tap Generate.</div>`; return; }

  selected.forEach(p=>{
    const avg=p.stats?.ppg||0;
    const sportsbook= oddsLines ? byOddsLine(p.fullName, oddsLines.points) : null;
    const line = (sportsbook!=null) ? sportsbook : makeLine(avg);
    const sd=defaultSd(avg);
    const pOver=Math.round(overProb(line, avg, sd)*100);

    const div=el(`<div class="prop-card">
      <div>
        <div class="prop-title">${p.fullName}</div>
        <div class="prop-meta">${sportsbook!=null?"Sportsbook line":"Model line"}: ${line.toFixed(1)} pts · Season ${(avg||0).toFixed(1)} PPG</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="toggle" data-player="${p.id}" data-line="${line}">
          <button data-type="under">Under ${line.toFixed(1)}</button>
          <button data-type="over" class="active">Over ${line.toFixed(1)}</button>
        </div>
        <div class="prop-meta">Over: <b id="prob-${p.id}">${pOver}%</b></div>
      </div>
    </div>`);

    div.querySelector(".toggle").addEventListener("click", async (e)=>{
      const btn=e.target.closest("button"); if(!btn) return;
      div.querySelectorAll(".toggle button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const prob= btn.dataset.type==="over"? pOver : (100-pOver);
      div.querySelector(`#prob-${p.id}`).textContent=`${prob}%`;
      try{
        const uid=getUserId();
        const name=localStorage.getItem("gh_name")||`Fan-${uid.slice(0,6)}`;
        await upsertUserName(name);
        await sb.from("prop_picks").insert({ user_id:uid, event_id:selectedEventId, player_id:p.id, line:Number(line), choice:btn.dataset.type });
      }catch{}
    });
    propsWrap.appendChild(div);
  });
}
propGameSelect?.addEventListener("change", ()=>{ renderPropsCards(); });

/* ===== News/Tickets list ===== */
function renderNews(){
  newsList.innerHTML="";
  const links = [
    ["Official Gators — Men’s Basketball","https://floridagators.com/sports/mens-basketball"],
    ["ESPN — Florida Gators Team Page","https://www.espn.com/mens-college-basketball/team/_/id/57/florida-gators"],
    ["The Independent Florida Alligator — Sports","https://www.alligator.org/section/sports"],
    ["Google News — Gators Basketball","https://news.google.com/search?q=Florida%20Gators%20basketball&hl=en-US&gl=US&ceid=US%3Aen"]
  ];
  for(const [title,url] of links){ newsList.appendChild(el(`<a class="card" target="_blank" rel="noopener" href="${url}">${title}</a>`)); }
}
function renderTickets(games){
  ticketsList.innerHTML="";
  const upcoming=games.filter(g=> new Date(g.date) > new Date()).slice(0,5);
  if(!upcoming.length){ ticketsList.appendChild(el(`<div class="card">No upcoming games found.</div>`)); return; }
  for(const g of upcoming){
    const t=ticketUrl(g.opponent, g.date);
    const row=el(`<div class="card">
      <div class="row">
        <div class="logo"></div>
        <div style="flex:1;min-width:200px">
          <div style="font-weight:800;overflow-wrap:anywhere">${g.isHome?"vs":"@"} ${g.opponent}</div>
          <div class="meta">${fmtDate(g.date)} ${g.venue?("· "+g.venue):""}</div>
        </div>
        <div class="right">
          <a class="btn" target="_blank" rel="noopener" href="${t.seatgeek}">SeatGeek</a>
          <a class="btn" target="_blank" rel="noopener" href="${t.ticketmaster}">TM</a>
          <a class="btn" target="_blank" rel="noopener" href="${t.vivid}">Vivid</a>
          <a class="btn" target="_blank" rel="noopener" href="${t.google}">Google</a>
        </div>
      </div>
    </div>`);
    const logoNode = g.opponentLogo ? safeImg(g.opponentLogo.replace(/\.svg($|\?)/i,".png"), `${g.opponent} logo`) : safeImg("", "logo");
    logoNode.className="logo"; row.querySelector(".logo").replaceWith(logoNode);
    ticketsList.appendChild(row);
  }
}

/* ===== Data flow ===== */
async function loadAll(){
  try{
    refreshBtn.disabled=true; refreshBtn.textContent="Loading…"; setHero(0);

    const sched = await getJSON(`${BASE}/${GENDER}/teams/${TEAM_ID}/schedule`);
    const games = parseSchedule(sched);
    renderSchedule(games);

    let rosterJSON, players=[];
    try{ rosterJSON = await getJSON(`${BASE}/${GENDER}/teams/${TEAM_ID}`); players = parseRoster(rosterJSON); }catch{}
    if(!players.length){
      // fallback has numeric ids so headshots load
      players = ROSTER_FALLBACK.map(p=>({ ...p, stats:{ppg:0,rpg:0,apg:0,fgp:0,tpp:0,ftp:0,spg:0,bpg:0,topg:0,mpg:0}, headshot:`https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${p.id}.png` }));
    }
    renderRoster(players);

    window._latestGames = games;
    window._rosterPlayers = players;

    renderLeaders(players);
    renderTeamPtsChart(games);
    renderNews();
    renderTickets(games);

    populatePropControls();
    loadGameOdds();
    renderLeaderboard();
  }catch(err){
    scheduleList.innerHTML=`<div class="note" style="color:#c1121f">Error: ${err}</div>`;
  }finally{
    refreshBtn.disabled=false; refreshBtn.textContent="↻ Refresh";
  }
}

function populatePropControls(){
  const games=(window._latestGames||[]).slice();
  const players=(window._rosterPlayers||[]).slice();
  const now=Date.now();
  const upcoming=games.filter(g=>new Date(g.date).getTime()>now);
  const past=games.filter(g=>new Date(g.date).getTime()<=now).reverse();
  const ordered = upcoming.length ? [...upcoming, ...past] : past;

  propGameSelect.innerHTML="";
  for(const g of ordered){
    const o=document.createElement("option");
    o.value=g.id;
    o.textContent=`${new Date(g.date).toLocaleDateString()} — ${g.isHome?"vs":"@"} ${g.opponent}`;
    propGameSelect.appendChild(o);
  }

  propPlayerSelect.innerHTML="";
  players.sort((a,b)=>(b.stats?.ppg??0)-(a.stats?.ppg??0));
  for(const p of players){
    const o=document.createElement("option");
    o.value=p.id; o.textContent=`${p.fullName}${p.stats?.ppg?` (${p.stats.ppg.toFixed(1)} ppg)`:''}`;
    propPlayerSelect.appendChild(o);
  }
  [...propPlayerSelect.options].slice(0,5).forEach(x=>x.selected=true);
}

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", ()=>{
  activateTab("schedule");
  setHero(0);
  loadAll();
  makePropsBtn?.addEventListener("click", renderPropsCards);
});
refreshBtn.addEventListener("click", loadAll);
genderSelect.addEventListener("change",(e)=>{ GENDER=e.target.value; loadAll(); });
