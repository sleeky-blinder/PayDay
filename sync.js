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

  /* ---------- sign-in card ---------- */
  function signinUI(){ var card=q('#signin'); if(!card) return; show(card,true);
    var form=q('#signinForm'), msg=q('#signinMsg'), email=q('#signinEmail');
    form.addEventListener('submit',function(ev){ ev.preventDefault(); var v=email.value.trim(); if(!v) return; msg.textContent='Sending…';
      client.auth.signInWithOtp({email:v,options:{emailRedirectTo:location.origin+location.pathname}}).then(function(r){ if(r.error) throw r.error; msg.textContent='Link sent. Open it on this device and you will land back here, signed in.'; }).catch(function(e){ msg.textContent=e.message||'Could not send the link.'; }); });
    q('#signinSkip').addEventListener('click',function(){ show(card,false); App.setSync(false,'saved on this device'); localStorage.setItem('pm-skip-signin','1'); });
  }

  /* ---------- Settings: connect / change sync ---------- */
  var cfgBox=q('#syncCfg'); if(cfgBox){ q('#syncUrl').value=cfg.url||''; q('#syncKey').value=cfg.key||'';
    q('#btnSyncSave').addEventListener('click',function(){ var u=q('#syncUrl').value.trim(), k=q('#syncKey').value.trim(); if(!u||!k) return App.toast('Both fields are needed'); localStorage.setItem('pm-sync-cfg',JSON.stringify({url:u,key:k})); localStorage.removeItem('pm-skip-signin'); location.reload(); });
    q('#btnSyncClear').addEventListener('click',function(){ localStorage.removeItem('pm-sync-cfg'); location.reload(); }); }

  if(!hasCfg){ App.setSync(false,'saved on this device'); var w=q('#storeWhere'); if(w) w.textContent='Saved on this device only — connect Supabase below to sync'; return; }

  client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  App.setSync(false,'checking sign-in…');
  function signedOutUI(){ var w=q('#storeWhere'); if(w) w.textContent='Signed out — saved on this device only'; show(q('#signin'),false); var sa=q('#syncAcct'); if(!sa) return; sa.hidden=false; sa.innerHTML='<span>Not signed in</span><button class="btn sm" type="button" id="btnSignIn">Sign in to sync</button>'; q('#btnSignIn').addEventListener('click',function(){ localStorage.removeItem('pm-skip-signin'); signinUI(); window.scrollTo({top:0}); }); }
  client.auth.getSession().then(function(r){ var s=r.data&&r.data.session; if(s){ start(s); return; } App.setSync(false,'saved on this device'); if(!localStorage.getItem('pm-skip-signin')) signinUI(); else signedOutUI(); });
  client.auth.onAuthStateChange(function(ev,session){ if(ev==='SIGNED_IN'&&session&&!uid) start(session); if(ev==='SIGNED_OUT'){ uid=null; } });
})();
