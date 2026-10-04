const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


const $ = (id) =>
  document.getElementById(id);


let currentUser = null;


/* =========================
   HELPERS
   ========================= */

const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );


function showMessage(
  elementId,
  message,
  success = false
) {

  const element = $(elementId);

  if (!element) return;

  element.textContent = message;

  element.className =
    success
      ? "message success"
      : "message error";

}


function setLoading(
  elementId,
  message = "Loading..."
) {

  const element = $(elementId);

  if (element) {
    element.innerHTML =
      `<div class="loading">${message}</div>`;
  }

}


function formatDate(date) {

  if (!date) return "-";

  return new Date(
    date + "T00:00:00"
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

}


/* =========================
   LOGIN
   ========================= */

async function login() {

  const email =
    $("email").value.trim();

  const password =
    $("password").value;


  if (!email || !password) {

    showMessage(
      "loginMsg",
      "Please enter email and password."
    );

    return;
  }


  showMessage(
    "loginMsg",
    "Logging in...",
    true
  );


  const {
    data,
    error
  } =
    await sb.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    showMessage(
      "loginMsg",
      error.message
    );

    return;
  }


  currentUser =
    data.user;


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
   AUTH INIT
   ========================= */

async function init() {

  const {
    data: {
      user
    }
  } =
    await sb.auth.getUser();


  if (!user) {

    $("login").classList.remove(
      "hidden"
    );

    $("app").classList.add(
      "hidden"
    );

    return;
  }


  currentUser = user;


  /* Check admin_users */

  const {
    data: admin,
    error
  } =
    await sb
      .from("admin_users")
      .select(
        "user_id, display_name"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Admin check error:",
      error
    );

    showMessage(
      "loginMsg",
      error.message
    );

    return;
  }


  if (!admin) {

    await sb.auth.signOut();

    showMessage(
      "loginMsg",
      "You are not authorized as an administrator."
    );

    return;
  }


  $("login").classList.add(
    "hidden"
  );

  $("app").classList.remove(
    "hidden"
  );


  await loadAll();

}


/* =========================
   TABS
   ========================= */

