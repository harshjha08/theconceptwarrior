const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],T=localStorage;
let tok=T.cw||'',sock,L=null,D=null,cur='Dashboard',tick,unread={},audioContext=null,warningCount=0;
const subjectiveTimers=new Map();
const api=async(p,b)=>{
 const r=await fetch('/api/'+p,{method:b?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:tok||''},body:b?JSON.stringify(b):undefined});
 let j;try{j=await r.json()}catch(error){throw Error('The server returned an unreadable response. Please try again.')}
 if(!r.ok){if(r.status===401&&tok)out();throw Error(j.e||'The request could not be completed.')}
 return j;
};
const toast=m=>{const e=document.createElement('div');e.className='toast';e.setAttribute('role','status');e.textContent=m;document.body.append(e);setTimeout(()=>e.remove(),4000)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fd=d=>new Date(d).toLocaleString();
const H=(t,b)=>$('#main').innerHTML=`<h2>${t}</h2>${b}`;
const view=v=>{$('#login').hidden=v!=='l';$('#app').hidden=v!=='a';if(v==='a')$('#main').focus({preventScroll:true})};
function authMessage(message,isError=true){
 const el=$('#loginErr');el.textContent=message;el.classList.toggle('show',!!message);el.classList.toggle('success',!isError&&!!message);
}
const out=()=>{
 if(sock)sock.disconnect();
 T.removeItem('cw');T.removeItem('cwi');tok='';L=null;D=null;clearInterval(tick);
 location.reload();
};
$('#out').onclick=out;
$('#pwEye').onclick=()=>{const input=$('#pw'),visible=input.type==='password';input.type=visible?'text':'password';$('#pwEye').innerHTML=`<i class="fas fa-eye${visible?'-slash':''}"></i>`;$('#pwEye').setAttribute('aria-label',visible?'Hide password':'Show password')};
$('#fgl').onclick=()=>{
 const form=$('#fg'),opening=form.hidden;form.hidden=!opening;
 $('#fgl').setAttribute('aria-expanded',String(opening));
 $('#resetMessage').textContent='';if(opening)$('#fid').focus();
};
$('#gc').onclick=async()=>{
 const button=$('#gc');button.disabled=true;$('#resetMessage').textContent='';
 try{await api('forgot',{id:$('#fid').value.trim()});$('#resetMessage').textContent='If that student ID exists, a reset code is waiting with your tutor.'}
 catch(error){$('#resetMessage').textContent=error.message}
 finally{button.disabled=false}
};
$('#fg').onsubmit=async e=>{
 e.preventDefault();const submit=e.submitter;submit.disabled=true;$('#resetMessage').textContent='';
 try{await api('reset',{id:$('#fid').value.trim(),code:$('#fc').value.trim(),password:$('#fp').value});$('#resetMessage').textContent='Password updated. You can now sign in.';$('#fg').reset()}
 catch(error){$('#resetMessage').textContent=error.message}
 finally{submit.disabled=false}
};
$('#lf').onsubmit=async e=>{
 e.preventDefault();const button=$('#loginSubmit');button.disabled=true;authMessage('');
 prepareNotificationAudio();
 try{const j=await api('login',{id:$('#id').value.trim(),password:$('#pw').value});tok=T.cw=j.t;T.cwi=j.id;start()}
 catch(error){authMessage(error.message);$('#pw').focus()}
 finally{button.disabled=false}
};

function playNotificationSound(){
 if(T.cwLmsSound==='off')return;
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
 audioContext=audioContext||new Audio();
 if(audioContext.state==='suspended')audioContext.resume();
 const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
 oscillator.type='sine';oscillator.frequency.value=680;gain.gain.setValueAtTime(.0001,audioContext.currentTime);
 gain.gain.exponentialRampToValueAtTime(.07,audioContext.currentTime+.03);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.2);
 oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+.21);
}
function prepareNotificationAudio(){
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
 audioContext=audioContext||new Audio();
 if(audioContext.state==='suspended')audioContext.resume();
}
function updateSoundButton(){
 const muted=T.cwLmsSound==='off',button=$('#soundBtn');
 button.innerHTML=`<i class="fas fa-volume-${muted?'xmark':'high'}"></i>`;
 button.setAttribute('aria-label',muted?'Enable notification sounds':'Mute notification sounds');
 button.setAttribute('aria-pressed',String(!muted));
 button.title=muted?'Enable notification sounds':'Mute notification sounds';
}
updateSoundButton();
$('#soundBtn').onclick=()=>{
 T.cwLmsSound=T.cwLmsSound==='off'?'on':'off';updateSoundButton();
 if(T.cwLmsSound==='on')playNotificationSound();
};

