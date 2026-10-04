const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

let currentUser = null;


/* =========================
   HELPERS
========================= */

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showMessage(id, message, type = "") {
  const el = $(id);

  if (!el) return;

  el.textContent = message;
  el.className = "message " + type;
}

function setLoading(id, message = "Loading...") {
  const el = $(id);

  if (el) {
    el.innerHTML = `<div class="loading">${escapeHTML(message)}</div>`;
  }
}

function formatDate(date) {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


/* =========================
   LOGIN
========================= */

async function login() {

  const email = $("email")?.value.trim();
  const password = $("password")?.value;

  if (!email || !password) {
    showMessage(
      "loginMsg",
      "Please enter your email and password.",
      "error"
    );

    return;
  }

  showMessage("loginMsg", "Logging in...");

  const { error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) {

    showMessage(
      "loginMsg",
      error.message,
      "error"
    );

    return;
  }

  await init();
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await sb.auth.signOut();

  location.reload();
}


/* =========================
   INITIALIZE
========================= */

async function init() {

  const {
    data: { user },
    error
  } = await sb.auth.getUser();

  if (error || !user) {

    $("login")?.classList.remove("hidden");
    $("app")?.classList.add("hidden");

    return;
  }

  currentUser = user;

  const {
    data: admin,
    error: adminError
  } = await sb
    .from("admin_users")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {

    console.error(adminError);

    showMessage(
      "loginMsg",
      adminError.message,
      "error"
    );

    await sb.auth.signOut();

    return;
  }

  if (!admin) {

    showMessage(
      "loginMsg",
      "This account is not an authorized temple admin.",
      "error"
    );

    await sb.auth.signOut();

    return;
  }

  $("login")?.classList.add("hidden");
  $("app")?.classList.remove("hidden");

  await loadAll();
}


/* =========================
   TABS
========================= */

function showTab(id) {

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.add("hidden");
  });

  const selected = $(id);

  if (selected) {
    selected.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   LOAD EVERYTHING
========================= */

async function loadAll() {

  await Promise.all([
    loadEvents(),
    loadNews(),
    loadGallery(),
    loadSettings()
  ]);
}


/* =========================
   EVENTS
========================= */

async function loadEvents() {

  setLoading("eventAdmin", "Loading events...");

  const {
    data,
    error
  } = await sb
    .from("events")
    .select("*")
    .order("event_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {

    console.error(error);

    $("eventAdmin").innerHTML =
      `<div class="row">
        <b>Unable to load events</b>
        <p>${escapeHTML(error.message)}</p>
      </div>`;

    return;
  }

  const events = data || [];

  if ($("eventCount")) {
    $("eventCount").textContent = events.length;
  }

  if (!events.length) {

    $("eventAdmin").innerHTML =
      `<div class="loading">No events found.</div>`;

    return;
  }

  $("eventAdmin").innerHTML = events.map((event) => {

    const status = event.published
      ? "Published"
      : "Hidden";

    return `
      <div class="row">

        <b>${escapeHTML(event.title || "Untitled event")}</b>

        <p>
          📅 ${escapeHTML(formatDate(event.event_date))}
          ${event.start_time
            ? ` · ⏰ ${escapeHTML(event.start_time)}`
            : ""}
          ${event.end_time
            ? ` - ${escapeHTML(event.end_time)}`
            : ""}
        </p>

        ${
          event.location
            ? `<p>📍 ${escapeHTML(event.location)}</p>`
            : ""
        }

        ${
          event.description
            ? `<p>${escapeHTML(event.description)}</p>`
            : ""
        }

        <small>
          Status: ${escapeHTML(status)}
        </small>

        <br>

        <button
          onclick="editEvent('${event.id}')"
        >
          Edit
        </button>

        <button
          onclick="deleteRow('events','${event.id}',loadEvents)"
        >
          Delete
        </button>

      </div>
    `;

  }).join("");
}


/* =========================
   ADD EVENT
========================= */

async function addEvent() {

  const title = $("etitle")?.value.trim();
  const description = $("edesc")?.value.trim();
  const eventDate = $("edate")?.value;
  const startTime = $("estart")?.value || null;
  const endTime = $("eend")?.value || null;
  const location = $("elocation")?.value.trim();

  if (!title || !eventDate) {

    alert("Event title and date are required.");

    return;
  }

  const {
    error
  } = await sb
    .from("events")
    .insert({
      title,
      description,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      location,
      published: true
    });

  if (error) {

    alert(error.message);

    return;
  }

  [
    "etitle",
    "edesc",
    "edate",
    "estart",
    "eend",
    "elocation"
  ].forEach((id) => {

    if ($(id)) {
      $(id).value = "";
    }

  });

  alert("Event added successfully.");

  await loadEvents();
}


/* =========================
   EDIT EVENT
========================= */

async function editEvent(id) {

  const {
    data: event,
    error
  } = await sb
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {

    alert(error.message);

    return;
  }

  const title = prompt(
    "Event title:",
    event.title || ""
  );

  if (title === null) return;

  const description = prompt(
    "Description:",
    event.description || ""
  );

  if (description === null) return;

  const location = prompt(
    "Location:",
    event.location || ""
  );

  if (location === null) return;

  const {
    error: updateError
  } = await sb
    .from("events")
    .update({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (updateError) {

    alert(updateError.message);

    return;
  }

  await loadEvents();

  alert("Event updated successfully.");
}


/* =========================
   ANNOUNCEMENTS
========================= */

async function loadNews() {

  setLoading(
    "newsAdmin",
    "Loading announcements..."
  );

  const {
    data,
    error
  } = await sb
    .from("announcements")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    $("newsAdmin").innerHTML =
      `<div class="row">
        <b>Unable to load announcements</b>
        <p>${escapeHTML(error.message)}</p>
      </div>`;

    return;
  }

  const news = data || [];

  if ($("newsCount")) {
    $("newsCount").textContent = news.length;
  }

  if (!news.length) {

    $("newsAdmin").innerHTML =
      `<div class="loading">
        No announcements found.
      </div>`;

    return;
  }

  $("newsAdmin").innerHTML = news.map((item) => {

    return `
      <div class="row">

        <b>${escapeHTML(item.title || "Untitled")}</b>

        <p>
          ${escapeHTML(item.content || "")}
        </p>

        <small>
          ${item.published ? "Published" : "Hidden"}
          ·
          ${escapeHTML(formatDate(item.created_at))}
        </small>

        <br>

        <button
          onclick="editNews('${item.id}')"
        >
          Edit
        </button>

        <button
          onclick="deleteRow('announcements','${item.id}',loadNews)"
        >
          Delete
        </button>

      </div>
    `;

  }).join("");
}


/* =========================
   ADD NEWS
========================= */

async function addNews() {

  const title = $("ntitle")?.value.trim();
  const content = $("nbody")?.value.trim();

  if (!title || !content) {

    alert(
      "Announcement title and content are required."
    );

    return;
  }

  const {
    error
  } = await sb
    .from("announcements")
    .insert({
      title,
      content,
      published: true
    });

  if (error) {

    alert(error.message);

    return;
  }

  $("ntitle").value = "";
  $("nbody").value = "";

  alert(
    "Announcement published successfully."
  );

  await loadNews();
}


/* =========================
   EDIT NEWS
========================= */

async function editNews(id) {

  const {
    data: item,
    error
  } = await sb
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {

    alert(error.message);

    return;
  }

  const title = prompt(
    "Announcement title:",
    item.title || ""
  );

  if (title === null) return;

  const content = prompt(
    "Announcement content:",
    item.content || ""
  );

  if (content === null) return;

  const {
    error: updateError
  } = await sb
    .from("announcements")
    .update({
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (updateError) {

    alert(updateError.message);

    return;
  }

  await loadNews();

  alert(
    "Announcement updated successfully."
  );
}


/* =========================
   GALLERY
========================= */

async function loadGallery() {

  setLoading(
    "galleryAdmin",
    "Loading gallery..."
  );

  const {
    data,
    error
  } = await sb
    .from("gallery_photos")
    .select("*")
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    $("galleryAdmin").innerHTML =
      `<div class="row">
        <b>Unable to load gallery</b>
        <p>${escapeHTML(error.message)}</p>
      </div>`;

    return;
  }

  const photos = data || [];

  if ($("galleryCount")) {
    $("galleryCount").textContent = photos.length;
  }

  if (!photos.length) {

    $("galleryAdmin").innerHTML =
      `<div class="loading">
        No photos found.
      </div>`;

    return;
  }

  $("galleryAdmin").innerHTML = photos.map((photo) => {

    return `
      <div class="galleryCard">

        <img
          src="${escapeHTML(photo.image_url || "")}"
          alt="${escapeHTML(photo.title || "Temple photo")}"
          loading="lazy"
        >

        <div class="galleryInfo">

          <b>
            ${escapeHTML(photo.title || "Untitled photo")}
          </b>

          <small>
            ${photo.published ? "Published" : "Hidden"}
          </small>

          <br>

          <button
            onclick="editPhoto('${photo.id}')"
          >
            Edit
          </button>

          <button
            onclick="deletePhoto('${photo.id}')"
          >
            Delete
          </button>

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   UPLOAD PHOTO
========================= */

async function uploadPhoto() {

  const file = $("photoFile")?.files[0];
  const title = $("photoTitle")?.value.trim();

  if (!file) {

    alert("Please choose a photo.");

    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {

    alert(
      "Please upload a JPG, PNG or WebP image."
    );

    return;
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {

    alert(
      "Image size must be less than 10 MB."
    );

    return;
  }

  showMessage(
    "uploadMsg",
    "Uploading photo..."
  );

  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  const path =
    `${crypto.randomUUID()}-${safeName}`;

  const {
    error: uploadError
  } = await sb
    .storage
    .from("temple-gallery")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) {

    showMessage(
      "uploadMsg",
      uploadError.message,
      "error"
    );

    return;
  }

  const {
    data: publicData
  } = sb
    .storage
    .from("temple-gallery")
    .getPublicUrl(path);

  const imageUrl = publicData.publicUrl;

  const {
    error: insertError
  } = await sb
    .from("gallery_photos")
    .insert({
      title: title || "Temple Photo",
      image_url: imageUrl,
      storage_path: path,
      published: true
    });

  if (insertError) {

    /* Remove uploaded file if database insert fails */

    await sb
      .storage
      .from("temple-gallery")
      .remove([path]);

    showMessage(
      "uploadMsg",
      insertError.message,
      "error"
    );

    return;
  }

  $("photoFile").value = "";
  $("photoTitle").value = "";

  showMessage(
    "uploadMsg",
    "Photo uploaded successfully.",
    "success"
  );

  await loadGallery();
}


/* =========================
   EDIT PHOTO
========================= */

async function editPhoto(id) {

  const {
    data: photo,
    error
  } = await sb
    .from("gallery_photos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {

    alert(error.message);

    return;
  }

  const title = prompt(
    "Photo title:",
    photo.title || ""
  );

  if (title === null) return;

  const {
    error: updateError
  } = await sb
    .from("gallery_photos")
    .update({
      title: title.trim()
    })
    .eq("id", id);

  if (updateError) {

    alert(updateError.message);

    return;
  }

  await loadGallery();

  alert(
    "Photo title updated successfully."
  );
}


/* =========================
   DELETE PHOTO
========================= */

async function deletePhoto(id) {

  if (
    !confirm(
      "Delete this photo permanently?"
    )
  ) {
    return;
  }

  const {
    data: photo,
    error: fetchError
  } = await sb
    .from("gallery_photos")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError) {

    alert(fetchError.message);

    return;
  }

  if (photo?.storage_path) {

    const {
      error: storageError
    } = await sb
      .storage
      .from("temple-gallery")
      .remove([photo.storage_path]);

    if (storageError) {

      console.warn(
        "Storage deletion failed:",
        storageError.message
      );
    }
  }

  const {
    error
  } = await sb
    .from("gallery_photos")
    .delete()
    .eq("id", id);

  if (error) {

    alert(error.message);

    return;
  }

  await loadGallery();
}


/* =========================
   DELETE DATABASE ROW
========================= */

async function deleteRow(
  table,
  id,
  callback
) {

  if (
    !confirm(
      "Delete this item permanently?"
    )
  ) {
    return;
  }

  const {
    error
  } = await sb
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {

    alert(error.message);

    return;
  }

  if (typeof callback === "function") {
    await callback();
  }
}


/* =========================
   SITE SETTINGS
========================= */

async function loadSettings() {

  const {
    data,
    error
  } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {

    console.error(error);

    showMessage(
      "setMsg",
      error.message,
      "error"
    );

    return;
  }

  if (!data) {

    showMessage(
      "setMsg",
      "Site settings row with ID 1 was not found.",
      "error"
    );

    return;
  }

  if ($("sname"))
    $("sname").value = data.temple_name || "";

  if ($("slocation"))
    $("slocation").value = data.location_name || "";

  if ($("stag"))
    $("stag").value = data.tagline || "";

  if ($("saddress"))
    $("saddress").value = data.address || "";

  if ($("sp1"))
    $("sp1").value = data.phone_1 || "";

  if ($("sp2"))
    $("sp2").value = data.phone_2 || "";

  if ($("swa"))
    $("swa").value = data.whatsapp_channel || "";

  if ($("sig"))
    $("sig").value = data.instagram || "";

  if ($("smap"))
    $("smap").value = data.google_maps || "";

  if ($("heroImage"))
    $("heroImage").value = data.hero_image || "";
}


/* =========================
   SAVE SETTINGS
========================= */

async function saveSettings() {

  const settings = {

    temple_name:
      $("sname")?.value.trim() || "",

    location_name:
      $("slocation")?.value.trim() || "",

    tagline:
      $("stag")?.value.trim() || "",

    address:
      $("saddress")?.value.trim() || "",

    phone_1:
      $("sp1")?.value.trim() || "",

    phone_2:
      $("sp2")?.value.trim() || "",

    whatsapp_channel:
      $("swa")?.value.trim() || "",

    instagram:
      $("sig")?.value.trim() || "",

    google_maps:
      $("smap")?.value.trim() || "",

    hero_image:
      $("heroImage")?.value.trim() || "",

    updated_at:
      new Date().toISOString()

  };

  showMessage(
    "setMsg",
    "Saving..."
  );

  const {
    error
  } = await sb
    .from("site_settings")
    .update(settings)
    .eq("id", 1);

  if (error) {

    console.error(error);

    showMessage(
      "setMsg",
      error.message,
      "error"
    );

    return;
  }

  showMessage(
    "setMsg",
    "Settings saved successfully.",
    "success"
  );
}


/* =========================
   START
========================= */

init();
