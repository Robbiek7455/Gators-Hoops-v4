/* ========= Config ========= */
const TEAM_ID = 57; // Florida
let   GENDER  = "mens-college-basketball";
const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball";

/* ===== (Optional) Supabase for leaderboard - stays wired but not required for props to work) ===== */
const SUPABASE_URL  = "https://rydpaqzentkqlwjgxpbt.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHBhcXplbnRrcWx3amd4cGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDczOTgsImV4cCI6MjA3Nzg4MzM5OH0.dyw38h9QOLHXLaERz9aG-3fvup70lKoDaFfzEBTNqjg";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ===== DOM ===== */
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

/* ===== Utils ===== */
function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
async function getJSON(url){ const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error("HTTP "+r.status+" for "+url); return r.json(); }
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:"medium", timeStyle:"short"}); }
function toGCalDate(dt){ return dt.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"); }
function addHours(date, h){ const d=new Date(date); d.setHours(d.getHours()+h); return d; }

/* ===== Hero ===== */
const CHAMPIONSHIP_PHOTOS = [
  "https://img.youtube.com/vi/igDpFxg60qU/maxresdefault.jpg",
  "https://img.youtube.com/vi/ww6n-Y9ygeg/maxresdefault.jpg",
  "https://img.youtube.com/vi/kuPmLVeXXac/maxresdefault.jpg",
  "https://img.youtube.com/vi/2Skv3IYAdUE/maxresdefault.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"
];
let heroIndex=0;
function setHero(i){
  const arr=CHAMPIONSHIP_PHOTOS;
  heroIndex=(i+arr.length)%arr.length;
  const src=arr[heroIndex];
  heroImg.loading="lazy"; heroImg.decoding="async"; heroImg.referrerPolicy="no-referrer";
  heroImg.onerror=()=>{
    const m=/img\.youtube\.com\/vi\/([^/]+)\//.exec(src);
    if(m){ heroImg.onerror=null; heroImg.src=`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`; heroImg.style.objectFit="cover"; return; }
    heroImg.onerror=null; heroImg.src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"; heroImg.style.objectFit="contain";
  };
  heroImg.src=src;
}
prevBtn.addEventListener("click",()=>setHero(heroIndex-1));
nextBtn.addEventListener("click",()=>setHero(heroIndex+1));

/* ===== ESPN parsing ===== */
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
    let stats={ ppg:0,rpg:0,apg:0,fgp:0,tpp:0,ftp:0 };
    const season=(it.statistics??[]).find(s=>String(s.name||"").toLowerCase().includes("season"));
    const cats=season?.splits?.categories??[];
    for(const cat of cats){ for(const st of (cat.stats??[])){ const nm=st.name, val=Number(st.value);
      if(nm==="pointsPerGame")stats.ppg=val; if(nm==="reboundsPerGame")stats.rpg=val; if(nm==="assistsPerGame")stats.apg=val;
      if(nm==="fieldGoalPct")stats.fgp=val; if(nm==="threePointPct")stats.tpp=val; if(nm==="freeThrowPct")stats.ftp=val;
    } }
    const pid=String(it.id||"");
    const head = it.headshot?.href || (pid ? `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${pid}.png` : "");
    players.push({ id:pid, fullName:it.displayName, position:it.position?.abbreviation, number:it.jersey, classYear:it.class, headshot:head, stats });
  } }
  players.sort((a,b)=> a.fullName.localeCompare(b.fullName));
  return players;
}

