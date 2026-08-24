import urllib.request

try:
    with urllib.request.urlopen('http://localhost:3000/api/test-env') as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
