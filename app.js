
(function(){
'use strict';
/* ---------- constants ---------- */
var ACC=[
 {id:'pocket',name:'PocketApp',app:'PocketApp',grp:'Spending',cash:true,path:'PocketApp',job:'The month\'s spending: food, transport, data, internet, outings, clothes.'},
 {id:'zenith',name:'Zenith',app:'Zenith Bank',grp:'Spending',cash:true,path:'Zenith app',job:'The router. Family support goes out, Cowrywise debits the rest, a float stays behind for card subscriptions and bank charges.'},
 {id:'flex',name:'Flex Naira',app:'PiggyVest',grp:'Spending',cash:true,path:'PiggyVest → Flex Naira',job:'Landing pad for a salary. Holds nothing overnight.'},
 {id:'cash',name:'Cash in hand',app:'Cash',grp:'Spending',cash:true,physical:true,path:'Your wallet',job:'Notes withdrawn from Zenith or Pocket. Spent like Pocket money — it counts against the allowance. Count it now and then and use Reconcile.'},
 {id:'cons',name:'Conservative Portfolio',app:'Cowrywise',grp:'Reserve',rate:'16.86% p.a.',tgt:'ef',tgtLabel:'emergency fund',path:'Cowrywise → Invest → Naira Mutual Funds → Conservative',job:'Low risk, T-bills and money market. Holds the emergency fund first; above that, the naira reserve. Withdraw in 1–3 days.'},
 {id:'house',name:'HouseMoney',app:'PiggyVest',grp:'Rent',rate:'15% p.a.',tgt:'rent',tgtLabel:'rent · Feb 2027',path:'PiggyVest → HouseMoney',job:'Rent wallet. Next rent due Feb 2027, then the year after divided by 12.'},
 {id:'fxd',name:'Flex Dollar',app:'PiggyVest',grp:'Dollars',usd:true,rate:'up to 5% USD',path:'PiggyVest → Flex Dollar',job:'Dollar cash, PiggyVest side. Deposits — the balance in dollars never falls.'},
 {id:'dollar',name:'Dollar Portfolio',app:'Cowrywise',grp:'Dollars',usd:true,rate:'6.48% YTD USD',path:'Cowrywise → Invest → Dollar Mutual Funds',job:'Dollar bonds: Nigerian Eurobond · ARM Eurobond · FSDH Dollar. Hedges the naira, carries Nigeria credit risk.'},
 {id:'life',name:'Life plan',app:'Cowrywise',grp:'Wants',path:'Cowrywise → Save → Emergency-type plan "Life"',job:'Travel, gadgets, big gifts. Funded each payday from 1 Jan 2027. Spend up to its balance; never top it up from another pot.'},
 {id:'nest',name:"Light's Nest",app:'Cowrywise',grp:'Family',rate:'12.57% p.a.',path:'Cowrywise → Nest',job:'Funded every payday, with a catch-up on 8 Dec. Hers, for 17 years.'},
 {id:'equity',name:'Equity Portfolio',app:'Cowrywise',grp:'Growth',rate:'41.13% YTD',path:'Cowrywise → Naira Mutual Funds → My investments',job:'Four active equity funds. Hold. No new money until under 25% of the whole.'},
 {id:'stocks',name:'Stocks · MTN',app:'Cowrywise',grp:'Speculative',path:'Cowrywise → Stocks',job:'Speculative sleeve, funded monthly from May 2027. Never topped up after a loss.'},
 {id:'dangote',name:'Dangote Refinery',app:'PiggyVest',grp:'Speculative',path:'PiggyVest → IPO',job:'Bought in the 1 Oct IPO. Then leave it alone for a year.'},
 {id:'piggy',name:'PiggyBank',app:'PiggyVest',grp:'Locked',rate:'16% p.a.',path:'PiggyVest → Savings → PiggyBank',job:'Locked savings. Interest to Flex on the 1st. Free window ~8 Dec, then it never re-locks.'}
];
var GROUPS=[['Spending','Spending accounts'],['Reserve','Reserve'],['Rent','Rent'],['Dollars','Dollar sleeve'],['Wants','Wants'],['Family','Family'],['Growth','Growth'],['Speculative','Speculative'],['Locked','Locked']];
var EXT=[{id:'income',name:'Salary / income'},{id:'spend',name:'Spending'},{id:'dad',name:'Dad'},{id:'interest',name:'Interest / returns'},{id:'rent',name:'Landlord (rent)'},{id:'fees',name:'Bank charges'},{id:'ext',name:'Other (outside)'}];
var ACCMAP={}; ACC.concat(EXT).forEach(function(a){ACCMAP[a.id]=a;});
var DEFAULT_OPEN={pocket:0,zenith:0,flex:0,cash:0,cons:0,house:0,fxd:0,dollar:0,life:0,nest:0,equity:0,stocks:0,dangote:0,piggy:0};
var DEFAULT_SET={"allowance": 0, "cushion": 0, "zfloat": 0, "rate": 1420, "anchorDate": "2026-09-10", "budgetStart": "2026-10", "ef": 0, "rentTarget": 0, "ret": 0, "posFee": 100, "posPer": 10000, "atmFee": 100, "atmPer": 20000};
var DEFAULT_FEES={zenith:{stamp:true,nip:true,sms:false,stampDebit:true},pocket:{stamp:true,nip:false,sms:false},flex:{stamp:true,nip:false,sms:false}};
var DEBIT_TARGETS={cons:1,dollar:1,nest:1,life:1,stocks:1};
var CATS=['Food','Transport','Data & airtime','Subscriptions','Outings','Clothes','Health','Gifts & family','Home','Other'];
var SUBS=[{"k": "net", "name": "Internet", "amt": 0, "cat": "Data & airtime", "from": "pocket"}, {"k": "icloud", "name": "iCloud", "amt": 0, "cat": "Subscriptions", "from": "zenith"}, {"k": "x", "name": "X Premium", "amt": 0, "cat": "Subscriptions", "from": "zenith"}, {"k": "yt", "name": "YouTube Premium", "amt": 0, "cat": "Subscriptions", "from": "zenith"}];
var FIRST_RUN='2026-10';
var DEFAULT_PLAN={"salaries": [{"acct": "pocket", "amt": 0, "note": "PocketApp \u00b7 after tax"}, {"acct": "flex", "amt": 0, "note": "PiggyVest Flex Naira \u00b7 after tax"}, {"acct": "zenith", "amt": 0, "note": "Zenith \u00b7 after \u20a690k WHT"}], "lines": [{"id": "flex-dangote", "grp": "Flex", "from": "flex", "to": "dangote", "label": "Buy the Dangote IPO shares", "how": "PiggyVest \u2192 IPO \u00b7 after the AutoSaves run", "day": 1, "months": {"2026-10": 0}, "method": "inapp"}, {"id": "flex-house", "grp": "Flex", "from": "flex", "to": "house", "label": "Flex \u2192 HouseMoney", "how": "AutoSave, 1st \u00b7 confirm it ran", "day": 1, "amts": {"2026-10": 0, "2027-03": 0}, "start": "2026-10", "method": "inapp"}, {"id": "flex-fxd", "grp": "Flex", "from": "flex", "to": "fxd", "label": "Flex \u2192 Flex Dollar", "how": "AutoSave, 1st \u00b7 the first one by hand on 1 Oct unlocks it", "day": 1, "amts": {"2026-10": 0, "2027-03": 0}, "start": "2026-10", "method": "inapp"}, {"id": "flex-cons", "grp": "Flex", "from": "flex", "to": "cons", "label": "Flex \u2192 Conservative Portfolio", "how": "Withdraw to the saved Cowrywise beneficiary \u00b7 Flex should read zero after", "day": 1, "amts": {"2026-10": 0, "2026-11": 0}, "start": "2026-10", "dyn": "restOfFlex", "method": "transfer"}, {"id": "zen-dad", "grp": "Zenith", "from": "zenith", "to": "dad", "label": "Zenith \u2192 Dad", "how": "Standing order, 1st \u00b7 confirm it went", "day": 1, "amts": {"2026-10": 0}, "start": "2026-10", "method": "transfer"}, {"id": "zen-nest", "grp": "Zenith", "from": "zenith", "to": "nest", "label": "Zenith \u2192 Nest (Light)", "how": "Cowrywise debit, 1st", "day": 1, "amts": {"2026-10": 0}, "start": "2026-10", "method": "debit"}, {"id": "zen-cons", "grp": "Zenith", "from": "zenith", "to": "cons", "label": "Zenith \u2192 Conservative Portfolio", "how": "Cowrywise debit, 2nd", "day": 2, "amts": {"2026-10": 0, "2027-01": 0, "2027-05": 0}, "start": "2026-10", "method": "debit"}, {"id": "zen-dollar", "grp": "Zenith", "from": "zenith", "to": "dollar", "label": "Zenith \u2192 Dollar Portfolio", "how": "Cowrywise debit, 2nd \u00b7 the first one by hand on 2 Oct unlocks auto-invest", "day": 2, "amts": {"2026-10": 0, "2027-01": 0, "2027-05": 0}, "start": "2026-10", "method": "debit"}, {"id": "zen-life", "grp": "Zenith", "from": "zenith", "to": "life", "label": "Zenith \u2192 Life plan", "how": "Cowrywise debit, 2nd \u00b7 create the plan by hand on 1 Jan with this first debit", "day": 2, "amts": {"2027-01": 0}, "start": "2027-01", "method": "debit"}, {"id": "zen-stocks", "grp": "Zenith", "from": "zenith", "to": "stocks", "label": "Zenith \u2192 Stocks", "how": "Manual order on Cowrywise Stocks", "day": 2, "amts": {"2027-05": 0}, "start": "2027-05", "method": "debit"}, {"id": "int-flex", "grp": "Sweep", "from": "interest", "to": "flex", "label": "PiggyBank interest lands in Flex", "how": "Roughly \u2014 enter the real figure", "day": 1, "months": {"2026-10": 0, "2026-11": 0, "2026-12": 0}, "method": "none"}, {"id": "flex-house-sweep", "grp": "Sweep", "from": "flex", "to": "house", "label": "Sweep the interest \u2192 HouseMoney", "how": "In-app, same day", "day": 1, "months": {"2026-10": 0, "2026-11": 0, "2026-12": 0}, "method": "inapp"}], "oneoffs": [{"id": "dec-piggy-flex", "d": "2026-12-08", "from": "piggy", "to": "flex", "amt": 0, "label": "Withdraw the whole PiggyBank to Flex", "how": "Free-withdrawal window. It does not re-lock.", "method": "inapp"}, {"id": "dec-flex-nest", "d": "2026-12-08", "from": "flex", "to": "nest", "amt": 0, "label": "Flex \u2192 Nest catch-up for Light", "how": "The catch-up: months owed, minus what is already held", "method": "transfer"}, {"id": "dec-flex-fxd", "d": "2026-12-08", "from": "flex", "to": "fxd", "amt": 0, "label": "Flex \u2192 Flex Dollar", "how": "In-app", "method": "inapp"}, {"id": "dec-flex-dollar", "d": "2026-12-08", "from": "flex", "to": "dollar", "amt": 0, "label": "Flex \u2192 Cowrywise Dollar Portfolio", "how": "Withdraw to beneficiary, then buy", "method": "transfer"}, {"id": "feb-rent", "d": "2027-02-01", "from": "house", "to": "rent", "amt": 0, "label": "Pay the rent from HouseMoney", "how": "Free withdrawal on the due date \u00b7 enter the real amount", "method": "inapp"}]};

/* ---------- state ---------- */
var state={opening:Object.assign({},DEFAULT_OPEN),settings:Object.assign({},DEFAULT_SET),done:{},subs:null,plan:null,confirmed:{},catLimits:{}};
var ledger={};   // ym -> { id -> entry | tombstone {id,del:true,ts} }
var pending={};  // ym -> { id -> entry|tombstone } awaiting sync
var db=null;
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function plan(){ var p=state.plan; if(!p||!Array.isArray(p.lines)) return DEFAULT_PLAN; return p; }
function subsList(){ return Array.isArray(state.subs)?state.subs:SUBS; }
function ls(k,v){try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v);}catch(e){return null;}}
function adoptState(s){ state.opening=Object.assign({},DEFAULT_OPEN,s.opening||{}); state.settings=Object.assign({},DEFAULT_SET,s.settings||{}); state.done=s.done||{}; state.subs=Array.isArray(s.subs)?s.subs:null; state.plan=(s.plan&&Array.isArray(s.plan.lines))?s.plan:null; state.confirmed=s.confirmed||{}; state.catLimits=s.catLimits||{}; }
function normMonth(x){ // array (old) or object -> object keyed by id
  var o={}; if(Array.isArray(x)) x.forEach(function(t){ if(t&&t.id) o[t.id]=t; }); else if(x&&typeof x==='object') Object.keys(x).forEach(function(k){ if(x[k]&&typeof x[k]==='object') o[k]=x[k]; }); return o; }
function loadLocal(){ try{ var s=JSON.parse(ls('pm-state')||'null'); if(s) adoptState(s); var l=JSON.parse(ls('pm-ledger')||'null'); if(l){ Object.keys(l).forEach(function(ym){ ledger[ym]=normMonth(l[ym]); }); } var p=JSON.parse(ls('pm-pending')||'null'); if(p) pending=p; }catch(e){} }
function saveLocal(){ ls('pm-state',JSON.stringify(state)); ls('pm-ledger',JSON.stringify(ledger)); ls('pm-pending',JSON.stringify(pending)); }
function saveState(){ saveLocal(); if(db){ db.doc('money/state').set(clone(state)).catch(function(e){ toast('Settings not synced ('+(e&&e.code||'error')+')'); }); } }
var flushing=false;
function flush(){ if(!db||flushing) return; var yms=Object.keys(pending).filter(function(ym){ return Object.keys(pending[ym]||{}).length; }); if(!yms.length) return; flushing=true;
  var ym=yms[0], patch=clone(pending[ym]); var ref=db.doc('ledger/'+ym);
  ref.update({items:patch}).catch(function(e){ if(e&&e.code==='invalid_argument'){ return ref.set({items:clone(ledger[ym]||{})}); } throw e; })
   .then(function(){ Object.keys(patch).forEach(function(id){ if(pending[ym]&&pending[ym][id]&&pending[ym][id].ts===patch[id].ts) delete pending[ym][id]; }); if(pending[ym]&&!Object.keys(pending[ym]).length) delete pending[ym]; saveLocal(); flushing=false; setSync(true,'synced'); flush(); })
   .catch(function(e){ flushing=false; setSync(false,'sync failed — kept on this device'); }); }
