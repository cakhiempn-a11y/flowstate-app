import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old diagnostic script
content = re.sub(r'<script>\s*window\.addEventListener\(\'load\', \(\) => {\s*const diag = document\.createElement.*?setInterval\(updateDiag, 1000\);\s*updateDiag\(\);\s*}\);\s*</script>', '', content, flags=re.DOTALL)

diagnostic_script = """
    <script>
      // Capture early
      window.promptFired = false;
      window.appInstalled = false;
      window.addEventListener('beforeinstallprompt', (e) => {
        window.promptFired = true;
        window.deferredPrompt = e;
      });
      window.addEventListener('appinstalled', (e) => {
        window.appInstalled = true;
      });

      window.addEventListener('load', () => {
        const diag = document.createElement('div');
        diag.style.position = 'fixed';
        diag.style.bottom = '10px';
        diag.style.right = '10px';
        diag.style.background = 'rgba(0,0,0,0.8)';
        diag.style.color = 'lime';
        diag.style.padding = '10px';
        diag.style.zIndex = '99999';
        diag.style.fontSize = '10px';
        diag.style.pointerEvents = 'none';
        document.body.appendChild(diag);
        
        const updateDiag = () => {
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
          const modes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
          const currentMode = modes.find(mode => window.matchMedia(`(display-mode: ${mode})`).matches) || 'unknown';
          
          let swState = 'none';
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            swState = 'controlled';
          }
          
          diag.innerHTML = `
            <strong>PWA Diagnostics v2</strong><br/>
            standalone: ${isStandalone}<br/>
            display-mode: ${currentMode}<br/>
            prompt-fired: ${window.promptFired}<br/>
            app-installed: ${window.appInstalled}<br/>
            sw: ${swState}<br/>
            url: ${window.location.pathname}
          `;
        };
        
        setInterval(updateDiag, 1000);
        updateDiag();
      });
    </script>
"""

content = content.replace("</body>", diagnostic_script + "\n  </body>")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