/* ===== Renderers ===== */
function renderSchedule(list){
  const wrap=$("#scheduleList"); wrap.innerHTML="";
  window._latestGames=list;
  // Next game
  const next=list.find(g=> new Date(g.date) > new Date());
  $("#nextGame").innerHTML = next ? `
    <div class="next-card">
      <img class="logo" alt="" src="${(next.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg'">
      <div class="next-left">
        <div style="font-weight:800">Next: ${next.isHome?"vs":"@"} ${next.opponent}</div>
        <div class="meta">${fmtDate(next.date)} ${next.venue?("· "+next.venue):""} ${next.tv?("· "+next.tv):""}</div>
      </div>
    </div>` : `<div class="note">No upcoming games found.</div>`;

  // List
  for(const g of list){
    const right=(g.myScore!=null&&g.oppScore!=null)?`<div class="score">${g.myScore}-${g.oppScore}</div>`:`<div class="meta">${g.status}</div>`;
    const card=el(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${(g.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg'">
        <div style="flex:1;min-width:220px">
          <div style="font-weight:800;overflow-wrap:anywhere">${g.isHome?"vs":"@"} ${g.opponent}</div>
          <div class="meta">${fmtDate(g.date)} ${g.venue?("· "+g.venue):""} ${g.tv?("· "+g.tv):""}</div>
        </div>
        <div class="right">${right}</div>
      </div>
    </div>`);
    wrap.appendChild(card);
  }
}
function rosterHeadshotUrl(p){
  if(p.headshot) return p.headshot;
  const id=String(p.id||"");
  if(/^\d+$/.test(id)) return `https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${id}.png`;
  return "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg";
}
function renderRoster(players){
  const wrap=$("#rosterList"); wrap.innerHTML="";
  if(!players.length){ wrap.appendChild(el(`<div class="meta">No players found.</div>`)); return; }
  for(const p of players){
    const s=p.stats||{};
    const img=rosterHeadshotUrl(p);
    const card=el(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${img}" loading="lazy" onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg'">
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
    </div>`);
    wrap.appendChild(card);
  }
}

/* ===== Stats (auto updates after each final) ===== */
function renderTeamPtsChart(games){
  const ctx=$("#teamPtsChart").getContext("2d");
  const completed=games.filter(g=>g.myScore!=null&&g.oppScore!=null);
  ctx.canvas.height=260;
  if(window._ptsChart) window._ptsChart.destroy?.();
  if(!completed.length){ ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.font="14px system-ui"; ctx.fillText("No completed games yet",10,22); return; }
  window._ptsChart=new Chart(ctx,{type:"line",data:{labels:completed.map((g,i)=>`G${i+1}`),datasets:[{label:"Gators Pts",data:completed.map(g=>g.myScore)}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}}}});
}
function renderLeaders(players){
  const leaders=$("#leaders"); leaders.innerHTML="";
  const by=(k)=>[...players].sort((a,b)=>(b.stats?.[k]??0)-(a.stats?.[k]??0))[0];
  const cats=[["ppg","PPG"],["rpg","RPG"],["apg","APG"],["tpp","3P%"],["fgp","FG%"],["ftp","FT%"]];
  for(const [k,lab] of cats){
    const p=by(k)||{fullName:"—",stats:{[k]:0}};
    leaders.appendChild(el(`<div class="stat"><div class="t">${lab}</div><div class="v">${p.fullName}<br>${(p.stats?.[k]??0).toFixed(1)}</div></div>`));
  }
}

/* ===== Props: ALWAYS use averages from prior games (last 6) =====
   We fetch ESPN summaries for each completed game (cap to last 6),
   read Gators boxscore players, and average per-player points.
*/
async function fetchRecentPlayerAverages(games){
  const completed = games.filter(g=>g.myScore!=null&&g.oppScore!=null).slice(-6);
  const base = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/${GENDER}/summary?event=`;
  const totals = new Map(); // id -> {name, ptsSum, gp}
  for(const g of completed){
    try{
      const sum = await getJSON(base + g.id);
      const teams = sum?.boxscore?.teams || [];
      const uf = teams.find(t => String(t.team?.id)===String(TEAM_ID));
      const players = uf?.players || [];
      for(const p of players){
        const aid = String(p.athlete?.id||"");
        const name = p.athlete?.displayName || "";
        // ESPN different shapes; try common keys:
        const statLine = p.statistics?.[0]?.athletes?[0]?.stats : p.statistics?.[0]?.stats || p.statistics?.stats || {};
        // points can be "PTS" or nested value:
        let pts = 0;
        if (typeof statLine === "object" && !Array.isArray(statLine)) {
          pts = Number(statLine.PTS ?? statLine.points ?? 0);
        } else if (Array.isArray(statLine)) {
          // Sometimes it's an array of "key:value" strings like ["PTS: 14", ...]
          const kv = String(statLine.find(s=>/^PTS[: ]/i.test(s))||"").split(":")[1];
          pts = Number((kv||"").trim()||0);
        }
        if(!aid || !name) continue;
        if(!totals.has(aid)) totals.set(aid,{ name, ptsSum:0, gp:0 });
        const row=totals.get(aid); row.ptsSum += (isNaN(pts)?0:pts); row.gp += 1;
      }
    }catch{ /* ignore single-game failures */ }
  }
  // Build map id -> avg
  const out = new Map();
  for(const [id,row] of totals.entries()){
    if(row.gp>0) out.set(id, row.ptsSum/row.gp);
  }
  return out; // Map(playerId -> avgPtsLastN)
}

/* Render props using recent averages (fallback to season avg) */
async function renderPropsFromAverages(){
  const players = window._rosterPlayers||[];
  const games   = window._latestGames||[];
  propsWrap.innerHTML = "<div class='note'>Calculating recent averages…</div>";
  let recentMap = new Map();
  try{ recentMap = await fetchRecentPlayerAverages(games); }catch{}
  const ids=[...propPlayerSelect.selectedOptions].map(o=>o.value);
  const selected = players.filter(p=>ids.includes(p.id));
  if(!selected.length){ propsWrap.innerHTML=`<div class='note'>Pick at least one player, then tap Generate.</div>`; return; }

  propsWrap.innerHTML="";
  selected.forEach(p=>{
    const recent = recentMap.get(String(p.id));
    const season = Number(p.stats?.ppg||0);
    const avg = recent ?? season;
    const line = Math.max(1.5, Math.round(avg*2)/2); // 0.5 granularity, no 0.5 default
    const div=el(`<div class="card">
      <div class="row" style="align-items:flex-start">
        <div style="flex:1;min-width:220px">
          <div class="prop-title" style="font-weight:800">${p.fullName}</div>
          <div class="meta">${recent!=null?`Last 6 avg: ${avg.toFixed(1)} pts`:`Season avg: ${avg.toFixed(1)} pts`}</div>
        </div>
        <div class="right"><strong>Over/Under: ${line.toFixed(1)}</strong></div>
      </div>
    </div>`);
    propsWrap.appendChild(div);
  });
}

/* ===== News/Tickets ===== */
function renderNews(){
  const links = [
    ["Official Gators — Men’s Basketball","https://floridagators.com/sports/mens-basketball"],
    ["ESPN — Florida Gators Team Page","https://www.espn.com/mens-college-basketball/team/_/id/57/florida-gators"],
    ["Google News — Gators Basketball","https://news.google.com/search?q=Florida%20Gators%20basketball&hl=en-US&gl=US&ceid=US%3Aen"]
  ];
  newsList.innerHTML = links.map(([t,u])=>`<a class="card" target="_blank" rel="noopener" href="${u}">${t}</a>`).join("");
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
function renderTickets(games){
  const upcoming=games.filter(g=> new Date(g.date) > new Date()).slice(0,5);
  ticketsList.innerHTML="";
  if(!upcoming.length){ ticketsList.innerHTML=`<div class="card">No upcoming games found.</div>`; return; }
  upcoming.forEach(g=>{
    const t=ticketUrl(g.opponent, g.date);
    ticketsList.appendChild(el(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${(g.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg'">
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
  });
}

/* ===== Calendar (Add all) ===== */
function buildAllGamesICS(games){
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GatorHoops//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  for(const g of games){
    const title=`Florida Gators ${g.isHome?"vs":"@"} ${g.opponent}`;
    const s=new Date(g.date), e=addHours(s,2);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${g.id}@gatorhoops`,
      `DTSTAMP:${toGCalDate(new Date())}`,
      `DTSTART:${toGCalDate(s)}`,
      `DTEND:${toGCalDate(e)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:TV: ${g.tv||"TBD"} — Auto-generated from Gator Hoops`,
      `LOCATION:${g.venue||"TBD"}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return URL.createObjectURL(new Blob([lines.join("\r\n")],{type:"text/calendar;charset=utf-8"}));
}

/* ===== Data flow ===== */
async function loadAll(){
  try{
    refreshBtn.disabled=true; refreshBtn.textContent="Loading…"; setHero(0);

    // Schedule
    const sched = await getJSON(`${BASE}/${GENDER}/teams/${TEAM_ID}/schedule`);
    const games = parseSchedule(sched);
    renderSchedule(games);

    // Roster
    let players=[];
    try{ const rosterJSON = await getJSON(`${BASE}/${GENDER}/teams/${TEAM_ID}`); players = parseRoster(rosterJSON); }catch{}
    renderRoster(players);
    window._latestGames  = games;
    window._rosterPlayers= players;

    // Stats
    renderLeaders(players);
    renderTeamPtsChart(games);

    // News & Tickets
    renderNews();
    renderTickets(games);

    // Props controls
    populatePropControls();

    // Add-all-games calendar
    const allIcsUrl = buildAllGamesICS(games);
    $("#addAllBtn").onclick = () => { const a=document.createElement("a"); a.href=allIcsUrl; a.download="Florida_Gators_Basketball.ics"; document.body.appendChild(a); a.click(); a.remove(); };

  }catch(err){
    scheduleList.innerHTML=`<div class="note" style="color:#c1121f">Error: ${err.message||err}</div>`;
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

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  // Tabs
  const ids=["schedule","roster","props","stats","news","tickets"];
  document.addEventListener("click",(e)=>{
    const b=e.target.closest(".tab"); if(!b) return;
    e.preventDefault();
    ids.forEach(id=>{
      document.getElementById("tab-"+id)?.setAttribute("aria-selected", String(b.id===("tab-"+id)));
      document.getElementById("panel-"+id)?.classList.toggle("active", b.id===("tab-"+id));
    });
  });

  // Actions
  setHero(0);
  loadAll();
  makePropsBtn?.addEventListener("click", renderPropsFromAverages);
  refreshBtn?.addEventListener("click", loadAll);
  genderSelect?.addEventListener("change",(e)=>{ GENDER=e.target.value; loadAll(); });
});
