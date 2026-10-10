/* =============================================
   The Concept Warriors — Admin Console logic
   ============================================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=d=>new Date(d).toLocaleString();
const relTime=d=>{const s=Math.max(0,Math.floor((Date.now()-d)/1000));if(s<60)return'just now';const m=Math.floor(s/60);if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';const dd=Math.floor(h/24);if(dd<7)return dd+'d ago';return new Date(d).toLocaleDateString()};
const timeLeft=ms=>{const s=Math.max(0,Math.round((ms-Date.now())/1000));if(s<=0)return'Expired';const m=Math.floor(s/60);return m>0?`${m}m ${s%60}s left`:`${s}s left`};
const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};

let TOK=sessionStorage.cwAdminTok||'', SOCK=null, DATA=null, VIEW='overview', PRESET_Q='';
let LIVE_STATE={phase:'idle'};

/* ---------------- API ---------------- */
async function rawApi(path,body){
 const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 let j={};try{j=await r.json()}catch(e){}
 if(!r.ok)throw new Error(j.e||'Request failed');
 return j;
}
async function api(path,body,method){
 const r=await fetch('/api/'+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',Authorization:TOK},body:body?JSON.stringify(body):undefined});
 let j={};try{j=await r.json()}catch(e){}
 if(!r.ok){ if(r.status===401) sessionLost(); throw new Error(j.e||'Something went wrong'); }
 return j;
}
async function dl(path,filename){
 const r=await fetch('/api/'+path,{headers:{Authorization:TOK}});
 if(!r.ok){toast('err','Export failed');return}
 const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(u);
}
function sessionLost(){
 if(!TOK)return; TOK=''; sessionStorage.removeItem('cwAdminTok');
 SOCK&&SOCK.disconnect(); $('#app').classList.remove('show'); showLogin();
 toast('warn','Your session expired. Please sign in again.');
}
async function doLogout(){ try{await api('admin/logout',{})}catch(e){} TOK='';sessionStorage.removeItem('cwAdminTok');SOCK&&SOCK.disconnect();location.reload(); }

/* ---------------- Toast ---------------- */
function toast(kind,msg){
 const icons={ok:'fa-circle-check',err:'fa-circle-exclamation',warn:'fa-triangle-exclamation',info:'fa-circle-info'};
 const el=document.createElement('div');el.className='toast '+(kind||'info');
 el.innerHTML=`<i class="fas ${icons[kind]||icons.info}"></i><div>${esc(msg)}</div>`;
 $('#toastHost').append(el);
 setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(16px)';setTimeout(()=>el.remove(),250)},4200);
}

/* ---------------- Modal ---------------- */
function closeModal(){ $('#modalHost').classList.remove('open'); $('#modalBody').innerHTML=''; }
function openModal(html,{wide}={}){
 $('#modalBody').innerHTML=`<div class="modal ${wide?'wide':''}">${html}</div>`;
 $('#modalHost').classList.add('open');
 const first=$('#modalBody').querySelector('input,select,textarea');
 first&&first.focus();
}
$('#modalBackdrop').onclick=closeModal;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
function confirmModal(title,msg,okLabel,danger){
 return new Promise(res=>{
  openModal(`<div class="modal-h"><h3>${esc(title)}</h3><button class="mx">&times;</button></div>
   <div class="modal-b"><p style="color:var(--mut);font-size:.9rem;line-height:1.6">${esc(msg)}</p></div>
   <div class="modal-f"><button class="btn btn-ghost" id="cCancel">Cancel</button><button class="btn ${danger===false?'btn-main':'btn-danger'}" id="cOk">${esc(okLabel||'Delete')}</button></div>`);
  $('.mx').onclick=()=>{closeModal();res(false)};
  $('#cCancel').onclick=()=>{closeModal();res(false)};
  $('#cOk').onclick=()=>{closeModal();res(true)};
 });
}
function formModal({title,fields,okLabel,wide,onSubmit}){
 const row=f=>{
  if(f.type==='select')return`<div><label>${esc(f.label)}</label><select class="inp" name="${f.name}" ${f.req?'required':''}>${f.opts.map(o=>`<option value="${esc(o.v??o)}">${esc(o.t??o)}</option>`).join('')}</select>${f.help?`<div class="help">${esc(f.help)}</div>`:''}</div>`;
  if(f.type==='textarea')return`<div><label>${esc(f.label)}</label><textarea class="inp" name="${f.name}" ${f.req?'required':''} placeholder="${esc(f.ph||'')}">${esc(f.val||'')}</textarea>${f.help?`<div class="help">${esc(f.help)}</div>`:''}</div>`;
  return`<div><label>${esc(f.label)}</label><input class="inp" name="${f.name}" type="${f.inType||'text'}" ${f.req?'required':''} placeholder="${esc(f.ph||'')}" value="${esc(f.val||'')}" ${f.attrs||''}>${f.help?`<div class="help">${esc(f.help)}</div>`:''}</div>`;
 };
 openModal(`<div class="modal-h"><h3>${esc(title)}</h3><button class="mx">&times;</button></div>
  <form id="mForm"><div class="modal-b frm">${fields.map(row).join('')}</div>
  <div class="modal-f"><button type="button" class="btn btn-ghost" id="mCancel">Cancel</button><button class="btn btn-main" id="mSubmit">${esc(okLabel||'Save')}</button></div></form>`,{wide});
 $('.mx').onclick=closeModal; $('#mCancel').onclick=closeModal;
 $('#mForm').onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(e.target),vals={}; fields.forEach(x=>vals[x.name]=f.get(x.name));
  $('#mSubmit').disabled=true;
  try{ await onSubmit(vals); }
  catch(x){ toast('err',x.message); $('#mSubmit').disabled=false; }
 };
}
/* onSubmit is responsible for closing (closeModal) or swapping to a follow-up
   modal (openModal) once it finishes — this avoids a race where an automatic
   close would wipe out a follow-up modal opened from inside onSubmit. */

