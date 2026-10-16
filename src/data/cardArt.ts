/* eslint-disable */
// @ts-nocheck: this file is kept as a near-verbatim copy of the approved JS so the
// art cannot drift; the typed API for the app lives in greetingCards.ts.
// WELL greeting card art, ported line for line from the approved design file
// site-redesign/well-collective/cards-approved-2026-10-16/cards-art.js
// (Loretta approved 2026-10-16: "Please make sure the designs stay the same").
// Every design is vector art returned as an SVG string. Do not restyle here:
// change the approved source first, then port the change.
// Only edits from the source: the class name photo-img -> wc-photo-img, the
// logo/portrait point at app assets, and the falling extras use wc- keyframes.

const LOGO = "/cards/logo.png";
const PORTRAIT = "/cards/loretta-portrait.jpg";

/* ---------- Drawing helpers: every card is vector art, crisp at any size ---------- */
function f(v) { return (+v).toFixed(1); }
function rng(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
function blob(cx, cy, r, seed, fill) {
  var R = rng(seed), n = 7, pts = [], d = "";
  for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = r * (.89 + R() * .22); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  for (var j = 0; j < n; j++) {
    var p0 = pts[(j - 1 + n) % n], p1 = pts[j], p2 = pts[(j + 1) % n], p3 = pts[(j + 2) % n];
    if (j === 0) d += "M" + f(p1[0]) + "," + f(p1[1]);
    d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + "," + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + "," + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + "," + f(p2[1]);
  }
  return '<path d="' + d + 'Z" fill="' + fill + '"/>';
}
function S(c, w) { return ' fill="none" stroke="' + c + '" stroke-width="' + (w || 2.2) + '" stroke-linecap="round" stroke-linejoin="round"'; }
function dots(seed, n, c, x0, y0, x1, y1, r) { var R = rng(seed), s = ""; for (var i = 0; i < n; i++) s += '<circle cx="' + f(x0 + R() * (x1 - x0)) + '" cy="' + f(y0 + R() * (y1 - y0)) + '" r="' + f((r || 1.6) * (.6 + R())) + '" fill="' + c + '"/>'; return s; }
function sparkle(x, y, s, c) { return '<path d="M' + x + ',' + (y - s) + ' Q' + x + ',' + y + ' ' + (x + s) + ',' + y + ' Q' + x + ',' + y + ' ' + x + ',' + (y + s) + ' Q' + x + ',' + y + ' ' + (x - s) + ',' + y + ' Q' + x + ',' + y + ' ' + x + ',' + (y - s) + 'Z" fill="' + c + '"/>'; }
function drop(x, y, s, fill, stroke) { return '<path d="M' + x + ',' + (y - s) + ' C' + f(x + s * .2) + ',' + f(y - s * .55) + ' ' + f(x + s * .72) + ',' + f(y - s * .1) + ' ' + f(x + s * .72) + ',' + f(y + s * .38) + ' A' + f(s * .72) + ',' + f(s * .72) + ' 0 1 1 ' + f(x - s * .72) + ',' + f(y + s * .38) + ' C' + f(x - s * .72) + ',' + f(y - s * .1) + ' ' + f(x - s * .2) + ',' + f(y - s * .55) + ' ' + x + ',' + (y - s) + 'Z" fill="' + (fill || "none") + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2.2"' : '') + '/>'; }
function arches(x, y, r, n, gap, c, w) { var s = ""; for (var i = 0; i < n; i++) { var rr = r - i * gap; s += '<path d="M' + f(x - rr) + ',' + y + ' A' + rr + ',' + rr + ' 0 0 1 ' + f(x + rr) + ',' + y + '"' + S(c, w || 3) + '/>'; } return s; }
function balloon(x, y, s, c) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + f(s * .78) + '" ry="' + s + '"' + S(c) + '/><path d="M' + (x - 4) + ',' + (y + s + 5) + ' L' + x + ',' + (y + s) + ' L' + (x + 4) + ',' + (y + s + 5) + 'Z"' + S(c, 1.8) + '/><path d="M' + x + ',' + (y + s + 5) + ' q 8,18 -4,34 q -10,14 2,30"' + S(c, 1.6) + '/><path d="M' + f(x - s * .35) + ',' + f(y - s * .45) + ' q ' + f(s * .15) + ',' + f(-s * .25) + ' ' + f(s * .4) + ',' + f(-s * .3) + '"' + S(c, 1.8) + '/>'; }
function flower(x, y, r, c) { var s = ""; for (var i = 0; i < 6; i++) s += '<ellipse cx="' + x + '" cy="' + (y - r) + '" rx="' + f(r * .42) + '" ry="' + f(r * .8) + '" transform="rotate(' + i * 60 + ' ' + x + ' ' + y + ')"' + S(c, 1.8) + '/>'; return s + '<circle cx="' + x + '" cy="' + y + '" r="' + f(r * .28) + '"' + S(c, 1.8) + '/>'; }
function stem(x, y, h, c) { return '<path d="M' + x + ',' + y + ' C' + (x - 8) + ',' + f(y + h * .4) + ' ' + (x + 8) + ',' + f(y + h * .7) + ' ' + x + ',' + (y + h) + '"' + S(c, 1.8) + '/><path d="M' + x + ',' + f(y + h * .45) + ' q 18,-10 26,4 q -16,10 -26,-4z"' + S(c, 1.6) + '/>'; }
function leaf(x, y, s, rot, c, fill) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><path d="M0,' + (-s) + ' C' + f(s * .6) + ',' + f(-s * .5) + ' ' + f(s * .6) + ',' + f(s * .5) + ' 0,' + s + ' C' + f(-s * .6) + ',' + f(s * .5) + ' ' + f(-s * .6) + ',' + f(-s * .5) + ' 0,' + (-s) + 'Z" ' + (fill ? 'fill="' + fill + '"' : S(c, 1.8)) + '/><path d="M0,' + f(-s * .85) + ' L0,' + f(s * .85) + '"' + S(fill ? "rgba(0,0,0,.18)" : c, 1.4) + '/></g>'; }
function sun(x, y, r, c) { var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"' + S(c) + '/>'; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += '<path d="M' + f(x + Math.cos(a) * (r + 6)) + ',' + f(y + Math.sin(a) * (r + 6)) + ' L' + f(x + Math.cos(a) * (r + 16)) + ',' + f(y + Math.sin(a) * (r + 16)) + '"' + S(c) + '/>'; } return s; }
function crown(x, y, s, c, fill) { return '<path d="M' + (x - s) + ',' + f(y + s * .5) + ' L' + (x - s) + ',' + f(y - s * .35) + ' L' + f(x - s * .5) + ',' + y + ' L' + x + ',' + f(y - s * .6) + ' L' + f(x + s * .5) + ',' + y + ' L' + (x + s) + ',' + f(y - s * .35) + ' L' + (x + s) + ',' + f(y + s * .5) + 'Z" ' + (fill ? 'fill="' + fill + '"' : S(c)) + '/><circle cx="' + x + '" cy="' + f(y - s * .72) + '" r="3.4" fill="' + c + '"/>'; }
function star(x, y, r, fill) { var s = ""; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; s += (i ? "L" : "M") + f(x + Math.cos(a) * rr) + "," + f(y + Math.sin(a) * rr); } return '<path d="' + s + 'Z" fill="' + fill + '"/>'; }
function heart(x, y, s, c, fill) { return '<path d="M' + x + ',' + f(y + s * .8) + ' C' + f(x - s * 1.4) + ',' + f(y - s * .1) + ' ' + f(x - s * .6) + ',' + f(y - s * 1.1) + ' ' + x + ',' + f(y - s * .35) + ' C' + f(x + s * .6) + ',' + f(y - s * 1.1) + ' ' + f(x + s * 1.4) + ',' + f(y - s * .1) + ' ' + x + ',' + f(y + s * .8) + 'Z" ' + (fill ? 'fill="' + fill + '"' : S(c)) + '/>'; }
function wave(x, y, w, amp, c, sw) { var d = "M" + x + "," + y; for (var i = 0; i < 6; i++) d += " q " + f(w / 12) + "," + (i % 2 ? amp : -amp) + " " + f(w / 6) + ",0"; return '<path d="' + d + '"' + S(c, sw || 6) + '/>'; }
function gift(x, y, s, c) { return '<rect x="' + (x - s) + '" y="' + f(y - s * .4) + '" width="' + s * 2 + '" height="' + f(s * 1.4) + '" rx="3"' + S(c) + '/><rect x="' + f(x - s * 1.1) + '" y="' + f(y - s * .75) + '" width="' + f(s * 2.2) + '" height="' + f(s * .4) + '" rx="2"' + S(c) + '/><path d="M' + x + ',' + f(y - s * .75) + ' L' + x + ',' + (y + s) + '"' + S(c) + '/><path d="M' + x + ',' + f(y - s * .75) + ' c -18,-22 -32,-2 0,0 c 18,-22 32,-2 0,0"' + S(c) + '/>'; }
function trophy(x, y, s, c) { return '<path d="M' + f(x - s * .7) + ',' + (y - s) + ' L' + f(x + s * .7) + ',' + (y - s) + ' C' + f(x + s * .7) + ',' + f(y - s * .1) + ' ' + f(x + s * .35) + ',' + f(y + s * .25) + ' ' + x + ',' + f(y + s * .3) + ' C' + f(x - s * .35) + ',' + f(y + s * .25) + ' ' + f(x - s * .7) + ',' + f(y - s * .1) + ' ' + f(x - s * .7) + ',' + (y - s) + 'Z"' + S(c) + '/><path d="M' + f(x - s * .7) + ',' + f(y - s * .8) + ' c -24,0 -22,30 2,30 M' + f(x + s * .7) + ',' + f(y - s * .8) + ' c 24,0 22,30 -2,30"' + S(c) + '/><path d="M' + x + ',' + f(y + s * .3) + ' L' + x + ',' + f(y + s * .75) + ' M' + f(x - s * .4) + ',' + f(y + s * .8) + ' L' + f(x + s * .4) + ',' + f(y + s * .8) + '"' + S(c) + '/>'; }
function feather(x, y, s, c) { var g = '<g transform="rotate(-28 ' + x + ' ' + y + ')"><path d="M' + x + ',' + (y + s) + ' L' + x + ',' + (y - s) + '"' + S(c, 1.8) + '/><path d="M' + x + ',' + (y - s) + ' C' + f(x + s * .55) + ',' + f(y - s * .6) + ' ' + f(x + s * .5) + ',' + f(y + s * .3) + ' ' + x + ',' + f(y + s * .7) + ' C' + f(x - s * .5) + ',' + f(y + s * .3) + ' ' + f(x - s * .55) + ',' + f(y - s * .6) + ' ' + x + ',' + (y - s) + 'Z"' + S(c, 1.8) + '/>'; for (var i = 0; i < 5; i++) { var yy = f(y - s * .6 + i * s * .26); g += '<path d="M' + x + ',' + yy + ' l ' + f(s * .32) + ',' + f(-s * .14) + ' M' + x + ',' + yy + ' l ' + f(-s * .32) + ',' + f(-s * .14) + '"' + S(c, 1.2) + '/>'; } return g + '</g>'; }
function txt(x, y, s, font, fill, size, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || "middle") + '" font-family="' + font + '" font-size="' + size + '" font-weight="' + (o.weight || 400) + '" fill="' + fill + '" letter-spacing="' + (o.ls || 0) + '"' + (o.style ? ' font-style="' + o.style + '"' : '') + '>' + s + '</text>'; }
function lines(arr, x, y, gap, font, fill, size, o) { return arr.map(function (t, i) { return txt(x, y + i * gap, t, font, fill, size, o); }).join(""); }
var F = { bold: "Bricolage Grotesque, Arial Black, sans-serif", script: "Allura, cursive", serif: "Cormorant Garamond, Georgia, serif", sans: "Plus Jakarta Sans, sans-serif" };
function svg(inner, bg) { return '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="400" fill="' + bg + '"/>' + inner + '</svg>'; }

