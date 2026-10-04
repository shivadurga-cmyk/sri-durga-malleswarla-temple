/* =========================================================
   SRI DURGA MALLESWARLA TEMPLE
   PUBLIC WEBSITE - app.js
   ========================================================= */

const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
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


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function goToPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach((page) => {
      page.classList.remove("active");
    });

  const target = $(pageId);

  if (target) {

    target.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


/* =========================================================
   GALLERY VARIABLES
   ========================================================= */

let galleryPhotos = [];
let currentGalleryIndex = 0;


/* =========================================================
   LOAD SITE SETTINGS
   ========================================================= */

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


  /* -------------------------
     Temple Name
     ------------------------- */

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


  /* -------------------------
     Tagline
     ------------------------- */

  if ($("welcomeTagline")) {

    $("welcomeTagline").textContent =
      settings.tagline ||
      "భక్తి • శక్తి • శాంతి";

  }


  /* -------------------------
     Location
     ------------------------- */

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


  /* -------------------------
     Address
     ------------------------- */

  if ($("address")) {

    $("address").textContent =
      settings.address || "-";

  }


  /* -------------------------
     Phone 1
     ------------------------- */

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


  /* -------------------------
     Phone 2
     ------------------------- */

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


  /* -------------------------
     Contact Phone
     ------------------------- */

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


  /* -------------------------
     Google Maps
     ------------------------- */

  if ($("mapLink")) {

    $("mapLink").href =
      settings.google_maps || "#";

  }


  /* -------------------------
     WhatsApp
     ------------------------- */

  if ($("wa")) {

    $("wa").href =
      settings.whatsapp_channel || "#";

  }


  /* -------------------------
     Instagram
     ------------------------- */

  if ($("ig")) {

    $("ig").href =
      settings.instagram || "#";

  }


  /* =====================================================
     TEMPLE HISTORY
     ===================================================== */

  if ($("historyContent")) {

    const history =
      settings.temple_history;

    if (
      history &&
      history.trim()
    ) {

      $("historyContent").innerHTML =
        `<p>${esc(history).replace(
          /\n/g,
          "<br>"
        )}</p>`;

    } else {

      $("historyContent").innerHTML =
        `
          <p>
            ఆలయ చరిత్ర త్వరలో అందుబాటులోకి వస్తుంది.
          </p>
        `;

    }

  }


  /* =====================================================
     OPENING PHOTO
     ===================================================== */

  if (settings.hero_image) {

    const welcome =
      $("welcomeBackground");

    if (welcome) {

      welcome.style.backgroundImage =
        `url("${settings.hero_image}")`;

    }

  }

}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

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


  if (
    !events ||
    events.length === 0
  ) {

    $("eventsList").innerHTML =
      `
        <div class="loadingText">
          ప్రస్తుతం కార్యక్రమాలు లేవు.
        </div>
      `;

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


/* =========================================================
   LOAD ANNOUNCEMENTS
   ========================================================= */

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


  if (
    !news ||
    news.length === 0
  ) {

    $("newsList").innerHTML =
      `
        <div class="loadingText">
          ప్రస్తుతం ప్రకటనలు లేవు.
        </div>
      `;

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
                    ).toLocaleDateString(
                      "te-IN"
                    )
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


/* =========================================================
   CREATE GALLERY LIGHTBOX
   ========================================================= */

function createGalleryLightbox() {

  if ($("galleryLightbox")) {
    return;
  }


  const lightbox =
    document.createElement("div");


  lightbox.id =
    "galleryLightbox";


  lightbox.innerHTML =
    `
      <div
        class="galleryLightboxBackdrop"
        id="galleryLightboxBackdrop"
      ></div>

      <div class="galleryViewer">

        <button
          type="button"
          class="galleryClose"
          id="galleryClose"
          aria-label="Close"
        >
          ✕
        </button>

        <button
          type="button"
          class="galleryPrev"
          id="galleryPrev"
          aria-label="Previous photo"
        >
          ❮
        </button>

        <img
          id="galleryViewerImage"
          src=""
          alt=""
        >

        <button
          type="button"
          class="galleryNext"
          id="galleryNext"
          aria-label="Next photo"
        >
          ❯
        </button>

        <div
          class="galleryViewerCaption"
          id="galleryViewerCaption"
        ></div>

        <div
          class="galleryViewerCounter"
          id="galleryViewerCounter"
        ></div>

      </div>
    `;


  document.body.appendChild(
    lightbox
  );


  /* -------------------------
     Close
     ------------------------- */

  $("galleryClose")
    .addEventListener(
      "click",
      closeGallery
    );


  $("galleryLightboxBackdrop")
    .addEventListener(
      "click",
      closeGallery
    );


  /* -------------------------
     Previous
     ------------------------- */

  $("galleryPrev")
    .addEventListener(
      "click",
      function (event) {

        event.stopPropagation();

        showGalleryPhoto(
          currentGalleryIndex - 1
        );

      }
    );


  /* -------------------------
     Next
     ------------------------- */

  $("galleryNext")
    .addEventListener(
      "click",
      function (event) {

        event.stopPropagation();

        showGalleryPhoto(
          currentGalleryIndex + 1
        );

      }
    );

}


/* =========================================================
   OPEN GALLERY PHOTO
   ========================================================= */

function openGallery(index) {

  if (
    !galleryPhotos ||
    galleryPhotos.length === 0
  ) {
    return;
  }


  createGalleryLightbox();


  currentGalleryIndex =
    index;


  showGalleryPhoto(
    currentGalleryIndex
  );


  const lightbox =
    $("galleryLightbox");


  if (lightbox) {

    lightbox.classList.add(
      "open"
    );


    document.body.classList.add(
      "gallery-open"
    );

  }

}


/* =========================================================
   SHOW CURRENT GALLERY PHOTO
   ========================================================= */

function showGalleryPhoto(index) {

  if (
    !galleryPhotos ||
    galleryPhotos.length === 0
  ) {
    return;
  }


  if (
    index < 0
  ) {

    index =
      galleryPhotos.length - 1;

  }


  if (
    index >= galleryPhotos.length
  ) {

    index = 0;

  }


  currentGalleryIndex =
    index;


  const photo =
    galleryPhotos[
      currentGalleryIndex
    ];


  const image =
    $("galleryViewerImage");


  const caption =
    $("galleryViewerCaption");


  const counter =
    $("galleryViewerCounter");


  if (image) {

    image.src =
      photo.image_url;

    image.alt =
      photo.title ||
      "అమ్మవారి చిత్రం";

  }


  if (caption) {

    caption.textContent =
      photo.title || "";

  }


  if (counter) {

    counter.textContent =
      `${currentGalleryIndex + 1} / ${galleryPhotos.length}`;

  }

}


/* =========================================================
   CLOSE GALLERY
   ========================================================= */

function closeGallery() {

  const lightbox =
    $("galleryLightbox");


  if (lightbox) {

    lightbox.classList.remove(
      "open"
    );

  }


  document.body.classList.remove(
    "gallery-open"
  );

}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

    const lightbox =
      $("galleryLightbox");


    if (
      !lightbox ||
      !lightbox.classList.contains("open")
    ) {
      return;
    }


    if (
      event.key === "Escape"
    ) {

      closeGallery();

      return;

    }


    if (
      event.key === "ArrowLeft"
    ) {

      showGalleryPhoto(
        currentGalleryIndex - 1
      );

      return;

    }


    if (
      event.key === "ArrowRight"
    ) {

      showGalleryPhoto(
        currentGalleryIndex + 1
      );

    }

  }
);