/* ---------------- Theme / shell chrome ---------------- */
function setTheme(t){ document.documentElement.dataset.theme=t; localStorage.cwAdminTheme=t; $('#themeBtn').innerHTML=`<i class="fas fa-${t==='dark'?'sun':'moon'}"></i>`; }
setTheme(localStorage.cwAdminTheme||'dark');
$('#themeBtn').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('#avBtn').onclick=e=>{e.stopPropagation();$('#avMenu').classList.toggle('open')};
document.addEventListener('click',()=>$('#avMenu').classList.remove('open'));
$('#mSecurity').onclick=()=>{$('#avMenu').classList.remove('open');go('security')};
$('#mLogout').onclick=doLogout;
$('#burger').onclick=()=>{$('#side').classList.add('open');$('#scrim').classList.add('show')};
$('#scrim').onclick=()=>{$('#side').classList.remove('open');$('#scrim').classList.remove('show')};
$('#gsearch').onkeydown=e=>{ if(e.key==='Enter'){ PRESET_Q=e.target.value.trim(); go('students'); } };
function showLogin(){ $('#login').style.display='grid'; $('#app').classList.remove('show'); }
function showApp(){ $('#login').style.display='none'; $('#app').classList.add('show'); }

/* ---------------- Login ---------------- */
$('#lpEye').onclick=()=>{const i=$('#lp'),show=i.type==='password';i.type=show?'text':'password';$('#lpEye').innerHTML=`<i class="fas fa-eye${show?'-slash':''}"></i>`};
$('#lf').onsubmit=async e=>{
 e.preventDefault();
 $('#loginErr').classList.remove('show');
 $('#lBtn').disabled=true; $('#lBtn').textContent='Signing in…';
 try{
  const j=await rawApi('admin/login',{user:$('#lu').value.trim(),password:$('#lp').value});
  TOK=j.t; sessionStorage.cwAdminTok=TOK;
  await boot();
 }catch(x){ $('#loginErr').textContent=x.message; $('#loginErr').classList.add('show'); }
 $('#lBtn').disabled=false; $('#lBtn').textContent='Sign In';
};