/* ---------- Extra line-art pieces for the 12 added designs (2026-10-16) ---------- */
function candle(x, y, h, c) { return '<rect x="' + (x - 9) + '" y="' + y + '" width="18" height="' + h + '" rx="3"' + S(c) + '/><path d="M' + x + ',' + (y - 6) + ' C' + (x + 9) + ',' + (y - 16) + ' ' + (x + 3) + ',' + (y - 28) + ' ' + x + ',' + (y - 34) + ' C' + (x - 3) + ',' + (y - 28) + ' ' + (x - 9) + ',' + (y - 16) + ' ' + x + ',' + (y - 6) + 'Z"' + S(c, 1.8) + '/><path d="M' + (x - 9) + ',' + (y + 14) + ' L' + (x + 9) + ',' + (y + 8) + ' M' + (x - 9) + ',' + (y + 30) + ' L' + (x + 9) + ',' + (y + 24) + '"' + S(c, 1.6) + '/>'; }
function glass(x, y, s, tilt, c) { return '<g transform="rotate(' + tilt + ' ' + x + ' ' + (y + s) + ')"><path d="M' + (x - s * .45) + ',' + (y - s) + ' L' + (x + s * .45) + ',' + (y - s) + ' L' + (x + s * .3) + ',' + (y - s * .1) + ' Q' + x + ',' + (y + s * .1) + ' ' + (x - s * .3) + ',' + (y - s * .1) + 'Z"' + S(c) + '/><path d="M' + x + ',' + y + ' L' + x + ',' + (y + s * .9) + ' M' + (x - s * .35) + ',' + (y + s * .9) + ' L' + (x + s * .35) + ',' + (y + s * .9) + '"' + S(c) + '/></g>'; }
function mountain(x, y, w, c) { return '<path d="M' + (x - w) + ',' + y + ' L' + (x - w * .35) + ',' + (y - w * .75) + ' L' + (x - w * .1) + ',' + (y - w * .45) + ' L' + (x + w * .25) + ',' + (y - w * 1.05) + ' L' + (x + w) + ',' + y + '"' + S(c) + '/><path d="M' + (x + w * .1) + ',' + (y - w * .8) + ' L' + (x + w * .25) + ',' + (y - w * 1.05) + ' L' + (x + w * .42) + ',' + (y - w * .78) + '"' + S(c, 1.8) + '/><path d="M' + (x + w * .25) + ',' + (y - w * 1.05) + ' L' + (x + w * .25) + ',' + (y - w * 1.4) + ' L' + (x + w * .5) + ',' + (y - w * 1.3) + ' L' + (x + w * .25) + ',' + (y - w * 1.2) + '"' + S(c, 1.8) + '/>'; }
function medal(x, y, r, c, fill) { return '<path d="M' + (x - r * .7) + ',' + (y - r * 2.4) + ' L' + (x - r * .2) + ',' + (y - r * .9) + ' M' + (x + r * .7) + ',' + (y - r * 2.4) + ' L' + (x + r * .2) + ',' + (y - r * .9) + '"' + S(c, 6) + '/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * .72) + '"' + S("rgba(0,0,0,.25)", 2) + '/>' + star(x, y, r * .45, "rgba(255,255,255,.85)"); }

/* ---------- WELL palettes ---------- */
var N = { bg: "#0b1a3a", sky: "#84D8FD", gold: "#E8B04B", pink: "#F2A7C3", coral: "#F07F5E", lav: "#9b8cf2", teal: "#3fb6a8" };
var C = { bg: "#f7efe7", a: "#c9824a", b: "#e9c4b6", c: "#a98b74", ink: "#ffffff", type: "#7a4a2a" };
var K = { bg: "#173459", a: "#d99a6c", b: "#f3d2b4", ink: "#f8e7d6" };
var B = { bg: "#10302f", a: "#F07F5E", b: "#F6B6A6" };
function shapes(seed, n, area) {
  var cols = [N.sky, N.gold, N.pink, N.coral, N.lav, N.teal], R = rng(seed), s = "";
  for (var i = 0; i < n; i++) {
    var x = area[0] + R() * (area[2] - area[0]), y = area[1] + R() * (area[3] - area[1]), c = cols[Math.floor(R() * cols.length)], k = Math.floor(R() * 6), z = 10 + R() * 12;
    if (k === 0) s += sparkle(f(x), f(y), f(z), c);
    else if (k === 1) s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(z * .6) + '" fill="' + c + '"/>';
    else if (k === 2) s += arches(+f(x), f(y), z, 2, 6, c, 4);
    else if (k === 3) s += drop(+f(x), +f(y), z, c);
    else if (k === 4) s += '<path d="M' + f(x - z) + ',' + f(y) + ' A' + f(z) + ',' + f(z) + ' 0 0 1 ' + f(x + z) + ',' + f(y) + 'Z" fill="' + c + '"/>';
    else s += star(x, y, z * .7, c);
  }
  return s;
}

/* ---------- Designs: five per occasion ---------- */
var DESIGNS = {
  birthday: [
    { id: "b-shapes", name: "Party shapes", fx: ["confetti", "balloons"], draw: function () { return svg(shapes(11, 26, [10, 10, 290, 160]) + shapes(23, 14, [10, 300, 290, 395]) + '<rect x="30" y="170" width="240" height="118" rx="14" fill="' + N.bg + '"/>' + txt(150, 222, "HAPPY", F.bold, "#fff", 46, { weight: 800, ls: 2 }) + txt(150, 268, "Birthday", F.script, N.gold, 60), N.bg); } },
    { id: "b-clay", name: "Clay balloons", fx: ["balloons"], draw: function () { return svg(blob(110, 120, 120, 3, C.a) + blob(230, 300, 120, 8, C.b) + blob(60, 330, 90, 13, C.c) + balloon(110, 105, 34, C.ink) + balloon(170, 80, 28, C.ink) + balloon(205, 135, 24, C.ink) + dots(5, 24, C.ink, 40, 30, 270, 230) + txt(150, 330, "Happy Birthday", F.script, C.type, 46) + txt(150, 356, "IT IS YOUR DAY", F.sans, C.type, 11, { ls: 3, weight: 600 }), C.bg); } },
    { id: "b-copper", name: "Copper gift", fx: ["confetti"], draw: function () { return svg(dots(7, 40, K.a, 15, 15, 285, 385, 2.2) + gift(150, 125, 44, K.a) + txt(150, 238, "HAPPY", F.serif, K.ink, 22, { ls: 8, weight: 500 }) + txt(150, 298, "Birthday", F.script, K.a, 74) + txt(150, 336, "CELEBRATE YOU", F.sans, K.b, 11, { ls: 4, weight: 600 }), K.bg); } },
    { id: "b-bloom", name: "It's your day", fx: ["confetti", "balloons"], draw: function () { return svg(blob(150, 290, 125, 61, B.a) + candle(150, 236, 64, "#fff") + dots(63, 22, B.b, 20, 150, 280, 175) + txt(150, 70, "IT'S YOUR", F.bold, B.b, 40, { weight: 800 }) + txt(150, 134, "DAY!", F.bold, "#fff", 64, { weight: 800 }) + txt(150, 378, "Make a wish, queen", F.script, "#fff", 32), B.bg); } },
    { id: "b-cheers", name: "Cheers to you", fx: ["confetti"], draw: function () { return svg(arches(150, 220, 120, 3, 16, "#22427a", 6) + glass(124, 138, 40, -14, N.gold) + glass(176, 138, 40, 14, N.gold) + sparkle(150, 80, 12, N.sky) + sparkle(96, 104, 6, N.pink) + sparkle(206, 100, 7, N.pink) + dots(71, 14, N.gold, 80, 70, 220, 120) + txt(150, 290, "CHEERS TO", F.sans, N.sky, 14, { ls: 6, weight: 600 }) + txt(150, 342, "You!", F.script, N.gold, 76), N.bg); } }
  ],
  "thinking-of-you": [
    { id: "t-clay", name: "Clay bouquet", fx: ["petals"], draw: function () { return svg(blob(170, 150, 130, 21, C.b) + blob(80, 260, 110, 4, C.a) + blob(250, 360, 80, 9, C.c) + flower(130, 120, 22, C.ink) + flower(185, 150, 18, C.ink) + stem(130, 142, 110, C.ink) + stem(185, 168, 90, C.ink) + dots(31, 18, C.ink, 50, 40, 260, 220) + txt(150, 322, "Thinking", F.script, C.type, 52) + txt(150, 354, "OF YOU", F.sans, C.type, 13, { ls: 5, weight: 600 }), C.bg); } },
    { id: "t-bloom", name: "Big leaf", fx: ["petals"], draw: function () { return svg(leaf(150, 228, 118, 28, null, B.a) + leaf(76, 310, 48, -40, null, B.b) + lines(["THINKING", "OF YOU"], 150, 62, 42, F.bold, B.a, 38, { weight: 800, ls: 1 }) + txt(150, 384, "WELL COLLECTIVE", F.sans, B.b, 10, { ls: 4, weight: 600 }), B.bg); } },
    { id: "t-night", name: "Night arches", fx: ["petals"], draw: function () { return svg(arches(150, 250, 110, 5, 14, N.sky, 3) + heart(150, 205, 26, N.pink, N.pink) + sparkle(70, 90, 10, N.gold) + sparkle(240, 120, 7, N.gold) + txt(150, 318, "Sending you love", F.script, "#fff", 44) + txt(150, 348, "AND A BIG HUG", F.sans, N.sky, 11, { ls: 4, weight: 600 }), N.bg); } },
    { id: "t-copper", name: "On my mind", fx: ["petals"], draw: function () { return svg(heart(118, 140, 34, K.a) + heart(176, 120, 24, K.b) + heart(160, 178, 18, K.a) + dots(81, 30, K.a, 20, 20, 280, 380, 1.6) + txt(150, 270, "YOU ARE", F.serif, K.ink, 20, { ls: 8, weight: 500 }) + txt(150, 322, "On my mind", F.script, K.a, 56), K.bg); } },
    { id: "t-shapes", name: "Soft shapes", fx: ["petals"], draw: function () { return svg(shapes(91, 18, [10, 10, 290, 130]) + blob(150, 220, 70, 92, "#2a2f6b") + heart(150, 218, 30, N.pink, N.pink) + txt(150, 330, "Thinking of you", F.script, "#fff", 44) + txt(150, 360, "ALWAYS", F.sans, N.sky, 11, { ls: 6, weight: 600 }), N.bg); } }
  ],
  "just-saying-hi": [
    { id: "h-shapes", name: "Sunny shapes", fx: ["sparkles"], draw: function () { return svg(sun(150, 120, 34, N.gold) + wave(40, 210, 220, 16, N.pink, 7) + wave(40, 236, 220, 16, N.teal, 7) + shapes(41, 12, [10, 320, 290, 395]) + txt(150, 300, "HI THERE!", F.bold, "#fff", 50, { weight: 800 }), N.bg); } },
    { id: "h-clay", name: "Clay sun", fx: ["sparkles"], draw: function () { return svg(blob(150, 150, 140, 33, C.a) + blob(250, 350, 90, 2, C.b) + blob(40, 360, 80, 17, C.c) + sun(150, 135, 40, C.ink) + txt(150, 302, "Just saying hi", F.script, C.type, 44) + txt(150, 332, "AND THAT I MISS YOU", F.sans, C.type, 11, { ls: 3, weight: 600 }), C.bg); } },
    { id: "h-bloom", name: "Bold wave", fx: ["sparkles"], draw: function () { return svg('<path d="M0,250 C70,190 120,310 190,250 S290,200 300,230 L300,400 L0,400Z" fill="' + B.a + '"/>' + lines(["HEY", "YOU!"], 150, 120, 74, F.bold, B.b, 80, { weight: 800 }) + txt(150, 334, "Hope you are dancing today", F.script, B.bg, 25), B.bg); } },
    { id: "h-copper", name: "Hello beautiful", fx: ["sparkles"], draw: function () { return svg(wave(30, 120, 240, 14, K.a, 3) + wave(30, 140, 240, 14, K.b, 3) + wave(30, 160, 240, 14, K.a, 3) + txt(150, 250, "HELLO,", F.serif, K.ink, 26, { ls: 8, weight: 500 }) + txt(150, 312, "beautiful", F.script, K.a, 66), K.bg); } },
    { id: "h-hola", name: "Hola friend", fx: ["sparkles"], draw: function () { return svg(arches(150, 400, 170, 6, 22, N.coral, 8) + txt(150, 140, "HOLA!", F.bold, "#fff", 76, { weight: 800 }) + txt(150, 196, "friend", F.script, N.gold, 54) + sparkle(64, 70, 10, N.sky) + sparkle(240, 92, 8, N.pink), N.bg); } }
  ],
  condolences: [
    { id: "c-clay", name: "Soft leaves", fx: ["leaves"], draw: function () { return svg(blob(150, 160, 130, 7, "#cdbba8") + blob(230, 300, 90, 12, "#e5d6ca") + leaf(120, 140, 30, -30, "#fff") + leaf(160, 110, 26, 20, "#fff") + leaf(185, 160, 22, 50, "#fff") + '<path d="M150,210 C140,170 130,150 120,140"' + S("#fff", 1.8) + '/>' + txt(150, 322, "With deepest sympathy", F.script, "#6f5f52", 34) + txt(150, 352, "HOLDING YOU CLOSE", F.sans, "#6f5f52", 10, { ls: 3, weight: 600 }), "#f3eee8"); } },
    { id: "c-copper", name: "Copper feather", fx: ["leaves"], draw: function () { return svg(feather(150, 150, 70, K.a) + txt(150, 298, "In loving memory", F.script, K.ink, 40) + txt(150, 332, "WE ARE HERE FOR YOU", F.sans, K.b, 10, { ls: 3, weight: 600 }), K.bg); } },
    { id: "c-drop", name: "Gentle drop", fx: ["leaves"], draw: function () { return svg(arches(150, 230, 90, 4, 16, "#b9cbe0", 3) + drop(150, 170, 46, "none", "#3c5b7d") + txt(150, 302, "Thinking of you", F.script, "#3c5b7d", 40) + txt(150, 332, "WITH LOVE AND PRAYERS", F.sans, "#3c5b7d", 10, { ls: 3, weight: 600 }), "#e9eef4"); } },
    { id: "c-night", name: "Forever star", fx: ["leaves"], draw: function () { return svg(arches(150, 260, 100, 4, 18, "#24406f", 3) + star(150, 160, 30, "#f3e3b8") + sparkle(96, 110, 6, "#cfe7f7") + sparkle(206, 128, 5, "#cfe7f7") + txt(150, 310, "Forever in", F.script, "#fff", 40) + txt(150, 352, "OUR HEARTS", F.sans, "#b9cbe0", 12, { ls: 5, weight: 600 }), "#0e2244"); } },
    { id: "c-blush", name: "Sending love", fx: ["leaves"], draw: function () { return svg(blob(150, 170, 120, 101, "#ecd3cb") + blob(70, 300, 80, 102, "#dcc4b6") + flower(150, 120, 18, "#fff") + stem(150, 138, 100, "#fff") + leaf(118, 190, 16, -40, "#fff") + txt(150, 320, "Sending love", F.script, "#7a5a50", 44) + txt(150, 350, "AND GENTLE HUGS", F.sans, "#7a5a50", 10, { ls: 4, weight: 600 }), "#f6efea"); } }
  ],
  "youve-got-this": [
    { id: "g-bloom", name: "Big and bold", fx: ["sparkles"], draw: function () { return svg('<path d="M30,300 L80,250 L130,300 L180,250 L230,300 L280,250"' + S(B.b, 9) + '/>' + lines(["YOU'VE", "GOT", "THIS"], 150, 90, 70, F.bold, B.a, 72, { weight: 800 }) + txt(150, 372, "One step at a time, queen", F.script, B.b, 30), B.bg); } },
    { id: "g-shapes", name: "Spark shapes", fx: ["sparkles"], draw: function () { return svg(shapes(57, 22, [10, 10, 290, 150]) + star(150, 215, 46, N.gold) + txt(150, 314, "You've got this", F.script, "#fff", 48) + txt(150, 344, "I BELIEVE IN YOU", F.sans, N.sky, 11, { ls: 4, weight: 600 }), N.bg); } },
    { id: "g-crown", name: "Grab your crown", fx: ["sparkles"], draw: function () { return svg(blob(150, 150, 110, 5, "#132a55") + crown(150, 150, 56, N.gold, N.gold) + sparkle(78, 92, 9, N.pink) + sparkle(226, 104, 12, N.sky) + sparkle(210, 196, 6, N.gold) + txt(150, 298, "GRAB YOUR", F.sans, N.sky, 14, { ls: 6, weight: 600 }) + txt(150, 348, "Crown", F.script, N.gold, 76), N.bg); } },
    { id: "g-clay", name: "Keep climbing", fx: ["sparkles"], draw: function () { return svg(blob(150, 150, 130, 111, C.a) + blob(240, 330, 90, 112, C.b) + mountain(150, 210, 90, C.ink) + sun(80, 80, 16, C.ink) + txt(150, 318, "Keep going", F.script, C.type, 50) + txt(150, 350, "THE VIEW IS WORTH IT", F.sans, C.type, 10, { ls: 3, weight: 600 }), C.bg); } },
    { id: "g-fierce", name: "Strong brave fierce", fx: ["sparkles"], draw: function () { return svg(lines(["STRONG.", "BRAVE.", "FIERCE."], 150, 120, 66, F.bold, K.ink, 52, { weight: 800 }) + '<path d="M70,320 L230,320"' + S(K.a, 3) + '/>' + txt(150, 362, "That is you", F.script, K.a, 40), K.bg); } }
  ],
  "thank-you": [
    { id: "ty-disco", name: "Heart dance", fx: ["sparkles"], draw: function () { var r = 64, cx = 150, cy = 150, g = '<path d="M150,40 L150,' + (cy - r) + '"' + S(N.sky, 2) + '/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#22427a"/>', R = rng(171);
      for (var k = -2; k <= 2; k++) { var y = cy + k * r * .38, w = Math.sqrt(r * r - (y - cy) * (y - cy)); g += '<path d="M' + f(cx - w) + ',' + f(y) + ' L' + f(cx + w) + ',' + f(y) + '"' + S("#4f7fc0", 1.4) + '/>'; }
      [.32, .68].forEach(function (q) { g += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + f(r * q) + '" ry="' + r + '"' + S("#4f7fc0", 1.4) + '/>'; });
      g += '<path d="M150,' + (cy - r) + ' L150,' + (cy + r) + '"' + S("#4f7fc0", 1.4) + '/>';
      for (var i = 0; i < 14; i++) { var a = R() * Math.PI * 2, d = R() * r * .8; g += '<rect x="' + f(cx + Math.cos(a) * d - 4) + '" y="' + f(cy + Math.sin(a) * d - 4) + '" width="8" height="8" fill="' + [N.sky, "#fff", N.pink, N.gold][i % 4] + '" opacity=".85"/>'; }
      for (var j = 0; j < 8; j++) { var b = j * Math.PI / 4 + .2; g += '<path d="M' + f(cx + Math.cos(b) * (r + 10)) + ',' + f(cy + Math.sin(b) * (r + 10)) + ' L' + f(cx + Math.cos(b) * (r + 24)) + ',' + f(cy + Math.sin(b) * (r + 24)) + '"' + S(N.gold, 2.4) + '/>'; }
      return svg(g + sparkle(56, 70, 9, N.pink) + sparkle(244, 92, 11, N.sky) + txt(150, 282, "THANK YOU FOR MAKING", F.sans, N.sky, 12, { ls: 3, weight: 600 }) + txt(150, 338, "my heart dance", F.script, N.gold, 46), N.bg); } },
    { id: "ty-latte", name: "Thanks a latte", fx: ["petals"], draw: function () { return svg('<ellipse cx="150" cy="262" rx="92" ry="14" fill="' + C.c + '"/><rect x="96" y="160" width="108" height="96" rx="14" fill="' + C.a + '"/><path d="M204,182 C236,182 236,232 204,232"' + S(C.a, 11) + '/>' + heart(150, 205, 16, "#fff", "#fff") + '<path d="M128,140 C120,124 136,116 128,100 M172,140 C164,124 180,116 172,100"' + S(C.b, 3) + '/>' + heart(150, 104, 13, C.a) + txt(150, 320, "THANKS A", F.sans, C.type, 15, { ls: 6, weight: 600 }) + txt(150, 370, "latte!", F.script, C.type, 66), C.bg); } },
    { id: "ty-repeat", name: "Thank you, thank you", fx: ["confetti"], draw: function () { var s = ""; for (var i = 0; i < 5; i++) { var y = 64 + i * 46; s += '<text x="150" y="' + y + '" text-anchor="middle" font-family="' + F.bold + '" font-size="40" font-weight="800" letter-spacing="1" ' + (i === 2 ? 'fill="' + K.ink + '"' : 'fill="none" stroke="' + K.a + '" stroke-width="1.4"') + '>THANK YOU</text>'; } return svg(s + heart(150, 290, 13, K.a, K.a) + txt(150, 350, "from the bottom of my heart", F.script, K.b, 26), K.bg); } },
    { id: "ty-stamp", name: "Thank you seal", fx: ["confetti"], draw: function () { var c = '<path id="tyc" d="M150,99 a66,66 0 1,1 -0.1,0" fill="none"/>'; return svg('<defs>' + c + '</defs><circle cx="150" cy="165" r="96" fill="' + B.a + '"/><circle cx="150" cy="165" r="84" fill="none" stroke="' + B.bg + '" stroke-width="1.6" stroke-dasharray="3 5"/><text font-family="' + F.sans + '" font-size="15" font-weight="700" fill="' + B.bg + '" letter-spacing="2"><textPath href="#tyc" textLength="408">THANK YOU • THANK YOU • THANK YOU •</textPath></text>' + heart(150, 170, 26, B.bg, B.bg) + txt(150, 326, "for all you do", F.script, B.b, 46) + txt(150, 360, "WITH LOVE", F.sans, B.b, 11, { ls: 5, weight: 600 }), B.bg); } },
    { id: "ty-bouquet", name: "Bouquet for you", fx: ["petals"], draw: function () { var P = { bg: "#f6e6e4", pink: "#e99aa8", green: "#7fae9a", kraft: "#d9a77b", type: "#8a3d4f" }; return svg(leaf(104, 150, 26, -50, null, P.green) + leaf(196, 150, 26, 50, null, P.green) + '<circle cx="122" cy="132" r="24" fill="' + P.pink + '"/><circle cx="178" cy="132" r="24" fill="' + P.pink + '"/><circle cx="150" cy="104" r="26" fill="#f2b8c3"/>' + flower(122, 132, 13, "#fff") + flower(178, 132, 13, "#fff") + flower(150, 104, 14, "#fff") + '<path d="M104,170 L196,170 L150,292Z" fill="' + P.kraft + '"/><path d="M104,170 L150,292 M196,170 L150,292"' + S("#c58f63", 1.4) + '/><path d="M150,226 c-22,-18 -30,4 0,0 c22,-18 30,4 0,0 M150,226 l-10,22 M150,226 l10,22"' + S(P.type, 2.4) + '/>' + txt(150, 346, "Thank you", F.script, P.type, 56) + txt(150, 374, "THESE ARE FOR YOU", F.sans, P.type, 10, { ls: 4, weight: 600 }), P.bg); } }
  ],
  congratulations: [
    { id: "k-shapes", name: "Confetti burst", fx: ["confetti"], draw: function () { var s = ""; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; s += '<path d="M' + f(150 + Math.cos(a) * 40) + ',' + f(150 + Math.sin(a) * 40) + ' L' + f(150 + Math.cos(a) * 92) + ',' + f(150 + Math.sin(a) * 92) + '"' + S([N.gold, N.pink, N.sky, N.coral][i % 4], 4) + '/>'; } return svg(s + star(150, 150, 30, N.gold) + txt(150, 302, "CONGRATS!", F.bold, "#fff", 48, { weight: 800 }) + txt(150, 340, "You did it", F.script, N.gold, 40), N.bg); } },
    { id: "k-copper", name: "Copper star", fx: ["confetti"], draw: function () { return svg(dots(19, 50, K.a, 15, 15, 285, 385, 2) + star(150, 140, 58, K.a) + txt(150, 264, "Congratulations", F.script, K.ink, 50) + txt(150, 298, "SO PROUD OF YOU", F.sans, K.b, 11, { ls: 4, weight: 600 }), K.bg); } },
    { id: "k-clay", name: "Clay trophy", fx: ["confetti"], draw: function () { return svg(blob(140, 140, 120, 44, C.b) + blob(220, 280, 110, 6, C.a) + blob(60, 330, 70, 15, C.c) + trophy(140, 135, 46, C.ink) + dots(9, 16, C.ink, 60, 40, 240, 220) + txt(150, 322, "Way to go!", F.script, C.ink, 52), C.bg); } },
    { id: "k-yay", name: "Yay you", fx: ["confetti"], draw: function () { return svg(blob(150, 200, 125, 121, B.a) + lines(["YAY", "YOU!"], 150, 180, 78, F.bold, B.bg, 84, { weight: 800 }) + dots(123, 26, B.b, 20, 20, 280, 380, 2.4) + txt(150, 372, "You earned every bit", F.script, "#fff", 30), B.bg); } },
    { id: "k-medal", name: "Gold medal", fx: ["confetti"], draw: function () { return svg(arches(150, 230, 110, 3, 18, "#22427a", 6) + medal(150, 170, 40, N.sky, N.gold) + sparkle(84, 104, 9, N.pink) + sparkle(222, 120, 11, N.sky) + txt(150, 300, "SO PROUD", F.sans, N.sky, 14, { ls: 6, weight: 600 }) + txt(150, 350, "of you", F.script, N.gold, 64), N.bg); } }
  ]
};
var OCC = [["birthday", "Birthday"], ["thinking-of-you", "Thinking of You"], ["just-saying-hi", "Just Saying Hi"], ["condolences", "Condolences"], ["youve-got-this", "You've Got This"], ["congratulations", "Congratulations"], ["thank-you", "Thank You"], ["welcome", "Welcome from Loretta"]];
var PRINTED = {
  birthday: "Wishing you a year full of music, laughter and every reason to celebrate the FABULOUS you.",
  "thinking-of-you": "Sending you a little calm, a lot of love, and a reminder that you are never alone.",
  "just-saying-hi": "No reason at all. Just thinking of you and smiling.",
  condolences: "Holding you in my heart, today and in the days ahead.",
  "youve-got-this": "You are stronger than you know. Keep going, one step at a time.",
  congratulations: "Look at you go! Every bit of this is so well deserved.",
  "thank-you": "Thank you for being YOU. Your kindness makes every room a little brighter.",
  welcome: "You are royalty. You are beautiful. You are enough. And you are so welcome here."
};
var NOTES = {
  birthday: "Happy birthday! You light up every Tuesday class. Grab your crown, today is YOUR day!",
  "thinking-of-you": "I am thinking of you this week. Take it one breath at a time. We are all right here with you.",
  "just-saying-hi": "Hi friend! Missed your smile in class. Come dance with me soon!",
  condolences: "I am so sorry for your loss. Sending you love and strength. I am here if you need anything.",
  "youve-got-this": "I saw you shine this week and I am SO proud of you. Keep going!",
  congratulations: "You did it!! I knew you could. Let's celebrate on the dance floor!",
  "thank-you": "Thank you SO much! You made my week, and I am so grateful for you.",
  welcome: "I am SO happy you are here! Come dance with me, say hi in the community, and remember: wellness is a journey, not a destination. Let's live life lifted...together!"
};
var COVER_TITLE = { birthday: "Happy Birthday", "thinking-of-you": "Thinking of You", "just-saying-hi": "Hi There!", condolences: "With Sympathy", "youve-got-this": "You've Got This", congratulations: "Congratulations", "thank-you": "Thank You" };
var FX_FOR = { birthday: ["confetti", "balloons"], "thinking-of-you": ["petals"], "just-saying-hi": ["sparkles"], condolences: ["leaves"], "youve-got-this": ["sparkles"], congratulations: ["confetti"], "thank-you": ["sparkles", "petals"], welcome: ["confetti", "drops"] };

