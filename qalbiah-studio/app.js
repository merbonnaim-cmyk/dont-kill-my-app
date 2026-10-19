(function () {
  'use strict';
  var E = window.QalbiahEngine;
  var $ = function (id) { return document.getElementById(id); };
  var STORE = 'qalbiah-studio:last';
  var FIELDS = ['topic', 'scenes', 'setting', 'mood', 'style', 'duration', 'hasProphet', 'veilCompanions'];
  var ACT_ORDER = ['hook', 'rise', 'climax', 'finale'];
  var state = { variant: 0, project: null };

  function readForm() {
    var o = {};
    FIELDS.forEach(function (f) { var el = $(f); o[f] = el.type === 'checkbox' ? el.checked : el.value; });
    o.variant = state.variant;
    return o;
  }

  function writeForm(o) {
    FIELDS.forEach(function (f) {
      if (!(f in o)) return;
      var el = $(f);
      if (el.type === 'checkbox') el.checked = !!o[f]; else el.value = o[f];
    });
    $('scenesOut').textContent = $('scenes').value;
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ form: readForm(), variant: state.variant })); } catch (e) { /* приватный режим */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return false;
      var d = JSON.parse(raw);
      writeForm(d.form || {});
      state.variant = d.variant | 0;
      return !!(d.form && d.form.topic);
    } catch (e) { return false; }
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  function copy(text) {
    var done = function () { toast('Скопировано'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Имя файла латиницей: часть браузеров отбрасывает кириллицу в атрибуте download.
  var TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function slug(s) {
    var latin = s.toLowerCase().replace(/[а-яё]/g, function (c) { return TR[c]; });
    return (latin.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'story');
  }

  // Подсветка меток [ПРОВЕРИТЬ ...] без innerHTML с пользовательским текстом.
  function setMarked(el, text) {
    el.textContent = '';
    text.split(/(\[ПРОВЕРИТЬ[^\]]*\])/).forEach(function (part) {
      if (!part) return;
      if (/^\[ПРОВЕРИТЬ/.test(part)) { var m = document.createElement('mark'); m.textContent = part; el.appendChild(m); }
      else el.appendChild(document.createTextNode(part));
    });
  }

  function list(ul, items) {
    ul.textContent = '';
    items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  }

  function render(p) {
    $('resTitle').textContent = p.topic;

    var badges = $('badges');
    badges.textContent = '';
    var b = ['9:16 · 1080×1920', p.scenes.length + ' сцен', '≈ ' + p.format.totalDuration + ' с'];
    p.analysis.prophets.forEach(function (n) { b.push('✦ ' + n); });
    b.forEach(function (t, i) {
      var s = document.createElement('span');
      s.className = 'badge' + (i === 0 || t.charAt(0) === '✦' ? ' gold' : '');
      s.textContent = t; badges.appendChild(s);
    });

    var tl = $('timeline');
    tl.textContent = '';
    p.structure.forEach(function (a) {
      var li = document.createElement('li');
      li.dataset.act = a.act;
      var bEl = document.createElement('b'); bEl.textContent = a.title;
      var sp = document.createElement('span');
      sp.textContent = a.scenes.length === 1 ? 'сцена ' + a.scenes[0] : 'сцены ' + a.scenes[0] + '–' + a.scenes[a.scenes.length - 1];
      li.appendChild(bEl); li.appendChild(sp); tl.appendChild(li);
    });

    list($('rules'), p.rules);
    list($('verify'), p.verify);

    var box = $('scenesList');
    box.textContent = '';
    var tpl = $('sceneTpl');
    p.scenes.forEach(function (s, i) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.act = s.act;
      node.querySelector('.scene-num').textContent = 'Сцена ' + s.index + ' из ' + p.scenes.length + ' · ' + s.duration + ' с';
      node.querySelector('.scene-act').textContent = s.actTitle;
      node.querySelector('.purpose').textContent = s.purpose;
      node.querySelectorAll('dd[data-k]').forEach(function (dd) { setMarked(dd, s[dd.dataset.k]); });
      list(node.querySelector('.scene-verify'), s.verify);
      var pr = node.querySelector('.prompt'), ng = node.querySelector('.negative');
      pr.value = s.prompt; ng.value = s.negative;
      // ручные правки промпта сохраняются в проекте и попадают в экспорт
      pr.addEventListener('input', function () { p.scenes[i].prompt = pr.value; });
      ng.addEventListener('input', function () { p.scenes[i].negative = ng.value; });
      node.querySelectorAll('.copy').forEach(function (btn) {
        btn.addEventListener('click', function () { copy(btn.dataset.what === 'prompt' ? pr.value : ng.value); });
      });
      box.appendChild(node);
    });

    $('result').hidden = false;
  }

  function run(scroll) {
    var opts = readForm();
    if (!opts.topic.trim()) { $('topic').focus(); toast('Введите тему истории'); return; }
    state.project = E.generate(opts);
    render(state.project);
    save();
    if (scroll) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateDetected() {
    var a = E.analyzeTopic($('topic').value);
    var names = a.prophets.map(function (p) { return p.label; });
    $('detected').textContent = names.length ? 'Распознано: ' + names.join(', ') : (a.genericProphet ? 'Распознано: упоминание пророка' : '');
    if (names.length || a.genericProphet) $('hasProphet').checked = true;
  }

  // ---------- события ----------

  $('form').addEventListener('submit', function (e) { e.preventDefault(); state.variant = 0; run(true); });
  $('regen').addEventListener('click', function () { state.variant++; run(false); toast('Новый вариант'); });

  $('scenes').addEventListener('input', function () { $('scenesOut').textContent = this.value; });
  document.querySelectorAll('.step').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = $('scenes');
      r.value = Math.max(4, Math.min(12, (+r.value) + (+btn.dataset.step)));
      $('scenesOut').textContent = r.value;
    });
  });

  $('topic').addEventListener('input', updateDetected);
  $('topic').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('form').requestSubmit(); }
  });
  document.querySelectorAll('#examples .chip').forEach(function (c) {
    c.addEventListener('click', function () { $('topic').value = c.textContent; updateDetected(); $('topic').focus(); });
  });

  $('copyAll').addEventListener('click', function () {
    if (!state.project) return;
    copy(state.project.scenes.map(function (s) { return 'Scene ' + s.index + ' (' + s.actTitle + '):\n' + s.prompt; }).join('\n\n'));
  });
  $('dlTxt').addEventListener('click', function () {
    if (state.project) download('qalbiah-' + slug(state.project.topic) + '.txt', E.toText(state.project), 'text/plain;charset=utf-8');
  });
  $('dlJson').addEventListener('click', function () {
    if (state.project) download('qalbiah-' + slug(state.project.topic) + '.json', JSON.stringify(state.project, null, 2), 'application/json');
  });

  if (load()) { updateDetected(); run(false); }
})();
