/*
 * Qalbiah Studio — локальный генератор структуры истории и промптов Seedance 2.5.
 * Работает полностью офлайн: никаких API, ключей и сетевых запросов.
 *
 * Принцип достоверности: движок НЕ создаёт религиозных фактов, цитат, аятов,
 * хадисов, имён и дат. Он строит только кинематографический каркас и оставляет
 * явные метки [ПРОВЕРИТЬ] там, где автор должен вставить сведения из источника.
 */
(function (root) {
  'use strict';

  // ---------- Справочники для распознавания ----------

  // Пророки (рус./англ./араб. транслитерации). Совпадение включает правило «сияние вместо лица».
  var PROPHETS = [
    { id: 'muhammad', label: 'Пророк Мухаммад ﷺ', strict: true,
      keys: ['мухаммад', 'мухаммед', 'магомед', 'посланник аллаха', 'посланника аллаха', 'muhammad', 'mohammed', 'mohammad', 'расулуллах'] },
    { id: 'adam', label: 'Пророк Адам (мир ему)', keys: ['адам', 'adam'] },
    { id: 'nuh', label: 'Пророк Нух (мир ему)', keys: ['нух', 'ной', 'ноя', 'nuh', 'noah'] },
    { id: 'ibrahim', label: 'Пророк Ибрахим (мир ему)', keys: ['ибрахим', 'ибрагим', 'авраам', 'ibrahim', 'abraham'] },
    { id: 'ismail', label: 'Пророк Исмаил (мир ему)', keys: ['исмаил', 'ismail', 'ishmael'] },
    { id: 'ishaq', label: 'Пророк Исхак (мир ему)', keys: ['исхак', 'ishaq', 'isaac'] },
    { id: 'yaqub', label: 'Пророк Якуб (мир ему)', keys: ['якуб', 'яакуб', 'yaqub', 'jacob'] },
    { id: 'yusuf', label: 'Пророк Юсуф (мир ему)', keys: ['юсуф', 'иосиф', 'yusuf', 'joseph'] },
    { id: 'musa', label: 'Пророк Муса (мир ему)', keys: ['муса', 'моисей', 'musa', 'moses'] },
    { id: 'harun', label: 'Пророк Харун (мир ему)', keys: ['харун', 'аарон', 'harun', 'aaron'] },
    { id: 'dawud', label: 'Пророк Дауд (мир ему)', keys: ['дауд', 'давуд', 'давид', 'dawud', 'david'] },
    { id: 'sulayman', label: 'Пророк Сулейман (мир ему)', keys: ['сулейман', 'сулайман', 'соломон', 'sulayman', 'solomon'] },
    { id: 'yunus', label: 'Пророк Юнус (мир ему)', keys: ['юнус', 'иона', 'yunus', 'jonah'] },
    { id: 'ayyub', label: 'Пророк Айюб (мир ему)', keys: ['айюб', 'аюб', 'иов', 'ayyub', 'job'] },
    { id: 'isa', label: 'Пророк Иса (мир ему)', keys: ['иса', 'иисус', 'isa', 'jesus'] },
    { id: 'yahya', label: 'Пророк Яхья (мир ему)', keys: ['яхья', 'yahya'] },
    { id: 'zakariya', label: 'Пророк Закария (мир ему)', keys: ['закария', 'zakariya', 'zechariah'] },
    { id: 'salih', label: 'Пророк Салих (мир ему)', keys: ['салих', 'salih'] },
    { id: 'hud', label: 'Пророк Худ (мир ему)', keys: ['пророк худ', 'пророка худа', 'prophet hud'] },
    { id: 'shuayb', label: 'Пророк Шуайб (мир ему)', keys: ['шуайб', 'shuayb'] },
    { id: 'lut', label: 'Пророк Лут (мир ему)', keys: ['пророк лут', 'пророка лута', 'prophet lut'] },
    { id: 'idris', label: 'Пророк Идрис (мир ему)', keys: ['идрис', 'idris'] },
    { id: 'ilyas', label: 'Пророк Ильяс (мир ему)', keys: ['ильяс', 'ilyas', 'elijah'] },
    { id: 'alyasa', label: 'Пророк аль-Ясa (мир ему)', keys: ['аль-яса', 'альяса', 'al-yasa'] },
    { id: 'dhulkifl', label: 'Пророк Зуль-Кифль (мир ему)', keys: ['зуль-кифль', 'зулькифль', 'dhul-kifl'] }
  ];

  var COMPANIONS = ['сподвижник', 'сахаб', 'абу бакр', 'умар', 'усман', 'османа', 'али ибн', 'фатима', 'хадиджа', 'аиша', 'билял', 'хамза', 'хасан', 'хусейн', 'companion', 'sahaba', 'abu bakr', 'umar', 'uthman', 'bilal', 'khadija', 'aisha', 'fatima'];
  var ANGELS = ['ангел', 'джибрил', 'джабраил', 'микаил', 'исрафил', 'малаик', 'angel', 'jibril', 'gabriel'];
  var SOURCE_WORDS = ['аят', 'сура', 'хадис', 'коран', 'сказал', 'сказано', 'передал', 'тафсир', 'сунна', 'quran', 'hadith', 'ayah', 'surah'];

  // ---------- Визуальные пресеты ----------

  var SETTINGS = {
    desert: {
      ru: 'бескрайняя пустыня с барханами',
      en: 'vast desert with sweeping dunes',
      details: ['следы на песке, заметаемые ветром', 'одинокий шатёр вдали', 'караван силуэтов на гребне бархана', 'песок, струящийся с камня'],
      detailsEn: ['footprints in the sand being erased by wind', 'a lone tent in the distance', 'a caravan of silhouettes on a dune ridge', 'sand streaming off a rock']
    },
    night: {
      ru: 'ночная пустыня под звёздным небом',
      en: 'night desert under a dense starry sky',
      details: ['Млечный Путь над горизонтом', 'тлеющие угли костра', 'тонкий серп луны', 'тени, вытянутые лунным светом'],
      detailsEn: ['the Milky Way above the horizon', 'glowing embers of a campfire', 'a thin crescent moon', 'long shadows cast by moonlight']
    },
    sea: {
      ru: 'тёмное бурное море',
      en: 'dark stormy sea',
      details: ['гребни волн в тусклом свете', 'брызги, застывшие в воздухе', 'горизонт, тонущий в тумане', 'деревянный корпус старого судна'],
      detailsEn: ['wave crests in dim light', 'spray frozen in the air', 'a horizon dissolving into mist', 'the wooden hull of an ancient vessel']
    },
    city: {
      ru: 'древний город из глиняного кирпича',
      en: 'ancient mud-brick city',
      details: ['узкие улочки с арками', 'пыльный рынок с тканями', 'масляные лампы в нишах стен', 'плоские крыши на закате'],
      detailsEn: ['narrow alleys with arches', 'a dusty market with hanging fabrics', 'oil lamps in wall niches', 'flat rooftops at sunset']
    },
    mountains: {
      ru: 'скалистые горы и ущелья',
      en: 'rocky mountains and deep gorges',
      details: ['вход в тёмную пещеру', 'облака, ползущие по склону', 'одинокое дерево на уступе', 'каменная тропа вверх'],
      detailsEn: ['the mouth of a dark cave', 'clouds creeping down the slope', 'a lone tree on a ledge', 'a stone path winding upward'],
    },
    garden: {
      ru: 'оазис с финиковыми пальмами и водой',
      en: 'oasis with date palms and still water',
      details: ['отражение пальм в воде', 'капли росы на листьях', 'тихий родник среди камней', 'птицы, взлетающие с ветвей'],
      detailsEn: ['palms reflected in the water', 'dew drops on leaves', 'a quiet spring among stones', 'birds taking off from branches']
    }
  };

  var MOODS = {
    awe: { ru: 'благоговение', en: 'awe and reverence' },
    hope: { ru: 'надежда', en: 'quiet hope' },
    trial: { ru: 'испытание и терпение', en: 'trial and patience (sabr)' },
    reflection: { ru: 'размышление', en: 'contemplation' },
    warning: { ru: 'назидание', en: 'solemn warning' }
  };

  var STYLES = {
    cinematic: 'photorealistic cinematic film look, anamorphic lens, shallow depth of field, subtle film grain',
    painterly: 'painterly cinematic style, soft brush textures, oil-painting light, rich warm palette',
    minimal: 'minimalist cinematic style, negative space, muted earthy palette, symbolic composition'
  };

  // ---------- Акты ----------

  var ACTS = {
    hook: {
      title: 'Hook', ru: 'Крючок',
      purpose: 'Захватить внимание в первые 1–3 секунды: загадка, контраст или вопрос.',
      beats: [
        { d: 'Резкий визуальный контраст: {detail}. Зритель ещё не понимает, где он, но чувствует: {mood}.', a: 'Кадр открывается на крупной детали и мгновенно раскрывает масштаб — {setting}.', ae: 'The shot opens on an extreme close-up detail — {detailEn} — then instantly reveals the scale of the {settingEn}.' },
        { d: 'Тишина перед событием. {Setting}, в центре кадра — {detail}.', a: 'Ветер поднимает песок/пыль, звук стихает, в кадр медленно входит одинокая фигура со спины.', ae: 'Wind lifts dust across the frame, silence falls, a lone figure seen only from behind slowly enters the shot.' },
        { d: 'Вопрос без ответа, заданный текстом на экране (напишите сами; без цитат из источников без проверки). Фон — {setting}.', a: 'Пауза: в кадре — {detail}, затем свет медленно меняется, будто что-то должно произойти.', ae: 'A held moment on {detailEn}, then the light slowly shifts as if something is about to happen.' }
      ],
      light: ['предрассветные сумерки, холодный синий с первой тёплой полосой на горизонте', 'контровой свет, силуэты на фоне яркого неба', 'низкий ключ: почти темнота и один узкий луч'],
      lightEn: ['pre-dawn twilight, cold blue tones with the first warm line on the horizon', 'strong backlight, silhouettes against a bright sky', 'low-key lighting: near darkness pierced by a single narrow beam'],
      camera: ['быстрый push-in (наезд) от общего плана к детали', 'резкий drone-reveal снизу вверх', 'статичный крупный план, затем rack focus на фон'],
      cameraEn: ['fast push-in from wide shot to detail', 'dramatic drone reveal rising upward', 'static close-up, then rack focus to the background']
    },
    rise: {
      title: 'Развитие', ru: 'Развитие',
      purpose: 'Раскрыть обстоятельства и нарастающее напряжение.',
      beats: [
        { d: 'Знакомство с обстоятельствами истории «{topic}». Подробности события — [ПРОВЕРИТЬ: опишите по источнику].', a: 'Персонажи показаны со спины или в силуэте, медленно движутся по кадру, место действия — {setting}; в фокусе — {detail}.', ae: 'Characters shown from behind or in silhouette move through the {settingEn}; focus on {detailEn}.' },
        { d: 'Нарастание напряжения: трудность или испытание. Что именно произошло — [ПРОВЕРИТЬ по источнику].', a: 'Руки крупным планом: сжатые пальцы, дрожащая ладонь, дуа с поднятыми руками (без лиц).', ae: 'Close-up of hands only: clenched fingers, a trembling palm, hands raised in supplication; no faces visible.' },
        { d: 'Смена места или времени. {Setting}: {detail}.', a: 'Таймлапс облаков и теней, фигуры уменьшаются на фоне пейзажа.', ae: 'Timelapse of clouds and moving shadows, figures shrinking against the vast landscape.' },
        { d: 'Внутреннее состояние героя через окружение — {mood}. Без вымышленных реплик.', a: 'Медленный проход вдоль следов/дороги, на заднем плане — {detail}.', ae: 'Slow tracking along footprints on a path, with {detailEn} in the background.' },
        { d: 'Люди вокруг реагируют на происходящее. Состав и роль людей — [ПРОВЕРИТЬ по источнику].', a: 'Группа силуэтов, ткань одежд колышется на ветру, лица в тени или вне фокуса.', ae: 'A group of silhouettes, robes rippling in the wind, faces in deep shadow or out of focus.' }
      ],
      light: ['золотой час, тёплый боковой свет, длинные тени', 'рассеянный дневной свет сквозь пыль', 'мягкий свет масляных ламп, тёплый янтарь'],
      lightEn: ['golden hour, warm side light, long shadows', 'diffused daylight through hanging dust', 'soft oil-lamp light, warm amber tones'],
      camera: ['плавный dolly-in', 'боковой tracking shot', 'медленный орбитальный облёт', 'steadicam за героем со спины'],
      cameraEn: ['smooth dolly-in', 'lateral tracking shot', 'slow orbital move', 'steadicam following the character from behind']
    },
    climax: {
      title: 'Кульминация', ru: 'Кульминация',
      purpose: 'Пиковый момент: испытание, чудо или решающий выбор.',
      beats: [
        { d: 'Пиковый момент истории «{topic}». Суть события — [ПРОВЕРИТЬ: только по Корану/достоверному хадису/тафсиру].', a: 'Стихия приходит в движение: {detail}; масштаб подчёркивает величие происходящего.', ae: 'The elements surge into motion: {detailEn}; the vast scale emphasizes the magnitude of the moment.' },
        { d: 'Абсолютная тишина и один решающий жест. Значение момента — [ПРОВЕРИТЬ по источнику].', a: 'Время замедляется (slow motion), частицы пыли и света висят в воздухе.', ae: 'Time slows into slow motion, particles of dust and light suspended in the air.' }
      ],
      light: ['драматичный контраст: тёмное небо и прорывающийся столб света', 'вспышка мягкого белого света, заливающая кадр', 'грозовое освещение, вспышки и глубокие тени'],
      lightEn: ['dramatic contrast: dark sky with a breaking column of light', 'a soft white glow flooding the frame', 'stormy lighting, flashes and deep shadows'],
      camera: ['мощный crane-up (подъём крана) над сценой', 'медленный dolly-zoom (эффект вертиго)', 'низкий ракурс снизу вверх, медленный наезд'],
      cameraEn: ['powerful crane-up rising above the scene', 'slow dolly zoom (vertigo effect)', 'low-angle shot looking up, slow push-in']
    },
    finale: {
      title: 'Финал', ru: 'Финал',
      purpose: 'Разрешение и урок; спокойное послание зрителю.',
      beats: [
        { d: 'Успокоение после бури: {setting}, {detail}. Урок истории формулирует автор — [ПРОВЕРИТЬ: вывод должен опираться на источник].', a: 'Камера медленно отдаляется, герой в силуэте уходит к горизонту.', ae: 'The camera slowly pulls away as a silhouetted figure walks toward the horizon.' },
        { d: 'Тихий финальный образ для текста-вывода и призыва подписаться на Qalbiah.', a: 'Статичный кадр, свет постепенно становится тёплым, оставляя место для титров вверху и внизу.', ae: 'Static frame, the light gradually warms, leaving clean negative space at the top and bottom for captions.' }
      ],
      light: ['рассвет: мягкий тёплый свет, надежда', 'спокойный закат, розово-золотое небо', 'лунный свет и тёплый огонёк лампы'],
      lightEn: ['sunrise: soft warm light conveying hope', 'calm sunset, rose and gold sky', 'moonlight with a small warm lamp glow'],
      camera: ['медленный pull-back (отъезд) в общий план', 'плавный подъём камеры к небу', 'статичный широкий план с лёгким дрейфом'],
      cameraEn: ['slow pull-back to a wide shot', 'gentle tilt-up toward the sky', 'static wide shot with a subtle drift']
    }
  };

  // ---------- Утилиты ----------

  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function fill(tpl, ctx) {
    return tpl
      .replace(/\{topic\}/g, ctx.topic)
      .replace(/\{Setting\}/g, capitalize(ctx.setting))
      .replace(/\{setting\}/g, ctx.setting)
      .replace(/\{settingEn\}/g, ctx.settingEn)
      .replace(/\{detailEn\}/g, ctx.detailEn)
      .replace(/\{detail\}/g, ctx.detail)
      .replace(/\{mood\}/g, ctx.mood);
  }

  // Распределение сцен по актам: Hook — 1, Финал — 1, Кульминация — 1–2, остальное — Развитие.
  function distributeActs(n) {
    n = Math.max(4, Math.min(12, n | 0));
    var climax = n >= 9 ? 2 : 1;
    var rise = n - 2 - climax;
    var plan = ['hook'];
    for (var i = 0; i < rise; i++) plan.push('rise');
    for (var j = 0; j < climax; j++) plan.push('climax');
    plan.push('finale');
    return plan;
  }

  function normalize(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); }

  // Совпадение по границе слова с допустимыми падежными окончаниями (Мусы, Юсуфа, Ибрахиме…).
  var ENDINGS = '(?:а|у|е|ом|ым|ы|ой|ем|я|ю|и|ов|ам|ах|s)?';
  function hasWord(text, key) {
    var esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (/[ая]$/.test(esc) && esc.length > 3) esc = esc.slice(0, -1) + '[ая]?';
    return new RegExp('(^|[^a-zа-я])' + esc + ENDINGS + '(?=$|[^a-zа-я])').test(text);
  }
  function hasStem(text, key) { return text.indexOf(key) !== -1; }

  function analyzeTopic(topic) {
    var t = normalize(topic);
    var prophets = PROPHETS.filter(function (p) {
      return p.keys.some(function (k) { return hasWord(t, k); });
    });
    return {
      prophets: prophets,
      genericProphet: /пророк|prophet|наби|расул/.test(t),
      hasStrictProphet: prophets.some(function (p) { return p.strict; }),
      companions: COMPANIONS.some(function (k) { return k.length > 5 ? hasStem(t, k) : hasWord(t, k); }),
      angels: ANGELS.some(function (k) { return hasStem(t, k); }),
      mentionsSources: SOURCE_WORDS.some(function (k) { return hasStem(t, k); })
    };
  }

  // ---------- Правила изображения ----------

  function depictionRules(opts, analysis) {
    var rules = [];
    var promptEn = [];
    var negative = ['visible face of any prophet', 'facial features on veiled figures', 'text', 'watermark', 'logo', 'subtitles', 'cartoonish style', 'idols or statues being venerated', 'musical instruments'];

    if (opts.hasProphet || analysis.prophets.length || analysis.genericProphet) {
      rules.push('Лицо пророка никогда не показывается: на его месте — мягкое, сдержанное сияние без различимых черт.');
      promptEn.push('the prophet\'s face is completely concealed by a soft, restrained warm glow with no discernible features; never show his face');
      negative.push('prophet face', 'prophet portrait', 'eyes, nose or mouth of the prophet');
    }
    if (analysis.hasStrictProphet) {
      rules.push('Пророк Мухаммад ﷺ: не изображать фигуру вовсе (ни тела, ни силуэта) — только окружение, свет и следы присутствия: открытая дверь, луч света, место, где он находился.');
      promptEn.push('the Prophet Muhammad (peace be upon him) is not depicted at all — no body, no silhouette; his presence is suggested only through environment and gentle light');
      negative.push('any human figure representing the Prophet Muhammad');
    }
    if (opts.veilCompanions || analysis.companions) {
      rules.push('Сподвижники и члены семьи Пророка ﷺ: показывать только со спины, в силуэте или вне фокуса, без различимых лиц.');
      promptEn.push('companions are shown only from behind, in silhouette or out of focus, faces never visible');
    }
    if (analysis.angels) {
      rules.push('Ангелы не изображаются в человеческом облике — только как свет или ощущение присутствия.');
      promptEn.push('angels are never shown in human or winged form, only implied by pure light');
      negative.push('winged humans', 'angel figure');
    }
    rules.push('Скромная одежда, исторически уместные детали; без музыки и инструментов в кадре (звук — природа или нашид без инструментов, на усмотрение автора).');
    rules.push('Никакого текста, аятов или арабской каллиграфии внутри генерации — нейросеть искажает текст. Аяты добавляйте на монтаже из проверенного источника.');
    return { rules: rules, promptEn: promptEn, negative: negative };
  }

  // ---------- Генерация ----------

  function generate(opts) {
    var topic = String(opts.topic || '').trim();
    if (!topic) throw new Error('Введите тему истории');
    var n = Math.max(4, Math.min(12, parseInt(opts.scenes, 10) || 6));
    var setting = SETTINGS[opts.setting] || SETTINGS.desert;
    var mood = MOODS[opts.mood] || MOODS.awe;
    var style = STYLES[opts.style] || STYLES.cinematic;
    var duration = parseInt(opts.duration, 10) || 5;
    var variant = opts.variant | 0;
    var rand = rng(hashString(topic + '|' + n + '|' + variant));

    var analysis = analyzeTopic(topic);
    var dep = depictionRules(opts, analysis);
    var plan = distributeActs(n);
    var used = {};

    var scenes = plan.map(function (actKey, i) {
      var act = ACTS[actKey];
      // берём неповторяющийся бит внутри акта, пока это возможно
      var beatIdx = Math.floor(rand() * act.beats.length);
      var tries = 0;
      while (used[actKey + beatIdx] && tries < act.beats.length) { beatIdx = (beatIdx + 1) % act.beats.length; tries++; }
      used[actKey + beatIdx] = true;
      var beat = act.beats[beatIdx];

      var dIdx = Math.floor(rand() * setting.details.length);
      var lIdx = Math.floor(rand() * act.light.length);
      var cIdx = Math.floor(rand() * act.camera.length);
      var ctx = {
        topic: topic, setting: setting.ru, settingEn: setting.en,
        detail: setting.details[dIdx], detailEn: setting.detailsEn[dIdx], mood: mood.ru
      };

      var description = fill(beat.d, ctx);
      var action = fill(beat.a, ctx);
      var lighting = act.light[lIdx];
      var camera = act.camera[cIdx];

      var verify = [];
      if (/ПРОВЕРИТЬ/.test(description)) verify.push('Фактическое содержание сцены нужно заполнить по источнику (Коран, достоверный хадис, признанный тафсир).');
      if (actKey === 'finale') verify.push('Вывод/урок истории не должен приписывать источникам то, чего в них нет.');
      if (actKey === 'hook' && /текстом на экране/.test(description)) verify.push('Текст на экране пишите сами; если цитируете — только дословно, с номером аята/хадиса.');

      var prompt = buildPrompt({
        act: act, actionEn: fill(beat.ae, ctx), lightEn: act.lightEn[lIdx], cameraEn: act.cameraEn[cIdx],
        setting: setting, mood: mood, style: style, duration: duration, dep: dep, topic: topic
      });

      return {
        index: i + 1,
        act: actKey,
        actTitle: act.title,
        purpose: act.purpose,
        description: description,
        action: action,
        lighting: lighting,
        camera: camera,
        duration: duration,
        verify: verify,
        prompt: prompt,
        negative: dep.negative.join(', ')
      };
    });

    var globalVerify = [
      'Все исторические и религиозные сведения о теме «' + topic + '» проверьте по первоисточникам до публикации.',
      'Не используйте аяты и хадисы по памяти — копируйте текст и ссылку (сура:аят, сборник и номер хадиса) из проверенного издания.',
      'Уточните степень достоверности хадисов (сахих/хасан/даиф) и избегайте сомнительных преданий (исраилийат) без пометки.'
    ];
    if (analysis.mentionsSources) globalVerify.unshift('В теме упомянуты аят/хадис/сура — генератор их НЕ цитирует. Вставьте точный текст из источника.');
    if (!analysis.prophets.length && !analysis.genericProphet && !opts.hasProphet) globalVerify.push('Если в истории участвует пророк, включите переключатель «В истории есть пророк» — тема не распознала имя.');

    return {
      app: 'Qalbiah Studio',
      createdAt: new Date().toISOString(),
      topic: topic,
      format: { aspectRatio: '9:16', resolution: '1080x1920', sceneDuration: duration, totalDuration: duration * n },
      settings: { scenes: n, setting: opts.setting || 'desert', mood: opts.mood || 'awe', style: opts.style || 'cinematic' },
      analysis: {
        prophets: analysis.prophets.map(function (p) { return p.label; }),
        genericProphet: analysis.genericProphet,
        companions: analysis.companions,
        angels: analysis.angels
      },
      rules: dep.rules,
      verify: globalVerify,
      structure: ['hook', 'rise', 'climax', 'finale'].map(function (k) {
        return { act: k, title: ACTS[k].title, purpose: ACTS[k].purpose,
          scenes: scenes.filter(function (s) { return s.act === k; }).map(function (s) { return s.index; }) };
      }),
      scenes: scenes
    };
  }

  function buildPrompt(p) {
    var parts = [
      'Vertical 9:16 video, 1080x1920, ' + p.duration + ' seconds.',
      capitalize(p.style) + '.',
      'Setting: ' + p.setting.en + '.',
      p.actionEn,
      'Camera: ' + p.cameraEn + '.',
      'Lighting: ' + p.lightEn + '.',
      'Mood: ' + p.mood.en + ', Islamic historical atmosphere, modest clothing, authentic ancient Middle Eastern details.'
    ];
    if (p.dep.promptEn.length) parts.push('Depiction rules: ' + p.dep.promptEn.join('; ') + '.');
    parts.push('Composition centered for vertical framing, safe space for captions, no text in frame.');
    return parts.join(' ');
  }

  // ---------- Экспорт в текст ----------

  function toText(project) {
    var out = [];
    out.push('QALBIAH STUDIO — ' + project.topic);
    out.push('Формат: 9:16 (1080x1920), сцен: ' + project.scenes.length + ', ~' + project.format.totalDuration + ' с');
    out.push('');
    out.push('ПРАВИЛА ИЗОБРАЖЕНИЯ:');
    project.rules.forEach(function (r) { out.push('• ' + r); });
    out.push('');
    out.push('ТРЕБУЕТ ПРОВЕРКИ:');
    project.verify.forEach(function (r) { out.push('⚠ ' + r); });
    project.scenes.forEach(function (s) {
      out.push('');
      out.push('— СЦЕНА ' + s.index + ' · ' + s.actTitle + ' (' + s.duration + ' с) —');
      out.push('Описание: ' + s.description);
      out.push('Действие: ' + s.action);
      out.push('Освещение: ' + s.lighting);
      out.push('Камера: ' + s.camera);
      s.verify.forEach(function (v) { out.push('⚠ Проверить: ' + v); });
      out.push('Seedance 2.5 prompt: ' + s.prompt);
      out.push('Negative: ' + s.negative);
    });
    return out.join('\n');
  }

  var api = { generate: generate, toText: toText, analyzeTopic: analyzeTopic, distributeActs: distributeActs, SETTINGS: SETTINGS, MOODS: MOODS, STYLES: STYLES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QalbiahEngine = api;
})(this);
