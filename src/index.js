export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    const pass = url.searchParams.get("p");

    // 1. Show the Admin Panel if no URL is provided
    if (!targetUrl) {
      return new Response(this.getAdminHTML(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // 2. Password Check
    if (pass !== "0000") {
      return new Response("Error: Wrong Password in URL. Go back to the Admin Panel.", { status: 401 });
    }

    // 3. Proxy Logic
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });

      let body = await response.text();
      const targetOrigin = new URL(targetUrl).origin;

      // Fix Links & Images
      body = body.replace(/(src|href)=["']\/(?!\/)/g, `$1="${targetOrigin}/`);
      
      // Inject a script to prevent "Frame Busting" (sites trying to escape the iframe)
      const frameFix = `<script>window.onbeforeunload = function() { return "Preventing escape..."; };</script>`;
      body = body.replace("<head>", "<head>" + frameFix);

      const newResponse = new Response(body, response);
      
      // FORCED HEADER REMOVAL
      newResponse.headers.set("Content-Type", "text/html;charset=UTF-8");
      newResponse.headers.delete("X-Frame-Options");
      newResponse.headers.delete("Content-Security-Policy");
      newResponse.headers.set("Access-Control-Allow-Origin", "*");

      return newResponse;
    } catch (e) {
      return new Response("Worker Error: Could not fetch the site. Check the URL. " + e.message, { status: 500 });
    }
  },

  getAdminHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Deltastudy Bypass v2</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
              body { background: #000; color: #fff; font-family: sans-serif; margin: 0; padding: 20px; text-align: center; }
              .card { background: #111; border: 1px solid #333; padding: 20px; border-radius: 10px; max-width: 450px; margin: auto; }
              input { width: 90%; padding: 12px; margin: 10px 0; background: #222; border: 1px solid #444; color: #fff; border-radius: 5px; }
              button { width: 95%; padding: 15px; background: #007bff; border: none; color: white; font-weight: bold; cursor: pointer; border-radius: 5px; }
              #status { margin-top: 10px; color: #aaa; font-size: 12px; }
              #frame-wrap { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; }
              iframe { width: 100%; height: 100%; border: none; }
              .close-btn { position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 5px 15px; cursor: pointer; z-index: 10000; border-radius: 5px; font-weight: bold; }
          </style>
      </head>
      <body>
          <div id="login-ui" class="card">
              <h2 style="color:#00d4ff">Admin Bypass</h2>
              <input type="password" id="pw" placeholder="Password (0000)">
              <input type="text" id="target" placeholder="https://site-to-frame.com">
              <button onclick="startBypass()">Unlock & Show Content</button>
              <div id="status">Ready...</div>
          </div>

          <div id="frame-wrap">
              <div class="close-btn" onclick="location.reload()">Close [X]</div>
              <iframe id="view" sandbox="allow-forms allow-scripts allow-same-origin allow-popups"></iframe>
          </div>

          <script>
              function startBypass() {
                  const p = document.getElementById('pw').value;
                  const t = document.getElementById('target').value;
                  const status = document.getElementById('status');

                  if (p !== "0000") {
                      alert("Incorrect Password!");
                      return;
                  }
                  if (!t.includes("http")) {
                      alert("Please enter a full URL (including https://)");
                      return;
                  }

                  status.innerText = "Cleaning site and loading...";
                  
                  // Generate the final URL
                  const bypassUrl = window.location.origin + "/?p=0000&url=" + encodeURIComponent(t);
                  
                  // Show the iframe wrapper
                  document.getElementById('login-ui').style.display = 'none';
                  document.getElementById('frame-wrap').style.display = 'block';
                  
                  // Set the source
                  const frame = document.getElementById('view');
                  frame.src = bypassUrl;
                  
                  console.log("Loading: " + bypassUrl);
              }
          </script>
      </body>
      </html>
    `;
  }
};
