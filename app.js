/* ========= Config ========= */
const TEAM_ID = 57; // Florida men
const ESPN_SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const ESPN_WEB  = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/summary?event=";

/* ========= Supabase (Leaderboard) ========= */
const SUPABASE_URL  = "https://rydpaqzentkqlwjgxpbt.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHBhcXplbnRrcWx3amd4cGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDczOTgsImV4cCI6MjA3Nzg4MzM5OH0.dyw38h9QOLHXLaERz9aG-3fvup70lKoDaFfzEBTNqjg";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

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
const genPropsBtn      = $("#genPropsBtn");
const savePicksBtn     = $("#savePicksBtn");
const themeBtn         = $("#themeBtn");
const toastEl          = $("#toast");
const usernameInput    = $("#usernameInput");
const installBtn       = $("#installBtn");

/* ========= Helpers ========= */
function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
async function getJSON(url){ const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error("HTTP "+r.status+" for "+url); return r.json(); }
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:"medium", timeStyle:"short"}); }
function toGCalDate(dt){ return dt.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"); }
function addHours(date, h){ const d=new Date(date); d.setHours(d.getHours()+h); return d; }
function toast(msg){ if(!toastEl) return; toastEl.textContent=msg; toastEl.classList.add("show"); setTimeout(()=>toastEl.classList.remove("show"), 2200); }
function imgFallback(img){ img.onerror=()=>{ img.onerror=null; img.src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg"; img.style.objectFit="contain"; }; }

/* ========= Theme & username ========= */
(function initUI(){
  try{
    const savedTheme = localStorage.getItem("theme") || "light";
    if(savedTheme==="dark") document.documentElement.classList.add("dark");
    themeBtn?.addEventListener("click", ()=>{
      document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    const savedName = localStorage.getItem("gh_username") || "";
    usernameInput.value = savedName;
    usernameInput.addEventListener("change", ()=> localStorage.setItem("gh_username", usernameInput.value.trim()));
  }catch{}
})();

/* ========= PWA install + SW ========= */
let deferredPrompt=null;
if("serviceWorker" in navigator){ navigator.serviceWorker.register("./sw.js?v=75").catch(()=>{}); }
window.addEventListener("beforeinstallprompt",(e)=>{ e.preventDefault(); deferredPrompt=e; installBtn?.classList.remove("hidden"); });
installBtn?.addEventListener("click", async ()=>{
  if(!deferredPrompt){ toast("Already installed or not eligible"); return; }
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.classList.add("hidden");
});

/* ========= Hero ========= */
const CHAMPIONSHIP_PHOTOS = [
  "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/3/3a/Exactech_Arena_at_the_Stephen_C._O%27Connell_Center_2016.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9e/Florida_Gators_men%27s_basketball%2C_2006.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/f/ff/Florida_Gators_block_F.svg"
];
let heroIndex=0;
function setHero(i){
  heroIndex=(i+CHAMPIONSHIP_PHOTOS.length)%CHAMPIONSHIP_PHOTOS.length;
  heroImg.loading="lazy"; heroImg.decoding="async"; heroImg.referrerPolicy="no-referrer";
  heroImg.onerror=()=>{ heroImg.onerror=null; heroImg.src=CHAMPIONSHIP_PHOTOS[0]; };
  heroImg.src=CHAMPIONSHIP_PHOTOS[heroIndex];
}
prevBtn?.addEventListener("click",()=>setHero(heroIndex-1));
nextBtn?.addEventListener("click",()=>setHero(heroIndex+1));

/* ========= Tabs ========= */
function activateTab(which){
  const ids=["schedule","roster","props","stats","news","tickets"];
  ids.forEach(id=>{
    $("#tab-"+id)?.setAttribute("aria-selected", String(id===which));
    $("#panel-"+id)?.classList.toggle("active", id===which);
  });
}
document.addEventListener("click",(e)=>{
  const t=e.target.closest(".tab"); if(!t) return;
  e.preventDefault(); activateTab(t.id.replace("tab-",""));
});

/* ========= ROSTER 2025–26 ========= */
const UF_ROSTER = [
  { id:"fland",        fullName:"Boogie Fland",      number:"0",  position:"G",   classYear:"So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5238195.png" },
  { id:"lee",          fullName:"Xaivian Lee",       number:"1",  position:"G",   classYear:"Sr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5107169.png" },
  { id:"handlogten",   fullName:"Micah Handlogten",  number:"3",  position:"C",   classYear:"Sr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5108992.png" },
  { id:"lloyd",        fullName:"Alex Lloyd",        number:"4",  position:"G",   classYear:"Fr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5041948.png" },
  { id:"klavzar",      fullName:"Urban Klavzar",     number:"7",  position:"G",   classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5238200.png" },
  { id:"kovatchev",    fullName:"Alex Kovatchev",    number:"8",  position:"G",   classYear:"R-So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5175405.png" },
  { id:"chinyelu",     fullName:"Rueben Chinyelu",   number:"9",  position:"C",   classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5174971.png" },
  { id:"haugh",        fullName:"Thomas Haugh",      number:"10", position:"F",   classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5080489.png" },
  { id:"ingram",       fullName:"CJ Ingram",         number:"11", position:"G",   classYear:"Fr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5217184.png" },
  { id:"mikic",        fullName:"Viktor Mikic",      number:"12", position:"C",   classYear:"So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5238201.png" },
  { id:"isaiah-brown", fullName:"Isaiah Brown",      number:"20", position:"G",   classYear:"So.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5144372.png" },
  { id:"condon",       fullName:"Alex Condon",       number:"21", position:"F/C", classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5174657.png" },
  { id:"aj-brown",     fullName:"AJ Brown",          number:"23", position:"G",   classYear:"R-Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5108014.png" },
  { id:"rioux",        fullName:"Olivier Rioux",     number:"32", position:"C",   classYear:"R-Fr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5184753.png" },
  { id:"josefsberg",   fullName:"Cooper Josefsberg", number:"33", position:"G",   classYear:"Jr.", headshot:"https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/5174660.png" },
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

/* ========= Render schedule + tickets + ICS + wallpapers + highlights ========= */
function ticketUrl(opponent, iso){
  const d=new Date(iso); const yyyy=d.getUTCFullYear(), mm=String(d.getUTCMonth()+1).padStart(2,'0'), dd=String(d.getUTCDate()).padStart(2,'0');
  const dateStr=`${yyyy}-${mm}-${dd}`, teams=`Florida Gators vs ${opponent}`, q=`${teams} ${dateStr} Gainesville`;
  return {
    seatgeek:`https://seatgeek.com/search?search=${encodeURIComponent(q)}`,
    ticketmaster:`https://www.ticketmaster.com/search?q=${encodeURIComponent(q)}`,
    vivid:`https://www.vividseats.com/search?search=${encodeURIComponent(q)}`
  };
}
function ytSearchUrl(opponent, iso){ // quick link to highlights
  const q=`Florida Gators ${opponent} basketball highlights ${new Date(iso).getFullYear()}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
function renderSchedule(list){
  scheduleList.innerHTML=""; window._latestGames=list;

  const next=list.find(g=> new Date(g.date) > new Date());
  $("#nextGame").innerHTML = next ? `
    <div class="next-card">
      <img class="logo" alt="" src="${(next.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" />
      <div class="next-left">
        <div style="font-weight:800">Next: ${next.isHome?"vs":"@"} ${next.opponent}</div>
        <div class="meta">${fmtDate(next.date)} ${next.venue?("· "+next.venue):""} ${next.tv?("· "+next.tv):""}</div>
        <div><a class="btn" target="_blank" rel="noopener" href="${ytSearchUrl(next.opponent,next.date)}">Highlights</a></div>
      </div>
    </div>` : `<div class="note">No upcoming games found.</div>`;
  $("#nextGame").querySelectorAll("img").forEach(imgFallback);

  for(const g of list){
    const right=(g.myScore!=null&&g.oppScore!=null)?`<div class="score">${g.myScore}-${g.oppScore}</div>`:`<div class="meta">${g.status}</div>`;
    const card=el(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${(g.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" />
        <div style="flex:1;min-width:220px">
          <div style="font-weight:800;overflow-wrap:anywhere">${g.isHome?"vs":"@"} ${g.opponent}</div>
          <div class="meta">${fmtDate(g.date)} ${g.venue?("· "+g.venue):""} ${g.tv?("· "+g.tv):""}</div>
          <a class="btn" target="_blank" rel="noopener" href="${ytSearchUrl(g.opponent,g.date)}">Highlights</a>
        </div>
        <div class="right">${right}</div>
      </div>
    </div>`);
    scheduleList.appendChild(card);
    card.querySelectorAll("img").forEach(imgFallback);
  }

  // Tickets list
  const upcoming=list.filter(g=> new Date(g.date) > new Date()).slice(0,5);
  ticketsList.innerHTML="";
  if(!upcoming.length){ ticketsList.innerHTML=`<div class="card">No upcoming games found.</div>`; }
  for(const g of upcoming){
    const t=ticketUrl(g.opponent, g.date);
    const c=el(`<div class="card">
      <div class="row">
        <img class="logo" alt="" src="${(g.opponentLogo||'').replace(/\.svg($|\?)/i,'.png')}" />
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
    </div>`);
    ticketsList.appendChild(c);
    c.querySelectorAll("img").forEach(imgFallback);
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

  // Wallpapers
  $("#wallpapers").innerHTML = [
    "https://upload.wikimedia.org/wikipedia/commons/7/7d/Florida_Gators_gator_logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/f/ff/Florida_Gators_block_F.svg"
  ].map(u=>`<img class="wall-img" loading="lazy" src="${u}" alt="Gators wallpaper">`).join("");
}

/* ========= Roster Rendering ========= */
function renderRoster(players){
  rosterList.innerHTML="";
  if(!players.length){ rosterList.appendChild(el(`<div class="card">No players found.</div>`)); return; }
  for(const p of players){
    const img = el(`<img class="logo" alt="">`); img.src=p.headshot; imgFallback(img);
    const card=el(`
      <div class="card">
        <div class="row">
          <div class="logo-wrap"></div>
          <div style="flex:1;min-width:240px">
            <div style="font-weight:800;overflow-wrap:anywhere">${p.fullName}</div>
            <div class="meta">${p.number?("#"+p.number+" "):""}${p.position??""} ${p.classYear?("· "+p.classYear):""}</div>
          </div>
        </div>
      </div>`);
    card.querySelector(".logo-wrap").appendChild(img);
    rosterList.appendChild(card);
  }
}

/* ========= Stats (this season only) ========= */
async function computeSeasonAverages(games){
  // Build per-player averages from completed games' box scores
  const completed = games.filter(g=>g.myScore!=null&&g.oppScore!=null);
  const agg = new Map(); // name -> {pts,reb,ast,fgm,fga,tpm,tpa,ftm,fta,gp}
  for(const g of completed){
    try{
      const sum = await getJSON(ESPN_WEB + g.id);
      const uf = (sum?.boxscore?.teams||[]).find(t=>String(t.team?.id)===String(TEAM_ID));
      const players = uf?.players || [];
      for(const p of players){
        const name = p.athlete?.displayName; if(!name) continue;
        const sraw = p.statistics?.[0]?.athletes?.[0]?.stats || p.statistics?.[0]?.stats || p.statistics?.stats || p.statistics || {};
        // Try both array or object formats
        let pts=0, reb=0, ast=0, fgm=0,fga=0,tpm=0,tpa=0,ftm=0,fta=0;
        if(Array.isArray(sraw)){
          const find = (k)=>{ const row = sraw.find(x=>new RegExp("^"+k+"[: ]","i").test(x)); return row? Number((row.split(":")[1]||"").trim()||0):0; };
          pts=find("PTS"); reb=find("REB"); ast=find("AST");
          const fg = (sraw.find(x=>/^FG[: ]/i.test(x))||"").split(":")[1]||"0-0"; [fgm,fga]=fg.split("-").map(Number);
          const tp = (sraw.find(x=>/^3PT[: ]|^3P[: ]/i.test(x))||"").split(":")[1]||"0-0"; [tpm,tpa]=tp.split("-").map(Number);
          const ft = (sraw.find(x=>/^FT[: ]/i.test(x))||"").split(":")[1]||"0-0"; [ftm,fta]=ft.split("-").map(Number);
        }else if(typeof sraw==="object"){
          pts=Number(sraw.PTS ?? sraw.points ?? 0);
          reb=Number(sraw.REB ?? sraw.rebounds ?? 0);
          ast=Number(sraw.AST ?? sraw.assists ?? 0);
          if(sraw.fieldGoalsMade!=null){ fgm=Number(sraw.fieldGoalsMade); fga=Number(sraw.fieldGoalsAttempted||0); }
          if(sraw.threePointFieldGoalsMade!=null){ tpm=Number(sraw.threePointFieldGoalsMade); tpa=Number(sraw.threePointFieldGoalsAttempted||0); }
          if(sraw.freeThrowsMade!=null){ ftm=Number(sraw.freeThrowsMade); fta=Number(sraw.freeThrowsAttempted||0); }
        }
        if(!agg.has(name)) agg.set(name,{pts:0,reb:0,ast:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0,gp:0});
        const a=agg.get(name);
        a.pts+=pts; a.reb+=reb; a.ast+=ast; a.fgm+=fgm; a.fga+=fga; a.tpm+=tpm; a.tpa+=tpa; a.ftm+=ftm; a.fta+=fta; a.gp+=1;
      }
    }catch{ /* ignore this game if ESPN summary fails */ }
  }
  const avgs = new Map(); // name -> {ppg,rpg,apg,fgp,tpp,ftp}
  for(const [name,a] of agg.entries()){
    const gp = Math.max(1,a.gp);
    avgs.set(name,{
      ppg: a.pts/gp,
      rpg: a.reb/gp,
      apg: a.ast/gp,
      fgp: a.fga? (a.fgm/a.fga*100):0,
      tpp: a.tpa? (a.tpm/a.tpa*100):0,
      ftp: a.fta? (a.ftm/a.fta*100):0,
    });
  }
  window._playerAverages = avgs;
  return avgs;
}

function renderLeadersFromAverages(players, avgs){
  const leaders=$("#leaders"); leaders.innerHTML="";
  const get = (k)=>players
    .map(p=>({p, v:(avgs.get(p.fullName)?.[k] ?? 0)}))
    .sort((a,b)=>b.v - a.v)[0] || {p:{fullName:"—"}, v:0};
  const cats=[["ppg","PPG"],["rpg","RPG"],["apg","APG"],["tpp","3P%"],["fgp","FG%"],["ftp","FT%"]];
  for(const [k,lab] of cats){
    const top=get(k);
    leaders.appendChild(el(`<div class="stat"><div class="t">${lab}</div><div class="v">${top.p.fullName}<br>${top.v.toFixed(k==="ppg"||k==="rpg"||k==="apg"?1:1)}</div></div>`));
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
function renderAdvancedTeam(games){
  const adv=$("#advStats");
  const comp=games.filter(g=>g.myScore!=null&&g.oppScore!=null);
  if(!comp.length){ adv.innerHTML="<div class='note'>No completed games yet.</div>"; return; }
  const ppg = comp.reduce((s,g)=>s+g.myScore,0)/comp.length;
  const oppg= comp.reduce((s,g)=>s+g.oppScore,0)/comp.length;
  adv.innerHTML = `
    <div class="card">PPG: <strong>${ppg.toFixed(1)}</strong></div>
    <div class="card">Opp PPG: <strong>${oppg.toFixed(1)}</strong></div>
    <div class="card">Diff: <strong>${(ppg-oppg).toFixed(1)}</strong></div>
  `;
}

/* ========= Props (Fun) – lines from this season’s averages ========= */
function roundHalf(x){ return Math.round(Math.max(1.5,x)*2)/2; }
function populatePropPlayerSelect(players){
  propPlayerSelect.innerHTML="";
  players.forEach(p=>{ const o=document.createElement("option"); o.value=p.id; o.textContent=p.fullName; propPlayerSelect.appendChild(o); });
  [...propPlayerSelect.options].slice(0,8).forEach(x=>x.selected=true);
}
function buildPropRow(player, line){
  const id = `pick-${player.id}`;
  const row=el(`<div class="card prop-row" data-player="${player.fullName}">
    <div class="prop-title" style="font-weight:800;min-width:200px">${player.fullName}</div>
    <div class="prop-line">O/U: ${line.toFixed(1)}</div>
    <div class="prop-choices">
      <label for="${id}-over"><input id="${id}-over" type="radio" name="${id}" value="over"> Over</label>
      <label for="${id}-under"><input id="${id}-under" type="radio" name="${id}" value="under"> Under</label>
    </div>
  </div>`);
  return row;
}
async function generateProps(){
  const players = UF_ROSTER.slice();
  if(!propPlayerSelect.options.length) populatePropPlayerSelect(players);
  const ids=[...propPlayerSelect.selectedOptions].map(o=>o.value);
  const selected = players.filter(p=>ids.includes(p.id));
  if(!selected.length){ toast("Pick at least one player"); return; }

  propsWrap.innerHTML = "<div class='note'>Computing season averages…</div>";
  const avgs = window._playerAverages || await computeSeasonAverages(window._latestGames||[]);
  propsWrap.innerHTML="";
  selected.forEach(p=>{
    const avg = avgs.get(p.fullName)?.ppg ?? 8; // safe default
    const line = roundHalf(avg);
    propsWrap.appendChild(buildPropRow(p, line));
  });
}

/* ========= Supabase: save picks + leaderboard ========= */
async function savePicks(){
  const username = (usernameInput.value||"").trim();
  if(!username){ toast("Enter a display name first"); usernameInput.focus(); return; }

  const rows=[];
  propsWrap.querySelectorAll(".prop-row").forEach(row=>{
    const player = row.getAttribute("data-player");
    const lineText = row.querySelector(".prop-line")?.textContent||"";
    const m = /O\/U:\s*([0-9.]+)/i.exec(lineText);
    const ou_line = m? Number(m[1]) : null;
    const id = "pick-" + (UF_ROSTER.find(p=>p.fullName===player)?.id||"x");
    const pick = row.querySelector(`input[name="${id}"]:checked`)?.value||null;
    if(pick && ou_line!=null){ rows.push({ username, player, ou_line, pick }); }
  });
  if(!rows.length){ toast("Pick Over/Under first"); return; }

  await sb.from("users").upsert({ username }).select();
  const { error } = await sb.from("prop_picks").insert(rows);
  if(error){ toast("Could not save picks"); return; }
  toast("Picks saved ✓");
  loadLeaderboard().catch(()=>{});
}
async function loadLeaderboard(){
  const lb = $("#lbWrap"); lb.innerHTML = "<div class='note'>Loading leaderboard…</div>";
  // Prefer view if it exists
  let data=null, error=null;
  ({ data, error } = await sb.from("props_leaderboard").select("*").order("total",{ascending:false}).limit(20));
  if(error){
    const res = await sb.from("prop_picks").select("username, count:id").group("username").order("count",{ascending:false}).limit(20);
    data = res.data?.map(r=>({ username:r.username, total:r.count }))||[];
  }
  if(!data?.length){ lb.innerHTML="<div class='note'>No picks yet.</div>"; return; }
  const table=el(`<table class="lb-table"><thead><tr><th>#</th><th>User</th><th>Total Picks</th></tr></thead><tbody></tbody></table>`);
  data.forEach((r,i)=>{
    table.querySelector("tbody").appendChild(el(`<tr><td>${i+1}</td><td>${r.username}</td><td>${r.total||r.total_picks||r.count||0}</td></tr>`));
  });
  lb.innerHTML=""; lb.appendChild(table);
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

/* ========= Load all ========= */
async function loadAll(){
  try{
    refreshBtn.disabled=true; refreshBtn.textContent="…"; setHero(0);

    // Schedule
    const sched = await getJSON(`${ESPN_SITE}/teams/${TEAM_ID}/schedule`);
    const games = parseSchedule(sched);
    renderSchedule(games);
    window._latestGames = games;

    // Roster
    renderRoster(UF_ROSTER);

    // Stats from season games
    const avgs = await computeSeasonAverages(games);
    renderLeadersFromAverages(UF_ROSTER, avgs);
    renderTeamPtsChart(games);
    renderAdvancedTeam(games);

    // News
    renderNews();

    // Props controls + leaderboard
    populatePropPlayerSelect(UF_ROSTER);
    await loadLeaderboard();

    toast("Loaded ✓");
  }catch(err){
    scheduleList.innerHTML=`<div class="card" style="color:#c1121f">Error: ${err.message||err}</div>`;
    toast("Load failed");
  }finally{
    refreshBtn.disabled=false; refreshBtn.textContent="↻";
  }
}

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", ()=>{
  setHero(0);
  activateTab("schedule");
  loadAll().catch(()=>{});

  genPropsBtn?.addEventListener("click", generateProps);
  savePicksBtn?.addEventListener("click", savePicks);
  refreshBtn?.addEventListener("click", loadAll);

  // Keyboard tab shortcuts
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
