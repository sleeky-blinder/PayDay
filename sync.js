/* Payday — sync layer.
   Gives the app the small document API it was written against
   (doc.set / doc.update / doc.onSnapshot / collection.onSnapshot),
   backed by one Supabase table:  docs(user_id, path, data).
   Without a Supabase config the app runs on this device only. */
(function(){
  'use strict';
  var App=window.Payday; if(!App) return;
  var cfg=window.PAYDAY_CONFIG||{};
  try{ var saved=JSON.parse(localStorage.getItem('pm-sync-cfg')||'null'); if(saved&&saved.url&&saved.key) cfg=saved; }catch(e){}
  /* a setup link carries the project URL and anon key to a new device */
  try{ var m=/[#?]setup=([A-Za-z0-9+/=_-]+)/.exec(location.href);
    if(m){ var d=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g,'+').replace(/_/g,'/')))));
      if(d&&d.url&&d.key){ cfg={url:d.url,key:d.key}; localStorage.setItem('pm-sync-cfg',JSON.stringify(cfg)); localStorage.removeItem('pm-skip-signin'); }
      history.replaceState(null,'',location.pathname); } }catch(e){}
  var hasCfg=!!(cfg.url&&cfg.key&&window.supabase);
  var client=null, uid=null, cache={}, docL={}, colL={}, channel=null;

  function q(sel){ return document.querySelector(sel); }
  function show(el,on){ if(el) el.hidden=!on; }

  /* ---------- the shim ---------- */
  function emitDoc(path){ (docL[path]||[]).forEach(function(cb){ var d=cache[path]; cb({exists:d!==undefined, data:function(){ return d; }, metadata:{fromCache:false}}); }); }
  function emitCol(name){ (colL[name]||[]).forEach(function(cb){ var docs=Object.keys(cache).filter(function(p){ return p.indexOf(name+'/')===0; }).map(function(p){ return {id:p.slice(name.length+1), data:function(){ return cache[p]; }}; }); cb({docs:docs, metadata:{fromCache:false}}); }); }
  function emitAll(){ Object.keys(docL).forEach(emitDoc); Object.keys(colL).forEach(emitCol); }
  function colOf(path){ return path.split('/')[0]; }

  function loadAll(){ return client.from('docs').select('path,data').then(function(r){ if(r.error) throw r.error; cache={}; (r.data||[]).forEach(function(row){ cache[row.path]=row.data; }); emitAll(); }); }

  var db={
    doc:function(path){ return {
      get:function(){ return client.from('docs').select('data').eq('path',path).maybeSingle().then(function(r){ if(r.error) throw r.error; var d=r.data?r.data.data:undefined; cache[path]=d; return {exists:d!==undefined, data:function(){ return d; }}; }); },
      set:function(data){ return client.from('docs').upsert({user_id:uid,path:path,data:data,updated_at:new Date().toISOString()},{onConflict:'user_id,path'}).then(function(r){ if(r.error) throw r.error; cache[path]=data; emitDoc(path); emitCol(colOf(path)); }); },
      update:function(patch){ /* only {items:{id:entry}} merges are used by the app */
        return client.rpc('merge_items',{p_path:path,p_items:patch.items||{}}).then(function(r){ if(r.error) throw r.error; var cur=cache[path]||{items:{}}; var items=Object.assign({},cur.items||{},patch.items||{}); cache[path]={items:items}; emitDoc(path); emitCol(colOf(path)); }); },
      onSnapshot:function(cb,err){ (docL[path]=docL[path]||[]).push(cb); if(ready) emitDoc(path); }
    }; },
    collection:function(name){ return { onSnapshot:function(cb,err){ (colL[name]=colL[name]||[]).push(cb); if(ready) emitCol(name); } }; }
  };
  var ready=false;

  function subscribe(){ if(channel) client.removeChannel(channel);
    channel=client.channel('docs-'+uid).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'user_id=eq.'+uid},function(payload){ var row=payload.new||{}; if(!row.path) return; cache[row.path]=row.data; emitDoc(row.path); emitCol(colOf(row.path)); }).subscribe(function(status){ if(status==='SUBSCRIBED') App.setSync(true,'synced'); else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT') App.setSync(false,'sync paused — kept on this device'); }); }

  function start(session){ uid=session.user.id; App.setSync(true,'connecting…');
    loadAll().then(function(){ ready=true; App.connectDb(db); subscribe(); show(q('#signin'),false); acctLine(session.user.email); })
      .catch(function(e){ App.setSync(false,'sync failed — kept on this device'); App.toast('Could not reach sync: '+(e.message||e)); });
    document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible'&&ready) loadAll().catch(function(){}); });
  }

  function acctLine(email){ var box=q('#syncAcct'); if(!box) return; box.hidden=false; box.innerHTML='<span>Synced as <b>'+email+'</b></span><button class="btn sm ghost" type="button" id="btnSignOut">Sign out</button>'; q('#btnSignOut').addEventListener('click',function(){ client.auth.signOut().then(function(){ location.reload(); }); }); }

  /* ---------- sign-in card: email + password ---------- */
  function authMsg(e){ var m=(e&&e.message)||String(e||'');
    if(/Invalid login credentials/i.test(m)) return 'That email and password do not match an account here. If this is your first time, tap Create account.';
    if(/User already registered/i.test(m)) return 'That account already exists — tap Sign in instead.';
    if(/Password should be/i.test(m)) return 'Passwords need at least 6 characters.';
    if(/Email .*not authorized|signups not allowed|Signups not allowed/i.test(m)) return 'This Supabase project has sign-ups disabled. Turn Email sign-ups back on under Authentication → Sign In / Providers.';
    if(/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Could not reach Supabase. Check the project URL under Sync connection, and that you are online.';
    if(/Invalid API key|JWT/i.test(m)) return 'Supabase rejected the key. Re-copy the anon public key under Sync connection.';
    return m || 'Sign-in failed.';
  }
  function signinUI(){ var card=q('#signin'); if(!card||card.dataset.wired==='1'){ show(card,true); return; } card.dataset.wired='1'; show(card,true);
    var form=q('#signinForm'), msg=q('#signinMsg'), email=q('#signinEmail'), pass=q('#signinPass'), mk=q('#signinNew');
    function creds(){ var e=email.value.trim(), p=pass.value; if(!e||!p){ msg.textContent='Email and password, please.'; return null; } return {email:e,password:p}; }
    form.addEventListener('submit',function(ev){ ev.preventDefault(); var c=creds(); if(!c) return; msg.textContent='Signing in…';
      client.auth.signInWithPassword(c).then(function(r){ if(r.error) throw r.error; msg.textContent='Signed in.'; })
        .catch(function(e){ msg.textContent=authMsg(e); }); });
    mk.addEventListener('click',function(){ var c=creds(); if(!c) return; msg.textContent='Creating the account…';
      client.auth.signUp(c).then(function(r){ if(r.error) throw r.error;
        if(r.data&&r.data.session){ msg.textContent='Account created. You are signed in.'; }
        else { msg.textContent='Account created, but this project still wants email confirmation. Turn Confirm email off under Authentication → Sign In / Providers → Email, then tap Sign in.'; } })
        .catch(function(e){ msg.textContent=authMsg(e); }); });
    q('#signinSkip').addEventListener('click',function(){ show(card,false); App.setSync(false,'saved on this device'); localStorage.setItem('pm-skip-signin','1'); });
  }

  /* ---------- Settings: connect / change sync ---------- */
  var cfgBox=q('#syncCfg'); if(cfgBox){ q('#syncUrl').value=cfg.url||''; q('#syncKey').value=cfg.key||'';
    q('#btnSyncSave').addEventListener('click',function(){ var u=q('#syncUrl').value.trim(), k=q('#syncKey').value.trim(); if(!u||!k) return App.toast('Both fields are needed'); localStorage.setItem('pm-sync-cfg',JSON.stringify({url:u,key:k})); localStorage.removeItem('pm-skip-signin'); location.reload(); });
    q('#btnSyncClear').addEventListener('click',function(){ localStorage.removeItem('pm-sync-cfg'); location.reload(); }); }
  var lnkBtn=q('#btnSetupLink');
  if(lnkBtn) lnkBtn.addEventListener('click',function(){
    if(!cfg.url||!cfg.key) return App.toast('Nothing to share yet — set the project URL and key first');
    var b=btoa(unescape(encodeURIComponent(JSON.stringify({url:cfg.url,key:cfg.key})))).replace(/\+/g,'-').replace(/\//g,'_');
    var link=location.origin+location.pathname+'#setup='+b;
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(link).then(function(){ App.toast('Setup link copied — open it once on the other device'); },function(){ prompt('Copy this link and open it on the other device:',link); }); }
    else prompt('Copy this link and open it on the other device:',link);
  });

  if(!hasCfg){ var w=q('#storeWhere');
    if(cfg.url&&cfg.key&&!window.supabase){ /* configured, but the client library never loaded */
      App.setSync(false,'sync library did not load');
      if(w) w.textContent='Sync is set up, but vendor/supabase.js could not be loaded from this address — check that the vendor folder was uploaded with the app.';
      App.toast('Sync off: vendor/supabase.js is missing from the server');
    } else {
      App.setSync(false,'saved on this device');
      if(w) w.textContent='Saved on this device only — connect Supabase below to sync';
    }
    return; }

  client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  App.setSync(false,'checking sign-in…');
  function signedOutUI(){ var w=q('#storeWhere'); if(w) w.textContent='Signed out — saved on this device only'; show(q('#signin'),false); var sa=q('#syncAcct'); if(!sa) return; sa.hidden=false; sa.innerHTML='<span>Not signed in</span><button class="btn sm" type="button" id="btnSignIn">Sign in to sync</button>'; q('#btnSignIn').addEventListener('click',function(){ localStorage.removeItem('pm-skip-signin'); signinUI(); window.scrollTo({top:0}); }); }
  client.auth.getSession().then(function(r){ var s=r.data&&r.data.session; if(s){ start(s); return; } App.setSync(false,'saved on this device'); if(!localStorage.getItem('pm-skip-signin')) signinUI(); else signedOutUI(); });
  client.auth.onAuthStateChange(function(ev,session){ if(ev==='SIGNED_IN'&&session&&!uid) start(session); if(ev==='SIGNED_OUT'){ uid=null; } });
})();
