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
 ["donate","Donate","Offer Your Seva","Offer your seva to Ammavari with a UPI donation and get your slip.","Donate Now"],
 ["contact","Contact","Get In Touch","Visit us, call us or get directions. We are always here to help.","Get in Touch"]
];
const images={},focus={};let S={};
function fail(m){const b=document.createElement("div");b.style.cssText="background:#b00020;color:#fff;padding:10px 14px;font:14px sans-serif";b.textContent="Site error: "+m;document.body.prepend(b)}
addEventListener("error",e=>fail(e.message));
addEventListener("unhandledrejection",e=>fail((e.reason&&e.reason.message)||e.reason));

function build(){
  $("nav").innerHTML=`<a href="#home" data-p="home">${icon("home")}Home</a>`+PAGES.map(p=>`<a href="#${p[0]}" data-p="${p[0]}">${icon(p[0])}${p[1]}</a>`).join("");
  $("strip").innerHTML=PAGES.map(p=>`<a href="#${p[0]}"><span class="dot">${icon(p[0])}</span><b>${p[1].replace("Temple Info","Temple Information")}</b><small>${p[2]}</small></a>`).join("");
  renderCards();
  $("yr").textContent=new Date().getFullYear();
}
function renderCards(){
  $("cards").innerHTML=PAGES.map(p=>`<article class="card"><div class="pic" ${images[p[0]]?`style="background-image:url('${esc(images[p[0]])}');background-position:${esc(focus[p[0]]||"center")}"`:""}>${images[p[0]]?"":icon(p[0])}</div><h3>${icon(p[0])}${p[1]}</h3><p>${p[3]}</p><a class="btn" href="#${p[0]}">${p[4]} ${icon("arrow")}</a></article>`).join("");
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

async function loadSettings(){
  if(!sb)return;
  const {data,error}=await sb.from("site_settings").select("*").eq("id",1).maybeSingle();
  if(error||!data){if(error)fail(error.message);else fail("site_settings row 1 not found");return}
  S=data;let foc={};try{foc=JSON.parse(data.photo_focus||"{}")}catch(e){}
  ;["history","information","events","announcements","gallery","contact","donate"].forEach(k=>focus[k]=foc[k+"_image"]);
  if(data.temple_name){["heroTitle","brandName","footerName"].forEach(i=>$(i).textContent=data.temple_name)}
  if(data.tagline){$("footerTagline").textContent=data.tagline;$("heroTagline").textContent=data.tagline}
  ["events","announcements","gallery","contact","donate"].forEach(k=>{if(data[k+"_image"])images[k]=data[k+"_image"]});
  if(data.location_name){$("heroLocation").textContent=data.location_name;$("footLoc").textContent=data.location_name}
  $("addressText").textContent=data.address||"Temple address will appear here.";
  if(data.hero_image){const h=$("heroBg");h.style.setProperty("--img",`url("${data.hero_image}")`);h.classList.add("has-img");h.style.backgroundPosition=foc.hero_image||"center"}
  [["history","history_image"],["information","information_image"]].forEach(([k,c])=>{
    if(data[c]){images[k]=data[c];const el=$(k+"Image");el.src=data[c];el.hidden=false;el.style.objectPosition=foc[c]||"center"}
  });
  if(data.temple_history)$("historyText").textContent=data.temple_history;
  $("mapLink").href=data.google_maps||MAP_URL;
  [data.phone_1,data.phone_2,data.phone_3,data.phone_4,data.phone_5,data.phone_6].forEach((n,i)=>setPhone("phone"+(i+1),n));
  $("footPhones").textContent=[data.phone_1,data.phone_2,data.phone_3].filter(Boolean).join("\n")||"-";
  setLink("whatsappLink",data.whatsapp_channel);setLink("instagramLink",data.instagram);setLink("youtubeLink",data.youtube);
  renderCards();
}
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
function wrap(x,t,w){const L=[];let l="";String(t).split(/\s+/).forEach(wd=>{const n=l?l+" "+wd:wd;if(x.measureText(n).width>w&&l){L.push(l);l=wd}else l=n});if(l)L.push(l);return L}
async function drawSlip(d){
  const c=$("dSlip"),x=c.getContext("2d");c.width=800;c.height=1040;
  await Promise.all(['700 30px "Noto Serif Telugu"','600 22px Poppins'].map(f=>document.fonts.load(f,"అa")));
  x.fillStyle="#fffdf8";x.fillRect(0,0,800,1040);x.fillStyle="#4a0a14";x.fillRect(0,0,800,300);
  const img=await new Promise(r=>{if(!S.hero_image)return r(null);const i=new Image();i.crossOrigin="anonymous";i.onload=()=>r(i);i.onerror=()=>r(null);i.src=S.hero_image});
  if(img){x.save();x.beginPath();x.arc(400,95,70,0,7);x.clip();const s=Math.max(140/img.width,140/img.height);x.drawImage(img,400-img.width*s/2,95-img.height*s/2,img.width*s,img.height*s);x.restore();x.strokeStyle="#e0b45a";x.lineWidth=4;x.beginPath();x.arc(400,95,72,0,7);x.stroke()}
  x.textAlign="center";x.fillStyle="#e0b45a";x.font='700 30px "Noto Serif Telugu",serif';
  wrap(x,S.temple_name||"",740).forEach((l,i)=>x.fillText(l,400,205+i*42));
  x.fillStyle="#f6e3b4";x.font='600 20px Poppins,sans-serif';x.fillText("SRI DURGA MALLESWARLA AMMAVARI DEVASTHANAM",400,262);
  x.fillStyle="#4a0a14";x.font='600 24px Poppins,sans-serif';x.fillText("DONATION SLIP",400,350);
  x.textAlign="left";let y=410;
  const row=(k,v,big)=>{x.fillStyle="#650e19";x.font='600 20px Poppins,sans-serif';x.fillText(k,50,y);x.fillStyle="#2c1712";x.font=(big?'700 30px':'500 21px')+' "Noto Sans Telugu",Poppins,sans-serif';
    wrap(x,v,480).forEach((l,i)=>{x.fillText(l,270,y+i*30);if(i)y+=30});y+=big?58:50};
  row("Receipt no.",d.receipt_no);row("Date",new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}));
  row("Donor name",d.name);row("Gothram",d.gothram||"-");row("Mobile",d.mobile);row("Address",d.address);
  row("Amount","Rs. "+d.amount,1);row("UPI ref. no.",d.utr);
  x.textAlign="center";x.fillStyle="#6f5a4e";x.font='400 15px Poppins,sans-serif';x.fillText("Subject to confirmation of payment by the temple.",400,y+4);
  x.fillStyle="#4a0a14";x.fillRect(0,930,800,110);x.fillStyle="#e0b45a";x.font='700 22px "Noto Serif Telugu",serif';
  wrap(x,"అమ్మ దయ మీకు, మీ కుటుంబ సభ్యులందరికీ ఉండాలని కోరుకుంటున్నాము",740).forEach((l,i)=>x.fillText(l,400,980+i*34));
  $("dDl").href=c.toDataURL("image/png");$("dDl").download=d.receipt_no+".png";
}
function initDonate(){
  const v=id=>$(id).value.trim(),step=n=>[1,2,3].forEach(i=>$("dStep"+i).hidden=i!==n);
  $("dGo").onclick=()=>{
    const m=v("dMobile").replace(/\D/g,"").slice(-10);
    if(!v("dName")||m.length<10||!v("dAddr"))return alert("Please enter your name, 10-digit mobile number and address.");
    $("dBank").innerHTML=[["Account name",S.bank_account_name],["Bank",S.bank_name],["Account no.",S.account_no],["IFSC",S.ifsc],["UPI ID",S.upi_id]].filter(r=>r[1]).map(r=>`<p style="margin:2px 0"><b>${r[0]}:</b> ${esc(r[1])}</p>`).join("")||"<p>Payment details will be added soon.</p>";
    $("dQr").hidden=!S.qr_image;if(S.qr_image)$("dQr").src=S.qr_image;
    $("dUpi").hidden=!S.upi_id;if(S.upi_id)$("dUpi").href=`upi://pay?pa=${encodeURIComponent(S.upi_id)}&pn=${encodeURIComponent("Sri Durga Malleswarla Ammavari Temple")}&cu=INR`;
    step(2);scrollTo(0,0);
  };
  $("dPaid").onclick=async()=>{
    const amt=+v("dAmt"),utr=v("dUtr");
    if(!(amt>0)||utr.length<6)return alert("Please enter the amount paid and the UPI transaction ID.");
    const d={receipt_no:"DS"+new Date().toISOString().slice(2,10).replace(/-/g,"")+Math.floor(1000+Math.random()*9000),name:v("dName"),gothram:v("dGothram"),mobile:v("dMobile"),address:v("dAddr"),amount:amt,utr,status:"pending"};
    $("dPaid").disabled=true;
    const {error}=await sb.from("donations").insert(d);
    $("dPaid").disabled=false;
    if(error)return alert("Could not save your donation. Please try again. ("+error.message+")");
    if(S.sheet_url)fetch(S.sheet_url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify(d)}).catch(()=>{});
    await drawSlip(d);step(3);scrollTo(0,0);
  };
}
function init(){
  initDonate();
  build();show();
  addEventListener("hashchange",show);
  $("burger").onclick=()=>{const o=$("nav").classList.toggle("open");$("burger").setAttribute("aria-expanded",o)};
  const close=()=>$("lightbox").hidden=true;
  $("lbClose").onclick=close;$("lightbox").onclick=e=>{if(e.target.id==="lightbox")close()};
  addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  if(!sb)fail("Cannot connect to database. Check config.js");else loadSettings().catch(()=>{}).then(()=>Promise.all([loadEvents(),loadNews(),loadGallery()]));
}
document.addEventListener("DOMContentLoaded",init);
