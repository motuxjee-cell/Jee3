export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("No URL provided. Use ?url=https://example.com", { status: 400 });
    }

    try {
      // 1. Fetch the restricted site as a "real" browser
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      let body = await response.text();
      const targetOrigin = new URL(targetUrl).origin;

      // 2. Fix Relative Links (makes images/CSS work)
      // This converts href="/style.css" to href="https://target.com/style.css"
      body = body.replace(/(src|href)=["']\/(?!\/)/g, `$1="${targetOrigin}/`);

      const newResponse = new Response(body, response);

      // 3. REMOVE THE LOCKS
      newResponse.headers.set("Content-Type", "text/html");
      newResponse.headers.delete("X-Frame-Options");
      newResponse.headers.delete("Content-Security-Policy");
      
      // 4. Allow your Render site to access this data
      newResponse.headers.set("Access-Control-Allow-Origin", "*");

      return newResponse;
    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
