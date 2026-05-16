import urllib.request
import re

data = urllib.request.urlopen(urllib.request.Request('http://rx.linkfanel.net/kiwisdr_com.js', headers={'User-Agent': 'Mozilla/5.0'})).read().decode()
idx = data.find('RADIOCLUB COSTA RICA')
print(f"Found at index: {idx}")
chunk = data[idx:idx+800]
print(chunk)
