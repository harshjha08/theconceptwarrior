const $=s=>document.querySelector(s),T=localStorage;let tok=T.cw,sock,L=null,D=null,cur='Dashboard',sel=[],tick,unread={};
const api=async(p,b)=>{const r=await fetch('/api/'+p,{method:b?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:tok||''},body:b?JSON.stringify(b):undefined}),j=await r.json();if(!r.ok){if(r.status===401&&tok)out();throw Error(j.e||'Error')}return j};
const toast=m=>{const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.append(e);setTimeout(()=>e.remove(),4000)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),fd=d=>new Date(d).toLocaleString();
const H=(t,b)=>$('#main').innerHTML=`<h2>${t}</h2>${b}`,view=v=>{$('#login').hidden=v!=='l';$('#app').hidden=v!=='a'};
const out=()=>{T.clear();location.reload()};
$('#out').onclick=out;
$('#fgl').onclick=e=>{e.preventDefault();$('#fg').hidden=!$('#fg').hidden};
$('#gc').onclick=async()=>{try{await api('forgot',{id:$('#fid').value.trim()});toast('Request sent. Ask your tutor for the reset code (valid 15 min).')}catch(x){toast(x.message)}};
$('#fg').onsubmit=async e=>{e.preventDefault();try{await api('reset',{id:$('#fid').value.trim(),code:$('#fc').value.trim(),password:$('#fp').value});toast('Password reset. Please login.');$('#fg').hidden=true}catch(x){toast(x.message)}};
$('#lf').onsubmit=async e=>{e.preventDefault();try{const j=await api('login',{id:$('#id').value.trim(),password:$('#pw').value});tok=T.cw=j.t;T.cwi=j.id;start()}catch(x){toast(x.message)}};

async function dash(){const j=await api('home'),n=j.results.length,avg=n?Math.round(j.results.reduce((a,x)=>a+x.score/x.total,0)/n*100):0;
 H('Welcome, '+esc(j.name)+' 👋',`<div class="grid"><div class="card"><b>${j.results.filter(x=>x.type==='quiz').length}</b>Quizzes taken</div><div class="card"><b>${n}</b>Total attempts</div><div class="card"><b>${avg}%</b>Average score</div></div>${L?`<div class="card live">🔴 Live test "${esc(L.title)}" is open <button onclick="go('Live Test')">Join</button></div>`:''}<div class="card"><h3>Latest announcement</h3>${j.ann[0]?`<b>${esc(j.ann[0].t)}</b>${esc(j.ann[0].b)}`:'None'}</div>`)}
async function ann(){const j=await api('home');H('Announcements',j.ann.map(a=>`<div class="card"><b>${esc(a.t)}</b><small>${fd(a.d)}</small><p>${esc(a.b)}</p></div>`).join('')||'<p>No announcements</p>')}
async function msgs(){const m=await api('msgs');H('Messages',`<div class="chat">${m.map(x=>`<div class="m ${x.from===T.cwi?'me':''}"><small>${x.from===T.cwi?'You':'Tutor'}${x.to==='all'?' · to all':''} · ${fd(x.d)}</small>${esc(x.b)}</div>`).join('')||'<p>No messages yet</p>'}</div><form id="mf" class="row"><input id="mb" placeholder="Message your tutor…" required><button>Send</button></form>`);
 $('#mf').onsubmit=async e=>{e.preventDefault();await api('msgs',{b:$('#mb').value});msgs()};const c=$('.chat');c.scrollTop=c.scrollHeight}
async function quiz(){const j=await api('quiz');if(j.done)return H('Daily Quiz',`<div class="card">✅ Done for today. Score: <b>${j.done.score}/${j.done.total}</b>New quiz tomorrow!</div>`);
 H('Daily Quiz',`<form id="qf">${j.qs.map((x,i)=>`<div class="card"><b>${i+1}. ${esc(x.q)}</b>${x.o.map((o,k)=>`<label><input type="radio" name="q${i}" value="${k}"> ${esc(o)}</label>`).join('')}</div>`).join('')}<button>Submit quiz</button></form>`);
 $('#qf').onsubmit=async e=>{e.preventDefault();const a=j.qs.map((_,i)=>{const c=document.querySelector(`input[name=q${i}]:checked`);return c?+c.value:-1});try{const r=await api('quiz',{a});toast(`Score ${r.res.score}/${r.res.total}`)}catch(x){toast(x.message)}quiz()}}