function welcomeCover() { return svg(blob(150, 160, 125, 52, "#12305c") + arches(150, 205, 96, 4, 15, N.sky, 3) + drop(150, 150, 44, N.gold) + sparkle(72, 96, 9, N.pink) + sparkle(232, 88, 11, N.sky) + sparkle(222, 196, 6, N.gold) + txt(150, 278, "WELCOME TO THE", F.sans, N.sky, 12, { ls: 5, weight: 600 }) + txt(150, 326, "WELL", F.bold, "#fff", 56, { weight: 800, ls: 4 }) + txt(150, 366, "Collective", F.script, N.gold, 46), N.bg); }
function photoCover(src, occ, thumb) {
  var t = COVER_TITLE[occ] || "For You";
  return '<img class="wc-photo-img" src="' + src + '" alt=""' + (thumb ? ' style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"' : '') + '>'
    + '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="pg' + (thumb ? 't' : '') + '" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#0b1a3a" stop-opacity="0"/><stop offset="1" stop-color="#0b1a3a" stop-opacity=".88"/></linearGradient></defs><rect width="300" height="400" fill="url(#pg' + (thumb ? 't' : '') + ')"/><rect x="12" y="12" width="276" height="376" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.5"/>' + txt(150, 352, t, F.script, "#fff", t.length > 12 ? 40 : 52) + '</svg>';
}
/* ---------- Inside pages: each design has its own picture, saying and printed line (2026-10-16) ----------
   [background, saying colour, accent, picture, saying lines, printed line on the right page] */