function setSync(on,txt){ var sy=el('sync'); sy.classList.toggle('on',!!on); sy.lastChild.textContent=txt; }
function putEntry(t){ var ym=ymOf(t.d); if(!ledger[ym]) ledger[ym]={}; ledger[ym][t.id]=t; if(!pending[ym]) pending[ym]={}; pending[ym][t.id]=t; saveLocal(); flush(); }
function tombstone(id){ var ym=findYm(id); if(!ym) return null; var old=ledger[ym][id]; var tb={id:id,del:true,ts:Date.now()}; ledger[ym][id]=tb; if(!pending[ym]) pending[ym]={}; pending[ym][id]=tb; saveLocal(); flush(); return old; }
function findYm(id){ var yms=Object.keys(ledger); for(var i=0;i<yms.length;i++){ if(ledger[yms[i]][id]) return yms[i]; } return null; }

/* ---------- helpers ---------- */
var now=new Date(), TODAY=iso(now);
function refreshDay(){ var n=new Date(), t=iso(n); if(t===TODAY) return false; var was=TODAY; now=n; TODAY=t; if(typeof onNewDay==='function') onNewDay(was,t); return true; }
function anchorLbl(){ return dLabel(state.settings.anchorDate||'2026-09-10'); }
function iso(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
function p2(n){ return (n<10?'0':'')+n; }
function ymOf(s){ return s.slice(0,7); }
function idx(ym){ var a=ym.split('-'); return +a[0]*12+(+a[1]); }
function ymFromIdx(i){ var y=Math.floor((i-1)/12), m=i-y*12; return y+'-'+p2(m); }
function addMonths(ym,n){ return ymFromIdx(idx(ym)+n); }
function daysIn(ym){ var a=ym.split('-'); return new Date(+a[0],+a[1],0).getDate(); }
function lastDayOf(ym){ return ym+'-'+p2(daysIn(ym)); }
function addDays(s,n){ var a=s.split('-'); var d=new Date(+a[0],+a[1]-1,+a[2]+n); return iso(d); }
function fmt(n,dec){ if(n==null||isNaN(n)) return '—'; var d = dec!=null?dec:(Math.abs(n-Math.round(n))>0.004?2:0); return n.toLocaleString('en-NG',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function naira(n,dec){ return (n<0?'−':'')+'₦'+fmt(Math.abs(n),dec); }
function usdFmt(n){ return (n<0?'−':'')+'$'+fmt(Math.abs(n),0); }
function monthName(ym){ var a=ym.split('-'); return new Date(+a[0],+a[1]-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'}); }
function shortMonth(ym){ var a=ym.split('-'); return new Date(+a[0],+a[1]-1,1).toLocaleDateString('en-GB',{month:'short',year:'2-digit'}); }
function dLabel(s){ var a=s.split('-'); return new Date(+a[0],+a[1]-1,+a[2]).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
function dLabelY(s){ var a=s.split('-'); return new Date(+a[0],+a[1]-1,+a[2]).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function daysBetween(a,b){ var x=a.split('-'),y=b.split('-'); return Math.round((new Date(+y[0],+y[1]-1,+y[2])-new Date(+x[0],+x[1]-1,+x[2]))/86400000); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function el(id){ return document.getElementById(id); }
function uid(){ return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function name(id){ return ACCMAP[id]?ACCMAP[id].name:id; }
function isPot(id){ var a=ACCMAP[id]; return !!(a&&a.app&&!a.cash); }
function isUsd(id){ return !!(ACCMAP[id]&&ACCMAP[id].usd); }
var toastT, toastFn=null;
function toast(m,actLabel,fn){ var t=el('toast'); el('toastMsg').textContent=m; var b=el('toastAct'); toastFn=fn||null; b.hidden=!fn; if(fn) b.textContent=actLabel||'Undo'; t.hidden=false; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){ t.classList.remove('show'); toastFn=null; },fn?6000:2400); }
function allTx(){ var out=[]; Object.keys(ledger).forEach(function(ym){ var m=ledger[ym]; Object.keys(m).forEach(function(id){ var t=m[id]; if(t&&!t.del) out.push(t); }); }); out.sort(function(a,b){ return a.d<b.d?-1:a.d>b.d?1:(a.ts||0)-(b.ts||0); }); return out; }
function txByKey(){ var m={}; allTx().forEach(function(t){ if(t.key) m[t.key]=t; }); return m; }
function getTx(id){ var ym=findYm(id); var t=ym?ledger[ym][id]:null; return (t&&!t.del)?t:null; }

/* balances */
function balances(upTo){ var b={}; ACC.forEach(function(a){ b[a.id]=+state.opening[a.id]||0; }); allTx().forEach(function(t){ if(upTo && t.d>upTo) return; if(b[t.from]!=null) b[t.from]-=t.amt; if(b[t.to]!=null) b[t.to]+=t.amt; }); return b; }
function usdBalances(){ var u={fxd:0,dollar:0}; allTx().forEach(function(t){ var v=t.usd!=null?t.usd:(t.amt/state.settings.rate); if(u[t.to]!=null) u[t.to]+=v; if(u[t.from]!=null) u[t.from]-=v; }); return u; }
function returnsFor(acct){ var r=0; allTx().forEach(function(t){ if(t.from==='interest'&&t.to===acct) r+=t.amt; if(t.to==='interest'&&t.from===acct) r-=t.amt; }); return r; }
function tracked(b){ var s=0; ACC.forEach(function(a){ if(!a.cash) s+=b[a.id]; }); return s; }
function openingTracked(){ return ACC.filter(function(a){return !a.cash;}).reduce(function(s,a){return s+(+state.opening[a.id]||0);},0); }

/* ---------- fees ---------- */
function feeCfg(){ var f=state.settings.fees||{}; var out={}; Object.keys(DEFAULT_FEES).forEach(function(k){ out[k]=Object.assign({},DEFAULT_FEES[k],f[k]||{}); }); return out; }
function methodFor(t){ if(t.method) return t.method; var A=ACCMAP[t.from], B=ACCMAP[t.to]; if(!A||!A.cash) return 'none'; if(A.physical) return 'cash'; if(t.to==='cash') return 'pos'; if(t.to==='spend') return t.from==='zenith'?'card':'transfer'; if(t.to==='fees'||t.to==='interest'||t.to==='income') return 'none'; if(B&&B.app&&A.app===B.app) return 'inapp'; if(t.from==='zenith'&&DEBIT_TARGETS[t.to]) return 'debit'; return 'transfer'; }
function nipFee(a){ return a<=5000?10.75:(a<=50000?26.88:53.75); }
function feesFor(t){ if(t.fee||t.recon) return []; var m=methodFor(t), c=feeCfg()[t.from]; if(m==='none'||m==='card'||m==='inapp'||m==='cash'||m==='ownatm') return []; if(!c&&m!=='pos'&&m!=='atm') return []; c=c||{}; var out=[]; var what=(t.to==='spend'?(t.note||t.cat||'expense'):name(t.to));
  if(m==='transfer'){ if(c.stamp&&t.amt>=10000) out.push({amt:50,note:'Stamp duty · ₦'+fmt(t.amt,0)+' → '+what}); if(c.nip) out.push({amt:nipFee(t.amt),note:'Transfer fee incl. VAT · → '+what}); }
  if(m==='debit'){ if(c.stampDebit&&t.amt>=10000) out.push({amt:50,note:'Stamp duty · debit ₦'+fmt(t.amt,0)+' → '+what}); }
  if(m==='pos'){ var s0=state.settings; var n=Math.ceil(t.amt/(+s0.posPer||10000)); if(+s0.posFee>0) out.push({amt:n*(+s0.posFee),note:'POS agent fee · ₦'+fmt(t.amt,0)+' cash ('+n+' × ₦'+fmt(+s0.posFee,0)+')'}); }
  if(m==='atm'){ var s1=state.settings; var n2=Math.ceil(t.amt/(+s1.atmPer||20000)); if(+s1.atmFee>0) out.push({amt:n2*(+s1.atmFee),note:'Other-bank ATM fee · ₦'+fmt(t.amt,0)+' cash ('+n2+' × ₦'+fmt(+s1.atmFee,0)+')'}); }
  if(c.sms) out.push({amt:4.30,note:'SMS alert · → '+what});
  return out; }

/* ---------- ledger ops ---------- */
function post(t){ try{ t.id=t.id||uid(); t.ts=Date.now(); t.amt=Math.round(+t.amt*100)/100; if(!(t.amt>=0)) throw new Error('bad amount'); if((isUsd(t.to)||isUsd(t.from))&&t.usd==null) t.usd=Math.round(t.amt/state.settings.rate*100)/100; putEntry(t); var fees=feesFor(t); fees.forEach(function(f,i){ putEntry({id:uid()+i,ts:Date.now()+1+i,d:t.d,from:t.from,to:'fees',amt:f.amt,cat:'Bank charges',note:f.note,fee:true,parent:t.id}); }); t._fees=fees.reduce(function(s,f){return s+f.amt;},0); render(); return t; }catch(e){ toast('Could not post: '+(e&&e.message||e)); } }
function feeNote(t){ return t&&t._fees?' · +'+naira(t._fees,2)+' charges':''; }
function childrenOf(id){ return allTx().filter(function(t){ return t.parent===id; }); }
function removeTx(id,silent){ var kids=childrenOf(id); var removed=[]; var main=tombstone(id); if(main&&!main.del) removed.push(main); kids.forEach(function(k){ var r=tombstone(k.id); if(r&&!r.del) removed.push(r); }); render(); if(!silent&&removed.length){ toast('Deleted '+describe(removed[0]),'Undo',function(){ removed.forEach(function(r){ var c=clone(r); c.ts=Date.now(); putEntry(c); }); render(); toast('Restored'); }); } return removed; }
function describe(t){ return t.to==='spend'?(t.cat||'expense')+' '+naira(t.amt,0):name(t.from)+' → '+name(t.to)+' '+naira(t.amt,0); }
function updateTx(id,patch){ var t=getTx(id); if(!t) return; var n=Object.assign(clone(t),patch); n.ts=Date.now(); n.amt=Math.round(+n.amt*100)/100; if((isUsd(n.to)||isUsd(n.from))&&(patch.amt!=null||patch.to!=null||patch.from!=null)) n.usd=Math.round(n.amt/state.settings.rate*100)/100; putEntry(n); if(!n.fee&&!n.recon){ childrenOf(id).forEach(function(k){ tombstone(k.id); }); feesFor(n).forEach(function(f,i){ putEntry({id:uid()+i,ts:Date.now()+1+i,d:n.d,from:n.from,to:'fees',amt:f.amt,cat:'Bank charges',note:f.note,fee:true,parent:n.id}); }); } render(); }
function reconcile(acct,real){ var b=balances(); var diff=Math.round((real-b[acct])*100)/100; state.confirmed[acct]={d:TODAY,bal:real}; if(Math.abs(diff)>=0.01){ if(ACCMAP[acct]&&ACCMAP[acct].physical){ if(diff<0) post({d:TODAY,from:acct,to:'spend',amt:-diff,cat:'Other',note:'Cash spent, not itemised',method:'cash'}); else post({d:TODAY,from:'ext',to:acct,amt:diff,note:'Cash found on count',recon:true}); } else if(ACCMAP[acct]&&ACCMAP[acct].cash&&!ACCMAP[acct].rate){ if(diff<0) post({d:TODAY,from:acct,to:'spend',amt:-diff,cat:'Other',note:'Spent, not itemised — found at reconcile',method:'card'}); else post({d:TODAY,from:'ext',to:acct,amt:diff,note:'Reconciled to the app balance',recon:true}); } else { post({d:TODAY,from:diff>0?'interest':acct,to:diff>0?acct:'interest',amt:Math.abs(diff),note:'Reconciled to the app balance',recon:true}); } } saveState(); render(); var big=Math.abs(diff)>Math.max(100000,Math.abs(b[acct])*0.05); toast(name(acct)+' confirmed at '+naira(real)+(Math.abs(diff)>=0.01?' · '+(diff>0?'+':'−')+naira(Math.abs(diff))+((ACCMAP[acct]&&ACCMAP[acct].physical)?(diff<0?' recorded as cash spent':' added to cash'):' recorded as returns'):'')+(big&&!(ACCMAP[acct]&&ACCMAP[acct].physical)?' — large gap, check for a missed move':'')); }

/* ---------- plan engine ---------- */
function tierAt(amts,ym){ var keys=Object.keys(amts||{}).sort(); var v=null; keys.forEach(function(k){ if(k<=ym) v=amts[k]; }); return v; }
function lineAmt(L,ym){ if(L.months) return L.months[ym]!=null?+L.months[ym]:null; if(L.start&&ym<L.start) return null; if(L.end&&ym>L.end) return null; var v=tierAt(L.amts,ym); return v==null?null:+v; }
function grpLabel(g){ var P=plan(); var s=P.salaries.filter(function(x){return (g==='Flex'&&x.acct==='flex')||(g==='Zenith'&&x.acct==='zenith')||(g==='Pocket'&&x.acct==='pocket');})[0]; return g==='Salaries'?'Salaries':(s?g+' '+naira(s.amt,0):g); }
function runItems(ym){ var P=plan(), prev=addMonths(ym,-1), land=lastDayOf(prev), out=[];
  P.salaries.forEach(function(s){ out.push({key:'r'+ym+'-sal-'+s.acct,d:land,from:'income',to:s.acct,amt:+s.amt,label:name(s.acct)+' salary lands',how:s.note||'',grp:'Salaries',method:'none'}); });
  P.lines.forEach(function(L){ var a=lineAmt(L,ym); if(a==null) return; out.push({key:'r'+ym+'-'+L.id,d:ym+'-'+p2(L.day||1),from:L.from,to:L.to,amt:a,label:L.label,how:L.how||'',grp:L.grp,dyn:L.dyn,method:L.method}); });
  return out; }
function oneOffs(){ return plan().oneoffs.map(function(o){ return {key:o.id,d:o.d,from:o.from,to:o.to,amt:+o.amt,label:o.label,how:o.how||'',method:o.method,once:true}; }); }
function currentRun(){ var ym=ymOf(TODAY), d=now.getDate(); var r = d>=25 ? addMonths(ym,1) : ym; if(idx(r)<idx(FIRST_RUN)) r=FIRST_RUN; return r; }
function planItemsThrough(upTo){ var last=idx(ymOf(upTo))+1, items=[]; for(var i=idx(FIRST_RUN);i<=last;i++) items=items.concat(runItems(ymFromIdx(i))); return items.concat(oneOffs()); }
function expected(upTo,ret){ var b={}; ACC.forEach(function(a){ b[a.id]=+state.opening[a.id]||0; }); var items=planItemsThrough(upTo).filter(function(t){return t.d<=upTo;});
  if(!ret){ items.forEach(function(t){ if(b[t.from]!=null) b[t.from]-=t.amt; if(b[t.to]!=null) b[t.to]+=t.amt; }); return b; }
  /* with an assumed return: apply each month's plan, then compound the pots by ret/12 at every month end crossed before upTo */
  items.sort(function(a,c){return a.d<c.d?-1:a.d>c.d?1:0;}); var r=ret/12, m0=idx(ymOf(state.settings.anchorDate||TODAY)), m1=idx(ymOf(upTo)), k=0;
  for(var m=m0;m<=m1;m++){ var ym=ymFromIdx(m); while(k<items.length&&ymOf(items[k].d)===ym){ var t=items[k++]; if(b[t.from]!=null) b[t.from]-=t.amt; if(b[t.to]!=null) b[t.to]+=t.amt; } while(k<items.length&&ymOf(items[k].d)<ym) k++; if(m<m1) ACC.forEach(function(a){ if(isPot(a.id)&&b[a.id]>0) b[a.id]=b[a.id]*(1+r); }); }
  return b; }
function dynAmount(it,bal,byKey){ if(it.dyn==='restOfFlex'){ var rest=bal.flex; runItems(ymOf(it.d)).forEach(function(o){ if(o.from==='flex'&&o.key!==it.key&&!byKey[o.key]&&o.d===it.d) rest-=o.amt; }); return Math.max(0,Math.round(rest*100)/100); } return it.amt; }
function dueItems(){ var byKey=txByKey(), out=[], last=idx(currentRun()); for(var i=idx(FIRST_RUN);i<=last;i++) runItems(ymFromIdx(i)).forEach(function(it){ if(it.d<=TODAY&&!byKey[it.key]) out.push(it); }); oneOffs().forEach(function(it){ if(it.d<=TODAY&&!byKey[it.key]) out.push(it); }); return out; }
function canPost(it){ return daysBetween(TODAY,it.d)<=2; }
function phases(){ var set={}; set[FIRST_RUN]=1; plan().lines.forEach(function(L){ if(L.dyn||L.months) return; Object.keys(L.amts||{}).forEach(function(k){ if(k>=FIRST_RUN) set[k]=1; }); }); return Object.keys(set).sort(); }
function phaseLabel(ph,i,all){ var next=all[i+1]; if(!next) return shortMonth(ph).replace(/ /,' ')+' →'; var endYm=addMonths(next,-1); return endYm===ph?shortMonth(ph):shortMonth(ph).split(' ')[0]+'–'+shortMonth(endYm); }
function currentPhase(){ var ps=phases(), cur=currentRun(), p=ps[0]; ps.forEach(function(x){ if(x<=cur) p=x; }); return p; }

/* projection */
function project(monthsAhead,ret){ var b=balances(), byKey=txByKey(); var totals=[], t=tracked(b), start=currentRun(); var r=(ret||0)/12; var one=oneOffs();
  for(var i=0;i<monthsAhead;i++){ var ym=addMonths(start,i); t=t*(1+r); runItems(ym).forEach(function(it){ if(byKey[it.key]) return; if(isPot(it.from)) t-=it.amt; if(isPot(it.to)) t+=it.amt; }); one.forEach(function(it){ if(byKey[it.key]||ymOf(it.d)!==ym) return; if(isPot(it.from)) t-=it.amt; if(isPot(it.to)) t+=it.amt; }); totals.push({ym:ym,total:t}); }
  return totals; }

/* ---------- signals ---------- */
function prompts(){ var b=balances(), s=state.settings, out=[], day=now.getDate(), run=currentRun();
  var due=dueItems(); if(due.length) out.push({kind:'need',t:due.length+' planned move'+(due.length>1?'s':'')+' due',why:'Open Move and tick them, or do them by hand today.',go:'move'});
  if(day>=20){ var ymNow=ymOf(TODAY), charged={}; monthItems(ymNow).forEach(function(t){ if(t.sub) charged[t.sub]=1; }); subsList().forEach(function(sb){ if(!charged[sb.k]&&!state.done['skip-'+sb.k+'-'+ymNow]) out.push({kind:'need',t:sb.name+' '+naira(sb.amt,0)+' not recorded this month',why:'Billed to '+name(sb.from||'pocket')+'. Tick Charged if it has gone, or skip it for this month.',sub:sb.k,skip:'skip-'+sb.k+'-'+ymNow}); }); }
  if(b.pocket<0) out.push({kind:'over',t:'Pocket is overdrawn by '+naira(-b.pocket),why:'Spent past what landed. The cushion is gone — nothing more until payday.'});
  var line=s.allowance+s.cushion; if(b.pocket>line+1000 && day>=1 && day<=10) out.push({kind:'need',t:naira(b.pocket-line)+' above the line in Pocket',why:'Salary + cushion = '+naira(line)+'. The rest becomes dollars.',act:{from:'pocket',to:'fxd',amt:b.pocket-line,note:'Pocket leftover → Flex Dollar (via Flex)'}});
  if(b.zenith>s.zfloat+1000 && day>=3) out.push({kind:'need',t:naira(b.zenith-s.zfloat)+' above the float in Zenith',why:'Float is a target, not a savings account.',act:{from:'zenith',to:'cons',amt:b.zenith-s.zfloat,note:'Zenith leftover → Conservative'}});
  if(b.flex>1000 && day>=2 && day<25 && TODAY>='2026-10-01') out.push({kind:'need',t:'Flex is holding '+naira(b.flex)+' overnight',why:'Flex holds nothing overnight. Conservative unless it is earmarked.',act:{from:'flex',to:'cons',amt:b.flex,note:'Flex sweep → Conservative'}});
  var mi=monthItems(ymOf(TODAY)); var bIn=mi.filter(function(t){ return t.to==='pocket'&&ACCMAP[t.from]&&ACCMAP[t.from].app&&!t.key; }); var borrowed=bIn.reduce(function(s2,t){return s2+t.amt;},0);
  if(borrowed>0){ var firstD=bIn.map(function(t){return t.d;}).sort()[0]; var src=bIn[0].from; var returned=mi.filter(function(t){ return t.from==='pocket'&&ACCMAP[t.to]&&ACCMAP[t.to].app&&!t.key&&t.d>=firstD; }).reduce(function(s2,t){return s2+t.amt;},0); var spentSince=mi.filter(function(t){ return t.from==='pocket'&&(t.to==='spend'||t.to==='fees')&&t.d>=firstD; }).reduce(function(s2,t){return s2+t.amt;},0); var net=borrowed-returned; var unspent=Math.max(0,net-spentSince);
    var why = spentSince<1 ? 'Nothing has been spent from Pocket since it arrived — add the emergency spend itself as an expense so the month shows it.' : (unspent>=1 ? naira(spentSince,0)+' spent from Pocket since, so about '+naira(unspent,0)+' of it is still unused. Send that back to '+name(src)+' — Pocket keeps only what the month needs.' : 'All of it has gone on spending since; the month has absorbed it. Nothing to send back.');
    if(net>=1) out.push({kind:unspent>=1?'need':'fine',t:naira(net,0)+' borrowed into Pocket from '+name(src)+' this month',why:why,act:(unspent>=1&&spentSince>=1)?{from:'pocket',to:src,amt:unspent,note:'Return unused borrow'}:null}); }
  if(b.cons>=s.ef && !state.done['ef-done']) out.push({kind:'fine',t:'Emergency fund complete — '+naira(b.cons,0)+' in Conservative',why:'Three months of everything, liquid in 1–3 days. The line continues as reserve.',dismiss:'ef-done'});
  var stale=ACC.filter(function(a){ if(a.cash) return false; var c=state.confirmed[a.id]; var last=c?c.d:s.anchorDate; return daysBetween(last,TODAY)>=35 && (b[a.id]>0); }); if(stale.length&&TODAY>='2026-10-15') out.push({kind:'need',t:stale.length+' pot'+(stale.length>1?'s':'')+' not confirmed against the app for a month',why:stale.map(function(a){return a.name;}).join(', ')+'. Open each app and use Reconcile below.',go:'today'});
  if(TODAY>='2026-11-25'&&TODAY<='2026-12-08'&&!state.done['acct']) out.push({kind:'need',t:'1 Dec — book the accountant',why:'Filing is 31 March. TIN, LIRS e-Tax check, WHT credit notes, self-assessment.',dismiss:'acct'});
  if(TODAY>='2026-12-01'&&TODAY<='2026-12-15'&&!txByKey()['dec-piggy-flex']) out.push({kind:'need',t:'PiggyBank free window ~8 Dec',why:'PiggyBank → Flex → Nest · Flex Dollar · Dollar Portfolio. On the Move tab.',go:'move'});
  if(TODAY>='2027-02-01'&&TODAY<='2027-02-28'&&!txByKey()['feb-rent']) out.push({kind:'need',t:'Rent month — pay it from HouseMoney',why:'Then edit the PiggyVest AutoSaves to the new amounts.',go:'move'});
  if(TODAY>='2027-03-01'&&TODAY<='2027-03-31'&&!state.done['rev1']) out.push({kind:'need',t:'March review',why:'Download the JSON and send it. Equity share, dollar sleeve, first Life spend, broker question.',dismiss:'rev1'});
  return out; }

/* ---------- budget ---------- */
function monthItems(ym){ var m=ledger[ym]||{}; return Object.keys(m).map(function(k){return m[k];}).filter(function(t){ return t&&!t.del; }); }
function budgetFor(ym){ var s=state.settings; var partial=idx(ym)<idx(s.budgetStart); var allow = partial ? (+state.opening.pocket||0) : s.allowance;
  var items=monthItems(ym).filter(function(t){ return t.to==='spend'||t.to==='fees'; }); var spent=0, byCat={}, byAcct={};
  items.forEach(function(t){ spent+=t.amt; var c=t.cat||'Other'; byCat[c]=(byCat[c]||0)+t.amt; byAcct[t.from]=(byAcct[t.from]||0)+t.amt; });
  var pocketSpent=(byAcct.pocket||0)+(byAcct.cash||0); var left=allow-pocketSpent; var dim=daysIn(ym), cur=ymOf(TODAY);
  var dayNo = ym<cur ? dim : (ym>cur ? 0 : now.getDate()); var daysLeft = ym<cur?0:(ym>cur?dim:Math.max(0,dim-dayNo+1));
  var perDay = daysLeft? left/daysLeft : 0; var pace = (dayNo&&!partial)? pocketSpent/dayNo*dim : 0;
  var st = left<0 ? 'over' : (pace>allow*1.05 && dayNo>=5 ? 'need' : 'fine');
  return {ym:ym,allow:allow,spent:spent,pocketSpent:pocketSpent,left:left,byCat:byCat,items:items,daysLeft:daysLeft,perDay:perDay,pace:pace,status:st,partial:partial,dayNo:dayNo}; }
function catUsual(cat,ym){ var n=0,s=0; for(var i=1;i<=3;i++){ var m=addMonths(ym,-i); if(idx(m)<idx(state.settings.budgetStart)) break; var v=budgetFor(m).byCat[cat]; if(v!=null){ s+=v; n++; } } return n?s/n:null; }
function pillFor(st,txt){ var words={fine:'Fine',need:'Needs you',over:'Over',neutral:'—'}; return '<span class="pill '+st+'">'+esc(txt||words[st]||st)+'</span>'; }


/* ---------- render ---------- */
var curMonth=ymOf(TODAY), curRun=currentRun(), planPhase=null, qCat='Food';
var priv=ls('pm-priv')==='1';
function applyPriv(){ document.documentElement.classList.toggle('priv',priv); var b=el('btnPriv'); if(b){ b.setAttribute('aria-pressed',priv?'true':'false'); b.title=priv?'Show the figures':'Hide the figures'; b.setAttribute('aria-label',b.title); } }
function render(){ try{ var b=balances(), e=expected(TODAY);
  renderHero(b); renderQuick(b); renderPrompts(); renderRunCard(); renderPotGroups(b,e); renderRecent();
  renderBills(); renderMove(b); renderLedger(); renderPotsRef(b); renderPlan(); renderGoals(b); renderSettings(); renderGaps();
  var due=dueItems().length, ps=prompts().length; var bd=el('bdg-move'); bd.textContent=due; bd.hidden=!due; var bt=el('bdg-today'); bt.textContent=ps; bt.hidden=!ps||document.querySelector('nav.tabs button[aria-selected="true"]')&&document.querySelector('nav.tabs button[aria-selected="true"]').dataset.view==='today';
  }catch(err){ console.error(err); toast('Display error: '+(err&&err.message||err)); } }
function tile(l,big,sub,pct,cls,dim){ return '<div class="tile"><div class="hd"><span class="lbl">'+l+'</span>'+(cls?'<span class="pill '+cls+'">'+({fine:'Fine',need:'Needs you',over:'Over'}[cls]||'')+'</span>':'')+'</div><div class="big'+(dim?' dim':'')+'">'+big+'</div>'+(pct!=null?'<div class="bar '+(cls||'')+'"><i style="width:'+Math.min(100,pct).toFixed(1)+'%"></i></div>':'')+'<div class="sub">'+sub+'</div></div>'; }
function renderHero(b){ var tr=tracked(b), anchor=openingTracked(), d=tr-anchor; var bg=budgetFor(ymOf(TODAY)); var ps=prompts(); var worst=ps.some(function(p){return p.kind==='over';})?'over':(ps.some(function(p){return p.kind==='need';})?'need':'fine'); var s=state.settings;
  var meta=function(cls,icon,k,v,sub,pill){ return '<div class="meta"><div class="ic '+cls+'">'+icon+'</div><div style="min-width:0"><div class="k">'+k+(pill?'<span class="pill '+pill+'">'+({fine:'Fine',need:'Needs you',over:'Over'}[pill])+'</span>':'')+'</div><div class="b">'+v+'</div><div class="s">'+sub+'</div></div></div>'; };
  el('heroMeta').innerHTML=
   meta('c-wealth','<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>','Tracked wealth',naira(tr,0),(Math.abs(d)>=1?(d>=0?'+':'−')+naira(Math.abs(d),0)+' since the '+anchorLbl()+' anchor':'At the '+anchorLbl()+' anchor'))+
   meta('c-spend','<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg>','Left to spend',naira(bg.left,0),(bg.daysLeft?bg.daysLeft+' days · '+naira(Math.max(0,bg.perDay),0)+' a day':'Month closed')+(bg.pace&&bg.pace>bg.allow?' · pace '+naira(bg.pace,0):'')+(Math.abs(b.pocket-bg.left)>=1||b.cash>=1?' · Pocket holds '+naira(b.pocket,0)+(b.cash>=1?' · cash in hand '+naira(b.cash,0):'')+(b.pocket+b.cash>bg.left+1&&b.pocket>bg.left?' (₦'+fmt(b.pocket-bg.left,0)+' borrowed in)':''):''),bg.status)+
   meta('c-ef','<svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>','Emergency fund',naira(b.cons,0),(b.cons>=s.ef?'complete · reserve building':Math.min(100,b.cons/s.ef*100).toFixed(0)+'% of '+naira(s.ef,0)+' · full after the 1 Dec run'),b.cons>=s.ef?'fine':null); }
function renderQuick(b){ if(!el('qCat').options.length){ el('qCat').innerHTML=CATS.map(function(c){return '<option'+(c===qCat?' selected':'')+'>'+c+'</option>';}).join(''); }
  if(!el('qFrom').options.length){ el('qFrom').innerHTML=ACC.filter(function(a){return a.cash;}).concat(ACC.filter(function(a){return a.id==='life'||a.id==='cons';})).map(function(a){return '<option value="'+a.id+'">'+({cons:'Conservative',life:'Life plan'}[a.id]||a.name)+'</option>';}).join(''); }
  if(!el('qDate').value) el('qDate').value=TODAY;
  el('quickHint').textContent='Comes out of the account you pick — the balance moves at once.'; }
function promptRow(p){ return '<div class="row"><div class="l"><b>'+esc(p.t)+'</b><span class="why">'+p.why+'</span></div><div class="act">'+
  (p.act?'<button class="btn sm pri" type="button" data-prompt-act="'+esc(JSON.stringify(p.act))+'">Move '+naira(p.act.amt,0)+'</button>':'')+
  (p.sub?'<button class="btn sm pri" type="button" data-sub="'+p.sub+'">Charged</button><button class="btn sm ghost" type="button" data-dismiss="'+p.skip+'">Not this month</button>':'')+
  (p.go?'<button class="btn sm" type="button" data-go="'+p.go+'">Open</button>':'')+
  (p.dismiss?'<button class="btn sm" type="button" data-dismiss="'+p.dismiss+'">Done</button>':'')+
  (!p.act&&!p.go&&!p.dismiss&&!p.sub?pillFor(p.kind):'')+'</div></div>'; }
function renderPrompts(){ var ps=prompts(); el('promptCount').textContent=ps.length; el('promptCount').className='pill '+(ps.length?(ps.some(function(p){return p.kind==='over';})?'over':'need'):'fine');
  var lvl=ps.length?(ps.some(function(p){return p.kind==='over';})?'over':'need'):'fine'; var nc=el('needsCard'); nc.classList.remove('need','over','fine'); nc.classList.add(lvl);
  el('needsSub').textContent=ps.length?(ps.length===1?'One thing waiting for you':ps.length+' things waiting for you'):'Nothing waiting. Money is where it should be.';
  el('prompts').innerHTML=ps.map(promptRow).join('');
}
function renderRunCard(){ var run=curRun, items=runItems(run), byKey=txByKey(), done=items.filter(function(i){return byKey[i.key];}).length; var days=daysBetween(TODAY,run+'-01'); var due=dueItems().length;
  el('runCard').innerHTML='<div class="card-h"><div class="acc-t"><h3>Run of 1 '+monthName(run)+'</h3><span class="src">'+(days>0?'Salaries land '+dLabel(lastDayOf(addMonths(run,-1)))+' · '+days+' day'+(days===1?'':'s')+' to go':(days===0?'Run day':(due?due+' line'+(due===1?'':'s')+' still due':'Run complete')))+'</span></div><div class="act"><span class="pill '+(done===items.length&&items.length?'fine':(due?'need':'neutral'))+'">'+done+' / '+items.length+'</span><button class="btn ghost sm" type="button" data-go="move">Move →</button></div></div>'; }
function potStatus(a,v,x,gap){ var s=state.settings; if(a.cash){ if(a.id==='pocket'&&v<0) return ['over','Overdrawn']; if(a.id==='flex'&&v>1000&&now.getDate()>=2&&TODAY>='2026-10-01') return ['need','Holding money overnight']; if(a.id==='zenith'&&v>s.zfloat+1000&&now.getDate()>=3) return ['need','Above the float']; return [null,'']; }
  if(Math.abs(gap)<1000) return [null,'']; if(gap>0) return [null,'Ahead of plan by '+naira(gap,0)]; return [gap<-200000?'over':'need','Behind plan by '+naira(-gap,0)]; }
function renderPotGroups(b,e){ var u=usdBalances(), s=state.settings, html='', trAll=tracked(b);
  var pd=el('potDate'); if(pd&&!pd.max) pd.max=TODAY;
  var asOf=pd&&pd.value&&pd.value<TODAY?pd.value:'';
  el('potToday').hidden=!asOf;
  el('potSrc').textContent=asOf?'What every pot held at the end of that day':'Sheet balance · plan expects · reconcile when the app differs';
  if(asOf){ /* a past date: balances only — nothing here is actionable backwards */
    var hb=balances(asOf), trh=0;
    GROUPS.forEach(function(g){ var list=ACC.filter(function(a){return a.grp===g[0];}); if(!list.length) return;
      var sum=list.reduce(function(t,a){return t+hb[a.id];},0);
      html+='<div class="gset"><div class="grp g-'+g[0]+'"><span class="lbl">'+g[1]+'</span><span class="n">'+list.length+'</span><span class="v">'+naira(sum,0)+'</span></div>';
      list.forEach(function(a){ var open=+state.opening[a.id]||0, ch=hb[a.id]-open; if(!a.cash) trh+=hb[a.id];
        html+='<div class="arow"><span>'+a.name+'</span><span class="small muted hide-m">'+a.app+'</span><span class="r num small '+(Math.abs(ch)<0.005?'muted':(ch>=0?'pos':'neg'))+'">'+(Math.abs(ch)<0.005?'—':(ch>=0?'+':'−')+fmt(Math.abs(ch)))+'</span><span class="r num">'+fmt(hb[a.id])+'</span></div>'; });
      html+='</div>'; });
    el('potGroups').innerHTML=html;
    var pf=el('potFoot'); pf.hidden=false;
    pf.innerHTML='<span>Tracked on '+dLabelY(asOf)+': <b class="num">'+naira(trh,0)+'</b> · change is since the '+anchorLbl()+' anchor</span><span class="small muted">Looking back — tap Today to reconcile</span>';
    return; }
  el('potFoot').hidden=true;
  GROUPS.forEach(function(g){ var list=ACC.filter(function(a){return a.grp===g[0];}); if(!list.length) return; var sum=list.reduce(function(t,a){return t+b[a.id];},0); if(sum===0&&list.every(function(a){return (e[a.id]||0)===0;})&&g[0]!=='Spending') return;
    var open=ls('grp-'+g[0])!=='0'; var needs=list.some(function(a){ var st=potStatus(a,b[a.id],e[a.id],b[a.id]-(a.cash?0:returnsFor(a.id))-e[a.id]); return !!st[0]; });
    html+='<div class="gset"><div class="grp g-'+g[0]+(open?' open':'')+'" data-grp="'+g[0]+'" role="button" tabindex="0" aria-expanded="'+open+'"><span class="lbl">'+g[1]+'</span><span class="n">'+list.length+'</span>'+(needs&&!open?'<span class="pill need">Needs you</span>':'')+'<span class="v">'+naira(sum,0)+(g[0]==='Dollars'?' · ≈ '+usdFmt(u.fxd+u.dollar):'')+((g[0]==='Dollars'||g[0]==='Growth')&&trAll>0?' · '+(sum/trAll*100).toFixed(0)+'% of tracked':'')+'</span><svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div><div class="grp-b"'+(open?'':' hidden')+'>';
    list.forEach(function(a){ var v=b[a.id], x=e[a.id], rr0=a.cash?0:returnsFor(a.id), gap=v-rr0-x, st=potStatus(a,v,x,gap); var c=state.confirmed[a.id]; var tgt=a.tgt==='ef'?s.ef:(a.tgt==='rent'?s.rentTarget:null);
      var why=[]; var rr=returnsFor(a.id); if(!a.cash&&Math.abs(rr)>=1){ var base=v-rr; why.push('returns since anchor '+(rr>=0?'+':'−')+naira(Math.abs(rr),0)+(base>0?' ('+(rr>=0?'+':'−')+Math.abs(rr/base*100).toFixed(1)+'%)':'')); } else if(a.rate) why.push('quoted '+a.rate); if(!a.cash) why.push('plan '+naira(x,0)); if(c) why.push('confirmed '+dLabel(c.d)); if(st[1]) why.push(st[1]);
      html+='<div class="pot"><div class="n"><b>'+a.name+'</b><span class="why">'+why.join(' · ')+'</span></div><div class="bal">'+fmt(v)+(a.usd?'<small>'+usdFmt(u[a.id])+' at buy · '+naira(u[a.id]*s.rate,0)+' today</small>':'')+'</div><div class="act">'+(st[0]?pillFor(st[0]):'')+(a.cash&&a.id!=='flex'?'':'')+'<button class="btn sm ghost" type="button" data-recon="'+a.id+'">Reconcile</button></div>'+(tgt?'<div class="bar '+(v>=tgt?'fine':'')+'"><i style="width:'+Math.min(100,v/tgt*100).toFixed(1)+'%"></i></div>':'')+'</div>'; }); html+='</div></div>'; });
  el('potGroups').innerHTML=html; }


function dot(cat,isFee){ if(isFee) return '<span class="dot fee"></span>'; var i=CATS.indexOf(cat); return '<span class="dot c'+(i<0?9:i)+'"></span>'; }
function txTitle(t){ var isExp=t.to==='spend', isFee=t.to==='fees'; if(isExp) return esc(t.cat||'Expense'); if(isFee) return 'Bank charge'; if(t.recon||t.from==='interest'||t.to==='interest'){ var pot=t.from==='interest'?t.to:t.from; return name(pot)+' · '+(t.from==='interest'?'gain':'loss'); } return name(t.from)+' → '+name(t.to); }
function txRow(t){ var isExp=t.to==='spend', isFee=t.to==='fees'; return '<div class="row rowbtn" data-edit="'+t.id+'"><div class="l"><b>'+(isExp||isFee?dot(t.cat,isFee):'')+txTitle(t)+'</b><span class="why">'+dLabel(t.d)+(t.note?' · '+esc(t.note):'')+(isExp||isFee?' · from '+name(t.from):'')+'</span></div><span class="v">'+amtCell(t)+'</span></div>'; }
function renderRecent(){ var tx=allTx().slice(-5).reverse(); el('recent').innerHTML=tx.length?tx.map(txRow).join(''):'<div class="empty">No entries yet. Add your first expense above.</div>'; }

/* spend */
function budgetHTML(bg,big){ var pct=bg.allow?Math.min(100,Math.max(0,bg.pocketSpent/bg.allow*100)):0; var cur=bg.ym===ymOf(TODAY);
  return '<div class="card-h"><h3>'+(bg.partial?'Rest of '+monthName(bg.ym):'Pocket · '+monthName(bg.ym))+'</h3>'+pillFor(bg.status)+'</div>'+
  '<div class="card-b"><div class="lbl">Left to spend'+(bg.partial?'':' of '+naira(bg.allow,0))+'</div><div class="big num" style="font-size:'+(big?34:28)+'px;font-weight:500;letter-spacing:-.02em;margin:4px 0 8px">'+naira(bg.left,0)+'</div>'+
  '<div class="bar '+bg.status+'"><i style="width:'+pct.toFixed(1)+'%"></i></div><div class="rows" style="margin-top:8px">'+
   '<div class="row" style="padding-inline:0"><span class="l small muted">Spent from Pocket</span><span class="v">'+naira(bg.pocketSpent,0)+'</span></div>'+
   (cur?'<div class="row" style="padding-inline:0"><span class="l small muted">'+bg.daysLeft+' day'+(bg.daysLeft===1?'':'s')+' left · per day</span><span class="v">'+naira(Math.max(0,bg.perDay),0)+'</span></div>':'')+
   (cur&&bg.pace?'<div class="row" style="padding-inline:0"><span class="l small muted">At this pace the month costs</span><span class="v '+(bg.pace>bg.allow?'neg':'')+'">'+naira(bg.pace,0)+'</span></div>':'')+
  '</div></div>'; }
function renderBills(){ var ym=ymOf(TODAY), subsDone={}; monthItems(ym).forEach(function(t){ if(t.sub) subsDone[t.sub]=t; });
  var subs=subsList(); el('subs').innerHTML=subs.map(function(s){ var d=subsDone[s.k]; return '<div class="row"><div class="l"><b>'+esc(s.name)+'</b><span class="why">'+(d?'Charged '+dLabel(d.d):'Not yet charged this month')+' · '+name(s.from||'pocket')+'</span></div><div class="act"><span class="v">'+naira(s.amt,0)+'</span>'+(d?'<span class="pill fine">Paid</span>':'<button class="btn sm" type="button" data-sub="'+s.k+'">Charged</button>')+'</div></div>'; }).join('');
  var tot={}; subs.forEach(function(s){ tot[s.from||'pocket']=(tot[s.from||'pocket']||0)+s.amt; }); el('subsFoot').innerHTML='<span>'+Object.keys(tot).map(function(k){ return name(k)+' <b class="num">'+naira(tot[k],0)+'</b>'; }).join(' · ')+' a month</span><button class="btn ghost sm" type="button" data-go="settings">Edit list →</button>';
  if(!el('mvDate').value) el('mvDate').value=TODAY; }
function renderMonthEnd(bg){ var prev=addMonths(bg.ym,-1), pb=budgetFor(prev), hasPrev=idx(prev)>=idx(state.settings.budgetStart)-1; var cats={}; Object.keys(bg.byCat).forEach(function(k){cats[k]=1;}); Object.keys(pb.byCat).forEach(function(k){cats[k]=1;});
  var charges=bg.items.filter(function(t){return t.to==='fees';}).reduce(function(s,t){return s+t.amt;},0);
  var run=addMonths(bg.ym,1), items=runItems(run), byKey=txByKey(), done=items.filter(function(i){return byKey[i.key];}).length; var swept=monthItems(run).filter(function(t){return t.from==='pocket'&&t.to==='fxd';}).reduce(function(s,t){return s+t.amt;},0);
  var rows=Object.keys(cats).sort(function(a,c){return (bg.byCat[c]||0)-(bg.byCat[a]||0);}).map(function(k){ var v=bg.byCat[k]||0, p=pb.byCat[k]||0, d=v-p; return '<tr><td>'+esc(k)+'</td><td class="r num">'+fmt(v,0)+'</td><td class="r num muted hide-m">'+(hasPrev?fmt(p,0):'—')+'</td><td class="r num '+(hasPrev&&Math.abs(d)>=1?(d>0?'neg':'pos'):'muted')+'">'+(hasPrev?(d>0?'+':(d<0?'−':''))+fmt(Math.abs(d),0):'—')+'</td></tr>'; }).join('');
  el('meTitle').textContent=monthName(bg.ym)+' by category'; el('meSub').textContent='against '+monthName(prev); el('meBody').innerHTML='<div class="tbl-wrap"><table><thead><tr><th>Category</th><th class="r">This month</th><th class="r hide-m">Last month</th><th class="r">Change</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4" class="empty">Nothing yet.</td></tr>')+'</tbody></table></div>'+
   '<div class="kv"><span>Total from all accounts</span><span class="v">'+naira(bg.spent,0)+'</span><span>Of which bank charges</span><span class="v">'+naira(charges,2)+'</span>'+(bg.ym!==ymOf(TODAY)?'<span>Pocket allowance used</span><span class="v">'+(bg.allow?(bg.pocketSpent/bg.allow*100).toFixed(0):0)+'%</span>':'')+'</div>'; }

/* move */
function dueRow(it,byKey,bal){ var t=byKey[it.key], amt=t?t.amt:dynAmount(it,bal,byKey), overdue=!t&&it.d<TODAY, future=it.d>TODAY, open=canPost(it);
  return '<div class="due'+(t?' done':'')+'"><span class="step">'+dLabel(it.d)+'</span><div class="what"><b>'+esc(it.label)+'</b><span class="how">'+esc(it.how)+(it.dyn&&!t?' · computed from what is left in Flex':'')+'</span></div>'+
   (t?'<span class="v num">'+naira(amt)+'</span>':'<input class="amt num" type="number" step="0.01" min="0" value="'+amt+'" id="amt-'+it.key+'" aria-label="Amount"'+(open?'':' disabled')+'>')+
   '<div class="act">'+(t?'<span class="st">done '+dLabel(t.d)+'</span><button class="btn sm ghost" type="button" data-undo="'+t.id+'">Undo</button>':'<span class="st '+(overdue?'neg':'')+'">'+(overdue?'overdue':(future?'opens '+dLabel(addDays(it.d,-2)):'due'))+'</span><button class="btn sm '+(overdue||!future?'pri':'')+'" type="button" data-doit="'+it.key+'"'+(open?'':' disabled')+'>Done</button>')+'</div></div>'; }
function renderMove(b){ var run=curRun, items=runItems(run), byKey=txByKey(), done=items.filter(function(i){return byKey[i.key];}).length;
  el('rLabel').textContent='1 '+monthName(run); el('runTitle').textContent='Run of 1 '+monthName(run); el('runProg').textContent=done+' of '+items.length+' done';
  el('runWhen').textContent='Salaries land '+dLabelY(lastDayOf(addMonths(run,-1)))+' · routine on the 1st, Cowrywise on the 2nd.';
  var groups=[]; items.forEach(function(i){ if(groups.indexOf(i.grp)<0) groups.push(i.grp); }); var html='';
  groups.forEach(function(g){ var gi=items.filter(function(i){return i.grp===g;}); var undone=gi.filter(function(i){return !byKey[i.key]&&canPost(i);}); html+='<div class="gset"><div class="grp g-'+g+'"><span class="lbl">'+esc(grpLabel(g))+'</span><span class="n">'+gi.length+'</span><div class="act"><span class="v">'+naira(gi.reduce(function(s,i){return s+(byKey[i.key]?byKey[i.key].amt:i.amt);},0),0)+'</span>'+(g==='Salaries'&&undone.length>1?'<button class="btn sm" type="button" data-doall="'+run+'">All '+undone.length+' landed</button>':'')+'</div></div>'+gi.map(function(i){return dueRow(i,byKey,b);}).join('')+'</div>'; });
  el('runList').innerHTML=html; el('oneoffs').innerHTML=oneOffs().map(function(i){return dueRow(i,byKey,b);}).join('')||'<div class="empty">None.</div>'; }
function findItem(key){ var o=oneOffs().filter(function(i){return i.key===key;})[0]; if(o) return o; var m=/^r(\d{4}-\d{2})-/.exec(key); if(m) return runItems(m[1]).filter(function(x){return x.key===key;})[0]; return null; }
function postItem(it,amt){ return post({d: it.d<=TODAY?it.d:TODAY, from:it.from,to:it.to,amt:amt,note:it.label,key:it.key,method:it.method}); }

/* direction of an entry: relative to an account if given, else relative to 'your money' */
function dirOf(t,acct){ if(acct){ if(t.to===acct&&t.from!==acct) return 'in'; if(t.from===acct&&t.to!==acct) return 'out'; return 'move'; } var A=ACCMAP[t.from], B=ACCMAP[t.to]; var fromExt=!(A&&A.app), toExt=!(B&&B.app); if(fromExt&&!toExt) return 'in'; if(toExt&&!fromExt) return 'out'; return 'move'; }
function amtCell(t,acct){ var d=dirOf(t,acct); return '<span class="amt '+d+'">'+(d==='in'?'+':(d==='out'?'−':''))+fmt(t.amt)+'</span>'; }
/* ledger */
function renderLedger(){ var tx=allTx().slice().reverse(), acct=el('lgAcct').value, mon=el('lgMonth').value, q=(el('lgSearch').value||'').toLowerCase(); renderMonthEnd(budgetFor(mon||ymOf(TODAY)));
  var months=Object.keys(ledger).filter(function(k){return monthItems(k).length;}).sort().reverse(); var msel=el('lgMonth'); var keep=msel.value; msel.innerHTML='<option value="">All months</option>'+months.map(function(m){return '<option value="'+m+'"'+(m===keep?' selected':'')+'>'+monthName(m)+'</option>';}).join('');
  if(el('lgAcct').options.length<2){ el('lgAcct').innerHTML='<option value="">All accounts</option>'+ACC.concat(EXT).map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join(''); el('lgAcct').value=acct; }
  var typ=el('lgType').value; var typeOf=function(t){ if(t.to==='fees') return 'fees'; if(t.to==='spend') return 'spend'; if(t.from==='income'||t.from==='interest'||t.to==='interest'||t.recon) return 'income'; return 'move'; };
  var f=tx.filter(function(t){ return (!typ||typeOf(t)===typ)&&(!acct||t.from===acct||t.to===acct)&&(!mon||ymOf(t.d)===mon)&&(!q||((t.note||'')+' '+(t.cat||'')+' '+name(t.from)+' '+name(t.to)).toLowerCase().indexOf(q)>=0); }); var inn=0,out=0;
  el('lgBody').innerHTML=f.length?f.map(function(t){ if(acct){ if(t.to===acct) inn+=t.amt; if(t.from===acct) out+=t.amt; } return '<tr class="rowbtn" data-edit="'+t.id+'"><td class="num small">'+dLabelY(t.d)+'</td><td>'+name(t.from)+'</td><td>'+name(t.to)+'</td><td class="small hide-m">'+esc([t.cat&&t.to!=='fees'?t.cat:'',t.note||''].filter(Boolean).join(' · '))+(t.key?'<span class="why">planned</span>':'')+'</td><td class="r num">'+amtCell(t,acct)+'</td></tr>'; }).join(''):'<tr><td colspan="5" class="empty">No entries match.</td></tr>';
  el('lgFoot').innerHTML='<span>'+f.length+' entr'+(f.length===1?'y':'ies')+' · tap a line to edit</span>'+(acct?'<span>In <b class="num">'+naira(inn,0)+'</b> · Out <b class="num">'+naira(out,0)+'</b></span>':''); }

/* balances on a date */
/* pots ref */
function renderPotsRef(b){ el('potsRef').innerHTML=ACC.filter(function(a){return !a.cash;}).concat(ACC.filter(function(a){return a.cash;})).map(function(a){ return '<tr><td><b>'+a.name+'</b>'+(a.rate?'<span class="why">quoted '+a.rate+'</span>':'')+'</td><td class="small num hide-m">'+esc(a.path)+'</td><td class="small">'+esc(a.job)+'</td></tr>'; }).join('')+
  '<tr><td><b>Not held</b></td><td class="small num hide-m">Global equities · US Treasuries · gold</td><td class="small">Needs a SEC-licensed broker (Trove, Bamboo, Chaka). Deferred to March 2027 by choice.</td></tr>'; }
function renderGaps(){ document.querySelectorAll('#gaps tr').forEach(function(tr){ var k='gap-'+tr.dataset.k, cb=tr.querySelector('input'); cb.checked=!!state.done[k]; tr.classList.toggle('dim',cb.checked); }); }

/* plan tab (from rules) */
function renderPlan(){ var P=plan(), ps=phases(), cur=currentPhase(); if(!planPhase||ps.indexOf(planPhase)<0) planPhase=cur;
  el('phaseSeg').innerHTML=ps.map(function(p,i){ return '<button type="button" data-phase="'+p+'" aria-pressed="'+(p===planPhase)+'">'+esc(phaseLabel(p,i,ps))+'</button>'; }).join('');
  var html='<div class="card"><div class="card-h"><h3>When '+naira((P.salaries.filter(function(s){return s.acct==='pocket';})[0]||{amt:0}).amt,0)+' lands in PocketApp</h3><span class="src">That is the month.</span></div><div class="tbl-wrap"><table><tbody><tr><td class="i">1</td><td>Whatever sits above the cushion on the 1st <span class="why">Salary + cushion = '+naira(state.settings.allowance+state.settings.cushion,0)+'. The rest becomes dollars, not next month\'s spending.</span></td><td>Flex → Flex Dollar</td><td class="r">leftover</td></tr></tbody></table></div></div>';
  ['Flex','Zenith'].forEach(function(g){ var lines=P.lines.filter(function(L){return L.grp===g;}); if(!lines.length) return; var sal=(P.salaries.filter(function(s){return s.acct===(g==='Flex'?'flex':'zenith');})[0]||{amt:0}).amt;
    var head='<tr><th>#</th><th>To</th>'+ps.map(function(p,i){return '<th class="r'+(p===planPhase?' cur':'')+'" data-ph="'+p+'">'+esc(phaseLabel(p,i,ps))+'</th>';}).join('')+'</tr>';
    var totals=ps.map(function(){return 0;});
    var rows=lines.map(function(L,li){ return '<tr><td class="i">'+(li+1)+'</td><td>'+esc(L.label)+(L.how?'<span class="why">'+esc(L.how)+'</span>':'')+'</td>'+ps.map(function(p,pi){ var a=lineAmt(L,p); var once=''; if(L.months){ var end=ps[pi+1]?addMonths(ps[pi+1],-1):'2099-12'; var ms=Object.keys(L.months).filter(function(m){return m>=p&&m<=end;}); a=ms.length?ms.reduce(function(s,m){return s+ +L.months[m];},0)/ms.length:null; once=ms.length?'<span class="tiny muted"> '+(ms.length===1?'once':ms.length+'×')+'</span>':''; } if(a!=null&&!L.months) totals[pi]+=a; if(a!=null&&L.months&&ms.length===1) totals[pi]+=0; return '<td class="r num'+(p===planPhase?' cur':'')+'" data-ph="'+p+'">'+(a==null?'<span class="dash">—</span>':fmt(a,0)+once)+'</td>'; }).join('')+'</tr>'; }).join('');
    var floatRow=g==='Zenith'?'<tr><td class="i">·</td><td>Stays in Zenith (float) <span class="why">Card subscriptions and bank charges. Anything above '+naira(state.settings.zfloat,0)+' left from last month → Conservative by hand.</span></td>'+ps.map(function(p,pi){return '<td class="r num'+(p===planPhase?' cur':'')+'">'+fmt(sal-totals[pi],0)+'</td>';}).join('')+'</tr>':'';
    html+='<div class="card"><div class="card-h"><h3>When '+naira(sal,0)+' lands in '+(g==='Flex'?'Flex':'Zenith')+'</h3><span class="src">'+(g==='Flex'?'Two in-app moves, one transfer out. Flex back to zero.':'Dad first. Cowrywise then debits the rest automatically.')+'</span></div><div class="tbl-wrap"><table><thead>'+head+'</thead><tbody>'+rows+floatRow+'<tr class="total"><td></td><td>Total</td>'+ps.map(function(p,pi){ var tot=g==='Zenith'?sal:totals[pi]; return '<td class="r num'+(p===planPhase?' cur':'')+'">'+fmt(tot,0)+(g==='Flex'&&Math.abs(totals[pi]-sal)>1?'<span class="why '+(totals[pi]>sal?'neg':'')+'">'+(totals[pi]>sal?'over by ':'short by ')+fmt(Math.abs(totals[pi]-sal),0)+'</span>':'')+'</td>'; }).join('')+'</tr></tbody></table></div></div>'; });
  var sw=P.lines.filter(function(L){return L.grp==='Sweep';}); if(sw.length){ html+='<div class="card"><div class="card-h"><h3>Sweeps</h3><span class="src">Interest that lands in Flex goes straight to HouseMoney</span></div><div class="tbl-wrap"><table><tbody>'+sw.map(function(L){ return '<tr><td>'+esc(L.label)+'</td><td class="small muted">'+Object.keys(L.months||{}).sort().map(function(m){return '1 '+shortMonth(m)+' ≈ '+naira(+L.months[m],0);}).join(' · ')+'</td></tr>'; }).join('')+'</tbody></table></div></div>'; }
  el('planTables').innerHTML=html; accordion(el('planTables'),true); }
function setPhase(p){ planPhase=p; renderPlan(); }

/* goals */
function renderGoals(b){ var s=state.settings, tr=tracked(b), ret=+s.ret||0; var rs=el('retSel'); for(var oi=0;oi<rs.options.length;oi++){ if(Math.abs(+rs.options[oi].value-ret)<1e-9){ rs.selectedIndex=oi; break; } }
  var proj=project(180,ret); var ms=[[50e6,'₦50m'],[100e6,'₦100m'],[150e6,'₦150m'],[200e6,'₦200m'],[305e6,'the freedom number']]; var rows='';
  var events=[['2026-10-01','Buy 1,000 Dangote shares from Flex · offer closes 13 Oct'],['2026-12-01','Emergency fund planned complete after this run'],['2026-12-08','PiggyBank unlocks · Light caught up'],['2027-02-01','Pay the rent from HouseMoney'],['2027-03-01','Review #1 — send the JSON'],['2027-06-06','Light turns two']];
  var all=[]; events.forEach(function(e){ if(e[0]>=TODAY){ var p=proj.filter(function(x){return x.ym===ymOf(e[0]);})[0]; all.push({d:e[0],what:e[1],total:p?p.total:null}); } });
  ms.forEach(function(m){ var hit=proj.filter(function(x){return x.total>=m[0];})[0]; all.push({d:hit?hit.ym+'-01':null,what:'<b>'+m[1]+'</b>'+(tr>=m[0]?' — reached':''),total:hit?hit.total:null,ms:true}); });
  all.sort(function(a,c){ return (a.d||'9999')<(c.d||'9999')?-1:1; });
  el('msBody').innerHTML=all.map(function(r){ return '<tr><td class="num">'+(r.d?(r.ms?monthName(ymOf(r.d)):dLabelY(r.d)):'beyond 15 years')+'</td><td>'+r.what+'</td><td class="r num">'+(r.total!=null?fmt(r.total,0):'—')+'</td></tr>'; }).join('');
  el('msNote').textContent=ret?('at '+(ret*100).toFixed(0)+'% a year, compounding monthly'):'principal only — returns excluded'; el('projNote').textContent=ret?('Plan assumes '+(ret*100).toFixed(0)+'% a year on every pot, compounding monthly · tracked total excludes Pocket, Zenith, Flex and cash'):'Plan is contributions only, no returns · tracked total excludes Pocket, Zenith, Flex and cash';
  var fifty=proj.filter(function(x){return x.total>=50e6;})[0];
  var months=[]; for(var i=idx(FIRST_RUN);i<=idx('2027-05');i++) months.push(ymFromIdx(i)); var rows2='<tr><td>'+anchorLbl()+' anchor</td><td class="r hide-m">'+fmt(state.opening.cons,0)+'</td><td class="r hide-m">0</td><td class="r hide-m">0</td><td class="r hide-m">'+fmt(state.opening.nest,0)+'</td><td class="r"><b>'+fmt(openingTracked(),0)+'</b></td><td class="r">—</td><td class="r">—</td></tr>';
  months.forEach(function(ym){ var end=ym+'-03'; var e=expected(end,ret); var te=tracked(e); var past=end<=TODAY; var a=past?balances(end):null; var ta=a?tracked(a):null; var gap=ta!=null?ta-te:null;
    rows2+='<tr'+(ym===curRun?' style="background:var(--accent-soft)"':'')+'><td>1 '+shortMonth(ym)+'</td><td class="r num hide-m">'+fmt(e.cons,0)+'</td><td class="r num hide-m">'+fmt(e.fxd+e.dollar,0)+'</td><td class="r num hide-m">'+fmt(e.house,0)+'</td><td class="r num hide-m">'+fmt(e.nest,0)+'</td><td class="r num"><b>'+fmt(te,0)+'</b></td><td class="r num">'+(ta!=null?fmt(ta,0):'<span class="dash">—</span>')+'</td><td class="r num '+(gap==null?'':(gap>=0?'pos':'neg'))+'">'+(gap==null?'':(gap>=0?'+':'−')+fmt(Math.abs(gap),0))+'</td></tr>'; });
  el('projBody').innerHTML=rows2; }

/* settings */
function sel(opts,val,cls){ return '<select class="'+(cls||'')+'">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===val?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select>'; }
var ACCOPTS=ACC.concat(EXT).map(function(a){return [a.id,a.name];});
var METH=[['','Work it out'],['inapp','In-app'],['transfer','Bank transfer'],['debit','Cowrywise debit'],['card','Card'],['pos','Cash · POS agent'],['atm','Cash · other-bank ATM'],['ownatm','Cash · own-bank ATM'],['cash','Cash'],['none','No charge']];
function amtsText(o){ return Object.keys(o||{}).sort().map(function(k){return k+':'+o[k];}).join(', '); }
function parseAmts(s){ var o={}; String(s||'').split(',').forEach(function(p){ var m=/^\s*(\d{4}-\d{2})\s*:\s*([\d.]+)\s*$/.exec(p); if(m) o[m[1]]=+m[2]; }); return Object.keys(o).length?o:null; }
function renderFees(){ var c=feeCfg(); var cols=['stamp','nip','sms','stampDebit']; el('feesBody').innerHTML=['zenith','pocket','flex'].map(function(a){ return '<tr><td><b>'+name(a)+'</b></td>'+cols.map(function(k){ if(k==='stampDebit'&&a!=='zenith') return '<td class="small muted">—</td>'; return '<td><input class="chk" type="checkbox" data-fee="'+a+'.'+k+'" aria-label="'+k+' '+a+'"'+(c[a][k]?' checked':'')+'></td>'; }).join('')+'</tr>'; }).join(''); }
function renderBillsEditor(){ var subs=subsList(); el('billsBody').innerHTML=subs.length?subs.map(function(s){ return '<tr><td>'+esc(s.name)+'</td><td class="small muted">'+name(s.from||'pocket')+'</td><td class="small muted hide-m">'+esc(s.cat||'Subscriptions')+'</td><td class="r num">'+fmt(s.amt,0)+'</td><td class="r"><button class="btn sm ghost danger" type="button" data-subdel="'+s.k+'">Remove</button></td></tr>'; }).join(''):'<tr><td colspan="5" class="empty">No fixed bills listed.</td></tr>';
  if(!el('sbFrom').options.length){ el('sbFrom').innerHTML=ACC.filter(function(a){return a.cash;}).map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join(''); el('sbCat').innerHTML=CATS.map(function(c){return '<option'+(c==='Subscriptions'?' selected':'')+'>'+c+'</option>';}).join(''); } }
var planDirty=false;
function renderPlanEditor(){ if(planDirty) return; var P=plan(); var GR=[['Flex','Flex'],['Zenith','Zenith'],['Sweep','Sweep']];
  var CASH=ACC.filter(function(a){return a.cash;}).map(function(a){return [a.id,a.name];});
  el('salBody').innerHTML=P.salaries.map(function(s,i){ return '<tr data-sal-row="'+i+'"><td>'+sel(CASH,s.acct,'s-acct w-m')+'</td><td><input class="num w-m s-amt" type="number" step="1" value="'+s.amt+'" aria-label="Salary amount"></td><td><input class="w-l s-note" value="'+esc(s.note||'')+'" aria-label="Note"></td><td class="r"><button class="btn sm ghost danger" type="button" data-saldel="'+i+'">✕</button></td></tr>'; }).join('');
  el('salTotal').innerHTML='Total <b class="num">'+naira(P.salaries.reduce(function(t,s){return t+(+s.amt||0);},0),0)+'</b> a month';
  var F=function(lbl,inner,span){ return '<div class="lf'+(span?' s'+span:'')+'"><span class="lbl">'+lbl+'</span>'+inner+'</div>'; };
  el('linesBody').innerHTML=P.lines.map(function(L,i){ return '<div class="line" data-line="'+i+'"><div class="line-grid">'+
    F('Group',sel(GR,L.grp,'f-grp'))+F('From',sel(ACCOPTS,L.from,'f-from'))+F('To',sel(ACCOPTS,L.to,'f-to'))+F('Day',"<input class=\"f-day num\" type=\"number\" min=\"1\" max=\"28\" value=\""+(L.day||1)+"\" aria-label=\"Day\">")+F('How paid',sel(METH,L.method||'','f-meth'))+
    F('Label',"<input class=\"f-label\" value=\""+esc(L.label)+"\" aria-label=\"Label\">",2)+F('Note',"<input class=\"f-how\" value=\""+esc(L.how||'')+"\" placeholder=\"How / note\" aria-label=\"How\">",3)+
    F('Amounts by phase',"<input class=\"f-amts num\" value=\""+esc(amtsText(L.amts))+"\" placeholder=\"2026-10:400000, 2027-03:167000\" aria-label=\"Amounts by phase\">",2)+F('Only in',"<input class=\"f-months num\" value=\""+esc(amtsText(L.months))+"\" placeholder=\"2026-10:525000\" aria-label=\"Only in\">",1)+F('Start',"<input class=\"f-start num\" value=\""+esc(L.start||'')+"\" placeholder=\"YYYY-MM\" aria-label=\"Start\">")+F('End',"<input class=\"f-end num\" value=\""+esc(L.end||'')+"\" placeholder=\"YYYY-MM\" aria-label=\"End\">")+
    '</div><div class="line-act"><span class="small muted">'+esc(L.label)+'</span><button class="btn sm ghost danger" type="button" data-linedel="'+i+'">Remove line</button></div></div>'; }).join('');
  el('oneBody').innerHTML=P.oneoffs.map(function(o,i){ return '<div class="line" data-one="'+i+'"><div class="line-grid">'+
    F('Date',"<input class=\"o-d num\" type=\"date\" value=\""+esc(o.d)+"\" aria-label=\"Date\">")+F('From',sel(ACCOPTS,o.from,'o-from'))+F('To',sel(ACCOPTS,o.to,'o-to'))+F('Amount ₦',"<input class=\"o-amt num\" type=\"number\" step=\"1\" value=\""+o.amt+"\" aria-label=\"Amount\">")+F('How paid',sel(METH,o.method||'','o-meth'))+
    F('Label',"<input class=\"o-label\" value=\""+esc(o.label)+"\" aria-label=\"Label\">",2)+F('Note',"<input class=\"o-how\" value=\""+esc(o.how||'')+"\" placeholder=\"How / note\" aria-label=\"How\">",3)+
    '</div><div class="line-act"><span class="small muted">'+esc(o.label)+'</span><button class="btn sm ghost danger" type="button" data-onedel="'+i+'">Remove</button></div></div>'; }).join('')||'<div class="empty">None.</div>';
  checkLines(); }
function readLines(){ var out=[]; document.querySelectorAll('#linesBody [data-line]').forEach(function(tr){ var q=function(c){return tr.querySelector('.'+c);}; var P=plan(); var old=P.lines[+tr.dataset.line]||{}; var L={id:old.id||('l'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)),grp:q('f-grp').value,from:q('f-from').value,to:q('f-to').value,label:q('f-label').value.trim(),how:q('f-how').value.trim(),day:Math.max(1,Math.min(28,+q('f-day').value||1)),method:q('f-meth').value||undefined}; var am=parseAmts(q('f-amts').value), mo=parseAmts(q('f-months').value); if(mo) L.months=mo; else L.amts=am||{}; if(q('f-start').value.trim()) L.start=q('f-start').value.trim(); if(q('f-end').value.trim()) L.end=q('f-end').value.trim(); if(old.dyn) L.dyn=old.dyn; out.push(L); }); return out; }
function checkLines(){ var lines=readLines(), P=plan(), ps=phases(), msgs=[]; ['flex','zenith'].forEach(function(acct){ var sal=(P.salaries.filter(function(s){return s.acct===acct;})[0]||{amt:0}).amt; ps.forEach(function(p,i){ var sum=0; lines.forEach(function(L){ if(L.from!==acct||L.months) return; var a=lineAmt(L,p); if(a!=null) sum+=a; }); var room=sal-sum; if(acct==='zenith') room-=state.settings.zfloat; if(room<-1) msgs.push(name(acct)+' '+phaseLabel(p,i,ps)+': over by '+naira(-room,0)); }); }); el('linesCheck').innerHTML=msgs.length?'<span class="neg">'+msgs.join(' · ')+'</span>':'Lines fit inside each salary'+(state.settings.zfloat?' (Zenith keeps its '+naira(state.settings.zfloat,0)+' float)':'')+'.'; }
function renderCats(){ el('catBody').innerHTML=CATS.map(function(c){ return '<div class="lf"><span class="lbl">'+c+'</span><input class="num" type="number" step="1000" placeholder="No limit" value="'+(state.catLimits[c]||'')+'" data-catlim="'+c+'" aria-label="Limit '+c+'"></div>'; }).join(''); }
function renderSettings(){ var s=state.settings; renderFees(); renderBillsEditor(); renderPlanEditor(); if(!el('catBody').children.length) renderCats(); el('sAllow').value=s.allowance; el('sCushion').value=s.cushion; el('sFloat').value=s.zfloat; el('sRate').value=s.rate; el('sEF').value=s.ef; el('sRent').value=s.rentTarget; el('sPosFee').value=s.posFee; el('sPosPer').value=s.posPer; el('sAtmFee').value=s.atmFee; el('sAtmPer').value=s.atmPer; el('anchorDate').textContent='As of '+dLabelY(s.anchorDate);
  el('openBody').innerHTML=ACC.map(function(a){ return '<div class="lf"><span class="lbl">'+a.name+(a.app!==a.name?' · '+a.app:'')+'</span><input class="num" type="number" step="0.01" id="open-'+a.id+'" value="'+(+state.opening[a.id]||0)+'" aria-label="Opening '+a.name+'"></div>'; }).join('');
  if(!db&&!el('storeWhere').textContent) el('storeWhere').textContent='Saved on this device'; }

/* ---------- edit sheet ---------- */
function openSheet(html){ el('sheet').innerHTML=html; el('sheet').classList.add('on'); el('sheetBg').classList.add('on'); var f=el('sheet').querySelector('input,select'); if(f) f.focus(); }
function closeSheet(){ el('sheet').classList.remove('on'); el('sheetBg').classList.remove('on'); el('sheet').innerHTML=''; }
function openEdit(id){ var t=getTx(id); if(!t) return; var isExp=t.to==='spend'; var opts=ACC.concat(EXT).map(function(a){return [a.id,a.name];});
  openSheet('<div class="card-h"><h3 id="sheetTitle">Edit entry</h3><button class="btn ghost sm" type="button" data-close="1">Close</button></div><form class="form" id="editForm" data-id="'+id+'">'+
   '<div class="f"><label class="lbl" for="edAmt">Amount ₦</label><input class="num" id="edAmt" type="number" step="0.01" min="0" value="'+t.amt+'" required></div>'+
   '<div class="f"><label class="lbl" for="edDate">Date</label><input id="edDate" type="date" value="'+t.d+'" required></div>'+
   (t.fee?'<div class="f wide small muted">Bank charge attached to another entry. Amount and date only.</div>':
   '<div class="f"><label class="lbl" for="edFrom">From</label>'+sel(opts,t.from).replace('<select','<select id="edFrom"')+'</div><div class="f"><label class="lbl" for="edTo">To</label>'+sel(opts,t.to).replace('<select','<select id="edTo"')+'</div>'+
   '<div class="f"><label class="lbl" for="edHow">How</label>'+sel(METH,t.method||'').replace('<select','<select id="edHow"')+'</div>'+
   (isExp?'<div class="f"><label class="lbl" for="edCat">Category</label>'+sel(CATS.map(function(c){return [c,c];}),t.cat||'Other').replace('<select','<select id="edCat"')+'</div>':'')+
   (isUsd(t.to)||isUsd(t.from)?'<div class="f"><label class="lbl" for="edUsd">Dollars ($)</label><input class="num" id="edUsd" type="number" step="0.01" value="'+(t.usd!=null?t.usd:'')+'"></div>':'')+
   '<div class="f wide"><label class="lbl" for="edNote">Note</label><input id="edNote" value="'+esc(t.note||'')+'"></div>')+
   (t.key?'<div class="f wide small muted">Planned line · '+esc(t.key)+'</div>':'')+
   '<div class="actions"><button class="btn danger" type="button" data-delentry="'+id+'">Delete</button><span style="flex:1"></span><button class="btn pri" type="submit">Save</button></div></form>'); }
function openRecon(acct){ var b=balances(); var c=state.confirmed[acct]; openSheet('<div class="card-h"><h3 id="sheetTitle">Reconcile '+name(acct)+'</h3><button class="btn ghost sm" type="button" data-close="1">Close</button></div><form class="form" id="reconForm" data-acct="'+acct+'"><div class="f wide small muted">Sheet says <b class="num">'+naira(b[acct])+'</b>'+(c?' · last confirmed '+dLabelY(c.d)+' at '+naira(c.bal):'')+'. '+(ACCMAP[acct].physical?'Count the notes in your wallet and type the total; anything missing is recorded as <i>cash spent, not itemised</i>.':'Type what the app shows now; the difference is recorded as a dated <i>Interest / returns</i> line so history stays intact.')+'</div><div class="f"><label class="lbl" for="rcBal">'+(ACCMAP[acct].physical?'Cash counted ₦':'Balance in the app ₦')+'</label><input class="num" id="rcBal" type="number" step="0.01" min="0" value="'+b[acct]+'" required></div><div class="actions"><button class="btn pri" type="submit">Confirm</button></div></form>'); }
function openMore(){ openSheet('<div class="card-h"><h3 id="sheetTitle">Category</h3><button class="btn ghost sm" type="button" data-close="1">Close</button></div><div class="card-b chips">'+CATS.map(function(c){return '<button type="button" class="chip" data-qpick="'+c+'">'+c+'</button>';}).join('')+'</div>'); }


/* accordion */
var CHEV='<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
function accordion(root,defaultOpen){ root.querySelectorAll(':scope .card').forEach(function(card){ accCard(card,root.id,defaultOpen); }); }
function accCard(card,rootId,defaultOpen){ (function(){ if(card.classList.contains('acc-item')||card.closest('.acc-b')||card.classList.contains('tiles')) return; var h=card.querySelector(':scope > .card-h'); if(!h) return; var h3=h.querySelector('h3'); if(!h3) return; card.classList.add('acc-item'); var key='acc-'+rootId+'-'+h3.textContent.trim().slice(0,40);
  var src=h.querySelector(':scope > .src'); var t=document.createElement('div'); t.className='acc-t'; t.appendChild(h3); if(src) t.appendChild(src); var rest=Array.prototype.slice.call(h.childNodes); var act=document.createElement('div'); act.className='acc-act'; rest.forEach(function(n){ act.appendChild(n); }); h.innerHTML=''; h.appendChild(t); h.appendChild(act); h.insertAdjacentHTML('beforeend',CHEV);
  var body=document.createElement('div'); body.className='acc-b'; while(h.nextSibling) body.appendChild(h.nextSibling); card.appendChild(body); card.dataset.acc=key;
  var saved=ls(key); var open= saved!=null ? saved==='1' : (!!defaultOpen||card.dataset.open==='1'); card.classList.toggle('open',open);
  h.addEventListener('click',function(ev){ if(ev.target.closest('button,input,select,a')) return; card.classList.toggle('open'); ls(key,card.classList.contains('open')?'1':'0'); }); })(); }

/* ---------- events ---------- */
var tabs=document.querySelectorAll('nav.tabs button'), views=document.querySelectorAll('.view');
var YOU={settings:1,plan:1,goals:1};
function show(v){ if(!el('v-'+v)) v='today'; document.documentElement.setAttribute('data-view',v); views.forEach(function(s){ s.classList.toggle('on', s.id==='v-'+v); }); var tv=YOU[v]?'settings':v; tabs.forEach(function(t){ t.setAttribute('aria-selected', t.dataset.view===tv?'true':'false'); }); document.querySelectorAll('[data-sub-view]').forEach(function(sb){ sb.setAttribute('aria-selected', sb.dataset.subView===v?'true':'false'); }); ls('pm-tab',v); if(v==='today') el('bdg-today').hidden=true; }
tabs.forEach(function(t){ t.addEventListener('click',function(){ show(t.dataset.view); scrollTop0(); }); });
el('sheetBg').addEventListener('click',closeSheet);
document.addEventListener('keydown',function(ev){ if(ev.key==='Escape') closeSheet(); if((ev.key==='Enter'||ev.key===' ')&&ev.target.classList&&ev.target.classList.contains('grp')){ ev.preventDefault(); ev.target.click(); } });
document.addEventListener('click',function(ev){ var gh=ev.target.closest('.grp[data-grp]'); if(gh){ var open=!gh.classList.contains('open'); gh.classList.toggle('open',open); gh.setAttribute('aria-expanded',open); var body=gh.nextElementSibling; if(body) body.hidden=!open; ls('grp-'+gh.dataset.grp,open?'1':'0'); if(open) renderPotGroups(balances(),expected(TODAY)); return; }
  var b=ev.target.closest('button'); var row=ev.target.closest('[data-edit]');
  if(!b&&row){ openEdit(row.dataset.edit); return; }
  if(!b) return; var d=b.dataset;
  if(d.go){ show(d.go); scrollTop0(); }
  else if(d.close){ closeSheet(); }
  else if(d.undo){ removeTx(d.undo,true); toast('Undone'); }
  else if(d.delentry){ closeSheet(); removeTx(d.delentry); }
  else if(d.doit){ var it=findItem(d.doit); if(!it) return; var inp=el('amt-'+it.key); var amt=inp?+inp.value:it.amt; if(!(amt>=0)) return toast('Enter an amount'); var tx=postItem(it,amt); toast(name(it.from)+' → '+name(it.to)+' '+naira(amt,0)+feeNote(tx)); }
  else if(d.doall){ var byKey=txByKey(), n=0; runItems(d.doall).forEach(function(it){ if(it.grp==='Salaries'&&!byKey[it.key]&&canPost(it)){ var inp=el('amt-'+it.key); postItem(it,inp?+inp.value:it.amt); n++; } }); toast(n+' salaries posted'); }
  else if(d.promptAct){ var a=JSON.parse(d.promptAct); var tx2=post({d:TODAY,from:a.from,to:a.to,amt:a.amt,note:a.note}); toast('Moved '+naira(a.amt,0)+feeNote(tx2)); }
  else if(d.dismiss){ state.done[d.dismiss]=true; saveState(); render(); }
  else if(d.recon){ openRecon(d.recon); }
  else if(d.qcat){ if(d.qcat==='__more'){ openMore(); return; } qCat=d.qcat; renderQuick(balances()); }
  else if(d.qpick){ qCat=d.qpick; closeSheet(); renderQuick(balances()); }
  else if(d.sub){ var s=subsList().filter(function(x){return x.k===d.sub;})[0]; if(!s) return; var dd=TODAY; var tx3=post({d:dd,from:s.from||'pocket',to:'spend',amt:s.amt,cat:s.cat||'Subscriptions',note:s.name,sub:s.k,method:(s.from||'pocket')==='zenith'?'card':'transfer'}); toast(s.name+' added'+feeNote(tx3)); }
  else if(d.subdel){ state.subs=subsList().filter(function(x){return x.k!==d.subdel;}); saveState(); render(); toast('Removed from Fixed monthly'); }
  else if(d.phase){ setPhase(d.phase); }
  else if(d.linedel){ planDirty=false; var P=clone(plan()); P.lines.splice(+d.linedel,1); state.plan=P; saveState(); render(); toast('Line removed'); }
  else if(d.onedel){ planDirty=false; var P2=clone(plan()); P2.oneoffs.splice(+d.onedel,1); state.plan=P2; saveState(); render(); toast('One-off removed'); }
  else if(b.id==='btnAddLine'){ planDirty=false; var P3=clone(plan()); P3.lines.push({id:'l'+Date.now().toString(36),grp:'Zenith',from:'zenith',to:'cons',label:'New line',how:'',day:2,amts:{},start:currentRun()}); state.plan=P3; renderPlanEditor(); }
  else if(b.id==='btnAddOne'){ planDirty=false; var P4=clone(plan()); P4.oneoffs.push({id:'o'+Date.now().toString(36),d:TODAY,from:'flex',to:'cons',amt:0,label:'New one-off',how:''}); state.plan=P4; renderPlanEditor(); }
  else if(b.id==='btnSaveLines'){ var P5=clone(plan()); P5.lines=readLines(); state.plan=P5; planDirty=false; saveState(); render(); toast('Routine saved — Move, Plan and Goals updated'); }
  else if(b.id==='btnSaveOne'){ var P6=clone(plan()); P6.oneoffs=[]; document.querySelectorAll('#oneBody [data-one]').forEach(function(tr){ var q=function(c){return tr.querySelector('.'+c);}; var old=plan().oneoffs[+tr.dataset.one]||{}; P6.oneoffs.push({id:old.id||('o'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)),d:q('o-d').value,from:q('o-from').value,to:q('o-to').value,label:q('o-label').value.trim(),how:q('o-how').value.trim(),amt:+q('o-amt').value||0,method:q('o-meth').value||undefined}); }); state.plan=P6; planDirty=false; saveState(); render(); toast('One-offs saved'); }
  else if(b.id==='btnSaveSal'){ var P7=clone(plan()); P7.salaries=[]; document.querySelectorAll('#salBody tr[data-sal-row]').forEach(function(tr){ var q=function(c){return tr.querySelector('.'+c);}; P7.salaries.push({acct:q('s-acct').value,amt:+q('s-amt').value||0,note:q('s-note').value.trim()}); }); state.plan=P7; planDirty=false; saveState(); render(); toast('Salaries saved'); }
  else if(b.id==='btnAddSal'){ planDirty=false; var P8=clone(plan()); P8.salaries.push({acct:'zenith',amt:0,note:''}); state.plan=P8; renderPlanEditor(); }
  else if(d.saldel){ planDirty=false; var P9=clone(plan()); P9.salaries.splice(+d.saldel,1); state.plan=P9; saveState(); render(); toast('Salary removed'); }
  else if(b.id==='btnSaveCats'){ var L={}; document.querySelectorAll('[data-catlim]').forEach(function(i){ if(+i.value>0) L[i.dataset.catlim]=+i.value; }); state.catLimits=L; saveState(); render(); toast('Limits saved'); }
  else if(b.id==='btnResetPlan'){ state.plan=null; planDirty=false; saveState(); render(); toast('Routine reset to the original plan'); }
  else if(b.id==='toastAct'){ if(toastFn){ var fn=toastFn; toastFn=null; el('toast').classList.remove('show'); fn(); } }
});
document.addEventListener('input',function(ev){ if(ev.target.closest('#linesBody')){ planDirty=true; checkLines(); } if(ev.target.closest('#oneBody')||ev.target.closest('#salBody')) planDirty=true; });
document.addEventListener('submit',function(ev){ var f=ev.target; 
  if(f.id==='subForm'){ ev.preventDefault(); var nm=el('sbName').value.trim(), amt=+el('sbAmt').value; if(!nm||!(amt>0)) return toast('Name and amount, please'); var L=subsList().slice(); L.push({k:'s'+Date.now().toString(36),name:nm,amt:amt,from:el('sbFrom').value,cat:el('sbCat').value}); state.subs=L; saveState(); render(); toast(nm+' added to Fixed monthly'); el('sbName').value=''; el('sbAmt').value=''; }
  else if(f.id==='editForm'){ ev.preventDefault(); var id=f.dataset.id, t=getTx(id); if(!t) return closeSheet(); var patch={amt:+el('edAmt').value,d:el('edDate').value}; if(!t.fee){ patch.from=el('edFrom').value; patch.to=el('edTo').value; patch.method=el('edHow').value||undefined; patch.note=el('edNote').value.trim(); if(el('edCat')) patch.cat=el('edCat').value; if(el('edUsd')&&el('edUsd').value!=='') patch.usd=+el('edUsd').value; } if(patch.from===patch.to) return toast('From and To are the same'); if(ymOf(patch.d)!==ymOf(t.d)){ var kids=childrenOf(id); removeTx(id,true); var n=Object.assign(clone(t),patch); n.id=uid(); post(n); } else { updateTx(id,patch); } closeSheet(); toast('Saved'); }
  else if(f.id==='reconForm'){ ev.preventDefault(); var real=+el('rcBal').value; if(!(real>=0)) return toast('Enter the balance'); closeSheet(); reconcile(f.dataset.acct,real); }
  else if(f.id==='quickForm'){ ev.preventDefault(); var qa=+el('qAmt').value; if(!(qa>0)) return toast('Enter an amount'); var from=el('qFrom').value; qCat=el('qCat').value; var tq=post({d:el('qDate').value||TODAY,from:from,to:'spend',amt:qa,cat:qCat,note:el('qNote').value.trim(),method:el('qHow').value}); el('qAmt').value=''; el('qNote').value=''; el('qDate').value=TODAY; toast(qCat+' '+naira(qa,0)+' added'+feeNote(tq)+' · '+name(from)+' now '+naira(balances()[from],0)); }
});
el('qFrom').addEventListener('change',function(){ var f=el('qFrom').value; el('qHow').value = f==='zenith'?'card':(f==='cash'?'cash':'transfer'); });
el('mvForm').addEventListener('submit',function(ev){ ev.preventDefault(); var amt=+el('mvAmt').value, f=el('mvFrom').value, t=el('mvTo').value; if(!(amt>0)) return toast('Enter an amount'); if(f===t) return toast('From and To are the same'); var tx=post({d:el('mvDate').value||TODAY,from:f,to:t,amt:amt,note:el('mvNote').value.trim(),method:el('mvHow').value||undefined}); el('mvAmt').value=''; el('mvNote').value=''; toast('Moved '+naira(amt,0)+' · '+name(f)+' → '+name(t)+feeNote(tx)); });
el('setForm').addEventListener('submit',function(ev){ ev.preventDefault(); var s=state.settings; s.allowance=+el('sAllow').value||s.allowance; s.cushion=+el('sCushion').value||0; s.zfloat=+el('sFloat').value||0; s.rate=+el('sRate').value||s.rate; s.ef=+el('sEF').value||s.ef; s.rentTarget=+el('sRent').value||s.rentTarget; s.posFee=+el('sPosFee').value||0; s.posPer=+el('sPosPer').value||10000; s.atmFee=+el('sAtmFee').value||0; s.atmPer=+el('sAtmPer').value||20000; saveState(); render(); toast('Saved'); });
el('retSel').addEventListener('change',function(){ state.settings.ret=+el('retSel').value; saveState(); renderGoals(balances()); });
el('btnSaveOpen').addEventListener('click',function(){ ACC.forEach(function(a){ var v=el('open-'+a.id); if(v) state.opening[a.id]=+v.value||0; }); saveState(); render(); toast('Openings saved'); });
el('btnWipe').addEventListener('click',function(){ if(!confirm('Delete every entry? Opening balances, rules and settings stay.')) return; allTx().forEach(function(t){ tombstone(t.id); }); state.confirmed={}; saveState(); render(); toast('Ledger cleared'); });
function exportJSON(){ return JSON.stringify({exported:new Date().toISOString(),state:state,entries:allTx(),balances:balances()},null,2); }
el('btnExport').addEventListener('click',function(){ saveFile('payday-'+TODAY+'.json',exportJSON()); toast('Backup saved'); });
el('btnShowJson').addEventListener('click',function(){ el('jsonBox').value=exportJSON(); el('jsonBox').hidden=false; });
el('btnImport').addEventListener('click',function(){ var box=el('jsonBox'); if(box.hidden){ box.hidden=false; box.value=''; box.focus(); return toast('Paste the backup, then Import again'); } importText(box.value); });
el('rPrev').addEventListener('click',function(){ if(idx(curRun)>idx(FIRST_RUN)){ curRun=addMonths(curRun,-1); renderMove(balances()); renderRunCard(); } }); el('rNext').addEventListener('click',function(){ curRun=addMonths(curRun,1); renderMove(balances()); renderRunCard(); });
el('potDate').addEventListener('change',function(){ render(); });
el('potToday').addEventListener('click',function(){ el('potDate').value=''; render(); });
el('lgAcct').addEventListener('change',renderLedger); el('lgType').addEventListener('change',renderLedger); el('lgMonth').addEventListener('change',renderLedger); el('lgSearch').addEventListener('input',renderLedger);
el('feesBody').addEventListener('change',function(ev){ var k=ev.target.dataset.fee; if(!k) return; var p=k.split('.'); var f=Object.assign({},state.settings.fees||{}); f[p[0]]=Object.assign({},DEFAULT_FEES[p[0]],f[p[0]]||{}); f[p[0]][p[1]]=ev.target.checked; state.settings.fees=f; saveState(); toast('Charges updated'); });
el('gaps').addEventListener('change',function(ev){ var tr=ev.target.closest('tr'); if(!tr) return; state.done['gap-'+tr.dataset.k]=ev.target.checked; saveState(); renderGaps(); });

/* selects */
function fillSelects(){ var opts=function(list){ return list.map(function(a){return '<option value="'+a.id+'">'+a.name+(a.app&&a.app!==a.name?' · '+a.app:'')+'</option>';}).join(''); };
  el('mvFrom').innerHTML=opts(ACC.concat(EXT)); el('mvTo').innerHTML=opts(ACC.concat(EXT)); el('mvFrom').value='flex'; el('mvTo').value='cons'; }

/* ---------- boot ---------- */
el('today').textContent=now.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
function onNewDay(was,t){ curRun=currentRun(); ['qDate','mvDate'].forEach(function(id){ var e=el(id); if(e&&e.value===was) e.value=t; }); render(); }
document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible') refreshDay(); }); window.addEventListener('focus',refreshDay); setInterval(refreshDay,60000);
applyPriv();
el('btnPriv').addEventListener('click',function(){ priv=!priv; ls('pm-priv',priv?'1':'0'); applyPriv(); });
loadLocal(); fillSelects(); render(); accordion(el('v-pots'),false); accCard(el('recentCard'),'v-today',true); accCard(el('needsCard'),'v-today',true); accCard(el('billsCard'),'v-today',false); accCard(el('monthEnd'),'v-ledger',false); accordion(el('v-settings'),false); accordion(el('v-plan'),false); show((location.hash||'').replace('#','')||ls('pm-tab')||'today');

/* app hooks: sync layer (sync.js) calls connectDb; downloads are plain file saves */
function connectDb(d){ db=d; setSync(true,'synced'); var gotState=false;
  db.doc('money/state').onSnapshot(function(snap){ if(snap.exists){ adoptState(clone(snap.data())); saveLocal(); render(); } else if(!gotState){ db.doc('money/state').set(clone(state)).catch(function(){}); } gotState=true; },function(e){ setSync(false,'sync lost'); });
  db.collection('ledger').onSnapshot(function(snap){ var L={}; snap.docs.forEach(function(d){ var x=d.data(); if(!x) return; L[d.id]=normMonth(x.items); });
    Object.keys(ledger).forEach(function(ym){ if(!L[ym]){ L[ym]=ledger[ym]; Object.keys(ledger[ym]).forEach(function(id){ if(!pending[ym]) pending[ym]={}; pending[ym][id]=ledger[ym][id]; }); } });
    Object.keys(pending).forEach(function(ym){ if(!L[ym]) L[ym]={}; Object.keys(pending[ym]).forEach(function(id){ L[ym][id]=pending[ym][id]; }); });
    ledger=L; saveLocal(); render(); flush(); },function(e){ setSync(false,'sync lost'); });
  el('storeWhere').textContent='Synced through your Supabase project — every device you sign in on'; }
function saveFile(name,text){ var blob=new Blob([text],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000); }
function importText(txt){ try{ var j=JSON.parse(txt); if(!j.state) throw 0; if(!confirm('Replace everything in the app with this backup?')) return; adoptState(j.state); var entries=j.entries||[]; if(!entries.length&&j.ledger){ Object.keys(j.ledger).forEach(function(ym){ var m=j.ledger[ym]; (Array.isArray(m)?m:Object.keys(m).map(function(k){return m[k];})).forEach(function(t){ if(t&&!t.del) entries.push(t); }); }); } allTx().forEach(function(t){ tombstone(t.id); }); entries.forEach(function(t){ t.ts=Date.now(); putEntry(t); }); saveState(); render(); toast('Imported '+entries.length+' entries'); }catch(e){ toast('That is not a Payday backup'); } }
el('fileImport').addEventListener('change',function(){ var f=this.files&&this.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ importText(r.result); }; r.readAsText(f); this.value=''; });
window.addEventListener('online',function(){ flush(); });
function scrollTop0(){ var s=document.getElementById('scroll'); if(s&&s.scrollHeight>s.clientHeight) s.scrollTop=0; window.scrollTo(0,0); }
var APP_VERSION='v20260913-32708';
el('appVer').textContent='Build '+APP_VERSION;
/* install: offer it where the browser allows, explain it where it does not */
var deferredInstall=null;
function isStandalone(){ return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true; }
function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); }
function showInstall(on){ var b=el('btnInstall'); if(b) b.hidden=!on; }
window.addEventListener('beforeinstallprompt',function(ev){ ev.preventDefault(); deferredInstall=ev; if(!isStandalone()) showInstall(true); });
window.addEventListener('appinstalled',function(){ deferredInstall=null; showInstall(false); toast('Payday installed — open it from your home screen or dock'); });
el('btnInstall').addEventListener('click',function(){
  if(deferredInstall){ deferredInstall.prompt(); deferredInstall.userChoice.then(function(c){ deferredInstall=null; if(c&&c.outcome==='accepted') showInstall(false); }); return; }
  if(isIOS()) return toast('In Safari: tap Share, then Add to Home Screen','OK');
  toast('In Chrome: the install icon in the address bar, or ⋮ → Install page as app','OK');
});
if(!isStandalone()&&isIOS()) showInstall(true);
if(isStandalone()) document.documentElement.classList.add('installed');
window.Payday={connectDb:connectDb,setSync:setSync,toast:toast,exportJSON:exportJSON,importText:importText};
/* service worker: update notice */
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').then(function(reg){ reg.addEventListener('updatefound',function(){ var nw=reg.installing; nw&&nw.addEventListener('statechange',function(){ if(nw.state==='installed'&&navigator.serviceWorker.controller) toast('Payday updated','Reload',function(){ location.reload(); }); }); }); }).catch(function(){}); }
})();

