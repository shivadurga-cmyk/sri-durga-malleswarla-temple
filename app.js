const { createClient } = window.supabase;
const sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const MAP_URL = "https://maps.app.goo.gl/LK6swUG4yz7kwvSH6";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

function formatDate(value){
  if(!value) return "";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}

function goTo(id){
  document.querySelector(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  $("sidebar")?.classList.remove("open");
}

function setText(id,value,fallback=""){
  const el=$(id); if(el) el.textContent=value || fallback;
}

function setPhone(id, number){
  const el=$(id);
  if(!el) return;
  el.href = number ? `tel:${number}` : "#";
  el.querySelector("strong").textContent = number || "—";
}

async function loadSettings(){
  const {data,error}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
  if(error){ console.error(error); return; }
  if(!data) return;

  const name=data.temple_name || "శ్రీ శ్రీ శ్రీ దుర్గామల్లేశ్వర్ల అమ్మవారి ఆలయం";
  const tagline=data.tagline || "అమ్మ దయ ఉంటే అన్ని ఉన్నట్లే 🙏🏻";

  setText("welcomeTempleName",name);
  setText("sideTempleName",name);
  setText("heroTitle",name);
  setText("heroTagline",tagline);
  setText("welcomeTagline",tagline);
  setText("footerTempleName",name);
  setText("footerTagline",tagline);
  setText("heroLocation",data.location_name || "");
  setText("addressText",data.address || "Temple address will appear here.");

  const hero=$("heroBg");
  if(hero && data.hero_image){
    hero.style.backgroundImage=`url("${data.hero_image}")`;
    hero.classList.add("has-image");
  }
  if(data.history_image) $("historyImage").src=data.history_image;
  if(data.information_image) $("informationImage").src=data.information_image;

  if(data.temple_history) $("historyText").textContent=data.temple_history;

  const links=[
    ["mapLink",data.google_maps || MAP_URL],
    ["mapSideLink",data.google_maps || MAP_URL]
  ];
  links.forEach(([id,url])=>{ if($(id)) $(id).href=url; });

  setPhone("phone1",data.phone_1);
  setPhone("phone2",data.phone_2);
  setPhone("phone3",data.phone_3);

  if($("whatsappLink")) $("whatsappLink").href=data.whatsapp_channel || "#";
  if($("instagramLink")) $("instagramLink").href=data.instagram || "#";
}

async function loadEvents(){
  const box=$("eventsList"); if(!box)return;
  const {data,error}=await sb.from("events")
    .select("id,title,description,event_date,start_time,end_time,location,image_url,published,sort_order")
    .eq("published",true)
    .order("event_date",{ascending:true})
    .order("sort_order",{ascending:true});

  if(error){console.error(error);box.innerHTML="<p>Events are temporarily unavailable.</p>";return;}
  if(!data?.length){box.innerHTML='<div class="event-card"><h3>No upcoming events</h3><p>Please check again soon.</p></div>';return;}

  box.innerHTML=data.map(e=>`
    <article class="event-card">
      <span class="event-date">${formatDate(e.event_date)}</span>
      <h3>${esc(e.title)}</h3>
      <p>${esc(e.description)}</p>
      ${e.start_time?`<p>⏰ ${esc(e.start_time)}${e.end_time?" – "+esc(e.end_time):""}</p>`:""}
      ${e.location?`<p>📍 ${esc(e.location)}</p>`:""}
    </article>`).join("");
}

async function loadNews(){
  const box=$("newsList"); if(!box)return;
  const {data,error}=await sb.from("announcements")
    .select("id,title,content,published,created_at")
    .eq("published",true)
    .order("created_at",{ascending:false});

  if(error){console.error(error);box.innerHTML="<p>Announcements are temporarily unavailable.</p>";return;}
  if(!data?.length){box.innerHTML='<div class="news-card"><h3>No announcements</h3><p>New temple announcements will appear here.</p></div>';return;}

  box.innerHTML=data.map(n=>`
    <article class="news-card">
      <small>${formatDate((n.created_at||"").slice(0,10))}</small>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.content)}</p>
    </article>`).join("");
}

let gallery=[];
async function loadGallery(){
  const box=$("galleryGrid"); if(!box)return;
  const {data,error}=await sb.from("gallery_photos")
    .select("id,title,image_url,storage_path,sort_order,created_at,published")
    .eq("published",true)
    .order("sort_order",{ascending:true})
    .order("created_at",{ascending:false});

  if(error){console.error(error);box.innerHTML="<p>Gallery is temporarily unavailable.</p>";return;}
  gallery=data||[];
  if(!gallery.length){box.innerHTML='<div class="news-card"><h3>No photos yet</h3><p>Temple photographs will appear here.</p></div>';return;}

  box.innerHTML=gallery.map((p,i)=>`
    <div class="gallery-item" data-index="${i}">
      <img src="${esc(p.image_url)}" alt="${esc(p.title||"Temple photo")}" loading="lazy">
      ${p.title?`<span>${esc(p.title)}</span>`:""}
    </div>`).join("");

  box.querySelectorAll(".gallery-item").forEach(item=>{
    item.addEventListener("click",()=>{
      const p=gallery[Number(item.dataset.index)];
      $("lightboxImage").src=p.image_url;
      $("lightboxImage").alt=p.title||"Temple photo";
      $("lightboxTitle").textContent=p.title||"";
      $("lightbox").classList.add("show");
      $("lightbox").setAttribute("aria-hidden","false");
    });
  });
}

function initNavigation(){
  ["exploreBtn","heroExplore"].forEach(id=>{
    $(id)?.addEventListener("click",()=>goTo("#history"));
  });
  document.querySelectorAll(".nav-link").forEach(a=>{
    a.addEventListener("click",()=>setTimeout(()=>{},0));
  });
  $("openMenu")?.addEventListener("click",()=>$("sidebar").classList.add("open"));
  $("closeMenu")?.addEventListener("click",()=>$("sidebar").classList.remove("open"));

  const sections=[...document.querySelectorAll("main section[id]")];
  const links=[...document.querySelectorAll(".nav-link")];
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        links.forEach(l=>l.classList.toggle("active",l.getAttribute("href")==="#"+entry.target.id));
      }
    });
  },{rootMargin:"-35% 0px -55% 0px"});
  sections.forEach(s=>observer.observe(s));
}

function initLightbox(){
  $("lightboxClose")?.addEventListener("click",()=>{
    $("lightbox").classList.remove("show");
    $("lightbox").setAttribute("aria-hidden","true");
  });
  $("lightbox")?.addEventListener("click",e=>{
    if(e.target===$("lightbox")) $("lightboxClose").click();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape") $("lightboxClose")?.click();});
}

document.addEventListener("DOMContentLoaded",async()=>{
  initNavigation();
  initLightbox();
  await loadSettings();
  await Promise.all([loadEvents(),loadNews(),loadGallery()]);
  setTimeout(()=>$("welcome")?.classList.add("hide"),700);
});