var T = { clayBg: "#f3eee8", clayInk: "#6f5f52", dropBg: "#e9eef4", dropInk: "#3c5b7d", nightBg: "#0e2244", blushBg: "#f6efea", blushInk: "#7a5a50", rose: "#f6e6e4", roseInk: "#8a3d4f" };
var INSIDE = {
  "b-shapes": [N.bg, "#fff", N.gold, function () { return star(150, 150, 34, N.gold) + sparkle(104, 118, 8, N.pink) + sparkle(198, 112, 10, N.sky); }, ["Another year of dancing", "like nobody is watching."], "Wishing you a year full of music, laughter and every reason to celebrate the FABULOUS you."],
  "b-clay": [C.bg, C.type, C.a, function () { return balloon(132, 130, 28, C.a) + balloon(172, 116, 24, C.c); }, ["Float a little higher", "this year."], "May this year lift you up, one happy balloon at a time."],
  "b-copper": [K.bg, K.ink, K.a, function () { return gift(150, 150, 36, K.a); }, ["The best gift", "is YOU."], "The best present at any party is you showing up. Happy birthday!"],
  "b-bloom": [B.bg, B.b, B.a, function () { return candle(150, 150, 50, B.a); }, ["Make a wish.", "Then go make it happen."], "Blow out the candles and grab your crown. This is YOUR day!"],
  "b-cheers": [N.bg, "#fff", N.gold, function () { return glass(130, 140, 30, -14, N.gold) + glass(170, 140, 30, 14, N.gold); }, ["You are the oldest you have", "ever been, and the youngest", "you will ever be again."], "Here's to you, and to a whole year full of reasons to celebrate. Cheers!"],
  "t-clay": [C.bg, C.type, C.a, function () { return flower(150, 130, 22, C.a) + stem(150, 152, 70, C.a); }, ["Little flowers,", "big love."], "Sending you a little calm, a lot of love, and a reminder that you are never alone."],
  "t-bloom": [B.bg, B.b, B.a, function () { return leaf(150, 160, 48, 28, null, B.a); }, ["Breathe in.", "Breathe out.", "We've got you."], "Take it one breath at a time. Your WELL family is right here with you."],
  "t-night": [N.bg, "#fff", N.pink, function () { return arches(150, 190, 60, 3, 12, N.sky, 3) + heart(150, 160, 20, N.pink, N.pink); }, ["Sending love", "all the way to you."], "Wrapping you in the biggest hug from all of us."],
  "t-copper": [K.bg, K.ink, K.a, function () { return heart(136, 150, 26, K.a) + heart(170, 136, 18, K.b); }, ["You are on my mind", "and in my heart."], "Just wanted you to know I am thinking of you today."],
  "t-shapes": [N.bg, "#fff", N.pink, function () { return shapes(92, 8, [70, 100, 230, 200]); }, ["Connection.", "Community.", "Acceptance."], "This is what we are about, and you are a big part of it."],
  "h-shapes": [N.bg, "#fff", N.gold, function () { return sun(150, 150, 26, N.gold); }, ["Don't waste today", "waiting for tomorrow."], "No reason at all. Just thinking of you and smiling."],
  "h-clay": [C.bg, C.type, C.a, function () { return sun(150, 150, 28, C.a); }, ["You make the sunny days", "even sunnier."], "Hi friend! I miss your smile. Come dance with me soon."],
  "h-bloom": [B.bg, B.b, B.a, function () { return wave(80, 150, 140, 14, B.a, 7) + wave(80, 176, 140, 14, B.b, 7); }, ["Hope you are", "dancing today!"], "Turn up your favorite song and shake it a little for me."],
  "h-copper": [K.bg, K.ink, K.a, function () { return heart(150, 150, 30, K.a); }, ["You are beautiful.", "You are enough."], "Just a little hello to remind you how special you are."],
  "h-hola": [N.bg, "#fff", N.coral, function () { return arches(150, 200, 70, 3, 14, N.coral, 6); }, ["¡Hola, hola!", "¿Cómo estás?"], "Hola, friend! Just stopping by to send you a big smile."],
  "c-clay": [T.clayBg, T.clayInk, "#cdbba8", function () { return leaf(132, 150, 26, -30, null, "#cdbba8") + leaf(170, 136, 22, 24, null, "#b9a58f"); }, ["Love never", "really leaves us."], "Holding you in my heart, today and in the days ahead."],
  "c-copper": [K.bg, K.ink, K.a, function () { return feather(150, 150, 44, K.a); }, ["Gently,", "one day at a time."], "Wishing you peace, and gentle moments of comfort."],
  "c-drop": [T.dropBg, T.dropInk, T.dropInk, function () { return drop(150, 150, 34, "none", T.dropInk); }, ["We are holding", "you close."], "Sending you love, strength and prayers. I am here whenever you need me."],
  "c-night": [T.nightBg, "#fff", "#f3e3b8", function () { return star(150, 150, 26, "#f3e3b8") + sparkle(112, 118, 5, "#cfe7f7") + sparkle(190, 128, 4, "#cfe7f7"); }, ["A light that", "keeps on shining."], "Their light lives on in every life they touched."],
  "c-blush": [T.blushBg, T.blushInk, "#dcc4b6", function () { return flower(150, 136, 18, "#c9a596") + stem(150, 154, 64, "#c9a596"); }, ["Sending you", "gentle hugs."], "There are no perfect words, only love. And there is so much of it here for you."],
  "g-bloom": [B.bg, B.b, B.a, function () { return '<path d="M90,170 L120,140 L150,170 L180,140 L210,170"' + S(B.a, 7) + '/>'; }, ["One step at a time,", "queen."], "You are stronger than you know. Keep going, one step at a time."],
  "g-shapes": [N.bg, "#fff", N.gold, function () { return star(150, 150, 34, N.gold); }, ["You are stronger", "than you know."], "I believe in you, today and every day."],
  "g-crown": [N.bg, "#fff", N.gold, function () { return crown(150, 160, 40, N.gold, N.gold); }, ["You are royalty.", "Grab your crown."], "Hold your head high. You've got this, and we've got you."],
  "g-clay": [C.bg, C.type, C.a, function () { return mountain(150, 190, 60, C.a); }, ["Every step", "counts."], "Keep climbing. The view at the top is worth every single step."],
  "g-fierce": [K.bg, K.ink, K.a, function () { return '<path d="M160,100 L128,162 L152,162 L138,214 L178,144 L154,144Z" fill="' + K.a + '"/>'; }, ["Nothing can", "dim your light."], "You have faced hard things before, and you are still standing. Go get it!"],
  "k-shapes": [N.bg, "#fff", N.gold, function () { return star(150, 150, 30, N.gold) + sparkle(106, 120, 8, N.pink) + sparkle(196, 126, 9, N.sky); }, ["This is what", "we are about!"], "Look at you go! Every bit of this is so well deserved."],
  "k-copper": [K.bg, K.ink, K.a, function () { return star(150, 150, 34, K.a); }, ["Shine on,", "superstar."], "So proud of you. Keep on shining!"],
  "k-clay": [C.bg, C.type, C.a, function () { return trophy(150, 156, 36, C.a); }, ["Hard work", "looks good on you."], "You did the work, and it shows. Way to go!"],
  "k-yay": [B.bg, B.b, B.a, function () { return dots(124, 30, B.a, 80, 100, 220, 200, 2.6); }, ["Time to", "celebrate!"], "Turn up the music, because this calls for a dance party!"],
  "k-medal": [N.bg, "#fff", N.gold, function () { return medal(150, 168, 30, N.sky, N.gold); }, ["Gold medal", "moment!"], "You earned every bit of this. I am so proud of you!"],
  "ty-disco": [N.bg, "#fff", N.gold, function () { return sparkle(150, 150, 22, N.gold) + sparkle(112, 120, 9, N.pink) + sparkle(190, 126, 11, N.sky); }, ["Thank you for", "the good vibes."], "Thank you for bringing the music, the smiles and the joy."],
  "ty-latte": [C.bg, C.type, C.a, function () { return heart(150, 150, 26, C.a, C.a) + '<path d="M138,112 C132,100 144,94 138,82 M162,112 C156,100 168,94 162,82"' + S(C.b, 3) + '/>'; }, ["You warm", "my heart."], "Thank you for being the warm cup of kindness in my day."],
  "ty-repeat": [K.bg, K.ink, K.a, function () { return heart(150, 150, 28, K.a, K.a); }, ["I could say it", "a thousand times."], "Thank you, thank you, thank you. It still does not feel like enough!"],
  "ty-stamp": [B.bg, B.b, B.a, function () { return '<circle cx="150" cy="150" r="42" fill="' + B.a + '"/>' + heart(150, 154, 18, B.bg, B.bg); }, ["Gratitude,", "sealed with love."], "Thank you for all you do. It never goes unnoticed."],
  "ty-bouquet": [T.rose, T.roseInk, "#e99aa8", function () { return '<circle cx="150" cy="150" r="26" fill="#e99aa8"/>' + flower(150, 150, 15, "#fff"); }, ["A grateful heart", "is a WELL heart."], "Thank you for being YOU. Your kindness makes every room a little brighter."]
};
function printedFor(occ, id) { return (INSIDE[id] || [])[5] || PRINTED[occ] || ""; }
function photoInside(src, occ, id) {
  // Photo inside (2026-10-16): the designed front stays, and the photo fills the inside-left page with that card's saying on a band, like the welcome card.
  var ins = INSIDE[id], q = ins ? ins[4] : ["Sent with love"], bg = ins ? ins[0] : N.bg, ink = ins ? ins[1] : "#fff", three = q.length > 2;
  return '<img class="wc-photo-img" src="' + src + '" alt="">' + '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><rect y="' + (three ? 282 : 300) + '" width="300" height="' + (three ? 118 : 100) + '" fill="' + bg + '" fill-opacity=".9"/>' + lines(q, 150, three ? 314 : 334, 24, F.serif, ink, 20, { style: "italic" }) + '<image href="' + LOGO + '" x="140" y="372" width="20" height="20"/></svg>';
}
function insideLeft(occ, id) {
  if (occ === "welcome") return '<img class="wc-photo-img" src="' + PORTRAIT + '" alt="Loretta dancing"><svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><rect y="300" width="300" height="100" fill="#0b1a3a" fill-opacity=".82"/>' + txt(150, 344, "Come dance with me", F.script, "#fff", 34) + txt(150, 372, "THE WELL COLLECTIVE", F.sans, N.sky, 10, { ls: 4, weight: 600 }) + '</svg>';
  var ins = INSIDE[id];
  if (ins) return svg(dots(id.length * 7 + 3, 16, ins[2], 20, 20, 280, 70, 1.8) + ins[3]() + lines(ins[4], 150, ins[4].length > 2 ? 250 : 262, 26, F.serif, ins[1], 21, { style: "italic" }) + '<image href="' + LOGO + '" x="134" y="350" width="32" height="32"/>', ins[0]);
  var motif = { birthday: balloon(150, 150, 40, N.gold), "thinking-of-you": heart(150, 160, 34, N.pink, N.pink), "just-saying-hi": sun(150, 160, 32, N.gold), condolences: leaf(150, 160, 42, 15, N.sky), "youve-got-this": crown(150, 165, 46, N.gold, N.gold), congratulations: star(150, 160, 44, N.gold), "thank-you": flower(150, 160, 30, N.pink) }[occ] || "";
  var quote = { birthday: ["You are the oldest you have", "ever been, and the youngest", "you will ever be again."], "thinking-of-you": ["Connection.", "Community.", "Acceptance."], "just-saying-hi": ["Don't waste today", "waiting for tomorrow."], condolences: ["Love never", "really leaves us."], "youve-got-this": ["You are beautiful.", "You are enough."], congratulations: ["This is what", "we are about!"], "thank-you": ["A grateful heart", "is a WELL heart."] }[occ] || [""];
  return svg(shapes(77, 10, [10, 10, 290, 80]) + motif + lines(quote, 150, 262, 26, F.serif, "#fff", 21, { style: "italic" }) + '<image href="' + LOGO + '" x="134" y="350" width="32" height="32"/>', N.bg);
}


