const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
async function load(){
 const {data:s}=await sb.from('site_settings').select('*').eq('id',1).single();
 if(s){
  $('templeName').textContent=s.temple_name_te;
  $('tagline').textContent='“'+s.hero_tagline_te+'”';
  $('address').textContent=s.address_te;
  $('phone1').textContent=s.phone_1;$('phone1').href='tel:+91'+s.phone_1;
  $('phone2').textContent=s.phone_2;$('phone2').href='tel:+91'+s.phone_2;
  $('mapLink').href=s.maps_url;$('wa').href=s.whatsapp_url;$('ig').href=s.instagram_url;
  if(s.hero_image_url) document.querySelector('.hero').style.backgroundImage=`url("${s.hero_image_url}")`;
 }
 const {data:e}=await sb.from('events').select('*').eq('published',true).order('event_date').order('sort_order');
 $('eventsList').innerHTML=(e||[]).map(x=>`<article class="card"><div class="date">${new Date(x.event_date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div><h3>${esc(x.title_te)}</h3><p>${esc(x.description_te||'')}</p>${x.start_time?`<p>🕐 ${esc(x.start_time)}${x.end_time?' – '+esc(x.end_time):''}</p>`:''}</article>`).join('')||'<p>ప్రస్తుతం కార్యక్రమాలు లేవు.</p>';
 const {data:n}=await sb.from('announcements').select('*').eq('published',true).order('published_at',{ascending:false}).limit(6);
 $('newsList').innerHTML=(n||[]).map(x=>`<article class="card"><div class="date">${new Date(x.published_at).toLocaleDateString('te-IN')}</div><h3>${esc(x.title_te)}</h3><p>${esc(x.body_te)}</p></article>`).join('')||'<p>ప్రకటనలు లేవు.</p>';
 const {data:g}=await sb.from('gallery_photos').select('*').eq('published',true).order('sort_order');
 $('galleryGrid').innerHTML=(g||[]).map(x=>`<img src="${esc(x.image_url)}" alt="${esc(x.alt_te||x.title_te||'అమ్మవారి చిత్రం')}" loading="lazy">`).join('')||'<p>ఫోటోలు త్వరలో అందుబాటులోకి వస్తాయి.</p>';
}
load().catch(err=>{console.error(err);});
