const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));

function formatDate(date) {
  if (!date) return "";

  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

async function load() {
  /* =========================
     TEMPLE SETTINGS
     ========================= */

  const { data: settings, error: settingsError } =
    await sb
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

  if (settingsError) {
    console.error("Settings error:", settingsError);
  }

  if (settings) {
    if ($("templeName")) {
      $("templeName").textContent =
        settings.temple_name || "Sri Durga Malleswarla Temple";
    }

    if ($("tagline")) {
      $("tagline").textContent =
        settings.tagline ? `“${settings.tagline}”` : "";
    }

    if ($("address")) {
      $("address").textContent = settings.address || "";
    }

    if ($("phone1")) {
      $("phone1").textContent = settings.phone_1 || "";

      if (settings.phone_1) {
        $("phone1").href = `tel:+91${settings.phone_1}`;
      }
    }

    if ($("phone2")) {
      $("phone2").textContent = settings.phone_2 || "";

      if (settings.phone_2) {
        $("phone2").href = `tel:+91${settings.phone_2}`;
      }
    }

    if ($("mapLink")) {
      $("mapLink").href = settings.google_maps || "#";
    }

    if ($("wa")) {
      $("wa").href = settings.whatsapp_channel || "#";
    }

    if ($("ig")) {
      $("ig").href = settings.instagram || "#";
    }

    if (settings.hero_image) {
      const hero = document.querySelector(".hero");

      if (hero) {
        hero.style.backgroundImage =
          `url("${settings.hero_image}")`;
      }
    }
  }


  /* =========================
     EVENTS
     ========================= */

  const { data: events, error: eventsError } =
    await sb
      .from("events")
      .select("*")
      .eq("published", true)
      .order("event_date", { ascending: true })
      .order("sort_order", { ascending: true });

  if (eventsError) {
    console.error("Events error:", eventsError);
  }

  if ($("eventsList")) {
    $("eventsList").innerHTML =
      (events || [])
        .map((event) => `
          <article class="card">

            <div class="date">
              ${formatDate(event.event_date)}
            </div>

            <h3>
              ${esc(event.title)}
            </h3>

            ${
              event.description
                ? `<p>${esc(event.description)}</p>`
                : ""
            }

            ${
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
                : ""
            }

            ${
              event.location
                ? `
                  <p>
                    📍 ${esc(event.location)}
                  </p>
                `
                : ""
            }

          </article>
        `)
        .join("") ||
      "<p>ప్రస్తుతం కార్యక్రమాలు లేవు.</p>";
  }


  /* =========================
     ANNOUNCEMENTS
     ========================= */

  const { data: news, error: newsError } =
    await sb
      .from("announcements")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(6);

  if (newsError) {
    console.error("Announcements error:", newsError);
  }

  if ($("newsList")) {
    $("newsList").innerHTML =
      (news || [])
        .map((item) => `
          <article class="card">

            <div class="date">
              ${new Date(item.created_at).toLocaleDateString("te-IN")}
            </div>

            <h3>
              ${esc(item.title)}
            </h3>

            <p>
              ${esc(item.content)}
            </p>

          </article>
        `)
        .join("") ||
      "<p>ప్రకటనలు లేవు.</p>";
  }


  /* =========================
     GALLERY
     ========================= */

  const { data: gallery, error: galleryError } =
    await sb
      .from("gallery_photos")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

  if (galleryError) {
    console.error("Gallery error:", galleryError);
  }

  if ($("galleryGrid")) {
    $("galleryGrid").innerHTML =
      (gallery || [])
        .map((photo) => `
          <img
            src="${esc(photo.image_url)}"
            alt="${esc(photo.title || "అమ్మవారి చిత్రం")}"
            loading="lazy"
          >
        `)
        .join("") ||
      "<p>ఫోటోలు త్వరలో అందుబాటులోకి వస్తాయి.</p>";
  }
}


/* =========================
   START WEBSITE
   ========================= */

load().catch((error) => {
  console.error("Website loading error:", error);
});