/* =========================================================
   LOAD GALLERY
   ========================================================= */

async function loadGallery() {

  const {
    data: gallery,
    error
  } = await sb
    .from("gallery_photos")
    .select(
      "id, title, image_url, storage_path, sort_order, created_at, published"
    )
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


    if ($("galleryGrid")) {

      $("galleryGrid").innerHTML =
        `
          <div class="loadingText">
            ఫోటోలను లోడ్ చేయడంలో సమస్య ఏర్పడింది.
          </div>
        `;

    }

    return;

  }


  galleryPhotos =
    gallery || [];


  if (!$("galleryGrid")) {
    return;
  }


  /* -------------------------
     No photos
     ------------------------- */

  if (
    galleryPhotos.length === 0
  ) {

    $("galleryGrid").innerHTML =
      `
        <div class="loadingText">
          ఫోటోలు త్వరలో అందుబాటులోకి వస్తాయి.
        </div>
      `;

    return;

  }


  /* -------------------------
     Gallery cards
     ------------------------- */

  $("galleryGrid").innerHTML =
    galleryPhotos
      .map(
        (photo, index) => {

          return `
            <button
              type="button"
              class="galleryItem"
              data-gallery-index="${index}"
              aria-label="${
                esc(
                  photo.title ||
                  "Open photo"
                )
              }"
            >

              <img
                src="${esc(
                  photo.image_url
                )}"
                alt="${esc(
                  photo.title ||
                  "అమ్మవారి చిత్రం"
                )}"
                loading="lazy"
              >

              ${
                photo.title
                  ? `
                    <span class="galleryTitle">
                      ${esc(
                        photo.title
                      )}
                    </span>
                  `
                  : ""
              }

            </button>
          `;

        }
      )
      .join("");


  /* -------------------------
     Add click events
     ------------------------- */

  document
    .querySelectorAll(
      ".galleryItem"
    )
    .forEach(
      (item) => {

        item.addEventListener(
          "click",
          function () {

            const index =
              Number(
                this.dataset.galleryIndex
              );


            openGallery(index);

          }
        );

      }
    );


  createGalleryLightbox();

}


/* =========================================================
   GALLERY STYLES
   ========================================================= */