function showTab(id) {

  document
    .querySelectorAll(".tab")
    .forEach((tab) => {

      tab.classList.add(
        "hidden"
      );

    });


  const target =
    $(id);


  if (target) {

    target.classList.remove(
      "hidden"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


/* =========================
   LOAD ALL
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

  setLoading(
    "eventAdmin",
    "Loading events..."
  );


  const {
    data: events,
    error
  } =
    await sb
      .from("events")
      .select("*")
      .order(
        "event_date",
        {
          ascending: true
        }
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Events error:",
      error
    );

    $("eventAdmin").innerHTML =
      `<div class="message error">
        ${escapeHTML(error.message)}
      </div>`;

    return;
  }


  $("eventCount").textContent =
    events?.length || 0;


  if (!events || events.length === 0) {

    $("eventAdmin").innerHTML =
      `<div class="empty">
        No events added yet.
      </div>`;

    return;
  }


  $("eventAdmin").innerHTML =
    events
      .map((event) => {

        return `
          <div class="row">

            <b>
              ${escapeHTML(event.title)}
            </b>

            <span>
              📅 ${formatDate(event.event_date)}
            </span>

            ${
              event.start_time
                ? `
                  <span>
                    🕐 ${escapeHTML(
                      event.start_time
                    )}
                    ${
                      event.end_time
                        ? ` – ${escapeHTML(
                            event.end_time
                          )}`
                        : ""
                    }
                  </span>
                `
                : ""
            }

            ${
              event.location
                ? `
                  <span>
                    📍 ${escapeHTML(
                      event.location
                    )}
                  </span>
                `
                : ""
            }

            ${
              event.description
                ? `
                  <p>
                    ${escapeHTML(
                      event.description
                    )}
                  </p>
                `
                : ""
            }

            <span class="status">
              ${
                event.published
                  ? "Published"
                  : "Hidden"
              }
            </span>

            <div class="rowButtons">

              <button
                onclick="editEvent('${event.id}')"
              >
                ✏️ Edit
              </button>

              <button
                class="dangerBtn"
                onclick="deleteRow('events','${event.id}')"
              >
                🗑️ Delete
              </button>

            </div>

          </div>
        `;

      })
      .join("");

}


/* =========================
   ADD EVENT
   ========================= */

async function addEvent() {

  const title =
    $("etitle").value.trim();

  const description =
    $("edesc").value.trim();

  const event_date =
    $("edate").value;

  const start_time =
    $("estart").value;

  const end_time =
    $("eend").value;

  const location =
    $("elocation").value.trim();


  if (!title) {

    alert("Please enter event title.");

    return;
  }


  if (!event_date) {

    alert("Please select event date.");

    return;
  }


  const {
    error
  } =
    await sb
      .from("events")
      .insert({
        title,
        description,
        event_date,
        start_time:
          start_time || null,
        end_time:
          end_time || null,
        location,
        published: true
      });


  if (error) {

    alert(
      "Could not add event:\n" +
      error.message
    );

    return;
  }


  $("etitle").value = "";
  $("edesc").value = "";
  $("edate").value = "";
  $("estart").value = "";
  $("eend").value = "";
  $("elocation").value = "";


  await loadEvents();

}


/* =========================
   EDIT EVENT
   ========================= */

async function editEvent(id) {

  const {
    data: event,
    error
  } =
    await sb
      .from("events")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    alert(error.message);

    return;
  }


  const title =
    prompt(
      "Event title:",
      event.title || ""
    );


  if (title === null) return;


  const description =
    prompt(
      "Description:",
      event.description || ""
    );


  if (description === null) return;


  const location =
    prompt(
      "Location:",
      event.location || ""
    );


  if (location === null) return;


  const {
    error: updateError
  } =
    await sb
      .from("events")
      .update({
        title: title.trim(),
        description:
          description.trim(),
        location:
          location.trim(),
        updated_at:
          new Date().toISOString()
      })
      .eq("id", id);


  if (updateError) {

    alert(
      updateError.message
    );

    return;
  }


  await loadEvents();

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
    data: news,
    error
  } =
    await sb
      .from("announcements")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "News error:",
      error
    );

    $("newsAdmin").innerHTML =
      `<div class="message error">
        ${escapeHTML(error.message)}
      </div>`;

    return;
  }


  $("newsCount").textContent =
    news?.length || 0;


  if (!news || news.length === 0) {

    $("newsAdmin").innerHTML =
      `<div class="empty">
        No announcements yet.
      </div>`;

    return;
  }


  $("newsAdmin").innerHTML =
    news
      .map((item) => {

        return `
          <div class="row">

            <b>
              ${escapeHTML(item.title)}
            </b>

            <span>
              📅 ${
                item.created_at
                  ? new Date(
                      item.created_at
                    ).toLocaleDateString(
                      "en-IN"
                    )
                  : ""
              }
            </span>

            <p>
              ${escapeHTML(item.content)}
            </p>

            <span class="status">
              ${
                item.published
                  ? "Published"
                  : "Hidden"
              }
            </span>

            <div class="rowButtons">

              <button
                onclick="editNews('${item.id}')"
              >
                ✏️ Edit
              </button>

              <button
                class="dangerBtn"
                onclick="deleteRow('announcements','${item.id}')"
              >
                🗑️ Delete
              </button>

            </div>

          </div>
        `;

      })
      .join("");

}


/* =========================
   ADD NEWS
   ========================= */