async function prac(s=''){const p=await api('practice?s='+s);H('Practice',`<div class="row">${['','Physics','Chemistry','Maths'].map(x=>`<button class="chip ${x===s?'on':''}" onclick="prac('${x}')">${x||'All'}</button>`).join('')}</div>${p.map(x=>`<div class="card"><small>${x.s}</small><b>${esc(x.q)}</b>${x.o.map((o,k)=>`<button class="opt" onclick="this.classList.add(${k===x.a?"'ok'":"'bad'"});this.parentNode.children[${x.a+2}].classList.add('ok')">${esc(o)}</button>`).join('')}</div>`).join('')}`)}
async function prog(){const j=await api('home');H('Progress',`<table><tr><th>Date</th><th>Type</th><th>Title</th><th>Score</th></tr>${j.results.slice().reverse().map(x=>`<tr><td>${fd(x.d)}</td><td>${x.type}</td><td>${esc(x.title)}</td><td>${x.score}/${x.total}</td></tr>`).join('')}</table>`)}
const board=b=>`<table><tr><th>#</th><th>Name</th><th>Score</th><th>Tab warnings</th></tr>${b.map((x,i)=>`<tr class="${x.id===T.cwi?'meRow':''}"><td>${i+1}</td><td>${esc(x.name)}</td><td>${x.score}/${x.total}</td><td>${x.warn}</td></tr>`).join('')}</table>`;
function ans(i,k,b){sel[i]=k;sock.emit('test:answer',{i,o:k});b.parentNode.querySelectorAll('.opt').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')}
function live(){clearInterval(tick);
 if(D&&!L)return H('Live Test Results — '+esc(D.title),board(D.board));
 if(!L)return H('Live Test','<div class="card">No live test right now. You will be notified instantly when your tutor starts one.</div>');
 if(!L.run)return H('Live Test',`<div class="card live"><h3>🔴 ${esc(L.title)}</h3><p>${L.n} questions · ends ${new Date(L.end).toLocaleTimeString()}. Switching tabs is recorded.</p><br><button onclick="sock.emit('test:join')">Join test</button></div>`);
 const r=L.run;H(esc(r.title)+' <span id="tm" class="tm"></span>',r.qs.map((x,i)=>`<div class="card"><b>${i+1}. ${esc(x.q)}</b>${x.o.map((o,k)=>`<button class="opt ${sel[i]===k?'sel':''}" onclick="ans(${i},${k},this)">${esc(o)}</button>`).join('')}</div>`).join('')+'<button id="sb">Submit test</button>');
 $('#sb').onclick=()=>{sock.emit('test:submit');$('#sb').disabled=true;toast('Submitted. Results appear when the test ends.')};
 tick=setInterval(()=>{const s=Math.max(0,Math.round((r.end-Date.now())/1000));if($('#tm'))$('#tm').textContent=`⏱ ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`},500)}
const asg=(x,sb)=>{const s=sb(x.id),g=s&&s.marks!==undefined;return `<div class="card"><b>${esc(x.title)}</b>${esc(x.desc)}<small>Due: ${x.due||'-'}</small>${s?`<p>Submitted ${fd(s.d)} · ${g?`Marks: <b>${esc(s.marks)}</b> ${esc(s.fb||'')}`:'awaiting grading'}</p>`:''}${g?'':`<form class="f" onsubmit="sub(event,'${x.id}')"><input placeholder="Type your answer or paste a Drive link" value="${s?esc(s.text):''}" required><button>${s?'Resubmit':'Submit'}</button></form>`}</div>`};
async function lib(){const j=await api('res'),sb=id=>j.subs.find(x=>x.rid===id);
 const sec=(k,t)=>`<h3 style="margin:16px 0 8px">${t}</h3>`+(j.res.filter(x=>x.kind===k).map(x=>k==='assignment'?asg(x,sb):`<div class="card"><b>${esc(x.title)}</b>${esc(x.desc)}${x.url?`<br><br><a href="${esc(x.url)}" target="_blank" rel="noopener"><button>${k==='note'?'⬇ Download':'▶ Watch'}</button></a>`:''}</div>`).join('')||'<p class="mut">Your tutor has not added any items here yet. Please check back later.</p>');
 H('Library & Assignments',sec('lecture','🎥 Recorded lectures')+sec('note','📝 Notes & downloads')+sec('assignment','📌 Assignments'))}
async function sub(e,rid){e.preventDefault();try{await api('submit',{rid,text:e.target[0].value});toast('Submitted ✅')}catch(x){toast(x.message)}lib()}
const tabs={Dashboard:dash,Announcements:ann,Messages:msgs,'Daily Quiz':quiz,Practice:prac,'Live Test':live,Library:lib,Progress:prog};
function renderNav(){ $('#nav').innerHTML=Object.keys(tabs).map(k=>`<a href="#" data-k="${k}" class="${cur===k?'on':''}">${k}${unread[k]?`<span class="tab-badge" aria-label="${unread[k]} unread notifications">${unread[k]}</span>`:''}</a>`).join('') }
function notifyStudent(tab,message){if(!tabs[tab])tab='Announcements';if(cur!==tab)unread[tab]=(unread[tab]||0)+1;renderNav();toast('🔔 '+message);if(cur===tab)tabs[tab]()}
const go=k=>{if(!tabs[k])return;cur=k;unread[k]=0;renderNav();tabs[k]()};
function start(){view('a');sock=io();sock.on('connect',()=>sock.emit('auth',tok));
 sock.on('notify',n=>{if(n.to==='all'||n.to===T.cwi)notifyStudent(n.tab,n.t)});
 sock.on('test:open',d=>{L=d;D=null;notifyStudent('Live Test','🔴 Live test started: '+d.title)});
 sock.on('test:begin',d=>{L.run=d;sel=[];Object.entries(d.ans||{}).forEach(([i,o])=>sel[i]=o);if(cur==='Live Test')live()});
 sock.on('test:result',d=>{L=null;D=d;notifyStudent('Live Test','Live test finished: '+d.title)});
 renderNav();
 $('#nav').onclick=e=>{const a=e.target.closest('a[data-k]');if(a){e.preventDefault();go(a.dataset.k)}};
 document.onvisibilitychange=()=>{if(document.hidden&&L&&L.run)sock.emit('test:warn')};go('Dashboard')}
tok?start():view('l');
