/* The Concept Warriors — LMS + Admin Console server
   Express + Socket.IO with local JSON storage or PostgreSQL. */
const express=require('express'),http=require('http'),path=require('path'),crypto=require('crypto'),{Server}=require('socket.io');
const app=express(),srv=http.createServer(app),io=new Server(srv);
const StateStore=require('./storage');
const SITE_ROOT=path.resolve(__dirname,'..');
const F=process.env.CW_DATA_FILE||path.join(__dirname,'db.json');
if(process.env.NODE_ENV==='production'&&!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL to a persistent PostgreSQL database in production.');
const store=new StateStore({file:F,connectionString:process.env.DATABASE_URL});
let db;
const save=()=>store.save(db);
const emitAfterSave=(event,payload)=>store.flush().then(()=>io.emit(event,payload)).catch(error=>console.error('Could not publish persisted LMS update:',error));

app.disable('x-powered-by');
app.use(express.json({limit:'150kb'}));
app.use((q,r,n)=>{
 const sendJson=r.json.bind(r);
 r.json=body=>{
  store.flush().then(()=>sendJson(body)).catch(error=>{
   console.error('Request failed because LMS data could not be persisted:',error);
   r.status(503);sendJson({e:'The database is temporarily unavailable. Your change was not confirmed; please retry.'});
  });
  return r;
 };
 n();
});
app.use((q,r,n)=>{r.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});n()});
app.use((q,r,n)=>{r.set('X-Robots-Tag','noindex, nofollow');n()});
app.use('/lms/admin.html',(q,r,n)=>{r.set('X-Robots-Tag','noindex, nofollow');n()});
app.get('/api/health',(_q,r)=>r.json({ok:true}));
app.use('/api/lead',(q,r,n)=>{
 const origin=q.get('Origin');
 if(origin===process.env.FRONTEND_ORIGIN){
  r.set('Access-Control-Allow-Origin',origin);
  r.set('Access-Control-Allow-Methods','POST, OPTIONS');
  r.set('Access-Control-Allow-Headers','Content-Type');
  r.vary('Origin');
 }
 if(q.method==='OPTIONS')return r.sendStatus(origin===process.env.FRONTEND_ORIGIN?204:403);
 n();
});
app.get('/pages/lms-login.html',(_q,r)=>r.redirect(302,'/lms/'));
app.get('/pages/lms-dashboard.html',(_q,r)=>r.redirect(302,'/lms/'));
app.get(['/pages/admin-login.html','/pages/admin.html'],(_q,r)=>r.redirect(302,'/lms/admin.html'));
app.use(['/backend','/ConceptWarriors_Project'],(_q,r)=>r.sendStatus(404));
app.use('/lms',express.static(path.join(__dirname,'lms')));
app.use(express.static(SITE_ROOT,{dotfiles:'deny'}));