async function addNews() {

  const title =
    $("ntitle").value.trim();

  const content =
    $("nbody").value.trim();


  if (!title || !content) {

    alert(
      "Please enter title and announcement."
    );

    return;
  }


  const {
    error
  } =
    await sb
      .from("announcements")
      .insert({
        title,
        content,
        published: true
      });


  if (error) {

    alert(
      "Could not publish announcement:\n" +
      error.message
    );

    return;
  }


  $("ntitle").value = "";
  $("nbody").value = "";


  await loadNews();

}


/* =========================
   EDIT NEWS
   ========================= */

async function editNews(id) {

  const {
    data: item,
    error
  } =
    await sb
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    alert(error.message);

    return;
  }


  const title =
    prompt(
      "Announcement title:",
      item.title || ""
    );


  if (title === null) return;


  const content =
    prompt(
      "Announcement:",
      item.content || ""
    );


  if (content === null) return;


  const {
    error: updateError
  } =
    await sb
      .from("announcements")
      .update({
        title: title.trim(),
        content: content.trim(),
        updated_at:
          new Date().toISOString()
      })
      .eq("id", id);


  if (updateError) {

    alert(
      updateError.message
    );

    return;
  }


  await loadNews();

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
    data: gallery,
    error
  } =
    await sb
      .from("gallery_photos")
      .select("*")
      .order(
        "sort_order",
        {
          ascending: true
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Gallery error:",
      error
    );

    $("galleryAdmin").innerHTML =
      `<div class="message error">
        ${escapeHTML(error.message)}
      </div>`;

    return;
  }


  $("galleryCount").textContent =
    gallery?.length || 0;


  if (!gallery || gallery.length === 0) {

    $("galleryAdmin").innerHTML =
      `<div class="empty">
        No gallery photos yet.
      </div>`;

    return;
  }


  $("galleryAdmin").innerHTML =
    gallery
      .map((photo) => {

        return `
          <div class="galleryCard">

            <img
              src="${escapeHTML(
                photo.image_url
              )}"
              alt="${escapeHTML(
                photo.title || ""
              )}"
            >

            <div class="galleryInfo">

              <strong>
                ${escapeHTML(
                  photo.title ||
                  "Untitled"
                )}
              </strong>

              <span>
                ${
                  photo.published
                    ? "Published"
                    : "Hidden"
                }
              </span>

              <div class="rowButtons">

                <button
                  onclick="editPhoto('${photo.id}')"
                >
                  ✏️ Edit
                </button>

                <button
                  class="dangerBtn"
                  onclick="deletePhoto('${photo.id}')"
                >
                  🗑️ Delete
                </button>

              </div>

            </div>

          </div>
        `;

      })
      .join("");

}


/* =========================
   UPLOAD GALLERY PHOTO
   ========================= */

async function uploadPhoto() {

  const file =
    $("photoFile").files[0];

  const title =
    $("photoTitle").value.trim();


  if (!file) {

    showMessage(
      "uploadMsg",
      "Please select a photo."
    );

    return;
  }


  if (file.size > 10 * 1024 * 1024) {

    showMessage(
      "uploadMsg",
      "Photo must be smaller than 10 MB."
    );

    return;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (!allowedTypes.includes(
    file.type
  )) {

    showMessage(
      "uploadMsg",
      "Only JPG, PNG and WebP are allowed."
    );

    return;
  }


  showMessage(
    "uploadMsg",
    "Uploading...",
    true
  );


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const path =
    `gallery/${crypto.randomUUID()}.${extension}`;


  const {
    error: uploadError
  } =
    await sb.storage
      .from("temple-gallery")
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );


  if (uploadError) {

    showMessage(
      "uploadMsg",
      uploadError.message
    );

    return;
  }


  const {
    data: publicData
  } =
    sb.storage
      .from("temple-gallery")
      .getPublicUrl(path);


  const image_url =
    publicData.publicUrl;


  const {
    error: dbError
  } =
    await sb
      .from("gallery_photos")
      .insert({
        title:
          title || "Temple Photo",
        image_url,
        storage_path: path,
        published: true
      });


  if (dbError) {

    await sb.storage
      .from("temple-gallery")
      .remove([path]);


    showMessage(
      "uploadMsg",
      dbError.message
    );

    return;
  }


  $("photoTitle").value = "";
  $("photoFile").value = "";


  showMessage(
    "uploadMsg",
    "Photo uploaded successfully.",
    true
  );


  await loadGallery();

}


