/* Payday service worker — app shell offline, network for everything else */
var CACHE='payday-v20260912-52254';
var SHELL=['./','./index.html','./app.css?v20260912-52254','./app.js?v20260912-52254','./sync.js?v20260912-52254','./config.js?v20260912-52254','./vendor/supabase.js?v20260912-52254','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch',function(e){ var url=new URL(e.request.url); if(e.request.method!=='GET') return;
  if(url.origin===location.origin){ /* shell: cache first, refresh in background */
    e.respondWith(caches.match(e.request,{ignoreSearch:false}).then(function(hit){ var net=fetch(e.request).then(function(res){ if(res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request,copy); }); } return res; }).catch(function(){ return hit; }); return hit||net; }));
  } else if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'||url.hostname==='cdn.jsdelivr.net'){ /* third-party assets: cache, fall back to network */
    e.respondWith(caches.match(e.request).then(function(hit){ return hit||fetch(e.request).then(function(res){ if(res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request,copy); }); } return res; }); }));
  } });