function addGalleryStyles() {

  if ($("galleryDynamicStyles")) {
    return;
  }


  const style =
    document.createElement("style");


  style.id =
    "galleryDynamicStyles";


  style.textContent =
    `
      /* =========================================
         PUBLIC PHOTO GALLERY
         ========================================= */

      .galleryItem {

        position: relative;

        display: block;

        width: 100%;

        padding: 0;

        border: 0;

        background: transparent;

        cursor: pointer;

        overflow: hidden;

        border-radius: 14px;

      }


      .galleryItem img {

        display: block;

        width: 100%;

        height: 220px;

        object-fit: cover;

        transition:
          transform 0.35s ease,
          filter 0.35s ease;

      }


      .galleryItem:hover img {

        transform: scale(1.05);

        filter: brightness(0.88);

      }


      .galleryTitle {

        position: absolute;

        left: 0;

        right: 0;

        bottom: 0;

        padding: 10px;

        color: white;

        background:
          linear-gradient(
            transparent,
            rgba(0,0,0,0.78)
          );

        text-align: left;

        font-size: 14px;

      }


      /* =========================================
         LIGHTBOX
         ========================================= */

      #galleryLightbox {

        position: fixed;

        inset: 0;

        z-index: 99999;

        display: none;

        align-items: center;

        justify-content: center;

      }


      #galleryLightbox.open {

        display: flex;

      }


      .galleryLightboxBackdrop {

        position: absolute;

        inset: 0;

        background:
          rgba(0,0,0,0.94);

      }


      .galleryViewer {

        position: relative;

        z-index: 2;

        width: 100%;

        height: 100%;

        display: flex;

        align-items: center;

        justify-content: center;

        padding: 70px 70px 90px;

      }


      #galleryViewerImage {

        max-width: 92vw;

        max-height: 82vh;

        width: auto;

        height: auto;

        object-fit: contain;

        border-radius: 8px;

        box-shadow:
          0 15px 60px
          rgba(0,0,0,0.7);

        user-select: none;

        -webkit-user-drag: none;

      }


      .galleryClose,
      .galleryPrev,
      .galleryNext {

        position: absolute;

        z-index: 5;

        border: 0;

        color: white;

        background:
          rgba(0,0,0,0.55);

        cursor: pointer;

        display: flex;

        align-items: center;

        justify-content: center;

        transition:
          background 0.2s ease,
          transform 0.2s ease;

      }


      .galleryClose:hover,
      .galleryPrev:hover,
      .galleryNext:hover {

        background:
          rgba(255,255,255,0.22);

        transform: scale(1.08);

      }


      .galleryClose {

        top: 20px;

        right: 20px;

        width: 46px;

        height: 46px;

        border-radius: 50%;

        font-size: 24px;

      }


      .galleryPrev,
      .galleryNext {

        top: 50%;

        width: 50px;

        height: 50px;

        margin-top: -25px;

        border-radius: 50%;

        font-size: 22px;

      }


      .galleryPrev {

        left: 18px;

      }


      .galleryNext {

        right: 18px;

      }


      .galleryViewerCaption {

        position: absolute;

        left: 20px;

        right: 20px;

        bottom: 45px;

        z-index: 5;

        color: white;

        text-align: center;

        font-size: 17px;

        font-weight: 600;

        text-shadow:
          0 2px 5px rgba(0,0,0,0.8);

      }


      .galleryViewerCounter {

        position: absolute;

        left: 0;

        right: 0;

        bottom: 18px;

        z-index: 5;

        color: rgba(255,255,255,0.8);

        text-align: center;

        font-size: 13px;

      }


      body.gallery-open {

        overflow: hidden;

      }


      /* =========================================
         MOBILE
         ========================================= */

      @media (max-width: 700px) {

        .galleryItem img {

          height: 180px;

        }


        .galleryViewer {

          padding:
            60px 55px 85px;

        }


        #galleryViewerImage {

          max-width: 94vw;

          max-height: 72vh;

        }


        .galleryClose {

          top: 12px;

          right: 12px;

          width: 42px;

          height: 42px;

          font-size: 20px;

        }


        .galleryPrev,
        .galleryNext {

          width: 42px;

          height: 42px;

          margin-top: -21px;

          font-size: 18px;

        }


        .galleryPrev {

          left: 8px;

        }


        .galleryNext {

          right: 8px;

        }


        .galleryViewerCaption {

          bottom: 43px;

          font-size: 15px;

        }

      }


      @media (max-width: 420px) {

        .galleryItem img {

          height: 150px;

        }

        .galleryViewer {

          padding-left: 48px;

          padding-right: 48px;

        }

      }

    `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   INITIALIZE WEBSITE
   ========================================================= */

async function loadWebsite() {

  addGalleryStyles();

  await Promise.all([
    loadSettings(),
    loadEvents(),
    loadNews(),
    loadGallery()
  ]);

}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadWebsite();

  }
);
