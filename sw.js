/* Payday service worker.
   Network-first for our own files: an update always lands on the next open.
   Cache is the offline fallback only. Third-party assets are cache-first. */
var CACHE='payday-v20260913-24156';
var SHELL=['./','./index.html','./app.css?v20260913-24156','./app.js?v20260913-24156','./sync.js?v20260913-24156','./config.js?v20260913-24156','./vendor/supabase.js?v20260913-24156','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('message',function(e){ if(e.data==='skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch',function(e){ var url=new URL(e.request.url); if(e.request.method!=='GET') return;
  if(url.origin===location.origin){ /* ours: network first, cache as the fallback */
    e.respondWith(fetch(e.request).then(function(res){ if(res&&res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request,copy); }); } return res; })
      .catch(function(){ return caches.match(e.request,{ignoreSearch:true}).then(function(hit){ return hit||caches.match('./index.html'); }); }));
  } else if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){ /* fonts: cache first */
    e.respondWith(caches.match(e.request).then(function(hit){ return hit||fetch(e.request).then(function(res){ if(res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request,copy); }); } return res; }); }));
  } });
