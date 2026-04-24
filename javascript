export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let path = url.pathname;

    // 跨域配置
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ====================== 用户独立多仓（兼容版） ======================
    // 格式：/用户名_multi.json → 读取用户 xxx 的接口
    const userMatch = path.match(/^\/([a-zA-Z0-9]+)_multi\.json$/);
    if (userMatch) {
      const username = userMatch[1];
      const key = `api_list_${username}`;
      let list = await env.API_LIST_KV.get(key, { type: "json" }) || [];
      // 直接返回 App 能识别的标准格式：{"urls": [...]}
      return Response.json({ urls: list }, { headers: corsHeaders });
    }

    // 添加接口（带用户名）
    if (path === "/add") {
      const { username, name, url } = await request.json();
      if (!username || !name || !url) {
        return Response.json({ success: false, msg: "参数不全" }, { headers: corsHeaders });
      }
      const key = `api_list_${username}`;
      let list = await env.API_LIST_KV.get(key, { type: "json" }) || [];
      list.push({ name, url });
      await env.API_LIST_KV.put(key, JSON.stringify(list));
      return Response.json({ success: true, msg: "添加成功" }, { headers: corsHeaders });
    }

    // 删除接口（带用户名）
    if (path === "/delete") {
      const { username, index } = await request.json();
      if (!username || index == null) {
        return Response.json({ success: false, msg: "参数不全" }, { headers: corsHeaders });
      }
      const key = `api_list_${username}`;
      let list = await env.API_LIST_KV.get(key, { type: "json" }) || [];
      if (index >= 0 && index < list.length) list.splice(index, 1);
      await env.API_LIST_KV.put(key, JSON.stringify(list));
      return Response.json({ success: true, msg: "删除成功" }, { headers: corsHeaders });
    }

    return new Response("404", { status: 404 });
  }
};