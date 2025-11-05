// netlify/functions/gators-photos.js
// Fetch UF roster page and return { nameKey -> absolute headshot URL }
export default async (req, res) => {
  try {
    const resp = await fetch("https://floridagators.com/sports/mens-basketball/roster");
    if (!resp.ok) return res.status(502).json({ error: "Upstream error" });
    const html = await resp.text();

    // Very light HTML scrape: find <img ... alt="PLAYER NAME" ... src="...">
    // The site often uses data-src or srcset; we normalize whichever is present.
    const entries = {};
    const toAbs = (u) => {
      if (!u) return null;
      if (/^https?:\/\//i.test(u)) return u;
      return `https://floridagators.com${u.startsWith("/") ? "" : "/"}${u}`;
    };
    const nrm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    // Match blocks that look like roster cards; fallback to any <img alt="Name">
    const imgRegex = /<img[^>]*\salt="([^"]+)"[^>]*?>/gi;
    let m;
    while ((m = imgRegex.exec(html))) {
      const alt = m[1] || "";
      const tag = m[0];
      // Try to find src/srcset/data-src (prefer the largest image in srcset if present)
      let src =
        (/srcset="([^"]+)"/i.exec(tag)?.[1] || "")
          .split(",")
          .map(s => s.trim().split(" ")[0])
          .filter(Boolean)
          .pop() ||
        /data-src="([^"]+)"/i.exec(tag)?.[1] ||
        /src="([^"]+)"/i.exec(tag)?.[1] ||
        "";

      src = toAbs(src);
      const key = nrm(alt);
      if (key && src && !entries[key]) entries[key] = src;
    }

    return res.status(200).json({ ok: true, photos: entries });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