export type CardFx = "confetti" | "balloons" | "petals" | "leaves" | "sparkles" | "drops";
export interface CardDesign { id: string; name: string; fx: CardFx[]; draw: () => string }

export {
  N as CARD_NIGHT, DESIGNS as CARD_DESIGNS_RAW, OCC as CARD_OCCASION_LIST, PRINTED as CARD_PRINTED,
  NOTES as CARD_SAMPLE_NOTES, COVER_TITLE as CARD_COVER_TITLE, FX_FOR as CARD_FX_FOR,
  welcomeCover, photoCover, photoInside, insideLeft, printedFor, LOGO as CARD_LOGO, PORTRAIT as CARD_PORTRAIT,
};

/* ---------- Falling extras (from the approved fx()), returns the span markup ---------- */
export function fallingExtrasHtml(kinds: CardFx[]): string {
  var R = Math.random, cols = [N.sky, N.gold, N.pink, N.coral, N.lav, N.teal, "#ffffff"], bal = [N.sky, N.pink, N.gold, N.lav, N.coral], h = "";
  kinds.forEach(function (k) {
    var n = k === "balloons" ? 7 : k === "sparkles" ? 22 : 34;
    for (var i = 0; i < n; i++) {
      var left = (R() * 100).toFixed(1) + "%", dur = (k === "balloons" ? 6 + R() * 3 : k === "leaves" ? 7 + R() * 4 : 4 + R() * 3).toFixed(2), delay = (R() * (k === "balloons" ? 2.5 : 3)).toFixed(2);
      var v = "--dx:" + ((R() - .5) * 120).toFixed(0) + "px;--rot:" + ((R() - .5) * 900).toFixed(0) + "deg;";
      if (k === "confetti") h += '<span style="left:' + left + ';width:' + (6 + R() * 6).toFixed(0) + 'px;height:' + (10 + R() * 8).toFixed(0) + 'px;background:' + cols[i % cols.length] + ';border-radius:2px;' + v + 'animation:wc-fall ' + dur + 's ' + delay + 's ease-in forwards"></span>';
      else if (k === "petals") h += '<span style="left:' + left + ';width:12px;height:16px;background:' + ["#F2A7C3", "#f6c6d6", "#ffffff"][i % 3] + ';border-radius:80% 0 80% 0;opacity:.9;' + v + 'animation:wc-fall ' + (+dur + 2) + 's ' + delay + 's linear forwards"></span>';
      else if (k === "leaves") h += '<span style="left:' + left + ';width:14px;height:20px;background:' + ["#cdbba8", "#b9cbe0", "#e5d6ca"][i % 3] + ';border-radius:0 90% 0 90%;opacity:.85;' + v + 'animation:wc-fall ' + dur + 's ' + delay + 's ease-in-out forwards"></span>';
      else if (k === "drops") h += '<span style="left:' + left + ';width:10px;height:13px;background:' + N.sky + ';border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;' + v + 'animation:wc-fall ' + dur + 's ' + delay + 's ease-in forwards"></span>';
      else if (k === "sparkles") h += '<span style="left:' + left + ';top:' + (R() * 85).toFixed(0) + '%;width:14px;height:14px;background:' + [N.gold, N.sky, "#fff"][i % 3] + ';clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);opacity:0;animation:wc-twinkle ' + (1.4 + R()).toFixed(2) + 's ' + delay + 's ease-in-out 3"></span>';
      else if (k === "balloons") h += '<span style="left:' + left + ';top:0;width:34px;height:60px;' + v + 'animation:wc-rise ' + dur + 's ' + delay + 's ease-out forwards"><svg viewBox="0 0 34 60" width="34" height="60"><ellipse cx="17" cy="20" rx="15" ry="19" fill="' + bal[i % 5] + '"/><path d="M17 39 q5 9 -2 20" stroke="#fff" stroke-opacity=".6" fill="none"/><ellipse cx="11" cy="12" rx="3" ry="5" fill="#fff" opacity=".35"/></svg></span>';
    }
  });
  return h;
}
