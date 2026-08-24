import urllib.request
import json

data = json.dumps({
    "contents": [{"role": "user", "parts": [{"text": "Hello"}]}]
}).encode('utf-8')

req = urllib.request.Request('http://localhost:3000/api/gemini', data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        print(response.getcode())
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
