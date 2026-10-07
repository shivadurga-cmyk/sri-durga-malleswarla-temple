const sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function say(t,bad){const m=$("msg");m.textContent=t;m.className=bad?"bad":"ok";m.hidden=false;clearTimeout(say.t);say.t=setTimeout(()=>m.hidden=true,3500)}
const SITE=[["temple_name","Temple name (Telugu)"],["tagline","Tagline (shown under the name)"],["location_name","Place (e.g. Seethayyapeta, Chintapaka)"],["address","Full address","area"],["google_maps","Google Maps link"],["temple_history","Temple history","area"],["phone_1","Phone 1"],["phone_2","Phone 2"],["phone_3","Phone 3"],["phone_4","Phone 4"],["phone_5","Phone 5"],["phone_6","Phone 6"],["whatsapp_channel","WhatsApp link"],["instagram","Instagram link"],["youtube","YouTube link"],["upi_id","UPI ID (for donations)"],["bank_account_name","Bank account name"],["bank_name","Bank name"],["account_no","Account number"],["ifsc","IFSC code"],["sheet_url","Google Sheet link (Apps Script web app URL)"],
["hero_image","Home banner photo","photo"],["history_image","History card and page photo","photo"],["information_image","Temple Info card and page photo","photo"],["events_image","Events card photo","photo"],["announcements_image","Announcements card photo","photo"],["gallery_image","Gallery card photo","photo"],["contact_image","Contact card photo","photo"],["qr_image","Donation QR code photo","photo"],["donate_image","Donate card photo","photo"]];
const TABLES={
 site_settings:{label:"Site details",fields:SITE},
 events:{label:"Events",order:["event_date",true],title:r=>`${r.event_date||""}  ${r.title}`,defaults:{sort_order:0},fields:[["title","Title"],["description","Description","area"],["event_date","Date","date"],["start_time","Start time","time"],["end_time","End time","time"],["location","Place"],["image_url","Photo","photo"]]},
 announcements:{label:"Announcements",order:["created_at",false],title:r=>r.title,fields:[["title","Title"],["content","Text","area"]]},
 gallery_photos:{label:"Gallery",order:["created_at",false],title:r=>`${r.media_type&&r.media_type!=="photo"?"["+r.media_type+"] ":""}${r.title||"Photo"}`,defaults:{sort_order:0},fields:[["title","Caption"],["media_type","Type","select"],["image_url","Photo (for photo type)","photo"],["media_url","Video link (YouTube / Instagram) or upload audio / video file","media"]]},
 donations:{label:"Donations",nopub:1,order:["created_at",false],title:r=>`${(r.created_at||"").slice(0,10)} ${r.name} Rs.${r.amount} UTR ${r.utr} [${r.status}]`,fields:[["status","Status (pending / verified)"],["name","Name"],["gothram","Gothram"],["mobile","Mobile"],["address","Address","area"],["amount","Amount","number"],["utr","UPI transaction ID"]]}
};
const ytId=u=>{const m=String(u||"").match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);return m?m[1]:null};
const IN="width:100%;padding:9px;border:1px solid #d9c9a0;border-radius:6px;font:inherit";
function fieldHtml([c,l,t],v){
 if(t==="select")return `<label>${l}</label><select data-col="${c}" style="${IN}">${["photo","video","audio"].map(o=>`<option ${o===(v||"photo")?"selected":""}>${o}</option>`).join("")}</select>`;
 if(t==="media")return `<label>${l}</label><input data-col="${c}" value="${esc(v)}" placeholder="Paste YouTube / Instagram link, or upload a file below"><input type="file" accept="audio/*,video/*" data-audio="${c}" style="margin-top:6px">`;
 if(t==="photo"){const fx=window.FOC?(window.FOC[c]||"50% 50%").match(/\d+/g):null;
 const sl=a=>`<input type="range" min="0" max="100" value="${fx[a]}" data-fx="${c}" data-ax="${a?"y":"x"}" style="padding:0">`;
 return `<label>${l}</label><img class="pv" style="height:170px;object-fit:cover;object-position:${fx?fx[0]+"% "+fx[1]+"%":"50% 50%"}" ${v?`src="${esc(v)}"`:"hidden"}><input type="file" accept="image/*" data-photo="${c}"><input type="hidden" data-col="${c}" value="${esc(v)}">${fx?`<div style="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;font-size:.8rem;margin-top:6px"><span>Move left / right</span>${sl(0)}<span>Move up / down</span>${sl(1)}</div>`:""}`}
 if(t==="area")return `<label>${l}</label><textarea data-col="${c}">${esc(v)}</textarea>`;
 return `<label>${l}</label><input data-col="${c}" type="${t||"text"}" value="${esc(v)}">`;
}
async function upload(file){
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=`admin/${Date.now()}.${ext}`;
 const {error}=await sb.storage.from("temple-gallery").upload(path,file,{contentType:file.type||"image/jpeg"});
 if(error)throw error;
 return {path,url:sb.storage.from("temple-gallery").getPublicUrl(path).data.publicUrl};
}
function wire(form){
 form.querySelectorAll("[data-audio]").forEach(inp=>inp.onchange=async()=>{const f=inp.files[0];if(!f)return;
  try{say("Uploading file... please wait");const r=await upload(f);form.querySelector(`[data-col="${inp.dataset.audio}"]`).value=r.url;say("File ready. Press Save.")}catch(e){say(e.message,1)}});
 form.querySelectorAll("[data-fx]").forEach(s=>s.oninput=()=>pos(form,s.dataset.fx));
 form.querySelectorAll("[data-photo]").forEach(inp=>inp.onchange=async()=>{
  const f=inp.files[0];if(!f)return;
  try{say("Uploading photo...");const r=await upload(f);
   const hid=form.querySelector(`[data-col="${inp.dataset.photo}"]`);hid.value=r.url;form.dataset.path=r.path;
   const pv=inp.previousElementSibling;pv.src=r.url;pv.hidden=false;say("Photo ready. Press Save.")}
  catch(e){say(e.message,1)}
 });
}
function pos(form,c){const g=a=>form.querySelector(`[data-fx="${c}"][data-ax=${a}]`).value;form.querySelector(`[data-photo="${c}"]`).previousElementSibling.style.objectPosition=g("x")+"% "+g("y")+"%"}
function collect(form){const o={};form.querySelectorAll("[data-col]").forEach(e=>o[e.dataset.col]=e.value.trim()||null);return o}
async function show(t){
 document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
 const cfg=TABLES[t],p=$("panel");window.FOC=null;
 if(t==="site_settings"){
  const {data}=await sb.from(t).select("*").eq("id",1).maybeSingle();const d=data||{};try{window.FOC=JSON.parse(d.photo_focus||"{}")}catch(e){window.FOC={}}
  p.innerHTML=`<form id="f">${cfg.fields.map(f=>fieldHtml(f,d[f[0]])).join("")}<button class="btn">Save</button></form>`;
  const f=$("f");wire(f);
  f.onsubmit=async e=>{e.preventDefault();const ph={};f.querySelectorAll("[data-fx][data-ax=x]").forEach(sx=>{const c=sx.dataset.fx;ph[c]=sx.value+"% "+f.querySelector(`[data-fx="${c}"][data-ax=y]`).value+"%"});const {error}=await sb.from(t).upsert({id:1,...collect(f),photo_focus:JSON.stringify(ph),updated_at:new Date().toISOString()});say(error?error.message:"Saved",!!error)};
  return;
 }
 const {data,error}=await sb.from(t).select("*").order(cfg.order[0],{ascending:cfg.order[1]});
 if(error){p.textContent=error.message;return}
 let edit=null;
 const draw=()=>{
  const r=edit||{};
  p.innerHTML=`<form id="f"><h3 style="margin:0">${edit?"Edit":"Add new"}</h3>${cfg.fields.map(f=>fieldHtml(f,r[f[0]])).join("")}${cfg.nopub?"":`<label><input type="checkbox" id="pub" ${r.published===false?"":"checked"}> Show on website</label>`}<button class="btn">${edit?"Save changes":"Add"}</button>${edit?'<button type="button" class="btn alt" id="cx">Cancel</button>':""}</form>`
  +data.map(x=>`<div class="row"><span>${cfg.nopub||x.published?"":"(hidden) "}${esc(cfg.title(x))}</span><span><button class="btn alt" data-e="${x.id}">Edit</button><button class="btn alt" data-d="${x.id}">Delete</button></span></div>`).join("");
  const f=$("f");wire(f);
  if($("cx"))$("cx").onclick=()=>{edit=null;draw()};
  f.onsubmit=async e=>{e.preventDefault();
   const row={...collect(f)};if(!cfg.nopub)row.published=$("pub").checked;
   if(t==="gallery_photos"){const ty=row.media_type||"photo",yt=ytId(row.media_url);
    if(ty==="photo"&&!row.image_url)return say("Please choose a photo",1);
    if(ty==="video"&&!yt&&!/instagram\.com\/(reels?|p|tv)\//.test(row.media_url||"")&&!/\.(mp4|webm|mov|m4v)(\?|$)/i.test(row.media_url||""))return say("Paste a YouTube or Instagram link, or upload a video file",1);
    if(ty==="audio"&&!row.media_url)return say("Upload an audio file or paste its link",1);
    if(ty==="video"&&!row.image_url)row.image_url=`https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
    if(!row.image_url)row.image_url="";
    if(ty==="photo")row.media_url=null}
   if(t==="gallery_photos"&&f.dataset.path)row.storage_path=f.dataset.path;
   const q=edit?sb.from(t).update(row).eq("id",edit.id):sb.from(t).insert({...cfg.defaults,...row});
   const {error}=await q;if(error)return say(error.message,1);say("Saved");show(t)};
  p.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>{edit=data.find(x=>String(x.id)===b.dataset.e);draw();scrollTo(0,0)});
  p.querySelectorAll("[data-d]").forEach(b=>b.onclick=async()=>{if(!confirm("Delete this permanently?"))return;
   const {error}=await sb.from(t).delete().eq("id",b.dataset.d);say(error?error.message:"Deleted",!!error);show(t)});
 };
 draw();
}
function start(){
 $("login").hidden=true;$("app").hidden=false;
 $("tabs").innerHTML=Object.entries(TABLES).map(([k,v])=>`<button data-t="${k}">${v.label}</button>`).join("");
 $("tabs").onclick=e=>{if(e.target.dataset.t)show(e.target.dataset.t)};
 show("site_settings");
}
$("login").onsubmit=async e=>{e.preventDefault();
 const {error}=await sb.auth.signInWithPassword({email:$("em").value,password:$("pw").value});
 error?say(error.message,1):start()};
$("out").onclick=async()=>{await sb.auth.signOut();location.reload()};
sb.auth.getSession().then(({data})=>data.session?start():$("login").hidden=false);
