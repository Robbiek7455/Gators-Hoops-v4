export default async (req) => {
  try {
    const API = "https://api.the-odds-api.com/v4";
    const key = process.env.ODDS_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: "Missing ODDS_API_KEY" }), { status: 500 });

    const url = new URL(req.url);
    const type    = url.searchParams.get("type")    || "game"; // "game" | "player"
    const eventId = url.searchParams.get("eventId");           // required for player
    const region  = url.searchParams.get("region")  || "us";

    let target;
    if (type === "game") {
      target = `${API}/sports/basketball_ncaab/odds?regions=${region}&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${key}`;
    } else if (type === "player") {
      if (!eventId) return new Response(JSON.stringify({ error: "eventId required" }), { status: 400 });
      const markets = "player_points,player_rebounds,player_assists";
      target = `${API}/sports/basketball_ncaab/events/${encodeURIComponent(eventId)}/odds?regions=${region}&markets=${markets}&oddsFormat=american&apiKey=${key}`;
    } else {
      return new Response(JSON.stringify({ error: "unknown type" }), { status: 400 });
    }

    const r = await fetch(target);
    const data = await r.json();
    return new Response(JSON.stringify(data), {
      status: r.status,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