/* =========================
   EDIT GALLERY PHOTO
   ========================= */

async function editPhoto(id) {

  const {
    data: photo,
    error
  } =
    await sb
      .from("gallery_photos")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    alert(error.message);

    return;
  }


  const title =
    prompt(
      "Photo title:",
      photo.title || ""
    );


  if (title === null) return;


  const {
    error: updateError
  } =
    await sb
      .from("gallery_photos")
      .update({
        title: title.trim()
      })
      .eq("id", id);


  if (updateError) {

    alert(
      updateError.message
    );

    return;
  }


  await loadGallery();

}


/* =========================
   DELETE GALLERY PHOTO
   ========================= */

async function deletePhoto(id) {

  if (!confirm(
    "Delete this photo?"
  )) return;


  const {
    data: photo,
    error
  } =
    await sb
      .from("gallery_photos")
      .select("storage_path")
      .eq("id", id)
      .single();


  if (error) {

    alert(error.message);

    return;
  }


  if (photo?.storage_path) {

    const {
      error: storageError
    } =
      await sb.storage
        .from("temple-gallery")
        .remove([
          photo.storage_path
        ]);


    if (storageError) {

      console.error(
        "Storage delete error:",
        storageError
      );

    }
  }


  const {
    error: deleteError
  } =
    await sb
      .from("gallery_photos")
      .delete()
      .eq("id", id);


  if (deleteError) {

    alert(
      deleteError.message
    );

    return;
  }


  await loadGallery();

}


/* =========================
   GENERIC DELETE
   ========================= */

async function deleteRow(
  table,
  id
) {

  if (!confirm(
    "Are you sure you want to delete this item?"
  )) return;


  const {
    error
  } =
    await sb
      .from(table)
      .delete()
      .eq("id", id);


  if (error) {

    alert(error.message);

    return;
  }


  if (table === "events") {

    await loadEvents();

  }


  if (table === "announcements") {

    await loadNews();

  }

}


/* =========================
   LOAD SETTINGS
   ========================= */

async function loadSettings() {

  const {
    data: settings,
    error
  } =
    await sb
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();


  if (error) {

    console.error(
      "Settings error:",
      error
    );

    return;
  }


  if (!settings) return;


  $("sname").value =
    settings.temple_name || "";


  $("slocation").value =
    settings.location_name || "";


  $("stag").value =
    settings.tagline || "";


  $("saddress").value =
    settings.address || "";


  $("sp1").value =
    settings.phone_1 || "";


  $("sp2").value =
    settings.phone_2 || "";


  $("swa").value =
    settings.whatsapp_channel || "";


  $("sig").value =
    settings.instagram || "";


  $("smap").value =
    settings.google_maps || "";


  /* Temple history */

  $("templeHistory").value =
    settings.temple_history || "";


  /* Opening photo preview */

  if (settings.hero_image) {

    $("heroPreview").src =
      settings.hero_image;

    $("heroPreview").classList.add(
      "visible"
    );

    $("heroNoPhoto").classList.add(
      "hidden"
    );

  } else {

    $("heroPreview").src = "";

    $("heroPreview").classList.remove(
      "visible"
    );

    $("heroNoPhoto").classList.remove(
      "hidden"
    );

  }

}


/* =========================
   SAVE TEMPLE HISTORY
   ========================= */

async function saveHistory() {

  const history =
    $("templeHistory").value.trim();


  showMessage(
    "historyMsg",
    "Saving...",
    true
  );


  const {
    error
  } =
    awai
