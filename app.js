const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


/* =========================
   HELPERS
   ========================= */

const $ = (id) => document.getElementById(id);

const esc = (value) =>
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


function formatDate(date) {

  if (!date) return "";

  return new Date(
    date + "T00:00:00"
  ).toLocaleDateString("te-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


/* =========================
   PAGE NAVIGATION
   ========================= */

function goToPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach((page) => {
      page.classList.remove("active");
    });

  const target = $(pageId);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   LOAD SETTINGS
   ========================= */

async function loadSettings() {

  const {
    data: settings,
    error
  } = await sb
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {

    console.error(
      "Site settings error:",
      error
    );

    return;
  }


  if (!settings) return;


  /* Temple name */

  if ($("welcomeTempleName")) {
    $("welcomeTempleName").textContent =
      settings.temple_name ||
      "శ్రీ దుర్గా మల్లేశ్వరాలయం";
  }


  if ($("introTempleName")) {
    $("introTempleName").textContent =
      settings.temple_name ||
      "శ్రీ దుర్గా మల్లేశ్వరాలయం";
  }


  if ($("footerTempleName")) {
    $("footerTempleName").textContent =
      settings.temple_name ||
      "శ్రీ దుర్గా మల్లేశ్వరాలయం";
  }


  /* Tagline */

  if ($("welcomeTagline")) {
    $("welcomeTagline").textContent =
      settings.tagline ||
      "భక్తి • శక్తి • శాంతి";
  }


  /* Location */

  if ($("introLocation")) {
    $("introLocation").textContent =
      settings.location_name || "";
  }


  if ($("locationName")) {
    $("locationName").textContent =
      settings.location_name || "";
  }


  if ($("footerLocation")) {
    $("footerLocation").textContent =
      settings.location_name || "";
  }


  /* Address */

  if ($("address")) {
    $("address").textContent =
      settings.address || "-";
  }


  /* Phone 1 */

  if ($("phone1")) {

    $("phone1").textContent =
      settings.phone_1 || "-";

    if (settings.phone_1) {

      $("phone1").href =
        "tel:+91" +
        String(settings.phone_1)
          .replace(/\s+/g, "");

    }
  }


  /* Phone 2 */

  if ($("phone2")) {

    $("phone2").textContent =
      settings.phone_2 || "-";

    if (settings.phone_2) {

      $("phone2").href =
        "tel:+91" +
        String(settings.phone_2)
          .replace(/\s+/g, "");

    }
  }


  /* Contact phone */

  if ($("contactPhone1")) {

    if (settings.phone_1) {

      $("contactPhone1").href =
        "tel:+91" +
        String(settings.phone_1)
          .replace(/\s+/g, "");

    } else {

      $("contactPhone1").href = "#";

    }
  }


  if ($("contactPhoneText")) {

    $("contactPhoneText").textContent =
      settings.phone_1 || "-";

  }


  /* Google Maps */

  if ($("mapLink")) {

    $("mapLink").href =
      settings.google_maps || "#";

  }


  /* WhatsApp */

  if ($("wa")) {

    $("wa").href =
      settings.whatsapp_channel || "#";

  }


  /* Instagram */

  if ($("ig")) {

    $("ig").href =
      settings.instagram || "#";

  }


  /* =========================
     TEMPLE HISTORY
     ========================= */

  if ($("historyContent")) {

    const history =
      settings.temple_history;

    if (history && history.trim()) {

      $("historyContent").innerHTML =
        `<p>${esc(history).replace(/\n/g, "<br>")}</p>`;

    } else {

      $("historyContent").innerHTML =
        `<p>
          ఆలయ చరిత్ర త్వరలో అందుబాటులోకి వస్తుంది.
        </p>`;

    }
  }


  /* =========================
     OPENING PHOTO
     ========================= */

  if (settings.hero_image) {

    const welcome =
      $("welcomeBackground");

    if (welcome) {

      welcome.style.backgroundImage =
        `url("${settings.hero_image}")`;

    }

  }

}


/* =========================
   LOAD EVENTS
   ========================= */

async function loadEvents() {

  const {
    data: events,
    error
  } = await sb
    .from("events")
    .select("*")
    .eq("published", true)
    .order("event_date", {
      ascending: true
    })
    .order("sort_order", {
      ascending: true
    });


  if (error) {

    console.error(
      "Events error:",
      error
    );

  }


  if (!$("eventsList")) return;


  if (!events || events.length === 0) {

    $("eventsList").innerHTML =
      `<div class="loadingText">
        ప్రస్తుతం కార్యక్రమాలు లేవు.
      </div>`;

    return;
  }


  $("eventsList").innerHTML =
    events
      .map((event) => {

        const time =
          event.start_time
            ? `
              <p>
                🕐 ${esc(event.start_time)}
                ${
                  event.end_time
                    ? ` – ${esc(event.end_time)}`
                    : ""
                }
              </p>
            `
            : "";


        const location =
          event.location
            ? `
              <p>
                📍 ${esc(event.location)}
              </p>
            `
            : "";


        return `
          <article class="card">

            <div class="date">
              ${formatDate(event.event_date)}
            </div>

            <h3>
              ${esc(event.title)}
            </h3>

            ${
              event.description
                ? `
                  <p>
                    ${esc(event.description)}
                  </p>
                `
                : ""
            }

            ${time}

            ${location}

          </article>
        `;

      })
      .join("");

}


/* =========================
   LOAD ANNOUNCEMENTS
   ========================= */

async function loadNews() {

  const {
    data: news,
    error
  } = await sb
    .from("announcements")
    .select("*")
    .eq("published", true)
    .order("created_at", {
      ascending: false
    })
    .limit(6);


  if (error) {

    console.error(
      "Announcements error:",
      error
    );

  }


  if (!$("newsList")) return;


  if (!news || news.length === 0) {

    $("newsList").innerHTML =
      `<div class="loadingText">
        ప్రస్తుతం ప్రకటనలు లేవు.
      </div>`;

    return;
  }


  $("newsList").innerHTML =
    news
      .map((item) => {

        return `
          <article class="card">

            <div class="date">
              ${
                item.created_at
                  ? new Date(
                      item.created_at
                    ).toLocaleDateString("te-IN")
                  : ""
              }
            </div>

            <h3>
              ${esc(item.title)}
            </h3>

            <p>
              ${esc(item.content)}
            </p>

          </article>
        `;

      })
      .join("");

}


/* =========================
   LOAD GALLERY
   ========================= */

async function loadGallery() {

  const {
    data: gallery,
    error
  } = await sb
    .from("gallery_photos")
    .select("*")
    .eq("published", true)
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Gallery error:",
      error
    );

  }


  if (!$("galleryGrid")) return;


  if (!gallery || gallery.length === 0) {

    $("galleryGrid").innerHTML =
      `<div class="loadingText">
        ఫోటోలు త్వరలో అందుబాటులోకి వస్తాయి.
      </div>`;

    return;
  }


  $("galleryGrid").innerHTML =
    gallery
      .map((photo) => {

        return `
          <img
            src="${esc(photo.image_url)}"
            alt="${esc(
              photo.title ||
              "అమ్మవారి చిత్రం"
            )}"
            loading="lazy"
          >
        `;

      })
      .join("");

}


/* =========================
   LOAD EVERYTHING
   ========================= */

async function load() {

  await loadSettings();

  await Promise.all([
    loadEvents(),
    loadNews(),
    loadGallery()
  ]);

}


/* =========================
   START
   ========================= */

load().catch((error) => {

  console.error(
    "Website loading error:",
    error
  );

});