function board(items,highlightId){
 if(!items?.length)return'<p class="mut">No scores yet. The leaderboard will update as answers come in.</p>';
 return`<ol class="rank-list">${items.map((x,i)=>`<li class="${x.id===highlightId?'meRow':''}"><span class="rank-number">${i+1}</span><span class="rank-name">${esc(x.name)}${x.id===highlightId?' · You':''}${x.pending?` <small>· written answers pending</small>`:''}</span><span class="rank-score">${x.score}/${x.total}</span></li>`).join('')}</ol>`;
}

async function dash(){
 const j=await api('home'),n=j.results.length,avg=n?Math.round(j.results.reduce((sum,x)=>sum+x.score/Math.max(1,x.total),0)/n*100):0;
 const latest=j.ann[0];
 H(`Welcome, ${esc(j.name)} <span aria-hidden="true">👋</span>`,
  `<p>Your next big result starts with one focused session.</p>
   <div class="grid"><div class="card"><b>${j.results.filter(x=>x.type==='quiz').length}</b>Quizzes taken</div><div class="card"><b>${n}</b>Assessments completed</div><div class="card"><b>${avg}%</b>Average score</div></div>
   ${L&&!L.done?`<div class="card live"><div class="question-meta"><span class="badge">LIVE TEST</span>${L.showRanks?'<span>Live rankings enabled</span>':''}</div><b>${esc(L.title)}</b><p>${L.run?'Your answers are saved as you go.':'Your tutor has opened the test.'}</p><button onclick="go('Live Test')">${L.run?'Continue test':'Open live test'}</button></div>`:''}
   <div class="card"><div class="question-meta"><b>Latest announcement</b><span>${latest?fd(latest.d):''}</span></div>${latest?`<b>${esc(latest.t)}</b><p>${esc(latest.b)}</p>`:'<p>Your tutor has not posted an announcement yet. Stay tuned.</p>'}</div>`);
}
async function ann(){
 const j=await api('home');
 H('Announcements',`<p>Updates and important information from your tutor.</p>${j.ann.map(a=>`<div class="card"><div class="question-meta"><span class="badge">UPDATE</span><small>${fd(a.d)}</small></div><b>${esc(a.t)}</b><p>${esc(a.b)}</p></div>`).join('')||'<div class="card mut">No announcements yet.</div>'}`);
}
async function msgs(){
 const messages=await api('msgs');
 H('Messages',`<p>Ask a question or send a message directly to your tutor.</p>
   <div class="card"><div class="chat">${messages.map(x=>`<div class="m ${x.from===T.cwi?'me':''}"><small>${x.from===T.cwi?'You':'Tutor'}${x.to==='all'?' · to everyone':''} · ${fd(x.d)}</small>${esc(x.b)}</div>`).join('')||'<p class="mut">No messages yet. Start a conversation whenever you need help.</p>'}</div></div>
   <form id="mf" class="row"><input id="mb" maxlength="500" aria-label="Message your tutor" placeholder="Write a message…" required><button><i class="fas fa-paper-plane"></i> Send</button></form>`);
 $('#mf').onsubmit=async e=>{e.preventDefault();const input=$('#mb');try{await api('msgs',{b:input.value});await msgs()}catch(error){toast(error.message)}};
 const chat=$('.chat');chat.scrollTop=chat.scrollHeight;
}
async function quiz(){
 const j=await api('quiz');
 if(j.done)return H('Daily Quiz',`<p>A quick practice session, every day.</p><div class="card"><span class="badge badge-ok">COMPLETED TODAY</span><p>Score</p><span class="score-highlight">${j.done.score}/${j.done.total}</span><p>Your next daily quiz will be ready tomorrow.</p></div>`);
 H('Daily Quiz',`<p>Take your time and choose the best answer.</p>
  <form id="qf">${j.qs.map((x,i)=>`<fieldset class="card"><legend><b>${i+1}. ${esc(x.q)}</b></legend>${x.o.map((o,k)=>`<label><input type="radio" name="q${i}" value="${k}"> ${esc(o)}</label>`).join('')}</fieldset>`).join('')}
  <button><i class="fas fa-check"></i> Submit answers</button></form>`);
 $('#qf').onsubmit=async e=>{
  e.preventDefault();const answers=j.qs.map((_,i)=>{const choice=document.querySelector(`input[name="q${i}"]:checked`);return choice?Number(choice.value):-1});
  try{const result=await api('quiz',{a:answers});toast(`Quiz complete — ${result.res.score}/${result.res.total}`);await quiz()}
  catch(error){toast(error.message);await quiz()}
 };
}
let practiceSubject='';
async function prac(subject=practiceSubject){
 practiceSubject=subject;const questions=await api('practice'+(subject?'?s='+encodeURIComponent(subject):''));
 const subjects=['',...new Set(questions.map(x=>x.s))].sort((a,b)=>!a?-1:!b?1:a.localeCompare(b));
 H('Practice',`<p>Choose a subject and practise one question at a time.</p>
  <div class="row">${subjects.map(x=>`<button type="button" class="chip ${x===subject?'on':''}" data-subject="${esc(x)}">${esc(x||'All subjects')}</button>`).join('')}</div>
  ${questions.map((x,i)=>`<article class="card practice-question" data-question="${i}"><div class="question-meta"><span class="badge">${esc(x.s)}</span><span>${x.type==='subjective'?'Written answer':`${Number(x.points)||1} point(s)`}</span></div><b>${i+1}. ${esc(x.q)}</b>
   ${x.type==='subjective'?`<textarea class="answer-area practice-answer" placeholder="Use this space to work through your answer…"></textarea><p class="mut">Try the question before checking your notes. Written practice is not submitted or graded.</p>`:x.o.map((choice,k)=>`<button type="button" class="opt" data-answer="${k}">${esc(choice)}</button>`).join('')}
  </article>`).join('')||'<div class="card mut">No questions found for this subject yet.</div>'}`);
 $$('#main [data-subject]').forEach(button=>button.onclick=()=>prac(button.dataset.subject));
 $$('#main .practice-question').forEach(card=>card.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
  const correct=questions[Number(card.dataset.question)].a;
  card.querySelectorAll('[data-answer]').forEach(option=>{option.disabled=true;const index=Number(option.dataset.answer);if(index===correct)option.classList.add('ok');else if(option===button)option.classList.add('bad')});
 }));
}
async function prog(){
 const j=await api('home');
 H('Your progress',`<p>Every attempt is part of your learning journey.</p>
  ${j.results.length?`<div class="card table-scroll"><table><thead><tr><th>Date</th><th>Assessment</th><th>Score</th><th>Status</th></tr></thead><tbody>${j.results.slice().reverse().map(x=>`<tr><td>${fd(x.d)}</td><td>${esc(x.title)}</td><td>${x.score}/${x.total}</td><td>${x.pending?'<span class="badge badge-pending">Written answers under review</span>':'<span class="badge badge-ok">Graded</span>'}${x.feedback?`<div class="mut">${esc(x.feedback)}</div>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<div class="card mut">Your quiz and test results will appear here.</div>'}`);
}
function ans(i,k,button){
 if(!L?.run||L.run.sub)return;
 L.run.ans[i]=k;sock.emit('test:answer',{i,o:k});
 button.parentNode.querySelectorAll('.opt').forEach(option=>{option.classList.toggle('sel',option===button)});
 const label=$('#answeredCount');if(label)label.textContent=`${Object.values(L.run.ans).filter(x=>x!==undefined&&x!==null&&x!=='').length} of ${L.run.qs.length} answered`;
}
function saveSubjectiveAnswer(textarea){
 const i=Number(textarea.dataset.q);clearTimeout(subjectiveTimers.get(i));subjectiveTimers.delete(i);
 if(L?.run)sock.emit('test:answer',{i,o:textarea.value});
}
function updateRankPanel(){
 const panel=$('#liveLeaderboard');if(panel)panel.innerHTML=board(L.ranks||[],T.cwi);
}
function live(){
 clearInterval(tick);
 if(D&&!L)return H(`Test results · ${esc(D.title)}`,`<p>Your tutor has finished the live test.</p><div class="card"><div class="question-meta"><b>Final leaderboard</b><span class="badge badge-ok">${D.board.length} participants</span></div>${board(D.board,T.cwi)}</div>`);
 if(!L)return H('Live Test','<p>Your tutor’s timed assessments will appear here.</p><div class="card"><div class="question-meta"><span class="badge">STAY READY</span><i class="fas fa-bell" style="color:var(--cyan)"></i></div><b>No live test right now</b><p>You will receive an in-app notification when your tutor starts the next test.</p></div>');
 if(!L.run){
  H('Live Test',`<p>Review the details before joining your tutor's test.</p><div class="card live"><div class="question-meta"><span class="badge">LIVE TEST</span>${L.showRanks?'<span class="badge badge-ok">Live rankings on</span>':''}</div><h3>${esc(L.title)}</h3><p>${L.n} questions · Ends ${new Date(L.end).toLocaleTimeString()}</p><p>Tab switches${L.tabLimit?` are limited to ${L.tabLimit}`:' are recorded'}.</p><button id="joinTest"><i class="fas fa-arrow-right-to-bracket"></i> Join test</button></div>`);
  $('#joinTest').onclick=()=>sock.emit('test:join');return;
 }
 const run=L.run,questions=run.qs;
 const answered=Object.values(run.ans).filter(x=>x!==undefined&&x!==null&&x!=='').length;
 const rankPanel=L.showRanks?`<div class="card" id="liveLeaderboardPanel"><div class="question-meta"><b>Live leaderboard</b><span class="badge badge-ok">LIVE</span></div><div id="liveLeaderboard">${board(L.ranks||[],T.cwi)}</div></div>`:'';
 H(esc(run.title),`<div class="card"><div class="question-meta"><span id="answeredCount">${answered} of ${questions.length} answered</span><span class="tm" id="tm"></span></div><div class="progress-track"><i style="width:${Math.round(answered/questions.length*100)}%"></i></div>
   ${L.run.sub?`<p class="badge badge-ok" style="margin-top:13px">${L.run.autoSubmitted?'Automatically submitted after reaching the tab-switch limit.':'Your test has been submitted.'} Your answers are saved. Wait for the final results.</p>`:`<p class="mut">Your answers are saved as you go. You can submit before the timer ends.</p>`}</div>
   ${questions.map((x,i)=>`<article class="card exam-question" data-question="${i}"><div class="question-meta"><span>QUESTION ${String(i+1).padStart(2,'0')} · ${esc(x.type==='subjective'?'WRITTEN ANSWER':'MULTIPLE CHOICE')}</span><span>${Number(x.points)||1} mark(s)</span></div><b>${esc(x.q)}</b>
    ${x.type==='subjective'?`<textarea class="answer-area subjective-answer" data-q="${i}" maxlength="5000" placeholder="Write your answer here…"${run.sub?' readonly':''}>${esc(run.ans[i]||'')}</textarea><div class="help-text mut">Up to 5,000 characters. Your tutor will review written answers after the test.</div>`:x.o.map((choice,k)=>`<button type="button" class="opt ${run.ans[i]===k?'sel':''}" data-q="${i}" data-a="${k}"${run.sub?' disabled':''}>${esc(choice)}</button>`).join('')}
   </article>`).join('')}
   ${!run.sub?`<button id="sb"><i class="fas fa-paper-plane"></i> Submit test</button>`:`<div class="card muted"><p>Keep this page open to see the final results when your tutor ends the test.</p></div>`}
   ${rankPanel}`);
 $$('#main .exam-question .opt').forEach(button=>button.onclick=()=>ans(Number(button.dataset.q),Number(button.dataset.a),button));
 $$('#main .subjective-answer').forEach(textarea=>textarea.oninput=()=>{
  const i=Number(textarea.dataset.q);run.ans[i]=textarea.value;
  const label=$('#answeredCount');if(label)label.textContent=`${Object.values(run.ans).filter(x=>x!==undefined&&x!==null&&x!=='').length} of ${questions.length} answered`;
  clearTimeout(subjectiveTimers.get(i));subjectiveTimers.set(i,setTimeout(()=>saveSubjectiveAnswer(textarea),350));
 });
 $$('#main .subjective-answer').forEach(textarea=>textarea.onblur=()=>saveSubjectiveAnswer(textarea));
 if(!run.sub)$('#sb').onclick=()=>{
  if(!confirm('Submit your test now? You will not be able to change your answers afterwards.'))return;
  sock.emit('test:submit');toast('Your test has been submitted.');
 };
 const updateTimer=()=>{
  const el=$('#tm');if(!el)return clearInterval(tick);
  const seconds=Math.max(0,Math.round((run.end-Date.now())/1000));
  el.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  if(seconds===0&&!run.sub){run.sub=true;sock.emit('test:submit');toast('Time is up. Your answers have been submitted.');live()}
 };
 updateTimer();tick=setInterval(updateTimer,1000);
}
const asg=(x,sb)=>{
 const submission=sb(x.id),graded=submission&&submission.marks!==undefined;
 return`<div class="card"><div class="question-meta"><span class="badge">ASSIGNMENT</span><span>Due: ${esc(x.due||'—')}</span></div><b>${esc(x.title)}</b><p>${esc(x.desc)}</p>
 ${submission?`<p>Submitted ${fd(submission.d)} · ${graded?`Marks: <b>${esc(submission.marks)}</b> ${esc(submission.fb||'')}`:'Awaiting grading'}</p>`:''}
 ${graded?'':`<form class="f" data-rid="${esc(x.id)}"><textarea class="answer-area" maxlength="2000" placeholder="Write your answer or share a link…" required>${submission?esc(submission.text):''}</textarea><button>${submission?'Resubmit assignment':'Submit assignment'}</button></form>`}</div>`;
};
async function lib(){
 const j=await api('res'),submission=id=>j.subs.find(x=>x.rid===id);
 const section=(kind,title,icon)=>`<h3 style="margin:20px 0 10px"><i class="fas ${icon}" style="color:var(--pink)"></i> ${title}</h3>${j.res.filter(x=>x.kind===kind).map(x=>kind==='assignment'?asg(x,submission):`<div class="card"><b>${esc(x.title)}</b><p>${esc(x.desc)}</p>${x.url?`<a class="resource-link" href="${esc(x.url)}" target="_blank" rel="noopener">${kind==='note'?'Download resource':'Watch lecture'} <i class="fas fa-arrow-up-right-from-square"></i></a>`:''}</div>`).join('')||'<div class="card mut">Your tutor has not added anything here yet. Please check back later.</div>'}`;
 H('Learning library',`<p>Lessons, notes and assignments selected for you.</p>${section('lecture','Recorded lectures','fa-circle-play')}${section('note','Notes & downloads','fa-book-open')}${section('assignment','Assignments','fa-pen-to-square')}`);
 $$('#main form[data-rid]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const text=form.querySelector('textarea').value;try{await api('submit',{rid:form.dataset.rid,text});toast('Assignment submitted.');await lib()}catch(error){toast(error.message)}});
}
const tabs={Dashboard:{icon:'fa-house',load:dash},Announcements:{icon:'fa-bullhorn',load:ann},Messages:{icon:'fa-comment-dots',load:msgs},'Daily Quiz':{icon:'fa-circle-question',load:quiz},Practice:{icon:'fa-dumbbell',load:prac},'Live Test':{icon:'fa-satellite-dish',load:live},Library:{icon:'fa-book-open',load:lib},Progress:{icon:'fa-chart-line',load:prog}};
function renderNav(){
 $('#nav').innerHTML=Object.entries(tabs).map(([name,item])=>`<a href="#" data-k="${esc(name)}" class="${cur===name?'on':''}" ${cur===name?'aria-current="page"':''}><i class="fas ${item.icon}" aria-hidden="true"></i><span>${esc(name)}</span>${unread[name]?`<span class="tab-badge" aria-label="${unread[name]} unread notifications">${unread[name]}</span>`:''}</a>`).join('');
}
function notifyStudent(tab,message){
 if(!tabs[tab])tab='Announcements';
 if(cur!==tab)unread[tab]=(unread[tab]||0)+1;
 renderNav();playNotificationSound();toast(message);
 if(cur===tab)Promise.resolve().then(()=>tabs[tab].load()).catch(error=>toast(error.message));
}
const go=k=>{
 if(!tabs[k])return;cur=k;unread[k]=0;renderNav();
 Promise.resolve(tabs[k].load()).catch(error=>toast(error.message));
};
function start(){
 view('a');sock=io();sock.on('connect',()=>sock.emit('auth',tok));
 sock.on('notify',n=>{if(n.to==='all'||n.to===T.cwi)notifyStudent(n.tab,n.t)});
 sock.on('test:open',d=>{L={...d,ranks:L?.ranks||[],run:L?.run||null};D=null;notifyStudent('Live Test',`Your tutor has started "${d.title}".`)});
 sock.on('test:begin',d=>{
  warningCount=0;L=L||{title:d.title};L.run={...d,ans:{...(d.ans||{})},sub:false};
  if(cur==='Live Test')live();
 });
 sock.on('test:warning',d=>{warningCount=d.warn;toast(d.limit?`Tab switch ${d.warn} of ${d.limit}. The test will submit when the limit is reached.`:`Tab switch ${d.warn} recorded.`)});
 sock.on('test:auto-submit',d=>{if(L?.run){L.run.sub=true;L.run.autoSubmitted=true;live()}playNotificationSound();toast(`Your test was automatically submitted after ${d.warn} tab switches.`)});
 sock.on('test:submitted',()=>{if(L?.run){L.run.sub=true;live()}});
 sock.on('test:rank',ranks=>{if(L){L.showRanks=true;L.ranks=ranks;if(cur==='Live Test'&&L.run)updateRankPanel()}});
 sock.on('test:rank-control',d=>{if(L){L.showRanks=d.enabled;if(!d.enabled)L.ranks=[];if(cur==='Live Test'&&L.run)live();toast(d.enabled?'Your tutor enabled the live leaderboard.':'Your tutor hid the live leaderboard.')}});
 sock.on('test:graded',result=>{
  if(D?.board){const row=D.board.find(x=>x.id===result.id);if(row){row.score=result.score;row.pending=0;D.board.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));if(cur==='Live Test')live()}}
 });
 sock.on('test:result',d=>{L=null;D=d;notifyStudent('Live Test',`Live test "${d.title}" has ended. See the results.`)});
 sock.on('test:error',d=>toast(d.e||'The live test could not start.'));
 renderNav();$('#nav').onclick=e=>{const a=e.target.closest('a[data-k]');if(a){e.preventDefault();go(a.dataset.k)}};
 document.onvisibilitychange=()=>{
  if(document.hidden&&L?.run&&!L.run.sub){$$('#main .subjective-answer').forEach(saveSubjectiveAnswer);sock.emit('test:warn')}
 };
 go('Dashboard');
}
if(tok)start();else view('l');
