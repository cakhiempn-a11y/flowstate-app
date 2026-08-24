import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

diagnostic_script = """
    <script>
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
          
          diag.innerHTML = `
            <strong>PWA Diagnostics</strong><br/>
            standalone: ${isStandalone}<br/>
            display-mode: ${currentMode}<br/>
            prompt-fired: ${window.promptFired || false}<br/>
            url: ${window.location.pathname}
          `;
        };
        
        window.addEventListener('beforeinstallprompt', (e) => {
          window.promptFired = true;
          updateDiag();
        });
        
        setInterval(updateDiag, 1000);
        updateDiag();
      });
    </script>
"""

# Insert before </body>
content = content.replace("</body>", diagnostic_script + "\n  </body>")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
