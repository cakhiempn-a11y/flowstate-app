import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <title> tag to change the title as well, though optional, it's nice.
# Actually, the user wants to keep things clean.
# I'll just insert after <meta name="viewport"...
viewport_tag = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'

injection = """
    <meta name="theme-color" content="#e86fa5" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/png" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('ServiceWorker registered:', reg.scope);
          }).catch(err => {
            console.error('ServiceWorker registration failed:', err);
          });
        });
      }
    </script>"""

if viewport_tag in content:
    content = content.replace(viewport_tag, viewport_tag + injection)
else:
    print("Could not find viewport tag!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched index.html")