const rnd=n=>crypto.randomBytes(n).toString('hex');
const hash=(p,s)=>crypto.scryptSync(String(p),s,32).toString('hex');
const checkHash=(pw,salt,hex)=>{const a=Buffer.from(hash(pw,salt),'hex'),b=Buffer.from(hex,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const mk=(id,name,course,pw,details={})=>{const salt=rnd(8);return{id,name,course,salt,hash:hash(pw,salt),joined:Date.now(),disabled:false,...details}};
const feeBalance=s=>Math.max(0,Math.round((Number(s.fees?.total||0)-Number(s.fees?.paid||0)+Number.EPSILON)*100)/100);

// ---- question bank seed (admins can add more from the Question Bank screen) ----
const BANK0=[
{q:'SI unit of force?',o:['Joule','Newton','Watt','Pascal'],a:1,s:'Physics'},
{q:'Atomic number of Carbon?',o:['6','8','12','14'],a:0,s:'Chemistry'},
{q:'d/dx of sin x = ?',o:['cos x','-cos x','-sin x','tan x'],a:0,s:'Maths'},
{q:'Speed of light in vacuum (m/s)?',o:['3×10⁶','3×10⁸','3×10¹⁰','3×10⁴'],a:1,s:'Physics'},
{q:'pH of pure water at 25°C?',o:['5','6','7','8'],a:2,s:'Chemistry'},
{q:'∫2x dx = ?',o:['x','x²+C','2x²','x²'],a:1,s:'Maths'},
{q:'SI unit of resistance?',o:['Ohm','Volt','Ampere','Farad'],a:0,s:'Physics'},
{q:'Which is a noble gas?',o:['O₂','N₂','Ne','H₂'],a:2,s:'Chemistry'}];

const defaultDB={
 students:process.env.NODE_ENV==='production'?[]:[mk('CW2601','Demo Student','NEET','demo1234')],
 ann:[{id:rnd(4),t:'Welcome to The Concept Warriors LMS',b:'Attempt the daily quiz and practice sets. Live tests are announced here.',d:Date.now()}],
 msgs:[],resets:[],results:[],leads:[],bank:BANK0,res:[],subs:[],log:[]};

async function start(){
 db=await store.load()||defaultDB;
 // ---- one-time migrations so older db.json files keep working ----
 db.bank=db.bank||BANK0;db.res=db.res||[];db.subs=db.subs||[];db.leads=db.leads||[];db.log=db.log||[];
 db.ann=(db.ann||[]).map(a=>a.id?a:{...a,id:rnd(4)});
 db.leads=(db.leads||[]).map(l=>l.id?l:{...l,id:rnd(4),status:l.status||'new'});
 db.students=(db.students||[]).map(s=>({...s,disabled:!!s.disabled,phone:s.phone||'',email:s.email||'',guardian:s.guardian||'',className:s.className||'',fees:s.fees||{total:0,paid:0,payments:[]}}));
 db.bank=db.bank.map(x=>({...x,id:x.id||rnd(8),type:x.type||'mcq',points:Number(x.points)||1,s:x.s||'Physics'}));
 db.results=(db.results||[]).map(x=>x.type==='test'&&!x.rid?{...x,rid:rnd(8),objectiveScore:x.score,pending:0,responses:[],subjectiveGraded:true}:x);
 if(!db.admin){
  const initialPassword=process.env.ADMIN_PASSWORD||(process.env.NODE_ENV==='production'?null:'admin123');
  if(!initialPassword)throw new Error('Set ADMIN_PASSWORD before the first production start.');
  if(process.env.NODE_ENV==='production'&&initialPassword.length<12)throw new Error('ADMIN_PASSWORD must be at least 12 characters in production.');
  const salt=rnd(8);db.admin={salt,hash:hash(initialPassword,salt)};
  console.log(process.env.ADMIN_PASSWORD?'Initial admin password loaded from ADMIN_PASSWORD.':'First run: default admin created -> user "admin", password "admin123". Change it immediately.');
 }
 await save();
 await store.flush();
 listen();
}
const today=()=>new Date().toISOString().slice(0,10);

function log(type,msg){const e={id:rnd(4),type,msg,d:Date.now()};db.log.push(e);if(db.log.length>200)db.log=db.log.slice(-200);save();io.to('adm').emit('admin:event',e);return e}

// ---- sessions (in-memory, sliding expiry) ----
const sess={},TTL_ADMIN=2*60*60e3,TTL_STUDENT=12*60*60e3;
function liveSess(t){if(!t)return null;const s=sess[t];if(!s)return null;if(s.exp<Date.now()){delete sess[t];return null}s.exp=Date.now()+(s.admin?TTL_ADMIN:TTL_STUDENT);return s}
const auth=(q,r,n)=>{
 const s=liveSess(q.headers.authorization);if(!s||s.admin)return r.status(401).json({e:'Please login again'});
 const student=db.students.find(x=>x.id===s.id);
 if(!student||student.disabled||feeBalance(student)>0)return r.status(403).json({e:'LMS access is unavailable. Please contact your tutor about your account or outstanding fees.'});
 q.u=s;n();
};
const adm=(q,r,n)=>{const s=liveSess(q.headers.authorization);if(!s||!s.admin)return r.status(401).json({e:'Please login again'});q.u=s;n()};

// ---- brute-force protection (per key sliding window + lockout) ----
const attempts=new Map();
const checkLock=k=>{const e=attempts.get(k);return e&&e.lock>Date.now()?Math.ceil((e.lock-Date.now())/60000):0};
const recordFail=(k,max,lockMin)=>{const now=Date.now();let e=attempts.get(k);if(!e||now-e.start>10*60e3)e={start:now,count:0,lock:0};e.count++;if(e.count>=max)e.lock=now+lockMin*60e3;attempts.set(k,e)};
const recordOk=k=>attempts.delete(k);

// ========================= STUDENT AUTH =========================
app.post('/api/login',(q,r)=>{
 const key='stu:'+q.ip,wait=checkLock(key);if(wait)return r.status(429).json({e:`Too many attempts. Try again in ${wait} min.`});
 const{id,password}=q.body||{},s=db.students.find(x=>x.id===id);
 if(!s||!checkHash(password||'',s.salt,s.hash)){recordFail(key,8,15);return r.status(401).json({e:'Invalid ID or password'})}
 if(s.disabled)return r.status(403).json({e:'This account has been disabled. Please contact your tutor.'});
 if(feeBalance(s)>0)return r.status(403).json({e:'Your account is awaiting fee payment. Please contact your tutor to restore LMS access.'});
 recordOk(key);s.last=Date.now();save();
 const t=rnd(16);sess[t]={id,exp:Date.now()+TTL_STUDENT};r.json({t,id,name:s.name,exp:sess[t].exp})});
app.post('/api/logout',(q,r)=>{delete sess[q.headers.authorization];r.json({ok:1})});
app.post('/api/forgot',(q,r)=>{const s=db.students.find(x=>x.id===q.body.id);
 if(s){const code=String(100000+crypto.randomInt(900000));db.resets=db.resets.filter(x=>x.id!==s.id);db.resets.push({id:s.id,name:s.name,code,exp:Date.now()+9e5});save();log('reset',`Password reset requested for ${s.id} (${s.name})`)}
 r.json({ok:1})});
app.post('/api/reset',(q,r)=>{const{id,code,password}=q.body,x=db.resets.find(y=>y.id===id&&y.code===code&&y.exp>Date.now()),s=db.students.find(y=>y.id===id);
 if(!x||!s||!password||password.length<6)return r.status(400).json({e:'Invalid/expired code or password too short'});
 s.salt=rnd(8);s.hash=hash(password,s.salt);db.resets=db.resets.filter(y=>y!==x);save();r.json({ok:1})});

// ========================= STUDENT DATA =========================
app.get('/api/home',auth,(q,r)=>r.json({ann:db.ann.slice(-20).reverse(),results:db.results.filter(x=>x.id===q.u.id),name:db.students.find(x=>x.id===q.u.id).name}));
app.get('/api/msgs',auth,(q,r)=>r.json(db.msgs.filter(m=>m.to==='all'||m.to===q.u.id||m.from===q.u.id).slice(-50)));
app.post('/api/msgs',auth,(q,r)=>{if(!q.body.b)return r.status(400).json({e:'Empty message'});db.msgs.push({from:q.u.id,to:'tutor',b:String(q.body.b).slice(0,500),d:Date.now()});save();log('message',`${q.u.id} sent a message`);r.json({ok:1})});
const dq=()=>{const eligible=db.bank.map((x,i)=>x.type==='subjective'?null:i).filter(i=>i!==null),n=eligible.length,d=Math.floor(Date.now()/864e5);return Array.from({length:Math.min(5,n)},(_,i)=>eligible[(d*5+i)%n])};
const did=u=>db.results.find(x=>x.id===u&&x.type==='quiz'&&x.day===today());
app.get('/api/quiz',auth,(q,r)=>{const done=did(q.u.id);r.json(done?{done}:{qs:dq().map(i=>({q:db.bank[i].q,o:db.bank[i].o}))})});
app.post('/api/quiz',auth,(q,r)=>{if(did(q.u.id))return r.status(400).json({e:'Already attempted today'});
 const a=q.body.a||[],idx=dq(),res={id:q.u.id,type:'quiz',title:'Daily Quiz',score:idx.filter((k,i)=>a[i]===db.bank[k].a).length,total:idx.length,day:today(),d:Date.now()};
 db.results.push(res);save();r.json({res})});
app.get('/api/practice',auth,(q,r)=>r.json(db.bank.filter(x=>!q.query.s||x.s===q.query.s).sort(()=>Math.random()-.5)));
app.get('/api/res',auth,(q,r)=>r.json({res:db.res.slice().reverse(),subs:db.subs.filter(x=>x.id===q.u.id)}));
app.post('/api/submit',auth,(q,r)=>{const a=db.res.find(x=>x.id===q.body.rid&&x.kind==='assignment');if(!a||!q.body.text)return r.status(400).json({e:'Write your answer first'});
 const old=db.subs.find(x=>x.rid===a.id&&x.id===q.u.id);if(old&&old.marks!==undefined)return r.status(400).json({e:'Already graded'});
 db.subs=db.subs.filter(x=>x!==old);db.subs.push({rid:a.id,id:q.u.id,title:a.title,text:String(q.body.text).slice(0,2000),d:Date.now()});save();log('submission',`${q.u.id} submitted "${a.title}"`);r.json({ok:1})});

// ========================= WEBSITE LEADS (public) =========================
app.post('/api/lead',(q,r)=>{
 const key='lead:'+q.ip,wait=checkLock(key);if(wait)return r.status(429).json({e:'Too many submissions. Please try again later.'});
 const{type,data}=q.body||{};if(!['callback','demo','enroll'].includes(type)||!data||typeof data!=='object'){recordFail(key,20,10);return r.status(400).json({e:'Invalid form'})}
 const c={};for(const k in data)c[String(k).slice(0,30)]=String(data[k]).slice(0,120);
 const lead={id:rnd(4),type,status:'new',data:c,d:Date.now()};db.leads.push(lead);save();
 log('lead',`New ${type} request from ${c.Name||'a visitor'}`);r.json({ok:1})});

// ========================= ADMIN AUTH =========================
app.post('/api/admin/login',(q,r)=>{
 const key='adm:'+q.ip,wait=checkLock(key);if(wait)return r.status(429).json({e:`Too many attempts. Try again in ${wait} min.`});
 const{user,password}=q.body||{};
 if(user!=='admin'||!password||!checkHash(password,db.admin.salt,db.admin.hash)){recordFail(key,6,15);return r.status(401).json({e:'Invalid admin credentials'})}
 recordOk(key);const t=rnd(16),now=Date.now();sess[t]={admin:1,created:now,exp:now+TTL_ADMIN};
 log('login',`Admin logged in from ${q.ip}`);r.json({t,exp:sess[t].exp})});
app.post('/api/admin/logout',(q,r)=>{delete sess[q.headers.authorization];r.json({ok:1})});
app.get('/api/admin/session',adm,(q,r)=>r.json({created:q.u.created,exp:q.u.exp}));
app.post('/api/admin/password',adm,(q,r)=>{const{current,next}=q.body||{};
 if(!checkHash(current||'',db.admin.salt,db.admin.hash))return r.status(403).json({e:'Current password is incorrect'}); // 403, not 401: the admin IS signed in, and 401 would make the console treat it as an expired session
 if(!next||next.length<8||!/[0-9]/.test(next)||!/[A-Za-z]/.test(next))return r.status(400).json({e:'New password needs 8+ characters, including letters and numbers'});
 const salt=rnd(8);db.admin={salt,hash:hash(next,salt)};save();log('security','Admin password was changed');r.json({ok:1})});

// ========================= ADMIN DATA =========================
app.get('/api/admin/data',adm,(q,r)=>r.json({
 students:db.students.map(({salt,hash,...s})=>({...s,feeBalance:feeBalance(s)})),
 resets:db.resets, leads:db.leads.slice().reverse(), res:db.res, bank:db.bank, subs:db.subs,
 tests:db.results.filter(x=>x.type==='test').slice().reverse(),
 ann:db.ann.slice().reverse(), msgs:db.msgs.slice(-150).reverse(), log:db.log.slice().reverse()
}));

// ---- students ----
app.post('/api/admin/enroll',adm,(q,r)=>{const{name,course,phone,email,guardian,className,feeTotal,feePaid}=q.body||{};
 if(!String(name||'').trim())return r.status(400).json({e:'Student name is required'});
 const total=Math.round(Number(feeTotal||0)*100)/100,paid=Math.round(Number(feePaid||0)*100)/100;
 if(!Number.isFinite(total)||!Number.isFinite(paid)||total<0||paid<0||paid>total)return r.status(400).json({e:'Fee amounts must be non-negative, and amount paid cannot exceed the total fee'});
 const id='CW'+(Math.max(2600,...db.students.map(x=>+x.id.slice(2)))+1),pw=rnd(3),payment=paid?{amount:paid,date:Date.now(),note:'Initial enrollment payment'}:null;
 const s=mk(id,String(name).trim().slice(0,100),String(course||'General').slice(0,100),pw,{
  phone:String(phone||'').trim().slice(0,30),email:String(email||'').trim().slice(0,120),
  guardian:String(guardian||'').trim().slice(0,100),className:String(className||'').trim().slice(0,50),
  fees:{total,paid,payments:payment?[payment]:[]},disabled:false
 });
 db.students.push(s);save();
 log('enroll',`Enrolled ${s.name} as ${id}${feeBalance(s)>0?' — fee payment pending':''}`);r.json({id,password:pw,feeBalance:feeBalance(s)})});
app.post('/api/admin/sdel',adm,(q,r)=>{db.students=db.students.filter(x=>x.id!==q.body.id);db.results=db.results.filter(x=>x.id!==q.body.id);save();r.json({ok:1})});
app.post('/api/admin/sdisable',adm,(q,r)=>{const s=db.students.find(x=>x.id===q.body.id);if(!s)return r.status(404).json({e:'Not found'});
 if(!q.body.disabled&&feeBalance(s)>0)return r.status(400).json({e:'Record the outstanding fee payment before restoring LMS access'});
 s.disabled=!!q.body.disabled;save();log('security',`${s.id} ${s.disabled?'disabled':'re-enabled'}`);r.json({ok:1})});
app.post('/api/admin/fee',adm,(q,r)=>{const s=db.students.find(x=>x.id===q.body.id);if(!s)return r.status(404).json({e:'Student not found'});
 const amount=Math.round(Number(q.body.amount)*100)/100;if(!Number.isFinite(amount)||amount<=0)return r.status(400).json({e:'Enter a payment amount greater than zero'});
 s.fees=s.fees||{total:0,paid:0,payments:[]};if(s.fees.paid+amount>s.fees.total)return r.status(400).json({e:'Payment cannot exceed the remaining balance'});
 s.fees.paid+=amount;s.fees.payments.push({amount,date:Date.now(),note:String(q.body.note||'').trim().slice(0,160)});
 save();const balance=feeBalance(s);log('fee',`${s.id} payment recorded — ${balance?'balance remaining':'fees paid in full'}`);
 if(!balance)emitAfterSave('notify',{to:s.id,tab:'Dashboard',t:'Your fee payment is complete. LMS access is now available.'});
 r.json({ok:1,feeBalance:balance})});
app.post('/api/admin/test-grade',adm,(q,r)=>{const result=db.results.find(x=>x.type==='test'&&x.rid===q.body.rid);if(!result)return r.status(404).json({e:'Test result not found'});
 const responses=result.responses||[],written=responses.filter(x=>x.type==='subjective'&&x.answer),marks=q.body.marks,feedback=String(q.body.feedback||'').trim().slice(0,500);
 if(!Array.isArray(marks)||marks.length!==written.length)return r.status(400).json({e:'A mark is required for every written answer'});
 for(let i=0;i<marks.length;i++)if(!Number.isFinite(Number(marks[i]))||Number(marks[i])<0||Number(marks[i])>written[i].points)return r.status(400).json({e:'Each mark must be between zero and the question points'});
 written.forEach((answer,i)=>{answer.marks=Number(marks[i]);answer.feedback=feedback});
 result.score=result.objectiveScore+marks.reduce((sum,value)=>sum+Number(value),0);result.pending=0;result.subjectiveGraded=true;result.feedback=feedback;save();
 emitAfterSave('test:graded',{id:result.id,title:result.title,score:result.score,total:result.total});
 emitAfterSave('notify',{to:result.id,tab:'Progress',t:`Your written answers for "${result.title}" have been graded.`});
 log('test',`Written answers for ${result.id}'s "${result.title}" graded`);r.json({ok:1,score:result.score,total:result.total})});

// ---- leads ----
app.post('/api/admin/lead',adm,(q,r)=>{const l=db.leads.find(x=>x.id===q.body.id);if(!l)return r.status(404).json({e:'Not found'});
 if(!['new','contacted','converted'].includes(q.body.status))return r.status(400).json({e:'Invalid status'});l.status=q.body.status;save();r.json({ok:1})});
app.post('/api/admin/leaddel',adm,(q,r)=>{db.leads=db.leads.filter(x=>x.id!==q.body.id);save();r.json({ok:1})});

// ---- password reset queue ----
app.post('/api/admin/resetdone',adm,(q,r)=>{db.resets=db.resets.filter(x=>x.id!==q.body.id);save();r.json({ok:1})});

// ---- announcements ----
app.post('/api/admin/announce',adm,(q,r)=>{if(!q.body.t||!q.body.b)return r.status(400).json({e:'Title and details required'});
 const a={id:rnd(4),t:q.body.t,b:q.body.b,d:Date.now()};db.ann.push(a);save();emitAfterSave('notify',{to:'all',tab:'Announcements',t:'New announcement: '+a.t});log('announce',`Published announcement "${a.t}"`);r.json({ok:1})});
app.post('/api/admin/anndel',adm,(q,r)=>{db.ann=db.ann.filter(x=>x.id!==q.body.id);save();r.json({ok:1})});

// ---- messages ----
app.post('/api/admin/msg',adm,(q,r)=>{if(!q.body.b)return r.status(400).json({e:'Message required'});const to=q.body.to||'all';
 db.msgs.push({from:'tutor',to,b:String(q.body.b).slice(0,500),d:Date.now()});save();emitAfterSave('notify',{to,tab:'Messages',t:'New message from your tutor'});r.json({ok:1})});

// ---- content library (lectures / notes / assignments) ----
app.post('/api/admin/res',adm,(q,r)=>{const{kind,title,url,desc,due}=q.body;if(!title||!['lecture','note','assignment'].includes(kind))return r.status(400).json({e:'Kind and title required'});
 db.res.push({id:rnd(4),kind,title,url:/^https?:\/\//.test(url||'')?url:'',desc:desc||'',due:due||'',d:Date.now()});save();emitAfterSave('notify',{to:'all',tab:'Library',t:'New '+kind+': '+title});r.json({ok:1})});
app.post('/api/admin/resdel',adm,(q,r)=>{db.res=db.res.filter(x=>x.id!==q.body.id);save();r.json({ok:1})});
app.post('/api/admin/grade',adm,(q,r)=>{const x=db.subs.find(y=>y.rid===q.body.rid&&y.id===q.body.id);if(!x)return r.status(404).json({e:'Not found'});
 if(q.body.marks===undefined||q.body.marks==='')return r.status(400).json({e:'Marks required'});x.marks=q.body.marks;x.fb=q.body.fb||'';save();emitAfterSave('notify',{to:x.id,tab:'Library',t:'Your assignment was graded'});r.json({ok:1})});

// ---- question bank ----
app.post('/api/admin/q',adm,(q,r)=>{const{q:t,o,a,s,type,subject,points}=q.body||{},kind=type==='subjective'?'subjective':'mcq',score=points===undefined?1:Number(points);
 if(!String(t||'').trim()||!String(subject||s||'').trim()||!Number.isFinite(score)||score<=0||score>100)return r.status(400).json({e:'A question, subject, and positive point value are required'});
 if(kind==='mcq'&&(!Array.isArray(o)||o.length!==4||o.some(x=>!String(x).trim())||!Number.isInteger(+a)||!(a>=0&&a<4)))return r.status(400).json({e:'MCQ questions need four filled options and one correct answer'});
 db.bank.push({id:rnd(8),q:String(t).trim().slice(0,2000),type:kind,points:score,s:String(subject||s).trim().slice(0,80),...(kind==='mcq'?{o:o.map(x=>String(x).trim().slice(0,500)),a:+a}:{})});save();r.json({ok:1})});
app.post('/api/admin/qdel',adm,(q,r)=>{const i=Number(q.body.i);if(!Number.isInteger(i)||i<0||i>=db.bank.length)return r.status(400).json({e:'Question not found'});
 if(db.bank.length<=5)return r.status(400).json({e:'Keep at least 5 questions so quizzes keep working'});
 if(db.bank[i].type!=='subjective'&&db.bank.filter(x=>x.type!=='subjective').length<=1)return r.status(400).json({e:'Keep at least one multiple-choice question for the daily quiz'});
 db.bank.splice(i,1);save();r.json({ok:1})});

// ---- CSV export ----
const csvEsc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
app.get('/api/admin/export/leads',adm,(q,r)=>{
 const keys=[...new Set(db.leads.flatMap(l=>Object.keys(l.data)))];
 const rows=[['Type','Status','Date',...keys],...db.leads.map(l=>[l.type,l.status,new Date(l.d).toISOString(),...keys.map(k=>l.data[k]||'')])];
 r.set('Content-Type','text/csv').set('Content-Disposition','attachment; filename="leads.csv"').send(rows.map(x=>x.map(csvEsc).join(',')).join('\r\n'))});
app.get('/api/admin/export/students',adm,(q,r)=>{
 const rows=[['ID','Name','Phone','Email','Guardian','Class','Course','Total Fee','Paid','Balance','Joined','Last Login','Disabled'],...db.students.map(s=>[s.id,s.name,s.phone||'',s.email||'',s.guardian||'',s.className||'',s.course,new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(Number(s.fees?.total||0)),new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(Number(s.fees?.paid||0)),new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(feeBalance(s)),new Date(s.joined).toISOString(),s.last?new Date(s.last).toISOString():'',s.disabled?'yes':'no'])];
 r.set('Content-Type','text/csv').set('Content-Disposition','attachment; filename="students.csv"').send(rows.map(x=>x.map(csvEsc).join(',')).join('\r\n'))});

// ========================= LIVE TEST (Socket.IO) =========================
let live=null,timer=null;
const pub=()=>({title:live.title,end:live.end,n:live.qs.length,showRanks:live.showRanks,tabLimit:live.tabLimit});
const currentBoard=()=>Object.entries(live.p).map(([id,p])=>{
 let score=0,total=0;live.qs.forEach((x,i)=>{if(x.type!=='subjective'){const points=Number(x.points)||1;total+=points;if(p.ans[i]===x.a)score+=points}});
 return{id,name:p.name,score,total,warn:p.warn,sub:!!p.sub,pending:live.qs.some((x,i)=>x.type==='subjective'&&p.ans[i])};
}).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
const updLive=()=>{
 const roster=Object.entries(live.p).map(([id,p])=>({id,name:p.name,answered:Object.values(p.ans).filter(x=>x!==undefined&&x!==null&&x!=='').length,warn:p.warn,sub:!!p.sub,autoSubmitted:!!p.autoSubmitted}));
 io.to('adm').emit('test:live',roster);
 io.to('adm').emit('test:rank',currentBoard());
 if(live.showRanks)io.to('test-students').emit('test:rank',currentBoard());
};
async function finish(){if(!live||live.done)return;live.done=true;clearTimeout(timer);
 const board=Object.entries(live.p).map(([id,p])=>{
  let objectiveScore=0,total=0,pending=0;
  const responses=live.qs.map((x,i)=>{
   const points=Number(x.points)||1;total+=points;
   if(x.type==='subjective'){if(p.ans[i])pending++;return{type:'subjective',question:x.q,answer:String(p.ans[i]||''),points,marks:null}}
   if(p.ans[i]===x.a)objectiveScore+=points;
   return{type:'mcq',question:x.q,answer:p.ans[i]===undefined?'':x.o[p.ans[i]],points}
  });
  const rid=rnd(8);db.results.push({rid,id,type:'test',title:live.title,score:objectiveScore,objectiveScore,total,pending,subjectiveGraded:pending===0,responses,d:Date.now()});
  return{id,rid,name:p.name,score:objectiveScore,total,warn:p.warn,pending};
 }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 await save();log('test',`Live test "${live.title}" ended — ${board.length} participant(s)`);io.emit('test:result',{board,title:live.title})}
io.on('connection',s=>{
 s.on('auth',t=>{const u=liveSess(t);if(!u)return;s.u=u;if(u.admin){s.join('adm');if(live&&!live.done){s.emit('test:open',pub());s.emit('test:live',Object.entries(live.p).map(([id,p])=>({id,name:p.name,answered:Object.keys(p.ans).length,warn:p.warn,sub:!!p.sub,autoSubmitted:!!p.autoSubmitted})));s.emit('test:rank',currentBoard())}}else{s.join('test-students');const st=db.students.find(x=>x.id===u.id);if(!st||st.disabled||feeBalance(st)>0)return;if(live&&!live.done){s.emit('test:open',pub());if(live.showRanks)s.emit('test:rank',currentBoard())}}});
 s.on('admin:start',d=>{if(!s.u||!s.u.admin)return;
  if(live&&!live.done){s.emit('test:error',{e:'A live test is already in progress. End it before starting another.'});return}
  const duration=Number(d.dur),n=Number(d.n),tabLimit=Number(d.tabLimit)||0;
  const title=String(d.title||'').trim().slice(0,80);
  const selected=Array.isArray(d.questionIds)?[...new Set(d.questionIds.map(String))]:[];
  const questions=d.mode==='selected'?selected.map(id=>db.bank.find(x=>x.id===id)).filter(Boolean):[...db.bank].sort(()=>Math.random()-.5).slice(0,Math.min(n||5,db.bank.length));
  if(!title||!Number.isInteger(duration)||duration<1||duration>180||!questions.length||questions.length>100||d.mode==='selected'&&questions.length!==selected.length||d.mode!=='selected'&&(!Number.isInteger(n)||n<1||n>db.bank.length)||!Number.isInteger(tabLimit)||tabLimit<0||tabLimit>50){s.emit('test:error',{e:'Choose a title and valid duration, questions, and tab-switch limit.'});return}
  const m=duration*6e4;
  live={title,qs:questions,end:Date.now()+m,p:{},done:false,showRanks:!!d.showRanks,tabLimit};
  clearTimeout(timer);timer=setTimeout(()=>finish().catch(error=>console.error('Could not save live test results:',error)),m);log('test',`Live test "${live.title}" started (${live.qs.length} Qs, ${duration} min)`);io.emit('test:open',pub())});
 s.on('admin:rank-control',enabled=>{if(!s.u||!s.u.admin||!live||live.done)return;live.showRanks=!!enabled;s.emit('test:rank',currentBoard());io.to('test-students').emit('test:rank-control',{enabled:live.showRanks});if(live.showRanks)io.to('test-students').emit('test:rank',currentBoard())});
 s.on('admin:end',()=>{if(s.u&&s.u.admin)finish().catch(error=>console.error('Could not save live test results:',error))});
 s.on('test:join',()=>{if(!live||live.done||!s.u||s.u.admin)return;const st=db.students.find(x=>x.id===s.u.id);if(!st||st.disabled||feeBalance(st)>0)return;
  const p=live.p[st.id]=live.p[st.id]||{name:st.name,ans:{},warn:0};
  if(p.sub){s.emit('test:submitted');return}
  s.emit('test:begin',{title:live.title,end:live.end,ans:p.ans,qs:live.qs.map(x=>({q:x.q,type:x.type,points:x.points,o:x.o||[]}))});updLive()});
 const P=()=>{
  if(!s.u||s.u.admin||!live||live.done)return null;
  const student=db.students.find(x=>x.id===s.u.id),participant=live.p[s.u.id];
  return student&&!student.disabled&&!feeBalance(student)&&participant&&!participant.sub?participant:null;
 };
 s.on('test:answer',({i,o})=>{const p=P();if(!p||!Number.isInteger(i)||i<0||i>=live.qs.length)return;
  const question=live.qs[i];if(question.type==='subjective'){if(typeof o!=='string'||o.length>5000)return;p.ans[i]=o.trim()}else if(Number.isInteger(o)&&o>=0&&o<question.o.length)p.ans[i]=o;else return;
  updLive()});
 s.on('test:warn',()=>{const p=P();if(p){p.warn++;s.emit('test:warning',{warn:p.warn,limit:live.tabLimit});if(live.tabLimit&&p.warn>=live.tabLimit){p.sub=true;p.autoSubmitted=true;s.emit('test:auto-submit',{warn:p.warn,limit:live.tabLimit})}updLive()}});
 s.on('test:submit',()=>{const p=P();if(p){p.sub=true;updLive();s.emit('test:submitted')}});
});

function listen(){
 const PORT=process.env.PORT||3000;
 srv.listen(PORT,()=>console.log(`LMS running → http://localhost:${PORT}  |  Admin console → http://localhost:${PORT}/lms/admin.html`));
}
start().catch(async error=>{
 console.error('Unable to start the LMS server:',error);
 await store.close();
 process.exitCode=1;
});
