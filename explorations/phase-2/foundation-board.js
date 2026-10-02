// DISPOSABLE DESIGN-STUDY SCRIPT. Not production. It only builds the specimen board and runs the checks shown on it.
(function () {
  'use strict';

  var FONTS = [
    { id: 'commissioner', name: 'Commissioner', family: 'Commissioner' },
    { id: 'sofia', name: 'Sofia Sans', family: 'Sofia Sans' },
    { id: 'geologica', name: 'Geologica', family: 'Geologica' }
  ];

  var T = {
    enDisplay: 'Digital products built around real business needs.',
    elDisplay: 'Ψηφιακά προϊόντα για πραγματικές επιχειρηματικές ανάγκες.',
    enHead: 'AI where it creates value. Not where it creates noise.',
    elHead: 'Τεχνητή νοημοσύνη εκεί που δημιουργεί αξία. Όχι εκεί που δημιουργεί θόρυβο.',
    enBody: 'TechPi designs and builds digital products, platforms and intelligent systems for companies and institutions in Greece and Europe. We start from the business need, then choose the technology.',
    elBody: 'Η TechPi σχεδιάζει και αναπτύσσει ψηφιακά προϊόντα, πλατφόρμες και ευφυή συστήματα για επιχειρήσεις και οργανισμούς στην Ελλάδα και την Ευρώπη. Ξεκινάμε από την ανάγκη της επιχείρησης και μετά επιλέγουμε την τεχνολογία.',
    enNav: ['Work', 'Capabilities', 'EU Projects', 'About', 'Contact'],
    elNav: ['Έργα', 'Δυνατότητες', 'Ευρωπαϊκά έργα', 'Εταιρεία', 'Επικοινωνία']
  };

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  // ---------- A. display blocks ----------
  function displayBlocks(targetId, surface) {
    var host = document.getElementById(targetId);
    host.className = surface;
    FONTS.forEach(function (f) {
      var b = el('div', 'disp-block spec'); b.dataset.f = f.id;
      b.appendChild(el('p', 'cand', f.name + ' <i>English, then modern Greek</i>'));
      b.appendChild(el('p', 'disp', T.enDisplay));
      var g = el('p', 'disp', T.elDisplay); g.lang = 'el'; b.appendChild(g);
      if (f.id === 'sofia' && surface === 's-paper') {
        b.appendChild(el('p', 'sub', 'Sofia Sans Condensed, the same family at its narrow width (a possible display voice)'));
        b.appendChild(el('p', 'disp cond', T.enDisplay));
        var g2 = el('p', 'disp cond', T.elDisplay); g2.lang = 'el'; b.appendChild(g2);
      }
      host.appendChild(b);
    });
  }

  // ---------- A. specimen grid ----------
  function row(label, inner) { var r = el('div', 'row'); r.appendChild(el('p', 'rl', label)); r.insertAdjacentHTML('beforeend', inner); return r; }
  function specGrid(targetId, surface) {
    var host = document.getElementById(targetId);
    FONTS.forEach(function (f) {
      var c = el('div', 'spec-col spec ' + surface); c.dataset.f = f.id;
      c.appendChild(el('p', 'cand', f.name));
      c.appendChild(row('Medium editorial heading',
        '<p class="e-head">' + T.enHead + '</p><p class="e-head" lang="el">' + T.elHead + '</p>'));
      c.appendChild(row('Body, 18 px',
        '<p class="e-body">' + T.enBody + '</p><p class="e-body" lang="el">' + T.elBody + '</p>'));
      c.appendChild(row('Navigation, 15 px, sentence case',
        '<p class="e-nav">' + T.enNav.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</p>' +
        '<p class="e-nav" lang="el">' + T.elNav.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</p>'));
      c.appendChild(row('Small label, 14 px, and uppercase metadata, 13 px',
        '<p class="e-label">Healthcare platform · Πλατφόρμα υγείας</p>' +
        '<p class="e-label up">Healthcare platform</p><p class="e-label up" lang="el">Πλατφόρμα υγείας · Ευρωπαϊκά έργα</p>'));
      c.appendChild(row('CTA',
        '<p class="e-cta"><span class="btn">Start a project →</span><span class="btn sec">See selected work</span></p>' +
        '<p class="e-cta" lang="el" style="margin-top:10px"><span class="btn">Ξεκινήστε ένα έργο →</span><span class="btn sec">Επιλεγμένα έργα ↗</span></p>'));
      c.appendChild(row('Name and descriptor',
        '<p class="e-id">TECHPI</p><p class="e-id2">Digital Products &amp; Technology</p><p class="e-id2" lang="el">Ψηφιακά προϊόντα &amp; τεχνολογία</p>'));
      c.appendChild(row('Greek specimen: accents, dialytika, final sigma, punctuation, numerals',
        '<p class="e-gl" lang="el">ά έ ή ί ό ύ ώ<br>Ά Έ Ή Ί Ό Ύ Ώ<br>ϊ ΐ ϋ ΰ Ϊ Ϋ<br>σ ς · ; « » — …<br>0123456789 € % &amp; → ↗</p>' +
        '<p class="e-body" lang="el" style="margin-top:12px">Ξεσκεπάζω την ψυχοφθόρα βδελυγμία. Τι είναι αυτό; Προϊόν· υπηρεσία. Κόστος: 1.250,00 €, 24/7, 100%, π ≈ 3,14159.</p>'));
      c.appendChild(row('Mixed Greek and Latin',
        '<p class="e-mix" lang="el">Σχεδιάζουμε SaaS πλατφόρμες, e-commerce και AI συστήματα για B2B οργανισμούς στην ΕΕ.</p>'));
      host.appendChild(c);
    });
  }

  // ---------- A. mechanical checks ----------
  var GLYPHS = 'αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩάέήίόύώΆΈΉΊΌΎΏϊΐϋΰΪΫς·;«»0123456789&€';
  var ARROWS = '→↗';
  var cv = document.createElement('canvas'); cv.width = 900; cv.height = 140;
  var cx = cv.getContext('2d', { willReadFrequently: true });

  function hasGlyph(family, ch) {
    // If the candidate has the glyph, the fallback after it never matters, so all three widths agree.
    var w = ['monospace', 'serif', 'cursive'].map(function (fb) { cx.font = '500 64px "' + family + '", ' + fb; return cx.measureText(ch).width; });
    return Math.abs(w[0] - w[1]) < 0.01 && Math.abs(w[1] - w[2]) < 0.01;
  }
  function density(family, weight, text) {
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.fillStyle = '#000'; cx.textBaseline = 'alphabetic';
    cx.font = weight + ' 80px "' + family + '", monospace';
    cx.fillText(text, 4, 100);
    var w = cx.measureText(text).width, d = cx.getImageData(0, 0, cv.width, cv.height).data, n = 0;
    for (var i = 3; i < d.length; i += 4) n += d[i] / 255;
    return n / w;
  }
  function runChecks() {
    var tb = document.querySelector('#checks tbody'); tb.innerHTML = '';
    var anyBad = false;
    FONTS.forEach(function (f) {
      var loaded = document.fonts.check('500 20px "' + f.family + '"') && document.fonts.check('500 20px "' + f.family + '"', 'ά');
      if (!loaded) anyBad = true;
      var miss = GLYPHS.split('').filter(function (ch) { return !hasGlyph(f.family, ch); });
      var arr = ARROWS.split('').map(function (ch) { return ch + ' ' + (hasGlyph(f.family, ch) ? 'present' : 'falls back'); });
      var r4 = density(f.family, 400, 'ηοραπεσυ') / density(f.family, 400, 'noqapesu');
      var r7 = density(f.family, 700, 'ηοραπεσυ') / density(f.family, 700, 'noqapesu');
      var tr = el('tr');
      tr.innerHTML = '<td><strong>' + f.name + '</strong></td>' +
        '<td>' + (loaded ? '<span class="tag pass">Loaded</span>' : '<span class="tag fail">Not loaded</span>') + '</td>' +
        '<td>' + (loaded ? (miss.length ? '<span class="tag fail">' + miss.length + ' missing</span> ' + miss.join(' ') : '<span class="tag pass">None missing</span> of ' + GLYPHS.length) : 'not tested') + '</td>' +
        '<td>' + (loaded ? arr.join(', ') : 'not tested') + '</td>' +
        '<td>' + (loaded ? r4.toFixed(2) : '') + '</td><td>' + (loaded ? r7.toFixed(2) : '') + '</td>';
      tb.appendChild(tr);
      document.querySelectorAll('.load[data-font="' + f.family + '"]').forEach(function (s) {
        s.textContent = loaded ? 'loaded in this browser' : 'NOT LOADED. What you see is a fallback, not this typeface';
        s.classList.toggle('bad', !loaded);
      });
    });
    var w = document.getElementById('font-warning');
    w.hidden = !anyBad;
    if (anyBad) w.textContent = 'Warning: one or more candidate fonts did not load (no internet connection?). Affected specimens show a monospace fallback and must not be judged.';
  }

  // ---------- B. palette ----------
  var SRC = [
    ['#011970', 'Navy, ribbon shadow', '10.2%'], ['#0136BB', 'Deep blue', '12.2%'], ['#025EF0', 'Electric blue', '16.3%'],
    ['#07A3FC', 'Azure', '18.4%'], ['#1FDDFC', 'Cyan', '18.3%'], ['#6CEEFC', 'Light cyan', '18.1%'], ['#CBF4FC', 'Highlight', '6.5%']
  ];
  var UI = [
    ['--ink', 'Ink', 'Text on light. Dark surface. A blue-black in the logo navy’s hue, taken almost to black'],
    ['--paper', 'Paper', 'Page background. Warm off-white, set against the cool blue'],
    ['--sheet', 'Sheet', 'Raised light surface. Text on blue'],
    ['--blue', 'TechPi Blue', 'Brand surface, links, primary action. Between logo colours 2 and 3, calmer than 3'],
    ['--cyan', 'Cyan', 'Logo colour 5, unchanged. Dark surfaces only: links, focus, the arc'],
    ['--graphite', 'Graphite', 'Secondary text on light'],
    ['--slate', 'Slate', 'Tertiary text, labels, control borders'],
    ['--fog', 'Fog', 'Secondary text on Ink'],
    ['--rule', 'Rule', 'Decorative hairlines on light'],
    ['--blue-deep', 'Blue Deep (reserve)', 'Logo colour 1. Optional second brand surface']
  ];
  var css = getComputedStyle(document.documentElement);
  function v(name) { return css.getPropertyValue(name).trim().toUpperCase(); }
  function lum(hex) { var c = [1, 3, 5].map(function (i) { var x = parseInt(hex.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  function palette() {
    var s = document.getElementById('src-swatches');
    SRC.forEach(function (c, i) { s.appendChild(el('li', '', '<i style="background:' + c[0] + '"></i><div><b>' + (i + 1) + '. ' + c[0] + '</b><br><span>' + c[1] + ' · ' + c[2] + ' of clean area</span></div>')); });
    var u = document.getElementById('ui-swatches');
    UI.forEach(function (c) { u.appendChild(el('li', '', '<i style="background:var(' + c[0] + ')"></i><div><b>' + c[1] + ' ' + v(c[0]) + '</b><br><span>' + c[2] + '</span></div>')); });

    var PAIRS = [
      ['--ink', '--paper', 'Body text on light', 'text'], ['--graphite', '--paper', 'Secondary text on light', 'text'], ['--slate', '--paper', 'Labels on light', 'text'],
      ['--blue', '--paper', 'Links and focus on light', 'text'], ['--sheet', '--blue', 'Primary button label. Text on blue surface', 'text'],
      ['--paper', '--ink', 'Body text on dark', 'text'], ['--fog', '--ink', 'Secondary text on dark', 'text'], ['--cyan', '--ink', 'Links and focus on dark', 'text'],
      ['--ink', '--paper', 'Button label on dark surface (Ink on Paper pill)', 'text'], ['--blue', '--sheet', 'Button label on blue surface (blue on Sheet pill)', 'text'],
      ['--slate', '--paper', 'Control borders', 'ui'], ['--cyan', '--blue', 'Cyan on blue. Graphic use only, not planned for text', 'ui'],
      ['--rule', '--paper', 'Hairline rules. Decorative only', 'deco'],
      ['--cyan', '--paper', 'Cyan on light. Never used', 'never'], ['--blue', '--ink', 'Blue text on dark. Never used', 'never']
    ];
    var tb = document.querySelector('#contrast tbody');
    PAIRS.forEach(function (p) {
      var fg = v(p[0]), bg = v(p[1]), r = ratio(fg, bg), tag;
      if (p[3] === 'never') tag = '<span class="tag fail">Fails. Excluded by rule</span>';
      else if (p[3] === 'deco') tag = '<span class="tag warn">Decorative only</span>';
      else if (p[3] === 'ui') tag = r >= 3 ? '<span class="tag pass">Passes 3:1 for graphics</span>' : '<span class="tag fail">Fails 3:1</span>';
      else tag = r >= 7 ? '<span class="tag pass">AAA</span>' : r >= 4.5 ? '<span class="tag pass">AA</span>' : '<span class="tag fail">Fails AA</span>';
      var name = function (k) { return UI.filter(function (x) { return x[0] === k; })[0][1]; };
      tb.appendChild(el('tr', '', '<td>' + name(p[0]) + ' ' + fg + '</td><td>' + name(p[1]) + ' ' + bg + '</td>' +
        '<td><span class="cs" style="color:' + fg + ';background:' + bg + '">Τεχνολογία Aa 123</span></td>' +
        '<td><strong>' + r.toFixed(2) + ':1</strong></td><td>' + tag + '</td><td>' + p[2] + '</td>'));
    });
  }

  // ---------- D. studies ----------
  var actual = false;
  function fit() {
    document.querySelectorAll('.fr-wrap').forEach(function (w) {
      var f = w.firstElementChild, s = actual ? 1 : Math.min(1, w.clientWidth / 1440);
      f.style.transform = 'scale(' + s + ')';
      w.style.height = Math.round(900 * s) + 2 + 'px';
      w.classList.toggle('is-actual', actual);
      w.title = 'Desktop frame 1440 × 900, shown at ' + Math.round(s * 100) + '%';
    });
  }
  function controls() {
    document.querySelectorAll('.fbtn[data-f]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.getElementById('studies').dataset.f = b.dataset.f;
        document.querySelectorAll('.fbtn[data-f]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      });
    });
    var a = document.getElementById('actual');
    a.addEventListener('click', function () { actual = !actual; a.classList.toggle('is-on', actual); a.textContent = actual ? 'Fit desktop frames to the board' : 'Show desktop frames at 100%'; fit(); });
    window.addEventListener('resize', fit);
  }

  // ---------- critique ----------
  var CRIT = window.__CRIT || [], REF = window.__REFINE || [];
  function critique() {
    var b = document.getElementById('crit-body');
    CRIT.forEach(function (c) { b.appendChild(el('tr', '', '<td style="width:34%"><strong>' + c[0] + '</strong></td><td>' + c[1] + '</td>')); });
    var r = document.getElementById('refine');
    REF.forEach(function (t) { r.appendChild(el('li', '', t)); });
  }

  // ---------- run ----------
  displayBlocks('display-paper', 's-paper');
  displayBlocks('display-ink', 's-ink');
  specGrid('grid-paper', 's-paper');
  specGrid('grid-ink', 's-ink');
  palette();
  controls();
  critique();
  fit();

  var want = [];
  FONTS.forEach(function (f) { [400, 500, 700].forEach(function (w) { want.push(document.fonts.load(w + ' 40px "' + f.family + '"', 'Aaά' + GLYPHS + ARROWS)); }); });
  Promise.all(want).catch(function () {}).then(function () { return document.fonts.ready; }).then(function () { runChecks(); fit(); });
})();
