let sb=null;
try{sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY)}catch(e){console.error("Supabase not configured",e)}
const MAP_URL="https://maps.app.goo.gl/LK6swUG4yz7kwvSH6";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt=v=>v?new Date(v+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"";
const icon=n=>`<svg class="ic"><use href="#i-${n}"/></svg>`;
const PAGES=[
 ["history","Temple History","Know Our Heritage","Discover the history and spiritual significance of the temple.","Read More"],
 ["information","Temple Info","Timings & Facilities","Know about temple timings, facilities and rituals for a smooth darshan.","View Details"],
 ["events","Events","Upcoming Programs","Stay updated with festivals, poojas and special programs.","View Events"],
 ["announcements","Announcements","Latest Updates","Get the latest news and important information from the temple.","View All"],
 ["gallery","Gallery","Divine Moments","Explore photos of the temple, deities and festival celebrations.","View Gallery"],
 ["contact","Contact","Get In Touch","Visit us, call us or get directions. We are always here to help.","Get in Touch"]
];
const images={};

function build(){
  $("nav").innerHTML=`<a href="#home" data-p="home">${icon("home")}Home</a>`+PAGES.map(p=>`<a href="#${p[0]}" data-p="${p[0]}">${icon(p[0])}${p[1]}</a>`).join("");
  $("strip").innerHTML=PAGES.map(p=>`<a href="#${p[0]}"><span class="dot">${icon(p[0])}</span><b>${p[1].replace("Temple Info","Temple Information")}</b><small>${p[2]}</small></a>`).join("");
  renderCards();
  $("yr").textContent=new Date().getFullYear();
}
function renderCards(){
  $("cards").innerHTML=PAGES.map(p=>`<article class="card"><div class="pic" ${images[p[0]]?`style="background-image:url('${esc(images[p[0]])}')"`:""}>${images[p[0]]?"":icon(p[0])}</div><h3>${icon(p[0])}${p[1]}</h3><p>${p[3]}</p><a class="btn" href="#${p[0]}">${p[4]} ${icon("arrow")}</a></article>`).join("");
}
function show(){
  const id=(location.hash||"#home").slice(1);
  const v=$("v-"+id)?id:"home";
  document.querySelectorAll(".view").forEach(s=>s.hidden=s.id!=="v-"+v);
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.p===v));
  $("nav").classList.remove("open");$("burger").setAttribute("aria-expanded","false");
  window.scrollTo(0,0);
}
function setPhone(id,n){const el=$(id);el.href=n?`tel:${n}`:"#";el.querySelector("strong").textContent=n||"-";el.hidden=!n}
function setLink(id,url){const el=$(id);if(url)el.href=url;else el.hidden=true}
