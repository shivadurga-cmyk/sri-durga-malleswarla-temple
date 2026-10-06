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

async function loadEvents(){
  const box=$("eventsList");
  const {data,error}=await sb.from("events").select("id,title,description,event_date,start_time,end_time,location,image_url").eq("published",true).order("event_date").order("sort_order");
  if(error){console.error(error);box.innerHTML="<p>Events are temporarily unavailable.</p>";return}
  if(!data?.length){box.innerHTML='<div class="box"><h3>No upcoming events</h3><p>Please check again soon.</p></div>';return}
  const ev=!images.events&&data.find(e=>e.image_url);if(ev){images.events=ev.image_url;renderCards()}
  box.innerHTML=data.map(e=>`<article class="box"><small>${fmt(e.event_date)}</small><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>${e.start_time?`<p>${esc(e.start_time)}${e.end_time?" - "+esc(e.end_time):""}</p>`:""}${e.location?`<p>${esc(e.location)}</p>`:""}</article>`).join("");
}
async function loadNews(){
  const box=$("newsList");
  const {data,error}=await sb.from("announcements").select("id,title,content,created_at").eq("published",true).order("created_at",{ascending:false});
  if(error){console.error(error);box.innerHTML="<p>Announcements are temporarily unavailable.</p>";return}
  if(!data?.length){box.innerHTML='<div class="box"><h3>No announcements</h3><p>New announcements will appear here.</p></div>';return}
  box.innerHTML=data.map(n=>`<article class="box"><small>${fmt((n.created_at||"").slice(0,10))}</small><h3>${esc(n.title)}</h3><p>${esc(n.content)}</p></article>`).join("");
}
async function loadGallery(){
  const box=$("galleryGrid");
  const {data,error}=await sb.from("gallery_photos").select("id,title,image_url").eq("published",true).order("sort_order").order("created_at",{ascending:false});
  if(error){console.error(error);box.innerHTML="<p>Gallery is temporarily unavailable.</p>";return}
  const list=data||[];
  if(!list.length){box.innerHTML='<div class="box"><h3>No photos yet</h3><p>Temple photographs will appear here.</p></div>';return}
  if(!images.gallery){images.gallery=list[0].image_url;renderCards()}
  box.innerHTML=list.map((p,i)=>`<figure data-i="${i}"><img src="${esc(p.image_url)}" alt="${esc(p.title||"Temple photo")}" loading="lazy">${p.title?`<figcaption>${esc(p.title)}</figcaption>`:""}</figure>`).join("");
  box.onclick=e=>{const f=e.target.closest("figure");if(!f)return;const p=list[+f.dataset.i];
    $("lbImg").src=p.image_url;$("lbTitle").textContent=p.title||"";$("lightbox").hidden=false};
}
function init(){
  build();show();
  addEventListener("hashchange",show);
  $("burger").onclick=()=>{const o=$("nav").classList.toggle("open");$("burger").setAttribute("aria-expanded",o)};
  const close=()=>$("lightbox").hidden=true;
  $("lbClose").onclick=close;$("lightbox").onclick=e=>{if(e.target.id==="lightbox")close()};
  addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  if(sb)loadSettings().then(()=>Promise.all([loadEvents(),loadNews(),loadGallery()]));
}
document.addEventListener("DOMContentLoaded",init);
