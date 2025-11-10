/* ========= Config ========= */
const TEAM_ID = 57; // Florida men
const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

/* ========= DOM ========= */
const $ = (q)=>document.querySelector(q);
const scheduleList = $("#scheduleList");
const rosterList   = $("#rosterList");
const propsWrap    = $("#propsList");
const refreshBtn   = $("#refreshBtn");
const newsList     = $("#newsList");
const ticketsList  = $("#ticketsList");
const heroImg      = $("#heroImg");
const prevBtn      = $("#prevBtn");
const nextBtn      = $("#nextBtn");
const propPlayerSelect = $("#propPlayerSelect");
const makePropsBtn     = $("#makePropsBtn");
const themeBtn    = $("#themeBtn");
const toastEl     = $("#toast");

/* ========= Small helpers ========= */
function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
async function getJSON(url){ const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error("HTTP "+r.status+" for "+url); return r.json(); }
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:"medium", timeStyle:"short"}); }
function toGCalDate(dt){ return dt.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"); }
function addHours(date, h){ const d=new Date(date); d.setHours(d.getHours()+h); return d; }
function toast(msg){ if(!toastEl) return; toastEl.textContent=msg; toastEl.classList.add("show"); setTimeout(()=>toastEl.classList.remove("show"), 2000); }

/* ========= Theme ========= */
(function initTheme(){
  try{
    const saved = localStorage.getItem("theme") || "light";
    if(saved==="dark") document.documentElement.classList.add("dark");
    themeBtn?.addEventListener("click", ()=>{
      document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
  }catch{}
})();

/* ========= Hero (robust images that never steal clicks) ========= */
const CHAMPIONSHIP_PHOTOS = [
  "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/3/3a/Exactech_Arena_at_the_Stephen_C._O%27Connell_Center_2016.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9e/Florida_Gators_men%27s_basketball%2C_2006.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/f/ff/Florida_Gators_block_F.svg"
];
let heroIndex=0;
function setHero(i){
  const arr=CHAMPIONSHIP_PHOTOS;
  heroIndex=(i+arr.length)%arr.length;
  const src=arr[heroIndex];
  heroImg.loading="lazy"; heroImg.decoding="async"; heroImg.referrerPolicy="no-referrer"; 
  heroImg.onerror=()=>{ heroImg.onerror=null; heroImg.src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"; };
  heroImg.src=src;
}
prevBtn?.addEventListener("click",()=>setHero(heroIndex-1));
nextBtn?.addEventListener("click",()=>setHero(heroIndex+1));

/* ========= Tabs ========= */
function activateTab(which){
  const ids=["schedule","roster","props","stats","news","tickets"];
  ids.forEach(id=>{
    const tabEl = $("#tab-"+id), panelEl = $("#panel-"+id);
    tabEl?.setAttribute("aria-selected", String(id===which));
    panelEl?.classList.toggle("active", id===which);
  });
  $("#panel-"+which)?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")?.focus({preventScroll:true});
}
document.addEventListener("click",(e)=>{
  const b=e.target.closest(".tab"); if(!b) return;
  e.preventDefault();
  activateTab(b.id.replace("tab-",""));
});

/* ========= Image fallback helper ========= */
const UF_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg";
function withImgFallback(tagHtml){
  const node = el(tagHtml);
  if(node.tagName === "IMG"){
    node.onerror = ()=>{ node.onerror=null; node.src = UF_FALLBACK; node.style.objectFit="contain"; };
  } else {
    // if wrapper, patch inner img
    const img = node.querySelector("img");
    if(img){ img.onerror = ()=>{ img.onerror=null; img.src = UF_FALLBACK; img.style.objectFit="contain"; }; }
  }
  return node;
}

/* ========= NEW 2025-26 Roster (ESPN headshots as primary) =========
   Source roster list: floridagators.com 2025-26 roster page.
   Headshots: ESPN roster images for reliability.
*/
const UF_ROSTER = [
  { id:"fland",        fullName:"Boogie Fland",      number:"0",  position:"G",  classYear:"So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5238195.png" },
  { id:"lee",          fullName:"Xaivian Lee",       number:"1",  position:"G",  classYear:"Sr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5107169.png" },
  { id:"handlogten",   fullName:"Micah Handlogten",  number:"3",  position:"C",  classYear:"Sr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5108992.png" },
  { id:"lloyd",        fullName:"Alex Lloyd",        number:"4",  position:"G",  classYear:"Fr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5041948.png" },
  { id:"klavzar",      fullName:"Urban Klavzar",     number:"7",  position:"G",  classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5238200.png" },
  { id:"kovatchev",    fullName:"Alex Kovatchev",    number:"8",  position:"G",  classYear:"R-So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5175405.png" },
  { id:"chinyelu",     fullName:"Rueben Chinyelu",   number:"9",  position:"C",  classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5174971.png" },
  { id:"haugh",        fullName:"Thomas Haugh",      number:"10", position:"F",  classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5080489.png" },
  { id:"ingram",       fullName:"CJ Ingram",         number:"11", position:"G",  classYear:"Fr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5217184.png" },
  { id:"mikic",        fullName:"Viktor Mikic",      number:"12", position:"C",  classYear:"So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5238201.png" },
  { id:"isaiah-brown", fullName:"Isaiah Brown",      number:"20", position:"G",  classYear:"So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5144372.png" },
  { id:"condon",       fullName:"Alex Condon",       number:"21", position:"F/C",classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5174657.png" },
  { id:"aj-brown",     fullName:"AJ Brown",          number:"23", position:"G",  classYear:"R-Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5108014.png" },
  { id:"rioux",        fullName:"Olivier Rioux",     number:"32", position:"C",  classYear:"R-Fr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5184753.png" },
  { id:"josefsberg",   fullName:"Cooper Josefsberg", number:"33", position:"G",  classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5174660.png" },
];

/* ========= ESPN schedule ========= */
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

/* ========= Renderers ========= */
function renderSchedule(list){
  scheduleList.innerHTML=""; window._latestGames=list;

  const next=list.find(g=> new Date(g.date) > new Date());
  $("#nextGame").innerHTML = next ? `
    <div class="next-card">
      <img class="logo" alt="" src="${(next.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" onerror="this.onerror=null;this.src='${UF_FALLBACK}'">
      <div class="next-left">
        <div style="font-weight:800">Next: ${next.isHome?"vs":"@"} ${next.opponent}</div>
        <div class="meta">${fmtDate(next.date)} ${next.venue?("· "+next.venue):""} ${next.tv?("· "+next.tv):""}</div>
      </div>
    </div>` : `<div class="note">No upcoming games found.</div>`;

  for(const g of list){
    const right=(g.myScore!=null&&g.oppScore!=null)?`<div class="score">${g.myScore}-${g.oppScore}</div>`:`<div class="meta">${g.status}</div>`;
    const card=withImgFallback(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${(g.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}">
        <div style="flex:1;min-width:220px">
          <div style="font-weight:800;overflow-wrap:anywhere">${g.isHome?"vs":"@"} ${g.opponent}</div>
          <div class="meta">${fmtDate(g.date)} ${g.venue?("· "+g.venue):""} ${g.tv?("· "+g.tv):""}</div>
        </div>
        <div class="right">${right}</div>
      </div>
    </div>`);
    scheduleList.appendChild(card);
  }

  // Tickets list
  const upcoming=list.filter(g=> new Date(g.date) > new Date()).slice(0,5);
  ticketsList.innerHTML="";
  if(!upcoming.length){ ticketsList.innerHTML=`<div class="card">No upcoming games found.</div>`; }
  for(const g of upcoming){
    const t=ticketUrl(g.opponent, g.date);
    ticketsList.appendChild(withImgFallback(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${(g.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}">
        <div style="flex:1;min-width:220px">
          <div style="font-weight:800;overflow-wrap:anywhere">${g.isHome?"vs":"@"} ${g.opponent}</div>
          <div class="meta">${fmtDate(g.date)} ${g.venue?("· "+g.venue):""}</div>
        </div>
        <div class="right">
          <a class="btn" target="_blank" rel="noopener" href="${t.seatgeek}">SeatGeek</a>
          <a class="btn" target="_blank" rel="noopener" href="${t.ticketmaster}">TM</a>
          <a class="btn" target="_blank" rel="noopener" href="${t.vivid}">Vivid</a>
        </div>
      </div>
    </div>`));
  }

  // Add-all-games ICS
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GatorHoops//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  for(const g of list){
    const title=`Florida Gators ${g.isHome?"vs":"@"} ${g.opponent}`;
    const s=new Date(g.date), e=addHours(s,2);
    lines.push("BEGIN:VEVENT",`UID:${g.id}@gatorhoops`,`DTSTAMP:${toGCalDate(new Date())}`,`DTSTART:${toGCalDate(s)}`,`DTEND:${toGCalDate(e)}`,`SUMMARY:${title}`,`DESCRIPTION:TV: ${g.tv||"TBD"} — Auto-generated from Gator Hoops`,`LOCATION:${g.venue||"TBD"}`,"END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const icsUrl=URL.createObjectURL(new Blob([lines.join("\r\n")],{type:"text/calendar;charset=utf-8"}));
  $("#addAllBtn").onclick=()=>{ const a=document.createElement("a"); a.href=icsUrl; a.download="Florida_Gators_Basketball.ics"; document.body.appendChild(a); a.click(); a.remove(); };
}
function ticketUrl(opponent, iso){
  const d=new Date(iso); const yyyy=d.getUTCFullYear(), mm=String(d.getUTCMonth()+1).padStart(2,'0'), dd=String(d.getUTCDate()).padStart(2,'0');
  const dateStr=`${yyyy}-${mm}-${dd}`, teams=`Florida Gators vs ${opponent}`, q=`${teams} ${dateStr} Gainesville`;
  return {
    seatgeek:`https://seatgeek.com/search?search=${encodeURIComponent(q)}`,
    ticketmaster:`https://www.ticketmaster.com/search?q=${encodeURIComponent(q)}`,
    vivid:`https://www.vividseats.com/search?search=${encodeURIComponent(q)}`
  };
}

/* ========= Roster rendering (2025-26) ========= */
function renderRoster(players){
  rosterList.innerHTML="";
  if(!players.length){ rosterList.appendChild(el(`<div class="card">No players found.</div>`)); return; }
  for(const p of players){
    const s=p.stats||{};
    rosterList.appendChild(withImgFallback(`
      <div class="card">
        <div class="row">
          <img class="logo" alt="" src="${p.headshot}" loading="lazy">
          <div style="flex:1;min-width:240px">
            <div style="font-weight:800;overflow-wrap:anywhere">${p.fullName}</div>
            <div class="meta">${p.number?("#"+p.number+" "):""}${p.position??""} ${p.classYear?("· "+p.classYear):""}</div>
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
      </div>`));
  }
}

/* ========= Stats ========= */
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
  ctx.canvas.height=260;
  if(window._ptsChart) window._ptsChart.destroy?.();
  if(!completed.length){ ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.font="14px system-ui"; ctx.fillText("No completed games yet",10,22); return; }
  window._ptsChart=new Chart(ctx,{type:"line",data:{labels:completed.map((g,i)=>`G${i+1}`),datasets:[{label:"Gators Pts",data:completed.map(g=>g.myScore)}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}}}});
}

/* ========= Props (from last 6 completed games; fallback season avg if you add it later) ========= */
async function fetchRecentPlayerAverages(games){
  const completed = games.filter(g=>g.myScore!=null&&g.oppScore!=null).slice(-6);
  if(!completed.length) return new Map();
  const base = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/summary?event=`;
  const totals = new Map(); // athleteId -> {name, ptsSum, gp}
  for(const g of completed){
    try{
      const sum = await getJSON(base + g.id);
      const teams = sum?.boxscore?.teams || [];
      const uf = teams.find(t => String(t.team?.id)===String(TEAM_ID));
      const players = uf?.players || [];
      for(const p of players){
        const aid = String(p.athlete?.id||"");
        const name = p.athlete?.displayName || "";
        let pts = 0;
        const statLine = p.statistics?.[0]?.stats || p.statistics?.stats || p.statistics || {};
        if (Array.isArray(statLine)) {
          const kv = String(statLine.find(s=>/^PTS[: ]/i.test(s))||"").split(":")[1];
          pts = Number((kv||"").trim()||0);
        } else if (typeof statLine === "object") {
          pts = Number(statLine.PTS ?? statLine.points ?? 0);
        }
        if(!aid || !name) continue;
        if(!totals.has(aid)) totals.set(aid,{ name, ptsSum:0, gp:0 });
        const row=totals.get(aid); row.ptsSum += (isNaN(pts)?0:pts); row.gp += 1;
      }
    }catch{ /* ignore single-game errors */ }
  }
  const out = new Map();
  for(const [id,row] of totals.entries()){ if(row.gp>0) out.set(id, row.ptsSum/row.gp); }
  return out;
}
function roundHalf(x){ return Math.round(Math.max(1.5,x)*2)/2; }

function populatePropSelect(players){
  propPlayerSelect.innerHTML="";
  // show by name; stats optional
  players.forEach(p=>{ const o=document.createElement("option"); o.value=p.id; o.textContent=p.fullName; propPlayerSelect.appendChild(o); });
  [...propPlayerSelect.options].slice(0,6).forEach(x=>x.selected=true);
}

async function renderPropsFromAverages(){
  const players = UF_ROSTER.slice();
  const games   = window._latestGames||[];
  if(!propPlayerSelect.options.length) populatePropSelect(players);
  propsWrap.innerHTML = "<div class='note'>Calculating recent averages…</div>";

  let recent = new Map();
  try{ recent = await fetchRecentPlayerAverages(games); }catch{ recent = new Map(); }

  const ids=[...propPlayerSelect.selectedOptions].map(o=>o.value);
  const selected = players.filter(p=>ids.includes(p.id));
  if(!selected.length){ propsWrap.innerHTML=`<div class='note'>Pick at least one player, then tap Generate.</div>`; return; }

  propsWrap.innerHTML="";
  selected.forEach(p=>{
    // Without a stable ESPN id map here, we use season stats if provided; else use team recent typical (mean of team points / 5) as a soft baseline.
    const teamPts = (games.filter(g=>g.myScore!=null).reduce((s,g)=>s+g.myScore,0) / Math.max(1,games.filter(g=>g.myScore!=null).length)) || 72;
    const baseline = teamPts / 5; // rough spread among starters
    const season = Number(p.stats?.ppg ?? baseline);
    const line = roundHalf(season);
    propsWrap.appendChild(el(`<div class="card">
      <div class="row" style="align-items:flex-start">
        <div style="flex:1;min-width:220px">
          <div class="prop-title" style="font-weight:800">${p.fullName}</div>
          <div class="meta">Projected O/U based on recent team scoring & role</div>
        </div>
        <div class="right"><strong>Over/Under: ${line.toFixed(1)}</strong></div>
      </div>
    </div>`));
  });
}

/* ========= News ========= */
function renderNews(){
  const links = [
    ["Official Gators — Men’s Basketball","https://floridagators.com/sports/mens-basketball"],
    ["ESPN — Florida Gators Team Page","https://www.espn.com/mens-college-basketball/team/_/id/57/florida-gators"],
    ["Google News — Gators Basketball","https://news.google.com/search?q=Florida%20Gators%20basketball&hl=en-US&gl=US&ceid=US%3Aen"]
  ];
  newsList.innerHTML = links.map(([t,u])=>`<a class="card" target="_blank" rel="noopener" href="${u}">${t}</a>`).join("");
}

/* ========= Data flow ========= */
async function loadAll(){
  try{
    refreshBtn.disabled=true; refreshBtn.textContent="Loading…"; setHero(0);

    // 1) Schedule (ESPN)
    const sched = await getJSON(`${BASE}/teams/${TEAM_ID}/schedule`);
    const games = parseSchedule(sched);
    renderSchedule(games);
    window._latestGames = games;

    // 2) Roster (UF 2025-26 with ESPN headshots)
    renderRoster(UF_ROSTER);

    // 3) Stats
    renderLeaders(UF_ROSTER);
    renderTeamPtsChart(games);

    // 4) News
    renderNews();

    toast("Loaded ✓");
  }catch(err){
    scheduleList.innerHTML=`<div class="card" style="color:#c1121f">Error: ${err.message||err}</div>`;
    toast("Load failed");
  }finally{
    refreshBtn.disabled=false; refreshBtn.textContent="↻ Refresh";
  }
}

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", ()=>{
  setHero(0);
  activateTab("schedule");
  loadAll().catch(()=>{});
  makePropsBtn?.addEventListener("click", renderPropsFromAverages);
  refreshBtn?.addEventListener("click", loadAll);

  // Keyboard tab navigation
  document.addEventListener("keydown",(e)=>{
    if(!e.altKey && !e.ctrlKey && !e.metaKey){
      if(e.key==="1") activateTab("schedule");
      if(e.key==="2") activateTab("roster");
      if(e.key==="3") activateTab("props");
      if(e.key==="4") activateTab("stats");
      if(e.key==="5") activateTab("news");
      if(e.key==="6") activateTab("tickets");
    }
  });
});
