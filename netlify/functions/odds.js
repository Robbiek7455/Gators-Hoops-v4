async function loadGameOdds(){
  if(!gameOddsDiv) return;
  gameOddsDiv.innerHTML = "<div class='note'>Loading odds…</div>";
  try{
    const res = await fetch(`${NETLIFY_ODDS_FN}?type=game&region=us&_=${Date.now()}`); // cache-bust
    if(!res.ok){ gameOddsDiv.innerHTML = "<div class='note'>No odds available right now.</div>"; return; }
    const odds = await res.json();
    const sched = window._latestGames || [];
    const rows = [];

    // Only events that include Florida Gators
    const gatorEvents = (odds || []).filter(ev => {
      const home = nrm(ev.home_team), away = nrm(ev.away_team);
      return home === GATORS || away === GATORS;
    });

    // Build cards sorted by nearest upcoming schedule game
    gatorEvents.forEach(event=>{
      const link = mapOddsEventToSched(event, sched);
      if(!link) return;
      const { match } = link;
      const book = (event.bookmakers||[])[0]; if(!book) return;
      const markets = {}; for(const m of (book.markets||[])) markets[m.key]=m;

      const h2h    = markets.h2h?.outcomes    || [];
      const spreads= markets.spreads?.outcomes|| [];
      const totals = markets.totals?.outcomes || [];

      const card=el(`
        <div class="card" style="cursor:pointer" title="Tap to view player props for this game">
          <div class="row">
            <div style="flex:1">
              <div style="font-weight:800">${match.isHome?"vs":"@"} ${match.opponent}</div>
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
        await cachePlayerOddsLines(event.id);         // prefetch & cache lines
        propGameSelect.value = match.id;              // sync the dropdown
        renderPropsFromOdds(match.id);                // show sportsbook lines in Props (Fun)
        await loadPlayerProps(event.id);              // show raw book props list below
      });
      rows.push(card);
    });

    gameOddsDiv.innerHTML = rows.length ? "" : "<div class='note'>No Gators games with odds yet.</div>";
    rows.forEach(r=>gameOddsDiv.appendChild(r));
  }catch(e){
    gameOddsDiv.innerHTML = `<div class='note'>Failed to load odds (${String(e)}).</div>`;
  }
}
