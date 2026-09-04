const KEY="college-money-tracker-v1";
let state=JSON.parse(localStorage.getItem(KEY)||'{"balance":0,"transactions":[],"people":[]}');
state.people=state.people||[];
let mode="expense";
let chart;

const $=id=>document.getElementById(id);
const amount=$("amount"), balance=$("balance"), spentSummary=$("spentSummary");
const history=$("history"), undoBtn=$("undoBtn"), hint=$("entryHint");

function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n)}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function today(){return new Date().toISOString().slice(0,10)}
function formatDate(s){
  const d=new Date(s+"T00:00:00");
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function totalSpent(){return state.transactions.filter(x=>x.type==="expense").reduce((a,x)=>a+x.amount,0)}


function renderPeople(){
  const box=$("people");
  box.innerHTML="";
  if(!state.people.length){
    box.innerHTML='<div class="empty-people">No people added yet.</div>';
    return;
  }
  state.people.forEach(person=>{
    const div=document.createElement("div");
    div.className="person";
    const net=person.youOwe-person.theyOwe;
    let label, cls;
    if(net>0){label=`You owe ${money(net)}`;cls="owe"}
    else if(net<0){label=`They owe you ${money(Math.abs(net))}`;cls="get"}
    else{label="Settled";cls="settled"}
    div.innerHTML=`
      <div class="person-top">
        <span class="person-name"></span>
        <span class="person-balance ${cls}">${label}</span>
      </div>
      <div class="person-actions">
        <button class="owe-btn" data-action="owe">+ I owe them</button>
        <button class="get-btn" data-action="get">+ They owe me</button>
        <button data-action="settle">Settle</button>
        <button data-action="delete">Delete</button>
      </div>`;
    div.querySelector(".person-name").textContent=person.name;
    div.querySelector('[data-action="owe"]').onclick=()=>changePerson(person.id,"owe");
    div.querySelector('[data-action="get"]').onclick=()=>changePerson(person.id,"get");
    div.querySelector('[data-action="settle"]').onclick=()=>{
      person.youOwe=0;person.theyOwe=0;save();renderPeople();
    };
    div.querySelector('[data-action="delete"]').onclick=()=>{
      if(confirm(`Delete ${person.name}?`)){
        state.people=state.people.filter(x=>x.id!==person.id);save();renderPeople();
      }
    };
    box.appendChild(div);
  });
}
function changePerson(id,type){
  const person=state.people.find(x=>x.id===id);
  if(!person)return;
  const raw=prompt(type==="owe"?"How much do you owe them?":"How much do they owe you?");
  const value=Number(raw);
  if(!value||value<=0)return;
  if(type==="owe") person.youOwe+=value;
  else person.theyOwe+=value;
  save();renderPeople();
}
function addPerson(){
  const name=$("personName").value.trim();
  if(!name){$("personName").focus();return}
  state.people.push({id:crypto.randomUUID(),name,youOwe:0,theyOwe:0});
  $("personName").value="";
  $("personForm").classList.add("hidden");
  save();renderPeople();
}

function render(){
  balance.textContent=money(state.balance);
  spentSummary.textContent=`${money(totalSpent())} spent`;
  $("transactionCount").textContent=`${state.transactions.length} transaction${state.transactions.length===1?"":"s"}`;
  undoBtn.classList.toggle("hidden",!state.transactions.some(x=>x.type==="expense"));
  history.innerHTML="";
  if(!state.transactions.length){
    history.innerHTML='<div class="empty">No transactions yet.</div>';
  }else{
    [...state.transactions].reverse().slice(0,20).forEach(x=>{
      const div=document.createElement("div");
      div.className="item";
      div.innerHTML=`<div class="item-left"><span class="item-date">${formatDate(x.date)}</span><span class="item-type">${x.type==="expense"?"Spent":"Money added"}</span></div><span class="item-amount ${x.type}">${x.type==="expense"?"−":"+"}${money(x.amount)}</span>`;
      history.appendChild(div);
    });
  }
  drawChart();
}

function addTransaction(){
  const value=Number(amount.value);
  if(!value || value<=0){amount.focus();return}
  if(mode==="expense" && value>state.balance){
    alert("You don't have enough money left for this expense.");
    return;
  }
  state.transactions.push({id:crypto.randomUUID(),amount:value,type:mode,date:today()});
  state.balance += mode==="expense" ? -value : value;
  amount.value="";
  save(); render(); amount.focus();
}

function setMode(next){
  mode=next;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  hint.textContent=mode==="expense"?"Enter what you just spent.":"Enter money you received or added to your pocket.";
  amount.placeholder="0";
}

function undoLastExpense(){
  for(let i=state.transactions.length-1;i>=0;i--){
    if(state.transactions[i].type==="expense"){
      const x=state.transactions.splice(i,1)[0];
      state.balance += x.amount;
      save(); render(); return;
    }
  }
}

function drawChart(){
  const days=Number($("range").value);
  const labels=[], values=[];
  const now=new Date();
  for(let i=days-1;i>=0;i--){
    const d=new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()-i);
    const key=d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}));
    values.push(state.transactions.filter(x=>x.type==="expense"&&x.date===key).reduce((a,x)=>a+x.amount,0));
  }
  if(chart)chart.destroy();
  chart=new Chart($("expenseChart"),{
    type:"line",
    data:{labels,datasets:[{data:values,borderWidth:2,tension:.3,fill:false,pointRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false},ticks:{maxRotation:0,font:{size:10}}},
              y:{beginAtZero:true,ticks:{font:{size:10},callback:v=>"₹"+v},grid:{color:"#eef0f3"}}}}
  });
}

$("saveBtn").onclick=addTransaction;
amount.addEventListener("keydown",e=>{if(e.key==="Enter")addTransaction()});
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
undoBtn.onclick=undoLastExpense;
$("range").onchange=drawChart;
$("addPersonBtn").onclick=()=>{$("personForm").classList.toggle("hidden");$("personName").focus()};
$("savePersonBtn").onclick=addPerson;
$("personName").addEventListener("keydown",e=>{if(e.key==="Enter")addPerson()});
$("clearBtn").onclick=()=>{
  if(confirm("Delete all money and expense history?")){
    state={balance:0,transactions:[],people:state.people||[]};save();renderPeople();
render();
  }
};

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden");
});
$("installBtn").onclick=async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;
  $("installBtn").classList.add("hidden");
};
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
renderPeople();
render();
