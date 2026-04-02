export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    const pass = url.searchParams.get("p");

    // 1. SHOW THE ADMIN PANEL UI
    if (!targetUrl) {
      return new Response(getAdminHTML(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // 2. PASSWORD CHECK
    if (pass !== "0000") {
      return new Response("Wrong Password! Use the Admin Panel.", { status: 401 });
    }

    // 3. PROXY LOGIC (Fetching the site)
    try {
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0" }
      });

      let body = await response.text();
      const targetOrigin = new URL(targetUrl).origin;

      // Fix Links/Images
      body = body.replace(/(src|href)=["']\/(?!\/)/g, `$1="${targetOrigin}/`);

      const newResponse = new Response(body, response);
      newResponse.headers.set("Content-Type", "text/html;charset=UTF-8");
      newResponse.headers.delete("X-Frame-Options");
      newResponse.headers.delete("Content-Security-Policy");
      newResponse.headers.set("Access-Control-Allow-Origin", "*");

      return newResponse;
    } catch (e) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  }
};

function getAdminHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Deltastudy Admin</title>
        <style>
            body { background: #000; color: #fff; font-family: sans-serif; text-align: center; padding: 50px; }
            .box { max-width: 400px; margin: auto; background: #111; padding: 30px; border: 1px solid #333; border-radius: 10px; }
            input { width: 90%; padding: 12px; margin: 10px 0; background: #222; border: 1px solid #444; color: #fff; }
            button { width: 95%; padding: 15px; background: #007bff; color: #fff; border: none; cursor: pointer; font-weight: bold; }
            #view-wrap { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #fff; z-index: 999; }
            iframe { width: 100%; height: 100%; border: none; }
        </style>
    </head>
    <body>
        <div id="ui" class="box">
            <h2 style="color:#00d4ff">Admin Bypass</h2>
            <input type="password" id="pw" placeholder="Password (0000)">
            <input type="text" id="link" placeholder="https://site-to-frame.com">
            <button type="button" onclick="loadNow()">Unlock & Show</button>
        </div>

        <div id="view-wrap">
            <div style="position:fixed; top:10px; right:10px; background:red; color:#fff; padding:10px; cursor:pointer; z-index:1000" onclick="location.reload()">CLOSE [X]</div>
            <iframe id="ifr" sandbox="allow-forms allow-scripts allow-same-origin allow-popups"></iframe>
        </div>

        <script>
            function loadNow() {
                const p = document.getElementById('pw').value;
                const l = document.getElementById('link').value;
                if (p !== "0000") return alert("Wrong Password");
                if (!l.includes("http")) return alert("Enter full link with http");

                const finalUrl = window.location.origin + "/?p=0000&url=" + encodeURIComponent(l);
                
                document.getElementById('ui').style.display = 'none';
                document.getElementById('view-wrap').style.display = 'block';
                document.getElementById('ifr').src = finalUrl;
            }
        </script>
    </body>
    </html>
  `;
        }
