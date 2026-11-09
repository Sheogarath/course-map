(function(){
var API=null;function find(w){var n=0;while(w&&!w.API&&w.parent&&w.parent!=w&&n++<10)w=w.parent;return w&&w.API||null}
API=find(window)||(window.opener&&find(window.opener));
var mem={};
function get(k){try{return API?API.LMSGetValue(k):(mem[k]||localStorage.getItem('cm_'+k)||'')}catch(e){return''}}
function set(k,v){try{if(API)API.LMSSetValue(k,v);else{mem[k]=v;localStorage.setItem('cm_'+k,v)}}catch(e){}}
function commit(){try{API&&API.LMSCommit('')}catch(e){}}
if(API)API.LMSInitialize('');
var C=window.COURSE,S={start:null,done:[],sim:null};
try{var raw=get('cmi.suspend_data');if(raw)S=Object.assign(S,JSON.parse(raw))}catch(e){}
function iso(d){var z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)}
function parse(s){var p=s.split('-');return new Date(+p[0],p[1]-1,+p[2])}
if(!S.start)S.start=C.startDate==='launch'?iso(new Date()):C.startDate;
var months=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
function fmt(d){return d.getDate()+' '+months[d.getMonth()]}
function today(){return S.sim?parse(S.sim):parse(iso(new Date()))}
function opens(m){var d=parse(S.start);d.setDate(d.getDate()+m.offset);return d}
function state(i){if(S.done.indexOf(i)>=0)return'done';return today()>=opens(C.modules[i])?'open':'locked'}
function save(){var n=C.modules.length,d=S.done.length;set('cmi.suspend_data',JSON.stringify(S));
 set('cmi.core.score.min','0');set('cmi.core.score.max','100');set('cmi.core.score.raw',String(Math.round(d/n*100)));
 set('cmi.core.lesson_location',String(sel));
 set('cmi.core.lesson_status',d>=n?'completed':'incomplete');commit()}
var sel=parseInt(get('cmi.core.lesson_location'))||0;
var map=document.getElementById('map'),N=C.modules.length,pts=[];
for(var i=0;i<N;i++)pts.push([60+i*(880/(N-1)),i%2?150:340]);
var dd='M'+pts[0][0]+' '+pts[0][1];
for(i=1;i<N;i++){var a=pts[i-1],b=pts[i],mx=(a[0]+b[0])/2;dd+=' C'+mx+' '+a[1]+' '+mx+' '+b[1]+' '+b[0]+' '+b[1]}
document.getElementById('base').setAttribute('d',dd);document.getElementById('fill').setAttribute('d',dd);
var els=[];
C.modules.forEach(function(m,i){
 var n=document.createElement('div');n.className='node glass';n.style.left=pts[i][0]/10+'%';n.style.top=pts[i][1]/5.2+'%';
 n.onclick=function(){sel=i;render();save()};map.appendChild(n);
 var dt=document.createElement('div');dt.className='date glass';dt.style.left=pts[i][0]/10+'%';dt.style.top=(pts[i][1]/5.2+11)+'%';map.appendChild(dt);
 els.push([n,dt])});
function render(){
 document.getElementById('t').textContent=C.title;document.getElementById('s').textContent=C.subtitle;
 var done=S.done.length;document.getElementById('pt').textContent='Пройдено '+done+' из '+N+' · '+Math.round(done/N*100)+'%';
 document.getElementById('pb').style.width=done/N*100+'%';
 C.modules.forEach(function(m,i){var st=state(i),n=els[i][0];
  n.className='node glass '+st+(i===sel?' sel':'');
  n.innerHTML='<b>'+(st==='done'?'✓':st==='locked'?'🔒':(i+1))+'</b>'+m.title;
  els[i][1].textContent=fmt(opens(m))});
 var m=C.modules[sel],st=state(sel),p=document.getElementById('panel');
 var msg=st==='locked'?'Откроется '+fmt(opens(m))+' (через '+Math.ceil((opens(m)-today())/864e5)+' дн.)':st==='done'?'Модуль пройден':'Модуль доступен';
 p.innerHTML='<span class="tag">'+m.type+' · '+msg+'</span><h2>'+(sel+1)+'. '+m.title+'</h2><p style="margin-top:8px;opacity:.85">'+m.desc+'</p><button class="btn" id="go" '+(st==='open'?'':'disabled')+'>'+(st==='done'?'Отменить отметку':'Отметить пройденным')+'</button>';
 document.getElementById('go').onclick=function(){var k=S.done.indexOf(sel);if(k>=0)S.done.splice(k,1);else S.done.push(sel);save();render()};
 document.getElementById('sim').value=iso(today());
 document.getElementById('info').textContent='Старт курса: '+S.start+(S.sim?' · симуляция даты':'');
}
document.getElementById('simset').onclick=function(){var v=document.getElementById('sim').value;if(v){S.sim=v;save();render()}};
document.getElementById('simreal').onclick=function(){S.sim=null;save();render()};
document.getElementById('reset').onclick=function(){S.done=[];S.sim=null;S.start=C.startDate==='launch'?iso(new Date()):C.startDate;sel=0;save();render()};
if(get('cmi.core.lesson_status')==='not attempted'||!get('cmi.core.lesson_status'))set('cmi.core.lesson_status','incomplete');
render();save();
window.addEventListener('beforeunload',function(){save();try{API&&API.LMSFinish('')}catch(e){}});
})();