/* ---------------- Nav / router ---------------- */
const NAV=[
 {group:'Overview',items:[['overview','fa-gauge-high','Overview']]},
 {group:'Operations',items:[['leads','fa-bullseye','Leads'],['students','fa-user-graduate','Students']]},
 {group:'Learning',items:[['content','fa-book-open','Content'],['bank','fa-circle-question','Question Bank'],['live','fa-satellite-dish','Live Test']]},
 {group:'Communication',items:[['messages','fa-comment-dots','Messages'],['announcements','fa-bullhorn','Announcements']]},
 {group:'System',items:[['security','fa-shield-halved','Security']]},
];
function buildNav(){
 $('#nav').innerHTML=NAV.map(g=>`<div class="side-group"><div class="side-label">${g.group}</div>${g.items.map(([k,ic,label])=>`<a data-k="${k}" id="nav-${k}"><i class="fas ${ic}"></i><span>${label}</span><span class="bubble" id="bub-${k}" style="display:none"></span></a>`).join('')}</div>`).join('');
 $$('#nav a').forEach(a=>a.onclick=()=>go(a.dataset.k));
}
const VIEWS={overview,leads,students,content,bank,live,messages,announcements,security};
async function go(key){
 VIEW=key;
 $$('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.k===key));
 $('#side').classList.remove('open'); $('#scrim').classList.remove('show');
 $('main').innerHTML='<div class="empty"><i class="fas fa-spinner fa-spin"></i><b>Loading…</b></div>';
 try{ await refresh(); await VIEWS[key](); }
 catch(x){ $('main').innerHTML=`<div class="empty"><i class="fas fa-triangle-exclamation"></i><b>Could not load this view</b><span>${esc(x.message)}</span></div>`; }
}
async function refresh(){ DATA=await api('admin/data'); updateBubbles(); return DATA; }
function setBub(key,n){ const el=$('#bub-'+key); if(!el)return; if(n>0){el.textContent=n;el.style.display='inline-block'}else{el.style.display='none'} }
function updateBubbles(){
 if(!DATA)return;
 setBub('leads',DATA.leads.filter(l=>l.status==='new').length);
 setBub('security',DATA.resets.length);
 setBub('content',DATA.subs.filter(s=>s.marks===undefined).length);
}

/* ---------------- Boot ---------------- */
async function boot(){
 try{ await api('admin/session'); } catch(e){ showLogin(); return; }
 showApp(); buildNav(); connectSocket(); await go('overview');
}
if(TOK) boot(); else showLogin();

/* ---------------- Socket.IO (live changes) ---------------- */
function setPill(ok,bad){ const p=$('#livePill'),t=$('#livePillTxt'); p.classList.toggle('on',!!ok); p.classList.toggle('bad',!!bad); t.textContent=ok?'Live':(bad?'Offline':'Reconnecting'); }
let silentTimer=null;
function silentRefresh(){
 clearTimeout(silentTimer);
 silentTimer=setTimeout(async()=>{ try{ await refresh(); if(['leads','students','content','messages','security'].includes(VIEW)) VIEWS[VIEW](); }catch(e){} },700);
}
function connectSocket(){
 SOCK=io();
 SOCK.on('connect',()=>{ SOCK.emit('auth',TOK); setPill(true); });
 SOCK.on('disconnect',()=>setPill(false));
 SOCK.on('connect_error',()=>setPill(false,true));
 SOCK.on('admin:event',e=>{
  if(!DATA)return;
  DATA.log.unshift(e);
  if(VIEW==='overview'){ const led=$('#ledger'); if(led) led.innerHTML=renderLedger(DATA.log); }
  if(['lead','reset','submission','message'].includes(e.type)){ toast('info',e.msg); silentRefresh(); }
 });
 SOCK.on('test:open',d=>{ LIVE_STATE={phase:'running',title:d.title,end:d.end,n:d.n,roster:[]}; if(VIEW==='live')renderLiveView(); toast('info','Live test started: '+d.title); });
 SOCK.on('test:live',roster=>{ if(LIVE_STATE.phase==='running'){ LIVE_STATE.roster=roster; if(VIEW==='live')renderLiveView(); } });
 SOCK.on('test:result',d=>{ LIVE_STATE={phase:'ended',title:d.title,board:d.board}; if(VIEW==='live')renderLiveView(); toast('ok','Live test ended'); });
}

/* ================= VIEW: Overview ================= */
function overview(){
 const newLeads=DATA.leads.filter(l=>l.status==='new').length;
 const pending=DATA.subs.filter(s=>s.marks===undefined).length;
 $('main').innerHTML=`
 <div class="vh"><div><h2>Overview</h2><p>What's happening across The Concept Warriors right now.</p></div></div>
 <div class="kpis">
  <div class="kpi" style="--accent:var(--primary)" onclick="go('students')"><div class="k-top"><span>Students</span><i class="fas fa-user-graduate"></i></div><b class="num">${DATA.students.length}</b><span>Enrolled total</span></div>
  <div class="kpi" style="--accent:var(--amber)" onclick="go('leads')"><div class="k-top"><span>New leads</span><i class="fas fa-bullseye"></i></div><b class="num">${newLeads}</b><span>Awaiting first contact</span></div>
  <div class="kpi" style="--accent:var(--primary2)" onclick="go('content')"><div class="k-top"><span>To grade</span><i class="fas fa-file-pen"></i></div><b class="num">${pending}</b><span>Assignment submissions</span></div>
  <div class="kpi" style="--accent:var(--rose)" onclick="go('security')"><div class="k-top"><span>Reset requests</span><i class="fas fa-key"></i></div><b class="num">${DATA.resets.length}</b><span>Open password resets</span></div>
 </div>
 <div class="grid2">
  <div class="panel"><h3>Activity</h3><div class="ph-sub">Live feed across the whole console</div><div class="ledger" id="ledger">${renderLedger(DATA.log)}</div></div>
  <div class="panel"><h3>Quick actions</h3><div class="ph-sub">Jump straight to a task</div>
   <div style="display:flex;flex-direction:column;gap:9px">
    <button class="btn btn-ghost" style="justify-content:flex-start" onclick="go('students')"><i class="fas fa-user-plus"></i>&nbsp; Enroll a student</button>
    <button class="btn btn-ghost" style="justify-content:flex-start" onclick="go('announcements')"><i class="fas fa-bullhorn"></i>&nbsp; Publish an announcement</button>
    <button class="btn btn-ghost" style="justify-content:flex-start" onclick="go('live')"><i class="fas fa-satellite-dish"></i>&nbsp; Start a live test</button>
    <button class="btn btn-ghost" style="justify-content:flex-start" onclick="go('leads')"><i class="fas fa-bullseye"></i>&nbsp; Review new leads</button>
   </div>
  </div>
 </div>`;
}
function renderLedger(log){
 if(!log.length)return`<div class="empty"><i class="fas fa-inbox"></i><b>No activity yet</b><span>New leads, messages and enrollments will appear here instantly.</span></div>`;
 return log.slice(0,40).map(e=>`<div class="ledger-row"><span class="ldot ${e.type}"></span><div class="ltext">${esc(e.msg)}</div><div class="ltime">${relTime(e.d)}</div></div>`).join('');
}

/* ================= VIEW: Leads ================= */
let LEAD_FILTER='all',LEAD_STATUS='all',LEAD_Q='';
function leadInfo(l){
 const d=l.data, name=d.Name||'Unnamed lead';
 const phone=d.Phone?`<a class="lk" href="tel:${esc(String(d.Phone).replace(/[^\d+]/g,''))}"><i class="fas fa-phone"></i>${esc(d.Phone)}</a>`:'';
 const email=d.Email?(/^[^\s@<>"']+@[^\s@<>"']+$/.test(d.Email)?`<a class="lk" href="mailto:${esc(d.Email)}"><i class="fas fa-envelope"></i>${esc(d.Email)}</a>`:`<span class="lk">${esc(d.Email)}</span>`):'';
 const rest=Object.entries(d).filter(([k])=>!['Name','Phone','Email'].includes(k)).map(([k,v])=>`<span class="tag"><b>${esc(k)}:</b> ${esc(v)}</span>`).join('');
 return `<div class="lead-info"><b>${esc(name)}</b><div class="lead-contact">${phone}${email}</div>${rest?`<div class="tags">${rest}</div>`:''}</div>`;
}
function leads(){
 const list=DATA.leads.filter(l=>(LEAD_FILTER==='all'||l.type===LEAD_FILTER)&&(LEAD_STATUS==='all'||l.status===LEAD_STATUS)&&(!LEAD_Q||JSON.stringify(l.data).toLowerCase().includes(LEAD_Q.toLowerCase())));
 const counts={callback:0,demo:0,enroll:0}; DATA.leads.forEach(l=>counts[l.type]++);
 $('main').innerHTML=`
 <div class="vh"><div><h2>Leads</h2><p>Callback, demo-class and enrollment requests from the website.</p></div>
  <div class="vh-actions"><button class="btn btn-ghost" id="expLeads"><i class="fas fa-download"></i> Export CSV</button></div></div>
 <div class="chips" id="typeChips">
  <button class="chip ${LEAD_FILTER==='all'?'on':''}" data-f="all">All <span class="n">${DATA.leads.length}</span></button>
  <button class="chip ${LEAD_FILTER==='callback'?'on':''}" data-f="callback">Callback <span class="n">${counts.callback}</span></button>
  <button class="chip ${LEAD_FILTER==='demo'?'on':''}" data-f="demo">Demo class <span class="n">${counts.demo}</span></button>
  <button class="chip ${LEAD_FILTER==='enroll'?'on':''}" data-f="enroll">Enroll <span class="n">${counts.enroll}</span></button>
 </div>
 <div class="panel">
  <div class="filters">
   <input class="inp" id="leadQ" placeholder="Search name, phone, email…" value="${esc(LEAD_Q)}">
   <select class="inp" id="leadStatusF">
    <option value="all">All statuses</option><option value="new" ${LEAD_STATUS==='new'?'selected':''}>New</option>
    <option value="contacted" ${LEAD_STATUS==='contacted'?'selected':''}>Contacted</option><option value="converted" ${LEAD_STATUS==='converted'?'selected':''}>Converted</option>
   </select>
  </div>
  ${list.length?`<div class="tblwrap"><table><thead><tr><th>Type</th><th>Details</th><th>Status</th><th>Received</th><th></th></tr></thead><tbody>
  ${list.map(l=>`<tr>
   <td data-label="Type"><span class="badge ${l.type}">${l.type}</span></td>
   <td data-label="Details">${leadInfo(l)}</td>
   <td data-label="Status"><select class="statsel" onchange="setLeadStatus('${l.id}',this.value)">
    <option value="new" ${l.status==='new'?'selected':''}>New</option><option value="contacted" ${l.status==='contacted'?'selected':''}>Contacted</option><option value="converted" ${l.status==='converted'?'selected':''}>Converted</option>
   </select></td>
   <td data-label="Received">${relTime(l.d)}</td>
   <td data-label=""><div class="rowbtns"><button class="iconbtn danger" title="Delete" onclick="delLead('${l.id}')"><i class="fas fa-trash"></i></button></div></td>
  </tr>`).join('')}
  </tbody></table></div>`:`<div class="empty"><i class="fas fa-inbox"></i><b>No leads match</b><span>Try a different filter or search.</span></div>`}
 </div>`;
 $$('#typeChips .chip').forEach(c=>c.onclick=()=>{LEAD_FILTER=c.dataset.f;leads()});
 $('#leadStatusF').onchange=e=>{LEAD_STATUS=e.target.value;leads()};
 $('#leadQ').oninput=debounce(e=>{LEAD_Q=e.target.value;leads()},250);
 $('#expLeads').onclick=()=>dl('admin/export/leads','leads.csv');
}
async function setLeadStatus(id,status){ try{ await api('admin/lead',{id,status}); const l=DATA.leads.find(x=>x.id===id); if(l)l.status=status; toast('ok','Status updated'); }catch(x){toast('err',x.message);leads();} }
async function delLead(id){ if(!(await confirmModal('Delete lead','This will permanently remove this lead from your records.')))return;
 try{ await api('admin/leaddel',{id}); DATA.leads=DATA.leads.filter(l=>l.id!==id); toast('ok','Lead deleted'); leads(); }catch(x){toast('err',x.message)} }

/* ================= VIEW: Students ================= */
let STU_Q='';
function students(){
 if(PRESET_Q){STU_Q=PRESET_Q;PRESET_Q='';}
 const q=STU_Q.toLowerCase();
 const list=DATA.students.filter(s=>!q||s.id.toLowerCase().includes(q)||s.name.toLowerCase().includes(q)||(s.course||'').toLowerCase().includes(q));
 $('main').innerHTML=`
 <div class="vh"><div><h2>Students</h2><p>${DATA.students.length} enrolled · manage access and credentials.</p></div>
  <div class="vh-actions"><button class="btn btn-ghost" id="expStu"><i class="fas fa-download"></i> Export CSV</button><button class="btn btn-main" id="addStu"><i class="fas fa-user-plus"></i> Enroll student</button></div></div>
 <div class="panel">
  <input class="inp" id="stuQ" placeholder="Search by name, ID or course…" style="margin-bottom:16px" value="${esc(STU_Q)}">
  ${list.length?`<div class="tblwrap"><table><thead><tr><th>ID</th><th>Name</th><th>Course</th><th>Joined</th><th>Last login</th><th>Status</th><th></th></tr></thead><tbody>
  ${list.map(s=>`<tr>
   <td data-label="ID" class="mono">${esc(s.id)}</td>
   <td data-label="Name">${esc(s.name)}</td>
   <td data-label="Course">${esc(s.course||'—')}</td>
   <td data-label="Joined">${new Date(s.joined).toLocaleDateString()}</td>
   <td data-label="Last login">${s.last?relTime(s.last):'Never'}</td>
   <td data-label="Status"><span class="badge ${s.disabled?'off':'on'}">${s.disabled?'Disabled':'Active'}</span></td>
   <td data-label=""><div class="rowbtns">
    <button class="iconbtn" title="${s.disabled?'Enable':'Disable'} access" onclick="toggleStu('${s.id}',${!s.disabled})"><i class="fas fa-${s.disabled?'lock-open':'lock'}"></i></button>
    <button class="iconbtn danger" title="Delete" onclick="delStu('${s.id}')"><i class="fas fa-trash"></i></button>
   </div></td>
  </tr>`).join('')}
  </tbody></table></div>`:`<div class="empty"><i class="fas fa-user-graduate"></i><b>No students found</b><span>Try a different search, or enroll a new student.</span></div>`}
 </div>`;
 $('#stuQ').oninput=debounce(e=>{STU_Q=e.target.value;students()},250);
 $('#addStu').onclick=openEnrollModal;
 $('#expStu').onclick=()=>dl('admin/export/students','students.csv');
}
function openEnrollModal(){
 formModal({title:'Enroll a new student',okLabel:'Create login',fields:[
  {name:'name',label:'Full name',req:true,ph:'e.g. Ananya Verma'},
  {name:'course',label:'Course / Program',type:'select',opts:['NEET','JEE','CUET','School Boards','Foundation','Crash Course','Personal Mentorship','General']}
 ],onSubmit:async v=>{
  if(!v.name||!v.name.trim())throw new Error('Name is required');
  const r=await api('admin/enroll',{name:v.name,course:v.course});
  await refresh(); students();
  openModal(`<div class="modal-h"><h3>Student enrolled</h3><button class="mx">&times;</button></div>
   <div class="modal-b"><p style="color:var(--mut);font-size:.86rem;margin-bottom:14px">Share these credentials with ${esc(v.name)} now — the password is shown only once.</p>
    <div class="cred-box"><div><span>Student ID</span><b>${esc(r.id)}</b></div><button class="btn btn-sm btn-ghost" onclick="navigator.clipboard.writeText('${r.id}');toast('ok','ID copied')">Copy</button></div>
    <div class="cred-box"><div><span>Password</span><b>${esc(r.password)}</b></div><button class="btn btn-sm btn-ghost" onclick="navigator.clipboard.writeText('${r.password}');toast('ok','Password copied')">Copy</button></div>
   </div><div class="modal-f"><button class="btn btn-main" id="credDone">Done</button></div>`);
  $('.mx').onclick=closeModal; $('#credDone').onclick=closeModal;
 }});
}
async function toggleStu(id,disabled){ try{ await api('admin/sdisable',{id,disabled}); await refresh(); students(); toast('ok',disabled?'Access disabled':'Access re-enabled'); }catch(x){toast('err',x.message)} }
async function delStu(id){ if(!(await confirmModal('Delete student','This removes the student and their results permanently. This cannot be undone.')))return;
 try{ await api('admin/sdel',{id}); await refresh(); students(); toast('ok','Student deleted'); }catch(x){toast('err',x.message)} }

/* ================= VIEW: Content ================= */
let CONTENT_TAB='lecture';
function content(){
 const tabs=[['lecture','Lectures'],['note','Notes'],['assignment','Assignments'],['subs','Submissions']];
 const items=CONTENT_TAB==='subs'?[]:DATA.res.filter(r=>r.kind===CONTENT_TAB);
 $('main').innerHTML=`
 <div class="vh"><div><h2>Content Library</h2><p>Lectures, notes and assignments visible to every student.</p></div>
  ${CONTENT_TAB!=='subs'?`<div class="vh-actions"><button class="btn btn-main" id="addRes"><i class="fas fa-plus"></i> Add ${CONTENT_TAB}</button></div>`:''}</div>
 <div class="subtabs">${tabs.map(([k,l])=>`<button class="${CONTENT_TAB===k?'on':''}" data-k="${k}">${l}${k==='subs'?pendingBadge():''}</button>`).join('')}</div>
 <div id="contentBody"></div>`;
 $$('.subtabs button').forEach(b=>b.onclick=()=>{CONTENT_TAB=b.dataset.k;content()});
 if(CONTENT_TAB==='subs')renderSubs(); else renderResList(items);
 if($('#addRes'))$('#addRes').onclick=()=>openResModal(CONTENT_TAB);
}
function pendingBadge(){ const n=DATA.subs.filter(s=>s.marks===undefined).length; return n?` <span class="badge new">${n}</span>`:''; }
function renderResList(items){
 $('#contentBody').innerHTML=items.length?`<div class="grid3">${items.map(x=>`
  <div class="panel" style="margin-bottom:0"><h3>${esc(x.title)}</h3>
   <p style="color:var(--mut);font-size:.84rem;margin:6px 0 10px">${esc(x.desc||'No description')}</p>
   ${x.due?`<p style="font-size:.78rem;color:var(--amber);margin-bottom:8px"><i class="fas fa-clock"></i> Due ${esc(x.due)}</p>`:''}
   <div style="display:flex;gap:8px">${x.url?`<a class="btn btn-ghost btn-sm" href="${esc(x.url)}" target="_blank" rel="noopener">Open link</a>`:''}
    <button class="btn btn-danger btn-sm" onclick="delRes('${x.id}')"><i class="fas fa-trash"></i></button></div>
  </div>`).join('')}</div>`:`<div class="empty"><i class="fas fa-folder-open"></i><b>Nothing here yet</b><span>Add your first item using the button above.</span></div>`;
}
function openResModal(kind){
 const labels={lecture:'Recorded lecture',note:'Note / download',assignment:'Assignment'};
 formModal({title:'Add '+labels[kind].toLowerCase(),okLabel:'Add',fields:[
  {name:'title',label:'Title',req:true,ph:'e.g. Kinematics — Part 2'},
  ...(kind!=='assignment'?[{name:'url',label:'Link (YouTube / Drive)',ph:'https://…',req:true}]:[{name:'url',label:'Reference link (optional)',ph:'https://…'}]),
  {name:'desc',label:'Description / instructions',type:'textarea',ph:'What should students do with this?'},
  ...(kind==='assignment'?[{name:'due',label:'Due date',inType:'date'}]:[])
 ],onSubmit:async v=>{ if(!v.title||!v.title.trim())throw new Error('Title is required'); await api('admin/res',{kind,...v}); closeModal(); await refresh(); content(); toast('ok','Added — students notified'); }});
}
async function delRes(id){ if(!(await confirmModal('Remove item','Students will no longer see this.')))return;
 try{ await api('admin/resdel',{id}); await refresh(); content(); toast('ok','Removed'); }catch(x){toast('err',x.message)} }
function renderSubs(){
 const subs=[...DATA.subs].sort((a,b)=>(a.marks===undefined?-1:1)-(b.marks===undefined?-1:1));
 $('#contentBody').innerHTML=subs.length?subs.map(s=>`
  <div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
    <div><b>${esc(s.id)}</b> <span style="color:var(--mut)">— ${esc(s.title)}</span><div style="font-size:.78rem;color:var(--mut2)">${relTime(s.d)}</div></div>
    ${s.marks!==undefined?`<span class="badge converted">Graded: ${esc(s.marks)}</span>`:`<span class="badge new">Awaiting grade</span>`}
   </div>
   <p style="margin:10px 0;font-size:.86rem;background:var(--panel2);padding:10px 12px;border-radius:9px">${esc(s.text)}</p>
   <form class="gradeform" onsubmit="return gradeSub(event,'${s.rid}','${s.id}')">
    <input class="inp" name="marks" placeholder="Marks" value="${esc(s.marks??'')}" required>
    <input class="inp" name="fb" placeholder="Feedback (optional)" value="${esc(s.fb||'')}">
    <button class="btn btn-main">Save</button>
   </form></div>`).join(''):`<div class="empty"><i class="fas fa-file-circle-check"></i><b>No submissions yet</b><span>Graded and pending assignments will appear here.</span></div>`;
}
async function gradeSub(e,rid,id){
 e.preventDefault(); const f=new FormData(e.target);
 try{ await api('admin/grade',{rid,id,marks:f.get('marks'),fb:f.get('fb')}); await refresh(); content(); toast('ok','Graded — student notified'); }catch(x){toast('err',x.message)}
 return false;
}

/* ================= VIEW: Question Bank ================= */
let BANK_SUBJ='all',BANK_Q='';
function bank(){
 const list=DATA.bank.map((q,i)=>({...q,i})).filter(x=>(BANK_SUBJ==='all'||x.s===BANK_SUBJ)&&(!BANK_Q||x.q.toLowerCase().includes(BANK_Q.toLowerCase())));
 const counts={Physics:0,Chemistry:0,Maths:0}; DATA.bank.forEach(x=>counts[x.s]=(counts[x.s]||0)+1);
 $('main').innerHTML=`
 <div class="vh"><div><h2>Question Bank</h2><p>${DATA.bank.length} questions power the daily quiz, practice and live tests.</p></div>
  <div class="vh-actions"><button class="btn btn-main" id="addQ"><i class="fas fa-plus"></i> Add question</button></div></div>
 <div class="chips">
  <button class="chip ${BANK_SUBJ==='all'?'on':''}" data-s="all">All <span class="n">${DATA.bank.length}</span></button>
  <button class="chip ${BANK_SUBJ==='Physics'?'on':''}" data-s="Physics">Physics <span class="n">${counts.Physics||0}</span></button>
  <button class="chip ${BANK_SUBJ==='Chemistry'?'on':''}" data-s="Chemistry">Chemistry <span class="n">${counts.Chemistry||0}</span></button>
  <button class="chip ${BANK_SUBJ==='Maths'?'on':''}" data-s="Maths">Maths <span class="n">${counts.Maths||0}</span></button>
 </div>
 <div class="panel"><input class="inp" id="bankQ" placeholder="Search questions…" style="margin-bottom:14px" value="${esc(BANK_Q)}">
  ${list.length?list.map(x=>`
   <div style="display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--line)">
    <div><span class="badge callback" style="margin-bottom:6px;display:inline-block">${esc(x.s)}</span><div style="font-size:.88rem">${esc(x.q)}</div>
     <div style="font-size:.78rem;color:var(--mut);margin-top:4px">${x.o.map((o,k)=>k===x.a?`<b style="color:var(--green)">${esc(o)}</b>`:esc(o)).join(' · ')}</div></div>
    <button class="iconbtn danger" title="Delete" onclick="delQ(${x.i})"><i class="fas fa-trash"></i></button>
   </div>`).join(''):`<div class="empty"><i class="fas fa-circle-question"></i><b>No questions match</b></div>`}
 </div>`;
 $$('.chips .chip').forEach(c=>c.onclick=()=>{BANK_SUBJ=c.dataset.s;bank()});
 $('#bankQ').oninput=debounce(e=>{BANK_Q=e.target.value;bank()},250);
 $('#addQ').onclick=openQModal;
}
function openQModal(){
 formModal({title:'Add a question',okLabel:'Add question',wide:true,fields:[
  {name:'q',label:'Question',req:true,ph:'e.g. SI unit of power?'},
  {name:'o1',label:'Option 1',req:true},{name:'o2',label:'Option 2',req:true},
  {name:'o3',label:'Option 3',req:true},{name:'o4',label:'Option 4',req:true},
  {name:'a',label:'Correct option',type:'select',opts:[{v:0,t:'Option 1'},{v:1,t:'Option 2'},{v:2,t:'Option 3'},{v:3,t:'Option 4'}]},
  {name:'s',label:'Subject',type:'select',opts:['Physics','Chemistry','Maths']}
 ],onSubmit:async v=>{
  if(![v.q,v.o1,v.o2,v.o3,v.o4].every(x=>x&&x.trim()))throw new Error('Question and all 4 options are required');
  await api('admin/q',{q:v.q,o:[v.o1,v.o2,v.o3,v.o4],a:+v.a,s:v.s}); closeModal(); await refresh(); bank(); toast('ok','Question added');
 }});
}
async function delQ(i){ if(!(await confirmModal('Delete question','This removes it from quizzes, practice and future live tests.')))return;
 try{ await api('admin/qdel',{i}); await refresh(); bank(); toast('ok','Deleted'); }catch(x){toast('err',x.message)} }

/* ================= VIEW: Live Test ================= */
function live(){ renderLiveView(); }
let liveTickHandle=null;
function renderLiveView(){
 if(LIVE_STATE.phase==='idle'){
  $('main').innerHTML=`
  <div class="vh"><div><h2>Live Test</h2><p>Start a timed, proctored test — every enrolled student is notified instantly.</p></div></div>
  <div class="panel" style="max-width:480px">
   <h3>Start a new live test</h3><div class="ph-sub">Questions are drawn randomly from your question bank (${DATA.bank.length} available).</div>
   <form class="frm" id="liveForm">
    <div><label>Test title</label><input class="inp" name="title" value="Weekly Live Test" required></div>
    <div class="frow">
     <div><label>Duration (minutes)</label><input class="inp" name="dur" type="number" min="1" max="120" value="5" required></div>
     <div><label>Number of questions</label><input class="inp" name="n" type="number" min="1" max="${Math.min(20,DATA.bank.length)}" value="${Math.min(5,DATA.bank.length)}" required></div>
    </div>
    <button class="btn btn-main" style="margin-top:4px"><i class="fas fa-satellite-dish"></i> Start live test</button>
   </form>
  </div>`;
  $('#liveForm').onsubmit=e=>{ e.preventDefault(); const f=new FormData(e.target);
   SOCK.emit('admin:start',{title:f.get('title'),dur:f.get('dur'),n:f.get('n')}); toast('info','Starting live test…'); };
  return;
 }
 if(LIVE_STATE.phase==='running'){
  const roster=LIVE_STATE.roster;
  $('main').innerHTML=`
  <div class="vh"><div><h2>Live Test</h2><p>Monitoring in real time.</p></div>
   <div class="vh-actions"><button class="btn btn-danger" id="endTest"><i class="fas fa-stop"></i> End test now</button></div></div>
  <div class="live-banner"><span class="lb-dot"></span><b>${esc(LIVE_STATE.title)}</b><span style="color:var(--mut);font-size:.85rem">${LIVE_STATE.n} questions</span><span class="timer num" id="liveTimer">--:--</span></div>
  <div class="panel"><h3>Live roster</h3><div class="ph-sub">${roster.length} student(s) joined</div>
   ${roster.length?`<div class="tblwrap"><table><thead><tr><th>Student</th><th>Progress</th><th>Tab warnings</th><th>Submitted</th></tr></thead><tbody>
    ${roster.map(p=>`<tr><td data-label="Student"><div class="cv">${esc(p.name)} <span class="mono" style="color:var(--mut);font-size:.76rem">${esc(p.id)}</span></div></td>
     <td data-label="Progress"><div class="cv"><div class="progwrap" style="display:inline-block;vertical-align:middle"><i style="width:${Math.round(p.answered/LIVE_STATE.n*100)}%"></i></div> <span style="font-size:.76rem;color:var(--mut)">${p.answered}/${LIVE_STATE.n}</span></div></td>
     <td data-label="Warnings">${p.warn>0?`<span class="badge off">${p.warn}</span>`:'—'}</td>
     <td data-label="Submitted">${p.sub?'<i class="fas fa-circle-check" style="color:var(--green)"></i>':'…'}</td></tr>`).join('')}
   </tbody></table></div>`:`<div class="empty"><i class="fas fa-user-clock"></i><b>Waiting for students to join…</b></div>`}
  </div>`;
  $('#endTest').onclick=async()=>{ if(await confirmModal('End test now','Scoring will be finalised for everyone currently taking the test.','End test')) SOCK.emit('admin:end'); };
  clearInterval(liveTickHandle);
  const upd=()=>{ const el=$('#liveTimer'); if(!el)return clearInterval(liveTickHandle);
   const s=Math.max(0,Math.round((LIVE_STATE.end-Date.now())/1000)); el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
  upd(); liveTickHandle=setInterval(upd,500);
  return;
 }
 if(LIVE_STATE.phase==='ended'){
  const board=LIVE_STATE.board, top3=board.slice(0,3);
  $('main').innerHTML=`
  <div class="vh"><div><h2>Live Test</h2><p>Results for "${esc(LIVE_STATE.title)}"</p></div>
   <div class="vh-actions"><button class="btn btn-main" id="newTest"><i class="fas fa-rotate"></i> Start another test</button></div></div>
  ${top3.length?`<div class="panel"><div class="podium">
   ${[top3[1],top3[0],top3[2]].filter(Boolean).map(p=>{const rank=p===top3[0]?1:p===top3[1]?2:3;return`<div class="pod-col g${rank}"><div class="pav">${esc((p.name||'?')[0])}</div><div class="pod-bar"></div><b>${esc(p.name)}</b><span>${p.score}/${p.total}</span></div>`}).join('')}
  </div></div>`:''}
  <div class="panel"><h3>Full leaderboard</h3>
   ${board.length?`<div class="tblwrap"><table><thead><tr><th>#</th><th>Student</th><th>Score</th><th>Warnings</th></tr></thead><tbody>
    ${board.map((p,i)=>`<tr><td data-label="#">${i+1}</td><td data-label="Student">${esc(p.name)}</td><td data-label="Score" class="num">${p.score}/${p.total}</td><td data-label="Warnings">${p.warn||0}</td></tr>`).join('')}
   </tbody></table></div>`:`<div class="empty"><i class="fas fa-ghost"></i><b>No one took part this time</b></div>`}
  </div>`;
  $('#newTest').onclick=()=>{ LIVE_STATE={phase:'idle'}; live(); };
 }
}

/* ================= VIEW: Messages ================= */
let MSG_TO=null;
function messages(){
 const feed=DATA.msgs;
 $('main').innerHTML=`
 <div class="vh"><div><h2>Messages</h2><p>Direct message any student, or broadcast to everyone.</p></div></div>
 <div class="grid2">
  <div class="panel"><h3>Compose</h3>
   <form class="frm" id="msgForm">
    <div><label>To</label><select class="inp" name="to" id="msgTo"><option value="all">Everyone</option>${DATA.students.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.id)})</option>`).join('')}</select></div>
    <div><label>Message</label><textarea class="inp" name="b" required placeholder="Type your message…"></textarea></div>
    <button class="btn btn-main"><i class="fas fa-paper-plane"></i> Send</button>
   </form>
  </div>
  <div class="panel"><h3>Recent messages</h3><div class="ph-sub">Both directions, most recent first</div>
   <div class="feed">${feed.length?feed.map(m=>`<div class="fmsg ${m.from==='tutor'?'out':''}">
     <small>${m.from==='tutor'?('You → '+(m.to==='all'?'Everyone':esc(m.to))):esc(m.from)} · ${relTime(m.d)}</small>${esc(m.b)}
     ${m.from!=='tutor'?`<br><button class="btn btn-ghost btn-sm" onclick="replyTo('${m.from}')">Reply</button>`:''}
    </div>`).join(''):`<div class="empty"><i class="fas fa-comment-dots"></i><b>No messages yet</b></div>`}</div>
  </div>
 </div>`;
 $('#msgForm').onsubmit=async e=>{ e.preventDefault(); const f=new FormData(e.target);
  try{ await api('admin/msg',{to:f.get('to'),b:f.get('b')}); await refresh(); messages(); toast('ok','Message sent'); }catch(x){toast('err',x.message)} };
 if(MSG_TO){ $('#msgTo').value=MSG_TO; MSG_TO=null; }
}
function replyTo(id){ MSG_TO=id; messages(); const el=document.querySelector('#msgForm textarea'); el&&el.focus(); }

/* ================= VIEW: Announcements ================= */
function announcements(){
 $('main').innerHTML=`
 <div class="vh"><div><h2>Announcements</h2><p>Published instantly to every student's dashboard.</p></div></div>
 <div class="grid2">
  <div class="panel"><h3>New announcement</h3>
   <form class="frm" id="annForm">
    <div><label>Title</label><input class="inp" name="t" required placeholder="e.g. Diwali break schedule"></div>
    <div><label>Details</label><textarea class="inp" name="b" required placeholder="What should students know?"></textarea></div>
    <button class="btn btn-main"><i class="fas fa-bullhorn"></i> Publish</button>
   </form>
  </div>
  <div class="panel"><h3>Published</h3>
   ${DATA.ann.length?DATA.ann.map(a=>`<div style="padding:12px 0;border-top:1px solid var(--line)">
    <div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(a.t)}</b><button class="iconbtn danger" onclick="delAnn('${a.id}')"><i class="fas fa-trash"></i></button></div>
    <p style="font-size:.85rem;color:var(--mut);margin:4px 0">${esc(a.b)}</p><span style="font-size:.74rem;color:var(--mut2)">${relTime(a.d)}</span>
   </div>`).join(''):`<div class="empty"><i class="fas fa-bullhorn"></i><b>Nothing published yet</b></div>`}
  </div>
 </div>`;
 $('#annForm').onsubmit=async e=>{ e.preventDefault(); const f=new FormData(e.target);
  try{ await api('admin/announce',{t:f.get('t'),b:f.get('b')}); await refresh(); announcements(); toast('ok','Published to all students'); }catch(x){toast('err',x.message)} };
}
async function delAnn(id){ if(!(await confirmModal('Delete announcement','Students will no longer see this on their dashboard.')))return;
 try{ await api('admin/anndel',{id}); await refresh(); announcements(); toast('ok','Deleted'); }catch(x){toast('err',x.message)} }

/* ================= VIEW: Security ================= */
async function security(){
 const s=await api('admin/session');
 $('main').innerHTML=`
 <div class="vh"><div><h2>Security</h2><p>Session status, password and pending password-reset requests.</p></div></div>
 <div class="grid2">
  <div class="panel"><h3>This session</h3>
   <div style="display:flex;flex-direction:column;gap:10px;font-size:.87rem">
    <div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Signed in</span><b>${fd(s.created)}</b></div>
    <div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Expires</span><b>${fd(s.exp)}</b></div>
    <div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Auth method</span><b>Bearer token (not a cookie)</b></div>
   </div>
   <p class="help" style="margin-top:12px">Tokens are sent in an Authorization header, never as a cookie, so this console is not exposed to cross-site request forgery. Idle sessions expire automatically after 2 hours, and sign-ins are rate-limited against guessing.</p>
   <button class="btn btn-danger" style="margin-top:14px" onclick="doLogout()"><i class="fas fa-right-from-bracket"></i> End this session</button>
  </div>
  <div class="panel"><h3>Change password</h3>
   <form class="frm" id="pwForm">
    <div><label>Current password</label><input class="inp" name="current" type="password" required></div>
    <div><label>New password</label><input class="inp" name="next" type="password" required minlength="8"></div>
    <div class="help">At least 8 characters, with letters and numbers.</div>
    <button class="btn btn-main"><i class="fas fa-key"></i> Update password</button>
   </form>
  </div>
 </div>
 <div class="panel"><h3>Pending password-reset requests</h3><div class="ph-sub">Share the code with the student through a trusted channel (call or WhatsApp) — never email.</div>
  ${DATA.resets.length?`<div class="tblwrap"><table><thead><tr><th>Student</th><th>Code</th><th>Requested</th><th>Expires</th><th></th></tr></thead><tbody>
   ${DATA.resets.map(x=>`<tr><td data-label="Student"><div class="cv">${esc(x.name)} <span class="mono" style="color:var(--mut)">${esc(x.id)}</span></div></td>
    <td data-label="Code" class="mono" style="font-size:1rem;letter-spacing:.05em">${esc(x.code)}</td>
    <td data-label="Requested">${relTime(x.exp-900000)}</td><td data-label="Expires">${timeLeft(x.exp)}</td>
    <td data-label=""><button class="iconbtn danger" title="Dismiss" onclick="dismissReset('${x.id}')"><i class="fas fa-xmark"></i></button></td></tr>`).join('')}
  </tbody></table></div>`:`<div class="empty"><i class="fas fa-key"></i><b>No pending requests</b></div>`}
 </div>`;
 $('#pwForm').onsubmit=async e=>{ e.preventDefault(); const f=new FormData(e.target);
  try{ await api('admin/password',{current:f.get('current'),next:f.get('next')}); toast('ok','Password updated'); e.target.reset(); }catch(x){toast('err',x.message)} };
}
async function dismissReset(id){ try{ await api('admin/resetdone',{id}); await refresh(); security(); toast('ok','Dismissed'); }catch(x){toast('err',x.message)} }
