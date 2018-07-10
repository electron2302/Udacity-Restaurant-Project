# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_
---
#### Passed stage 1 and 2

#### Curently stage 3

---

## Run
no spetial server 
jus use "python -m SimpleHTTPServer 8000"
and then got to http://localhost:8000/

---

### curent Problem.
The background Sync is not being triggered
as far as I can tell this is because "navigator.serviceWorker.ready" (restaurant_info.js Line 363) doesn't resolve
even though I've tried to follow this Tutorials as closely as possible
https://youtu.be/cmGr0RszHc8?t=40m42s
https://developers.google.com/web/updates/2015/12/background-sync