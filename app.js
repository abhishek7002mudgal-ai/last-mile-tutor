(function () {
  'use strict';

  var STORAGE_KEY = 'lmt_student_data_v2';
  var simulatedOffline = false;

  var defaultData = {
    currentUser: 'राहुल',
    profiles: {
      'राहुल': { read: ['c1'], saved: ['c1'], quizScore: 0, quizTotal: 0, weakTopics: [] },
      'प्रिया': { read: [], saved: [], quizScore: 0, quizTotal: 0, weakTopics: [] },
      'अमन': { read: [], saved: [], quizScore: 0, quizTotal: 0, weakTopics: [] }
    }
  };

  var quizBank = {
    c1: [
      {
        q: 'खरीफ फसल किस मौसम में बोई जाती है?',
        options: ['बरसात के मौसम में', 'गर्मी के मौसम में', 'केवल जाड़े में'],
        ans: 0,
        explain: 'खरीफ फसलें बरसात के मौसम में बोई जाती हैं।',
        followup: { q: 'आसान अभ्यास: इनमें से कौन-सी खरीफ फसल है?', options: ['धान (चावल)', 'गेहूँ', 'सरसों'], ans: 0 }
      },
      {
        q: 'खेत में उगने वाले अनचाहे पौधों को क्या कहते हैं?',
        options: ['उर्वरक', 'खरपतवार', 'सिंचाई'],
        ans: 1,
        explain: 'खरपतवार मुख्य फसल का पानी और पोषक तत्व छीन लेते हैं।',
        followup: { q: 'आसान अभ्यास: खरपतवार हटाने की क्रिया क्या है?', options: ['निराई-गुड़ाई', 'भंडारण', 'कटाई'], ans: 0 }
      }
    ],
    c2: [
      {
        q: 'दूध से दही बनाने में कौन-सा जीवाणु मदद करता है?',
        options: ['राइज़ोबियम', 'लैक्टोबैसिलस', 'यीस्ट'],
        ans: 1, 
        explain: 'लैक्टोबैसिलस जीवाणु दूध को दही में बदलता है।',
        followup: { q: 'आसान अभ्यास: ब्रेड फुलाने में क्या काम आता है?', options: ['यीस्ट (कवक)', 'मच्छर', 'रेत'], ans: 0 }
      },
      {
        q: 'दलहन की जड़ों में कौन-सा जीवाणु नाइट्रोजन स्थिरीकरण करता है?',
        options: ['राइज़ोबियम', 'विषाणु', 'अमीबा'],
        ans: 0,
        explain: 'राइज़ोबियम हवा की नाइट्रोजन को मिट्टी के उपयोगी रूप में बदलता है।',
        followup: { q: 'आसान अभ्यास: किसकी जड़ों में राइज़ोबियम होता है?', options: ['चना और मटर', 'गेहूँ', 'मक्का'], ans: 0 }
      }
    ],
    c3: [
      {
        q: 'दाब (Pressure) का सही सूत्र क्या है?',
        options: ['बल × क्षेत्रफल', 'बल / क्षेत्रफल', 'बल + क्षेत्रफल'],
        ans: 1,
        explain: 'बल को क्षेत्रफल से भाग देने पर दाब मिलता है।',
        followup: { q: 'आसान अभ्यास: नुकीली सुई से सिलाई आसान क्यों होती है?', options: ['कम क्षेत्रफल से अधिक दाब लगता है', 'सुई हल्की होती है', 'सुई गर्म होती है'], ans: 0 }
      },
      {
        q: 'बल की मानक इकाई क्या होती है?',
        options: ['पास्कल', 'न्यूटन', 'मीटर'],
        ans: 1,
        explain: 'बल को न्यूटन में मापा जाता है।',
        followup: { q: 'आसान अभ्यास: धक्का देना या खींचना क्या है?', options: ['बल', 'तापमान', 'प्रकाश'], ans: 0 }
      }
    ]
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultData));
    } catch (e) { return JSON.parse(JSON.stringify(defaultData)); }
  }

  var state = loadState();
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
  function getUserData() {
    if (!state.profiles[state.currentUser]) state.profiles[state.currentUser] = { read: [], saved: [], quizScore: 0, quizTotal: 0, weakTopics: [] };
    return state.profiles[state.currentUser];
  }

  function renderProfiles() {
    var tabs = document.getElementById('profile-tabs'); tabs.innerHTML = '';
    Object.keys(state.profiles).forEach(function (name) {
      var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = name;
      btn.className = 'profile-btn' + (name === state.currentUser ? ' active' : '');
      btn.onclick = function () { state.currentUser = name; saveState(); renderAll(); };
      tabs.appendChild(btn);
    });
  }

  document.getElementById('add-profile-form').onsubmit = function (e) {
    e.preventDefault();
    var input = document.getElementById('new-name'); var msg = document.getElementById('profile-message');
    var name = input.value.trim();
    if (!name || /[0-9]/.test(name)) { msg.textContent = 'कृपया केवल पहला नाम लिखें।'; return; }
    if (!state.profiles[name]) state.profiles[name] = { read: [], saved: [], quizScore: 0, quizTotal: 0, weakTopics: [] };
    state.currentUser = name; input.value = ''; msg.textContent = name + ' की प्रोफाइल जुड़ गई है।';
    saveState(); renderAll();
  };
  function renderChapters() {
    var container = document.getElementById('chapters-container');
    var user = getUserData();
    var chapters = (window.LMT_CONTENT && window.LMT_CONTENT.chapters) || [];
    document.getElementById('summary-line').textContent = state.currentUser + ' ने ' + chapters.length + ' में से ' + user.read.length + ' अध्याय पढ़े हैं और ' + user.saved.length + ' अध्याय ऑफलाइन सेव हैं।';
    container.innerHTML = '';
    chapters.forEach(function (ch) {
      var isSaved = user.saved.indexOf(ch.id) !== -1;
      var card = document.createElement('div'); card.className = 'chapter-card';
      var title = document.createElement('h3'); title.textContent = ch.title; card.appendChild(title);
      var btnRow = document.createElement('div'); btnRow.className = 'btn-row';
      var listenBtn = document.createElement('button'); listenBtn.type = 'button'; listenBtn.className = 'btn-primary'; listenBtn.textContent = '🔊 पाठ सुनें / क्रम से पढ़ें'; btnRow.appendChild(listenBtn);
      var saveBtn = document.createElement('button'); saveBtn.type = 'button'; saveBtn.className = 'btn-secondary'; saveBtn.textContent = isSaved ? '✅ ऑफलाइन सेव है' : '📥 ऑफलाइन सेव करें';
      saveBtn.onclick = function () {
        if (user.saved.indexOf(ch.id) === -1) user.saved.push(ch.id);
        if (user.read.indexOf(ch.id) === -1) user.read.push(ch.id);
        saveState(); renderAll();
      };
      btnRow.appendChild(saveBtn); card.appendChild(btnRow);
      var pElements = [];
      ch.paragraphs.forEach(function (text) { var p = document.createElement('p'); p.textContent = text; card.appendChild(p); pElements.push(p); });
      listenBtn.onclick = function () {
        if (user.read.indexOf(ch.id) === -1) { user.read.push(ch.id); saveState(); }
        pElements.forEach(function (el) { el.classList.remove('highlight-line'); });
        var voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
        var hindiVoice = voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf('hi') !== -1; });
        if (hindiVoice && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          var utter = new SpeechSynthesisUtterance(ch.title + '। ' + ch.paragraphs.join(' '));
          utter.voice = hindiVoice; utter.lang = 'hi-IN'; window.speechSynthesis.speak(utter);
        } else {
          var idx = 0; listenBtn.textContent = '📖 क्रम से हाइलाइट चल रहा है...';
          var timer = setInterval(function () {
            pElements.forEach(function (el) { el.classList.remove('highlight-line'); });
            if (idx < pElements.length) { pElements[idx].classList.add('highlight-line'); pElements[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); idx++; }
            else { clearInterval(timer); listenBtn.textContent = '🔊 पाठ सुनें / क्रम से पढ़ें'; }
          }, 2200);
        }
      };
      container.appendChild(card);
    });
  }

  function showAiReply(text) {
    var box = document.getElementById('ai-reply-box'); box.classList.remove('hidden'); box.textContent = '';
    var title = document.createElement('strong'); title.textContent = '🤖 AI शिक्षक का उत्तर:';
    var para = document.createElement('p'); para.style.marginTop = '6px'; para.textContent = text;
    box.appendChild(title); box.appendChild(para);
  }

  document.querySelectorAll('.quick-doubt').forEach(function (btn) {
    btn.onclick = function () {
      var type = btn.getAttribute('data-type');
      if (type === 'easy') showAiReply('आसान भाषा में: फसल उगाने के लिए मिट्टी तैयार कर अच्छे बीज बोए जाते हैं और समय पर सिंचाई की जाती है।');
      else if (type === 'example') showAiReply('उदाहरण: दूध में थोड़ा जामन डालने से लैक्टोबैसिलस जीवाणु सुबह तक दही जमा देता है।');
      else showAiReply('मुख्य बिंदु: 1) खरीफ फसल बरसात में और रबी जाड़े में होती है। 2) दाब = बल / क्षेत्रफल।');
    };
  });

  document.getElementById('ask-btn').onclick = function () {
    var q = document.getElementById('doubt-input').value.trim();
    if (!q) { showAiReply('कृपया ऊपर बॉक्स में अपना सवाल लिखें या माइक से बोलें।'); return; }
    if (q.indexOf('दाब') !== -1 || q.indexOf('बल') !== -1) showAiReply('उत्तर: एकांक क्षेत्रफल पर लगने वाले बल को दाब कहते हैं।');
    else if (q.indexOf('सूक्ष्मजीव') !== -1 || q.indexOf('दही') !== -1) showAiReply('उत्तर: सूक्ष्मजीव बहुत छोटे जीव हैं; लैक्टोबैसिलस दही जमाता है।');
    else showAiReply('आपके सवाल "' + q + '" का सरल उत्तर: समय पर सिंचाई, पोषण और स्वच्छता सबसे ज़रूरी हैं।');
  };

    document.getElementById('mic-btn').onclick = function () {
    var status = document.getElementById('mic-status');
    var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { status.textContent = 'इस ब्राउज़र में माइक उपलब्ध नहीं है, कृपया त्वरित बटन दबाएं।'; return; }
    var rec = new SpeechRec(); rec.lang = 'hi-IN'; status.textContent = '🎤 सुन रहा हूँ... हिंदी में बोलें';
    rec.onresult = function (e) { var s = e.results.transcript; document.getElementById('doubt-input').value = s; status.textContent = 'आपने बोला: "' + s + '"'; document.getElementById('ask-btn').click(); };
    rec.onerror = function () { status.textContent = 'आवाज़ स्पष्ट नहीं सुनाई दी, दोबारा प्रयास करें।'; };
    rec.start();
  };

  document.getElementById('photo-input').onchange = function (e) {
    var file = e.target.files; if (!file) return;
    var previewBox = document.getElementById('photo-preview-box'); previewBox.classList.remove('hidden');
    var reader = new FileReader();
    reader.onload = function (ev) {
      previewBox.textContent = '';
      var p = document.createElement('p'); p.className = 'info-msg'; p.textContent = '📷 प्रश्न की फोटो अपलोड हो गई है:';
      var img = document.createElement('img'); img.src = ev.target.result; img.alt = 'प्रश्न फोटो';
      previewBox.appendChild(p); previewBox.appendChild(img);
      showAiReply('फोटो के प्रश्न का हल: पहले मुख्य परिभाषा लिखें और फिर दैनिक जीवन का एक उदाहरण दें।');
    };
    reader.readAsDataURL(file);
  };

  function renderQuiz() {
    var chId = document.getElementById('quiz-chapter-select').value;
    var area = document.getElementById('quiz-area');
    var questions = quizBank[chId] || []; var user = getUserData(); area.innerHTML = '';
    questions.forEach(function (item, idx) {
      var qBox = document.createElement('div'); qBox.style.marginTop = '14px'; qBox.style.paddingTop = '10px'; qBox.style.borderTop = '1px solid #e2e8f0';
      var qTitle = document.createElement('p'); var strong = document.createElement('strong'); strong.textContent = 'प्रश्न ' + (idx + 1) + ': ' + item.q; qTitle.appendChild(strong); qBox.appendChild(qTitle);
      var fb = document.createElement('div'); var followupDiv = document.createElement('div');
      item.options.forEach(function (opt, oIdx) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'quiz-option'; b.textContent = opt;
        b.onclick = function () {
          user.quizTotal += 1;
          if (oIdx === item.ans) { user.quizScore += 1; fb.className = 'feedback-correct'; fb.textContent = '✅ बिल्कुल सही जवाब!'; followupDiv.textContent = ''; }
          else {
            fb.className = 'feedback-wrong'; fb.textContent = '❌ गलत। कारण: ' + item.explain;
            if (user.weakTopics.indexOf(chId) === -1) user.weakTopics.push(chId);
            followupDiv.textContent = ''; var fTitle = document.createElement('p'); fTitle.style.marginTop = '8px'; var fStrong = document.createElement('strong'); fStrong.textContent = '🔄 ' + item.followup.q; fTitle.appendChild(fStrong); followupDiv.appendChild(fTitle);
            item.followup.options.forEach(function (fOpt, fIdx) {
              var fbBtn = document.createElement('button'); fbBtn.type = 'button'; fbBtn.className = 'quiz-option'; fbBtn.textContent = fOpt;
              fbBtn.onclick = function () { followupDiv.textContent = ''; var resP = document.createElement('p'); resP.className = fIdx === item.followup.ans ? 'feedback-correct' : 'feedback-wrong'; resP.textContent = fIdx === item.followup.ans ? '✅ बहुत अच्छे! अब समझ आ गया।' : 'सही उत्तर पहला विकल्प है।'; followupDiv.appendChild(resP); };
              followupDiv.appendChild(fbBtn);
            });
          }
          saveState(); renderReport();
        };
        qBox.appendChild(b);
      });
      qBox.appendChild(fb); qBox.appendChild(followupDiv); area.appendChild(qBox);
    });
  }
  document.getElementById('quiz-chapter-select').onchange = renderQuiz;

  function renderReport() {
    var user = getUserData(); var accuracy = user.quizTotal > 0 ? Math.round((user.quizScore / user.quizTotal) * 100) : 0;
    var weakNames = user.weakTopics.map(function (id) { return id === 'c1' ? 'फसल उत्पादन' : (id === 'c2' ? 'सूक्ष्मजीव' : 'बल तथा दाब'); });
    var reportDiv = document.getElementById('report-content'); reportDiv.textContent = '';
    ['विद्यार्थी का नाम: ' + state.currentUser, 'पढ़े गए अध्याय: ' + user.read.length + ' / 3', 'ऑफलाइन सेव: ' + user.saved.length + ' / 3', 'क्विज़ सटीकता: ' + accuracy + '% (' + user.quizScore + '/' + user.quizTotal + ')', 'दोहराने योग्य विषय: ' + (weakNames.length ? weakNames.join(', ') : 'सभी अच्छे हैं')].forEach(function (t) { var p = document.createElement('p'); p.textContent = t; reportDiv.appendChild(p); });
  }

  document.getElementById('copy-report-btn').onclick = function () {
    if (navigator.clipboard) navigator.clipboard.writeText(document.getElementById('report-content').innerText);
    document.getElementById('copy-status').textContent = '✅ रिपोर्ट कॉपी हो गई है!';
  };

  document.querySelectorAll('.nav-btn').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active'); document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
    };
  });

  document.getElementById('offline-toggle').onclick = function () {
    simulatedOffline = !simulatedOffline;
    document.getElementById('connection-status').textContent = simulatedOffline ? '🔴 ऑफलाइन (प्रगति सुरक्षित)' : '🟢 ऑनलाइन';
    document.getElementById('offline-toggle').textContent = simulatedOffline ? 'ऑनलाइन मोड पर लौटें' : 'ऑफलाइन मोड टेस्ट करें';
  };

  function renderAll() { renderProfiles(); renderChapters(); renderQuiz(); renderReport(); }
  renderAll();
  function addSafeStopButton() {
    var rows = document.querySelectorAll('.chapter-card .btn-row');
    rows.forEach(function (row) {
      if (row.querySelector('.safe-stop-btn')) return;
      var stopBtn = document.createElement('button');
      stopBtn.type = 'button';
      stopBtn.className = 'btn-secondary safe-stop-btn';
      stopBtn.textContent = '⏹ रोकें';
      stopBtn.onclick = function () {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        document.querySelectorAll('.highlight-line').forEach(function (el) {
          el.classList.remove('highlight-line');
        });
      };
      row.appendChild(stopBtn);
    });
  }

  var oldRenderAll = renderAll;
  renderAll = function () {
    oldRenderAll();
    addSafeStopButton();
  };

  renderAll();
})();
