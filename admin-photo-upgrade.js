/*
 PHOTO MANAGEMENT UPGRADE
 Add this AFTER your existing admin.js.
 It supports:
 1) Upload a new photo.
 2) Select an existing published gallery photo.
 3) Save that photo as Hero / History / Information photo.
*/

function photoPublicUrl(path){
  return `${window.SUPABASE_URL}/storage/v1/object/public/temple-gallery/${path}`;
}

async function uploadSectionPhoto(file, section){
  if(!file) throw new Error("Please select an image.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=`sections/${section}-${Date.now()}.${ext}`;
  const {error}=await sb.storage.from("temple-gallery").upload(path,file,{
    upsert:false,contentType:file.type||"image/jpeg"
  });
  if(error) throw error;
  return photoPublicUrl(path);
}

async function saveSectionImage(column,url,msgId){
  const {error}=await sb.from("site_settings").update({
    [column]:url,updated_at:new Date().toISOString()
  }).eq("id",1);
  if(error) throw error;
  if($(msgId)) $(msgId).textContent="✓ Photo saved successfully.";
  await loadPhotoSettings();
}

function showPhotoPreview(imgId,url){
  const img=$(imgId);
  if(!img)return;
  img.src=url;
  img.style.display="block";
}

function bindUpload(fileId,previewId,msgId,column,section){
  $(fileId)?.addEventListener("change",async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      $(msgId).textContent="Uploading...";
      const url=await uploadSectionPhoto(file,section);
      await saveSectionImage(column,url,msgId);
      showPhotoPreview(previewId,url);
    }catch(err){
      console.error(err);
      $(msgId).textContent=err.message||"Upload failed.";
    }
  });
}

async function loadPhotoSettings(){
  const {data,error}=await sb.from("site_settings")
    .select("hero_image,history_image,information_image")
    .eq("id",1).maybeSingle();
  if(error||!data)return;
  if(data.hero_image) showPhotoPreview("heroPreview",data.hero_image);
  if(data.history_image) showPhotoPreview("historyPhotoPreview",data.history_image);
  if(data.information_image) showPhotoPreview("informationPhotoPreview",data.information_image);
}

async function chooseExistingPhoto(column,previewId,msgId){
  const {data,error}=await sb.from("gallery_photos")
    .select("id,title,image_url,created_at,published")
    .eq("published",true)
    .not("image_url","is",null)
    .order("created_at",{ascending:false});

  if(error){ console.error(error); $(msgId).textContent=error.message; return; }
  const photos=data||[];
  if(!photos.length){ $(msgId).textContent="No published gallery photos available."; return; }

  const library=$("photoLibrary");
  const grid=$("photoLibraryGrid"); if(!grid) return; grid.innerHTML=photos.map(p=>`
    <button type="button" class="library-photo"
      data-url="${String(p.image_url).replace(/"/g,"&quot;")}"
      data-title="${String(p.title||"Temple photo").replace(/"/g,"&quot;")}">
      <img src="${String(p.image_url).replace(/"/g,"&quot;")}" alt="">
      <span>${String(p.title||"Temple photo")}</span>
    </button>`).join("");

  library.classList.add("show");

  grid.querySelectorAll(".library-photo").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const url=btn.dataset.url;
      try{
        $(msgId).textContent="Saving selected photo...";
        await saveSectionImage(column,url,msgId);
        showPhotoPreview(previewId,url);
        library.classList.remove("show");
      }catch(err){
        console.error(err);
        $(msgId).textContent=err.message||"Could not save photo.";
      }
    });
  });
}

function initPhotoSelectors(){
  bindUpload("heroFile","heroPreview","heroMsg","hero_image","hero");
  bindUpload("historyPhotoFile","historyPhotoPreview","historyPhotoMsg","history_image","history");
  bindUpload("informationPhotoFile","informationPhotoPreview","informationPhotoMsg","information");
  loadPhotoSettings();

  $("chooseHeroPhoto")?.addEventListener("click",()=>chooseExistingPhoto("hero_image","heroPreview","heroMsg"));
  $("chooseHistoryPhoto")?.addEventListener("click",()=>chooseExistingPhoto("history_image","historyPhotoPreview","historyPhotoMsg"));
  $("chooseInformationPhoto")?.addEventListener("click",()=>chooseExistingPhoto("information_image","informationPhotoPreview","informationPhotoMsg"));
  $("closePhotoLibrary")?.addEventListener("click",()=>$("photoLibrary")?.classList.remove("show"));
}
