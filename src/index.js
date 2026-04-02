export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    const pass = url.searchParams.get("p");

    // 1. If no URL is provided, show the Admin Login Page
    if (!targetUrl) {
      return new Response(this.getAdminHTML(), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // 2. Security Check: Only allow if the password (0000) is in the URL
    if (pass !== "0000") {
      return new Response("Unauthorized: Access Denied. Use the Admin Panel.", { status: 401 });
    }

    // 3. Proxy Logic: Fetch and Clean the restricted site
    try {
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });

      let body = await response.text();
      const targetOrigin = new URL(targetUrl).origin;

      // Fix links/images (relative to absolute)
      body = body.replace(/(src|href)=["']\/(?!\/)/g, `$1="${targetOrigin}/`);

      const newResponse = new Response(body, response);
      newResponse.headers.set("Content-Type", "text/html");
      
      // KILL THE LOCKS
      newResponse.headers.delete("X-Frame-Options");
      newResponse.headers.delete("Content-Security-Policy");
      newResponse.headers.set("Access-Control-Allow-Origin", "*");

      return newResponse;
    } catch (e) {
      return new Response("Error loading site: " + e.message, { status: 500 });
    }
  },

  // This function generates the Admin Panel HTML directly from the worker
  getAdminHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Deltastudy Bypass</title>
          <style>
              body { background: #0f172a; color: #fff; font-family: sans-serif; text-align: center; padding: 50px; }
              .box { max-width: 400px; margin: auto; background: #1e293b; padding: 30px; border-radius: 10px; }
              input { padding: 12px; width: 80%; margin: 10px; border-radius: 5px; border: 1px solid #334155; background: #0f172a; color: white; }
              button { padding: 12px 25px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
              iframe { width: 100%; height: 90vh; border: none; display: none; margin-top: 20px; background: white; }
          </style>
      </head>
      <body>
          <div id="login" class="box">
              <h2 style="color: #60a5fa;">Admin Access</h2>
              <input type="password" id="pw" placeholder="Enter Password (0000)"><br>
              <input type="text" id="target" placeholder="Paste Site Link (https://...)"><br>
              <button onclick="go()">Unlock & Frame Site</button>
          </div>
          <iframe id="view" sandbox="allow-forms allow-scripts allow-same-origin"></iframe>
          <script>
              function go() {
                  const p = document.getElementById('pw').value;
                  const t = document.getElementById('target').value;
                  if (p === '0000') {
                      document.getElementById('login').style.display = 'none';
                      const f = document.getElementById('view');
                      f.style.display = 'block';
                      // This re-calls the worker with the password and the target URL
                      f.src = window.location.origin + "/?p=0000&url=" + encodeURIComponent(t);
                  } else { alert("Wrong Password!"); }
              }
          </script>
      </body>
      </html>
    `;
  }
};
