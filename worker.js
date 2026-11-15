export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // スポット情報の取得 GET /api/spot?id=reizouko
    if (path === "/api/spot" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await env.SPOT_STORE.get(id, { type: "json" }) || { owner: "なし", team: "none", defenseStart: Date.now() };
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ジムの防衛・占領更新 POST /api/gym/update
    if (path === "/api/gym/update" && request.method === "POST") {
      try {
        const body = await request.json();
        const { id, owner, team } = body;
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const current = await env.SPOT_STORE.get(id, { type: "json" }) || {};
        const newData = {
          owner: owner || current.owner || "名無し",
          team: team || current.team || "blue",
          defenseStart: current.owner === owner ? (current.defenseStart || Date.now()) : Date.now()
        };
        await env.SPOT_STORE.put(id, JSON.stringify(newData));
        return new Response(JSON.stringify({ success: true, data: newData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
