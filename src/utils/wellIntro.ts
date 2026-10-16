// The WELL logo intro with its sound, the same one the website plays on its home page.
// In the app it plays right after a member taps a class, so the tap lets the sound play
// (Loretta, 2026-10-16: the in-app browser never showed the intro and blocked the sound).
// Once per app session, like the website's once per visit.
let played = false;

const CSS = `
.wl-app-splash { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; background: #020810; pointer-events: none; animation: wlAppOut .6s ease 2.4s forwards; }
.wl-app-splash img { width: min(46vw, 260px); height: auto; opacity: 0; transform: scale(.86); animation: wlAppLogoIn 1.7s cubic-bezier(.2,.7,.2,1) .2s forwards; position: relative; z-index: 1; }
.wl-app-splash::after { content: ""; position: absolute; width: min(70vw, 420px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(1,145,206,.35), rgba(1,145,206,0) 60%); opacity: 0; animation: wlAppGlow 2.4s ease .3s forwards; }
@keyframes wlAppLogoIn { 60% { opacity: 1; transform: scale(1.02); filter: drop-shadow(0 0 24px rgba(132,216,253,.55)); } to { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 10px rgba(132,216,253,.25)); } }
@keyframes wlAppGlow { 50% { opacity: 1; } to { opacity: .4; transform: scale(1.3); } }
@keyframes wlAppOut { to { opacity: 0; visibility: hidden; } }
`;

/** Plays the intro (once per session) and resolves when the logo has shown, about 2.4 s. */
export function playWellIntro(): Promise<void> {
  if (played) return Promise.resolve();
  played = true;
  if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  if (!document.getElementById("wl-app-splash-css")) {
    const st = document.createElement("style");
    st.id = "wl-app-splash-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement("div");
  el.className = "wl-app-splash";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<img src="/sounds/well-logo-white.png" alt="">';
  document.body.appendChild(el);
  try {
    const a = new Audio("/sounds/well-intro.mp3");
    a.volume = 0.6;
    a.play()?.catch(() => { /* sound blocked: the logo still plays */ });
  } catch { /* no audio: the logo still plays */ }
  return new Promise((resolve) => {
    setTimeout(resolve, 2400);
    setTimeout(() => el.remove(), 3100);
  });
}

/** Classes and the video library home get the intro; account, checkout, blog and events do not. */
export function isClassLink(url: string): boolean {
  return /^https:\/\/lorettabates\.com\/videolibrary\.lorettabates\.com\/(wpstream_vod\/[^?#]|$|\?|#)/.test(url);
}
