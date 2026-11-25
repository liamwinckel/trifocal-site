/* Trifocal Media site behaviour */
{
  /* ---- Forms ----
     Paste a Formspree form URL (free at formspree.io) for each form to get submissions by email.
     Left empty, the form opens the visitor's email app with their answers filled in. */
  const FORM_ENDPOINTS = {
    Contact: "",
    Careers: ""
  };
  const EMAIL = "support@trifocalmedia.com";

  /* ---- Videos ----
     Each video first looks for its own file at /assets/video/<id>.mp4. Until you add those files,
     it streams from Squarespace (which stops working once the Squarespace site is cancelled). */
  const SQ_VIDEO = "https://video.squarespace-cdn.com/content/v1/627929dc40cfe238326720cd/";
  const HLS_JS = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js";

  document.querySelectorAll(".yr").forEach(e => e.textContent = new Date().getFullYear());

  // entrance fade
  const fades = document.querySelectorAll(".fade");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -5% 0px" });
    fades.forEach(f => io.observe(f));
  } else fades.forEach(f => f.classList.add("in"));

  // mobile menu
  const burger = document.querySelector(".burger"), mnav = document.querySelector(".mnav");
  if (burger) burger.addEventListener("click", () => {
    const open = mnav.hidden;
    mnav.hidden = !open;
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  });

  // horizontal scrollers (client carousel, photo reel)
  const wire = (track, prev, next) => {
    if (!track) return;
    const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 20;
    prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); next?.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev?.click(); }
    });
  };
  document.querySelectorAll(".carousel").forEach(c => wire(c.querySelector(".slides"), c.querySelector(".prev"), c.querySelector(".next")));
  document.querySelectorAll(".reel").forEach(r => wire(r.querySelector(".reel-track"), r.querySelector(".reel-prev"), r.querySelector(".reel-next")));

  // bar charts (same data and scale as the Squarespace chart blocks)
  document.querySelectorAll(".chart-body").forEach(box => {
    const cfg = JSON.parse(box.dataset.chart);
    const labels = ["Before", "After"];
    const draw = () => {
      const W = box.clientWidth, H = box.clientHeight, L = 44, B = 22, T = 6;
      const ih = H - B - T, iw = W - L;
      let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${labels.map((l, i) => l + ": " + cfg.data[i].toLocaleString()).join(", ")}">`;
      for (let v = 0; v <= cfg.top; v += cfg.step) {
        const y = T + ih - (v / cfg.top) * ih;
        s += `<text x="${L - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
      }
      s += `<line x1="${L}" x2="${W}" y1="${T + ih}" y2="${T + ih}" stroke="#555" stroke-width="1"/>`;
      const bw = iw / cfg.data.length;
      cfg.data.forEach((v, i) => {
        const h = (v / cfg.top) * ih, x = L + i * bw + bw * .05;
        s += `<rect x="${x}" y="${T + ih - h}" width="${bw * .9}" height="${h}" fill="rgb(176,201,217)"><title>${labels[i]}: ${v.toLocaleString()}</title></rect>`;
        s += `<text x="${L + i * bw + bw / 2}" y="${H - 4}" text-anchor="middle">${labels[i]}</text>`;
      });
      box.innerHTML = s + "</svg>";
    };
    new ResizeObserver(draw).observe(box);
  });

  // videos
  let hlsLoading;
  const loadHls = () => hlsLoading ||= new Promise((res, rej) => {
    const sc = document.createElement("script"); sc.src = HLS_JS; sc.onload = () => res(window.Hls); sc.onerror = rej;
    document.head.appendChild(sc);
  });
  const attach = async v => {
    if (v.dataset.ready) return; v.dataset.ready = 1;
    const local = v.dataset.local, id = v.dataset.sq;
    try {
      const r = await fetch(local, { method: "HEAD" });
      if (r.ok && (r.headers.get("content-type") || "").includes("video")) { v.src = local; return; }
    } catch (e) {}
    const url = SQ_VIDEO + id + "/playlist.m3u8";
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; }
    try {
      const Hls = await loadHls();
      if (Hls.isSupported()) { const h = new Hls(); h.loadSource(url); h.attachMedia(v); }
    } catch (e) {}
  };
  const vids = document.querySelectorAll("video[data-sq]");
  if ("IntersectionObserver" in window) {
    const vo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { attach(e.target); vo.unobserve(e.target); } }), { rootMargin: "400px" });
    vids.forEach(v => vo.observe(v));
  } else vids.forEach(attach);

  // forms
  document.querySelectorAll("form[data-form]").forEach(form => {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      // validation: required fields + required checkbox groups
      let bad = [...form.querySelectorAll("[required]")].find(el => !el.value.trim() || (el.type === "email" && !/^\S+@\S+\.\S+$/.test(el.value)));
      const grp = form.querySelector("[data-group-required]");
      if (!bad && grp && !grp.querySelector("input:checked")) bad = grp.querySelector("input");
      if (bad) {
        status.textContent = "Please fill in all required fields" + (bad.type === "email" ? " with a valid email address." : ".");
        bad.focus(); return;
      }
      const data = new FormData(form);
      const endpoint = FORM_ENDPOINTS[form.dataset.form];
      if (endpoint) {
        status.textContent = "Sending…";
        try {
          const r = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
          if (!r.ok) throw 0;
          form.reset(); status.textContent = "Thank you!";
        } catch (err) { status.textContent = "Your message didn't send. Please email " + EMAIL + "."; }
      } else {
        const lines = [];
        for (const [k, v] of data.entries()) if (String(v).trim()) lines.push(`${k.replace(/_/g, " ")}: ${v}`);
        const subj = form.dataset.form + " form: " + (data.get("subject") || [data.get("first_name"), data.get("last_name")].join(" "));
        location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(lines.join("\n"))}`;
        status.textContent = "Your email app should open with your message ready to send.";
      }
    });
  });
}
