(function (global) {
  "use strict";

  var SCHEMA_VERSION = 1;
  var STORAGE_PREFIX = "ce_simulator_attempt_v1:";

  var DEFAULT_LABELS = {
    start: "Iniciar simulado",
    continue: "Continuar de onde parei",
    restart: "Reiniciar tentativa",
    studyMode: "Modo estudo",
    studyModeHelp: "Mostra o gabarito e a referência após responder.",
    examMode: "Modo prova",
    examModeHelp: "Mostra o gabarito somente ao finalizar.",
    question: "Questão",
    of: "de",
    previous: "Anterior",
    next: "Próxima",
    finish: "Finalizar simulado",
    mark: "Marcar para revisar",
    unmark: "Remover marcação",
    answered: "Respondida",
    unanswered: "Não respondida",
    marked: "Marcada para revisão",
    correct: "Resposta correta",
    incorrect: "Resposta incorreta",
    reference: "Referência",
    explanation: "Comentário",
    result: "Resultado",
    hits: "Acertos",
    errors: "Erros",
    unansweredResult: "Não respondidas",
    score: "Aproveitamento",
    time: "Tempo",
    reviewErrors: "Revisar erros",
    retryAll: "Refazer simulado",
    noErrors: "Nenhuma questão errada para revisar.",
    finishWithUnanswered: "Há questões não respondidas. Deseja finalizar mesmo assim?",
    restartConfirm: "Reiniciar apaga o progresso desta tentativa. Deseja continuar?",
    progressLabel: "Progresso do simulado",
    paletteLabel: "Navegação pelas questões",
    resumeSummary: "Existe uma tentativa em andamento neste dispositivo.",
    completedSummary: "Existe uma tentativa concluída salva neste dispositivo."
  };

  function merge(base, extra) {
    var out = {};
    Object.keys(base || {}).forEach(function (key) { out[key] = base[key]; });
    Object.keys(extra || {}).forEach(function (key) { out[key] = extra[key]; });
    return out;
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function toInt(value, fallback) {
    var n = Number(value);
    return Number.isInteger(n) ? n : fallback;
  }

  function normalizeQuestion(question, index) {
    var source = question || {};
    var options = Array.isArray(source.options) ? source.options.map(toText) : [];
    var correctIndex = toInt(
      source.answerIndex != null ? source.answerIndex :
      source.correctIndex != null ? source.correctIndex :
      source.answer != null ? source.answer : source.correct,
      -1
    );

    return {
      id: source.id != null ? source.id : index + 1,
      prompt: toText(source.prompt != null ? source.prompt : source.question),
      options: options,
      correctIndex: correctIndex,
      reference: toText(
        source.reference != null ? source.reference :
        source.ref != null ? source.ref : source.source
      ),
      explanation: toText(
        source.explanation != null ? source.explanation :
        source.comment != null ? source.comment : source.comentario
      ),
      topic: toText(source.topic != null ? source.topic : source.chapter),
      metadata: {
        chapter: toText(source.chapter),
        article: toText(source.article),
        difficulty: toText(source.difficulty),
        sourceType: toText(source.sourceType),
        source: toText(source.source)
      }
    };
  }

  function normalizeQuestions(questions) {
    if (!Array.isArray(questions)) return [];
    return questions.map(normalizeQuestion).filter(function (question) {
      return question.prompt && question.options.length >= 2 &&
        question.correctIndex >= 0 && question.correctIndex < question.options.length;
    });
  }

  function scoreAttempt(questions, answers) {
    var hits = 0;
    var errors = 0;
    var unanswered = 0;
    questions.forEach(function (question, index) {
      var answer = answers[index];
      if (!Number.isInteger(answer)) unanswered += 1;
      else if (answer === question.correctIndex) hits += 1;
      else errors += 1;
    });
    var total = questions.length;
    return {
      hits: hits,
      errors: errors,
      unanswered: unanswered,
      total: total,
      percent: total ? Math.round((hits / total) * 100) : 0
    };
  }

  function scoreBucket(percent) {
    if (percent >= 90) return "90_100";
    if (percent >= 75) return "75_89";
    if (percent >= 50) return "50_74";
    if (percent >= 25) return "25_49";
    return "0_24";
  }

  function progressBucket(answered, total) {
    if (!total) return 0;
    var percent = Math.floor((answered / total) * 100);
    if (percent >= 100) return 100;
    if (percent >= 75) return 75;
    if (percent >= 50) return 50;
    if (percent >= 25) return 25;
    return 0;
  }

  function storageKey(simulatorId) {
    return STORAGE_PREFIX + simulatorId;
  }

  function createEmptyAttempt(config, questionCount, mode) {
    var now = new Date().toISOString();
    return {
      schemaVersion: SCHEMA_VERSION,
      simulatorId: config.id,
      contentVersion: config.contentVersion,
      mode: mode || config.mode,
      answers: new Array(questionCount).fill(null),
      marked: [],
      currentIndex: 0,
      checkpoints: [],
      startedAt: now,
      updatedAt: now,
      completedAt: null,
      elapsedSeconds: 0
    };
  }

  function sanitizeAttempt(raw, config, questionCount) {
    if (!raw || raw.schemaVersion !== SCHEMA_VERSION) return null;
    if (raw.simulatorId !== config.id || raw.contentVersion !== config.contentVersion) return null;
    if (!Array.isArray(raw.answers) || raw.answers.length !== questionCount) return null;

    var answers = raw.answers.map(function (value) {
      if (value === null) return null;
      var n = Number(value);
      return Number.isInteger(n) && n >= 0 ? n : null;
    });

    var marked = Array.isArray(raw.marked) ? raw.marked.map(Number).filter(function (value) {
      return Number.isInteger(value) && value >= 0 && value < questionCount;
    }) : [];

    var currentIndex = Math.min(
      Math.max(toInt(raw.currentIndex, 0), 0),
      Math.max(questionCount - 1, 0)
    );

    return {
      schemaVersion: SCHEMA_VERSION,
      simulatorId: config.id,
      contentVersion: config.contentVersion,
      mode: raw.mode === "study" ? "study" : "exam",
      answers: answers,
      marked: Array.from(new Set(marked)),
      currentIndex: currentIndex,
      checkpoints: Array.isArray(raw.checkpoints) ? raw.checkpoints.map(Number) : [],
      startedAt: toText(raw.startedAt) || new Date().toISOString(),
      updatedAt: toText(raw.updatedAt) || new Date().toISOString(),
      completedAt: raw.completedAt ? toText(raw.completedAt) : null,
      elapsedSeconds: Math.max(0, toInt(raw.elapsedSeconds, 0))
    };
  }

  function analyticsAllowed() {
    try {
      return !global.localStorage || global.localStorage.getItem("analytics_storage") !== "denied";
    } catch (_) {
      return true;
    }
  }

  function emit(eventName, params) {
    if (!analyticsAllowed()) return;
    if (typeof global.gtag !== "function") return;
    global.gtag("event", eventName, params || {});
  }

  function createElement(tag, className, text) {
    var node = global.document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.floor(Number(seconds) || 0));
    var min = Math.floor(total / 60);
    var sec = total % 60;
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function Simulator(config) {
    if (!global.document) throw new Error("CESimulator requer um documento HTML.");
    this.config = merge({
      id: "",
      title: "Simulado",
      contentVersion: "1",
      mode: "exam",
      allowModeChoice: true,
      storage: true,
      timer: true,
      analytics: true,
      type: "",
      audience: "",
      topic: "",
      board: "",
      year: "",
      labels: {}
    }, config || {});

    if (!this.config.id) throw new Error("CESimulator: config.id é obrigatório.");

    this.questions = normalizeQuestions(this.config.questions);
    if (!this.questions.length) throw new Error("CESimulator: nenhuma questão válida.");

    this.labels = merge(DEFAULT_LABELS, this.config.labels || {});
    this.root = typeof this.config.root === "string"
      ? global.document.querySelector(this.config.root)
      : this.config.root;
    if (!this.root) throw new Error("CESimulator: root não encontrado.");

    this.attempt = null;
    this.timerHandle = null;
    this.timerBaseMs = 0;
    this.reviewOnly = false;
    this.reviewIndices = [];
    this.lastFocus = null;
    this._boundBeforeUnload = this._beforeUnload.bind(this);
  }

  Simulator.prototype._analyticsBase = function () {
    return {
      simulator_id: this.config.id,
      simulator_type: this.config.type || undefined,
      audience: this.config.audience || undefined,
      topic: this.config.topic || undefined,
      board: this.config.board || undefined,
      year: this.config.year || undefined,
      question_count: this.questions.length,
      mode: this.attempt ? this.attempt.mode : this.config.mode,
      page_path: global.location ? global.location.pathname : undefined
    };
  };

  Simulator.prototype._emit = function (name, extra) {
    if (!this.config.analytics) return;
    emit(name, merge(this._analyticsBase(), extra || {}));
  };

  Simulator.prototype._readStoredAttempt = function () {
    if (!this.config.storage || !global.localStorage) return null;
    try {
      var raw = global.localStorage.getItem(storageKey(this.config.id));
      if (!raw) return null;
      return sanitizeAttempt(JSON.parse(raw), this.config, this.questions.length);
    } catch (_) {
      return null;
    }
  };

  Simulator.prototype._save = function () {
    if (!this.attempt) return;
    this.attempt.updatedAt = new Date().toISOString();
    if (!this.config.storage || !global.localStorage) return;
    try {
      global.localStorage.setItem(storageKey(this.config.id), JSON.stringify(this.attempt));
    } catch (_) {}
  };

  Simulator.prototype._removeStored = function () {
    if (!this.config.storage || !global.localStorage) return;
    try { global.localStorage.removeItem(storageKey(this.config.id)); } catch (_) {}
  };

  Simulator.prototype._beforeUnload = function () {
    if (this.attempt && !this.attempt.completedAt) {
      this._syncElapsed();
      this._save();
    }
  };

  Simulator.prototype.mount = function () {
    this.stopTimer();
    this.attempt = this._readStoredAttempt();
    this.reviewOnly = false;
    this.reviewIndices = [];
    this.root.classList.add("ce-simulator");
    this.root.setAttribute("data-simulator-id", this.config.id);
    global.addEventListener("beforeunload", this._boundBeforeUnload);
    this.renderIntro();
    return this;
  };

  Simulator.prototype.destroy = function () {
    this.stopTimer();
    global.removeEventListener("beforeunload", this._boundBeforeUnload);
    clearNode(this.root);
  };

  Simulator.prototype.renderIntro = function () {
    var self = this;
    clearNode(this.root);

    var section = createElement("section", "ce-sim-intro");
    var heading = createElement("h2", "ce-sim-title", this.config.title);
    section.appendChild(heading);

    var meta = createElement("p", "ce-sim-meta",
      this.questions.length + " questões" + (this.config.timer ? " · cronômetro" : ""));
    section.appendChild(meta);

    var stored = this.attempt;
    if (stored) {
      var answered = stored.answers.filter(Number.isInteger).length;
      var summary = createElement(
        "div",
        "ce-sim-resume",
        stored.completedAt ? this.labels.completedSummary : this.labels.resumeSummary
      );
      var detail = createElement("span", "ce-sim-resume-detail",
        " " + answered + "/" + this.questions.length + " respondidas · " + formatTime(stored.elapsedSeconds));
      summary.appendChild(detail);
      section.appendChild(summary);
    }

    var modeFieldset = null;
    if (this.config.allowModeChoice && (!stored || stored.completedAt)) {
      modeFieldset = createElement("fieldset", "ce-sim-mode");
      var legend = createElement("legend", "ce-sim-mode-title", "Como deseja realizar?");
      modeFieldset.appendChild(legend);

      [
        { value: "study", title: this.labels.studyMode, help: this.labels.studyModeHelp },
        { value: "exam", title: this.labels.examMode, help: this.labels.examModeHelp }
      ].forEach(function (item) {
        var wrap = createElement("div", "ce-sim-mode-option");
        var input = createElement("input");
        input.type = "radio";
        input.name = "ce-sim-mode-" + self.config.id;
        input.id = "ce-sim-mode-" + self.config.id + "-" + item.value;
        input.value = item.value;
        input.checked = item.value === self.config.mode;
        var label = createElement("label", "ce-sim-mode-label");
        label.setAttribute("for", input.id);
        label.appendChild(createElement("strong", "", item.title));
        label.appendChild(createElement("span", "", item.help));
        wrap.appendChild(input);
        wrap.appendChild(label);
        modeFieldset.appendChild(wrap);
      });
      section.appendChild(modeFieldset);
    }

    var actions = createElement("div", "ce-sim-actions");

    if (stored && !stored.completedAt) {
      var continueButton = createElement("button", "ce-sim-btn ce-sim-btn-primary", this.labels.continue);
      continueButton.type = "button";
      continueButton.addEventListener("click", function () { self.start(true); });
      actions.appendChild(continueButton);

      var restartButton = createElement("button", "ce-sim-btn ce-sim-btn-secondary", this.labels.restart);
      restartButton.type = "button";
      restartButton.addEventListener("click", function () { self.restart(); });
      actions.appendChild(restartButton);
    } else if (stored && stored.completedAt) {
      var resultButton = createElement("button", "ce-sim-btn ce-sim-btn-primary", this.labels.result);
      resultButton.type = "button";
      resultButton.addEventListener("click", function () { self.renderResult(); });
      actions.appendChild(resultButton);

      var retryButton = createElement("button", "ce-sim-btn ce-sim-btn-secondary", this.labels.retryAll);
      retryButton.type = "button";
      retryButton.addEventListener("click", function () { self.restart(); });
      actions.appendChild(retryButton);
    } else {
      var startButton = createElement("button", "ce-sim-btn ce-sim-btn-primary", this.labels.start);
      startButton.type = "button";
      startButton.setAttribute("data-evento", "simulator_start_click");
      startButton.addEventListener("click", function () {
        var mode = self.config.mode;
        if (modeFieldset) {
          var checked = modeFieldset.querySelector("input[type=radio]:checked");
          if (checked) mode = checked.value;
        }
        self.start(false, mode);
      });
      actions.appendChild(startButton);
    }

    section.appendChild(actions);
    this.root.appendChild(section);
  };

  Simulator.prototype.start = function (resume, mode) {
    if (resume) {
      this.attempt = this._readStoredAttempt();
      if (!this.attempt || this.attempt.completedAt) {
        this.attempt = createEmptyAttempt(this.config, this.questions.length, mode || this.config.mode);
        resume = false;
      }
    } else {
      this.attempt = createEmptyAttempt(this.config, this.questions.length, mode || this.config.mode);
    }

    this.reviewOnly = false;
    this.reviewIndices = [];
    this._save();
    this._emit(resume ? "simulator_resume" : "simulator_start", {
      resumed: resume ? "yes" : "no"
    });
    this.renderRunner();
    this.startTimer();
  };

  Simulator.prototype.restart = function () {
    if (typeof global.confirm === "function" && !global.confirm(this.labels.restartConfirm)) return;
    this.stopTimer();
    this._removeStored();
    this.attempt = null;
    this.reviewOnly = false;
    this.reviewIndices = [];
    this._emit("simulator_retry_all");
    this.renderIntro();
  };

  Simulator.prototype.startTimer = function () {
    var self = this;
    if (!this.config.timer || !this.attempt || this.attempt.completedAt) return;
    this.stopTimer();
    this.timerBaseMs = Date.now() - (this.attempt.elapsedSeconds * 1000);
    this.timerHandle = global.setInterval(function () {
      self._syncElapsed();
      var timer = self.root.querySelector("[data-ce-sim-timer]");
      if (timer) timer.textContent = formatTime(self.attempt.elapsedSeconds);
    }, 1000);
  };

  Simulator.prototype._syncElapsed = function () {
    if (!this.config.timer || !this.attempt || this.attempt.completedAt || !this.timerBaseMs) return;
    this.attempt.elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.timerBaseMs) / 1000));
  };

  Simulator.prototype.stopTimer = function () {
    if (this.timerHandle) global.clearInterval(this.timerHandle);
    this.timerHandle = null;
    this._syncElapsed();
    this.timerBaseMs = 0;
  };

  Simulator.prototype._answeredCount = function () {
    return this.attempt ? this.attempt.answers.filter(Number.isInteger).length : 0;
  };

  Simulator.prototype._emitCheckpoint = function () {
    if (!this.attempt) return;
    var bucket = progressBucket(this._answeredCount(), this.questions.length);
    if (!bucket || this.attempt.checkpoints.indexOf(bucket) >= 0) return;
    this.attempt.checkpoints.push(bucket);
    this._emit("simulator_progress_checkpoint", { progress_bucket: bucket });
  };

  Simulator.prototype.answer = function (questionIndex, optionIndex) {
    if (!this.attempt || this.attempt.completedAt) return;
    var question = this.questions[questionIndex];
    if (!question || optionIndex < 0 || optionIndex >= question.options.length) return;
    if (this.attempt.mode === "study" && Number.isInteger(this.attempt.answers[questionIndex])) return;

    this.attempt.answers[questionIndex] = optionIndex;
    this._emit("simulator_question_answer", {
      question_index: questionIndex + 1,
      is_correct: optionIndex === question.correctIndex ? "yes" : "no"
    });
    this._emitCheckpoint();
    this._save();
    this.renderQuestion();
  };

  Simulator.prototype.toggleMark = function () {
    if (!this.attempt || this.attempt.completedAt) return;
    var index = this.attempt.currentIndex;
    var position = this.attempt.marked.indexOf(index);
    if (position >= 0) this.attempt.marked.splice(position, 1);
    else this.attempt.marked.push(index);
    this._emit("simulator_question_mark_review", {
      question_index: index + 1,
      marked: position >= 0 ? "no" : "yes"
    });
    this._save();
    this.renderQuestion();
  };

  Simulator.prototype.goTo = function (index) {
    if (!this.attempt) return;
    var max = this.questions.length - 1;
    var next = Math.min(Math.max(index, 0), max);
    this.attempt.currentIndex = next;
    this._save();
    this.renderQuestion();
  };

  Simulator.prototype.renderRunner = function () {
    clearNode(this.root);

    var header = createElement("header", "ce-sim-runner-header");
    var titleWrap = createElement("div", "ce-sim-runner-title");
    titleWrap.appendChild(createElement("h2", "", this.config.title));

    var status = createElement("div", "ce-sim-runner-status");
    var position = createElement("span", "", "");
    position.setAttribute("data-ce-sim-position", "");
    status.appendChild(position);

    if (this.config.timer) {
      var timer = createElement("time", "ce-sim-timer", formatTime(this.attempt.elapsedSeconds));
      timer.setAttribute("data-ce-sim-timer", "");
      timer.setAttribute("aria-label", this.labels.time);
      status.appendChild(timer);
    }
    titleWrap.appendChild(status);
    header.appendChild(titleWrap);

    var progressLabel = createElement("label", "ce-sim-progress-label", this.labels.progressLabel);
    progressLabel.setAttribute("for", "ce-sim-progress-" + this.config.id);
    var progress = createElement("progress", "ce-sim-progress");
    progress.id = "ce-sim-progress-" + this.config.id;
    progress.max = this.questions.length;
    progress.value = this._answeredCount();
    progressLabel.appendChild(progress);
    header.appendChild(progressLabel);

    this.root.appendChild(header);

    var layout = createElement("div", "ce-sim-layout");
    var main = createElement("section", "ce-sim-question-panel");
    main.setAttribute("data-ce-sim-question-panel", "");
    layout.appendChild(main);

    var aside = createElement("aside", "ce-sim-palette");
    aside.setAttribute("aria-label", this.labels.paletteLabel);
    aside.setAttribute("data-ce-sim-palette", "");
    layout.appendChild(aside);

    this.root.appendChild(layout);

    var live = createElement("div", "ce-sim-sr-only");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("data-ce-sim-live", "");
    this.root.appendChild(live);

    this.renderQuestion();
  };

  Simulator.prototype.renderPalette = function () {
    var self = this;
    var palette = this.root.querySelector("[data-ce-sim-palette]");
    if (!palette || !this.attempt) return;
    clearNode(palette);

    palette.appendChild(createElement("h3", "ce-sim-palette-title", this.labels.paletteLabel));
    var list = createElement("div", "ce-sim-palette-grid");

    this.questions.forEach(function (_, index) {
      var button = createElement("button", "ce-sim-palette-item", String(index + 1));
      button.type = "button";
      button.setAttribute("aria-label", self.labels.question + " " + (index + 1));
      if (index === self.attempt.currentIndex) button.setAttribute("aria-current", "step");
      if (Number.isInteger(self.attempt.answers[index])) button.classList.add("is-answered");
      if (self.attempt.marked.indexOf(index) >= 0) button.classList.add("is-marked");
      button.addEventListener("click", function () { self.goTo(index); });
      list.appendChild(button);
    });

    palette.appendChild(list);

    var legend = createElement("div", "ce-sim-palette-legend");
    legend.appendChild(createElement("span", "is-answered", this.labels.answered));
    legend.appendChild(createElement("span", "is-marked", this.labels.marked));
    palette.appendChild(legend);
  };

  Simulator.prototype.renderQuestion = function () {
    var self = this;
    if (!this.attempt) return;

    var panel = this.root.querySelector("[data-ce-sim-question-panel]");
    if (!panel) return;
    clearNode(panel);

    var index = this.attempt.currentIndex;
    var question = this.questions[index];
    var answer = this.attempt.answers[index];
    var locked = this.attempt.mode === "study" && Number.isInteger(answer);

    var position = this.root.querySelector("[data-ce-sim-position]");
    if (position) {
      position.textContent = this.labels.question + " " + (index + 1) + " " +
        this.labels.of + " " + this.questions.length;
    }

    var progress = this.root.querySelector("progress.ce-sim-progress");
    if (progress) progress.value = this._answeredCount();

    var fieldset = createElement("fieldset", "ce-sim-fieldset");
    var legend = createElement("legend", "ce-sim-question-title",
      this.labels.question + " " + (index + 1) + " " + this.labels.of + " " + this.questions.length);
    fieldset.appendChild(legend);
    fieldset.appendChild(createElement("p", "ce-sim-question-text", question.prompt));

    var options = createElement("div", "ce-sim-options");
    question.options.forEach(function (option, optionIndex) {
      var row = createElement("div", "ce-sim-option");
      var input = createElement("input");
      input.type = "radio";
      input.name = "ce-sim-q-" + self.config.id + "-" + index;
      input.id = "ce-sim-q-" + self.config.id + "-" + index + "-" + optionIndex;
      input.value = String(optionIndex);
      input.checked = answer === optionIndex;
      input.disabled = locked;
      input.addEventListener("change", function () { self.answer(index, optionIndex); });

      var label = createElement("label", "ce-sim-option-label");
      label.setAttribute("for", input.id);
      label.appendChild(createElement("span", "ce-sim-option-letter", String.fromCharCode(65 + optionIndex)));
      label.appendChild(createElement("span", "ce-sim-option-text", option));

      if (locked && optionIndex === question.correctIndex) row.classList.add("is-correct");
      if (locked && answer === optionIndex && answer !== question.correctIndex) row.classList.add("is-wrong");

      row.appendChild(input);
      row.appendChild(label);
      options.appendChild(row);
    });
    fieldset.appendChild(options);

    if (locked) {
      var feedback = createElement("section", "ce-sim-feedback");
      feedback.setAttribute("aria-live", "polite");
      var isCorrect = answer === question.correctIndex;
      feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
      feedback.appendChild(createElement(
        "h3",
        "ce-sim-feedback-title",
        isCorrect ? this.labels.correct : this.labels.incorrect
      ));
      if (question.explanation) {
        var explanation = createElement("p", "ce-sim-feedback-explanation");
        explanation.appendChild(createElement("strong", "", this.labels.explanation + ": "));
        explanation.appendChild(global.document.createTextNode(question.explanation));
        feedback.appendChild(explanation);
      }
      if (question.reference) {
        var reference = createElement("p", "ce-sim-feedback-reference");
        reference.appendChild(createElement("strong", "", this.labels.reference + ": "));
        reference.appendChild(global.document.createTextNode(question.reference));
        feedback.appendChild(reference);
      }
      fieldset.appendChild(feedback);
    }

    panel.appendChild(fieldset);

    var controls = createElement("div", "ce-sim-controls");
    var previous = createElement("button", "ce-sim-btn ce-sim-btn-secondary", this.labels.previous);
    previous.type = "button";
    previous.disabled = index === 0;
    previous.addEventListener("click", function () { self.goTo(index - 1); });
    controls.appendChild(previous);

    var mark = createElement("button", "ce-sim-btn ce-sim-btn-ghost",
      this.attempt.marked.indexOf(index) >= 0 ? this.labels.unmark : this.labels.mark);
    mark.type = "button";
    mark.addEventListener("click", function () { self.toggleMark(); });
    controls.appendChild(mark);

    if (index < this.questions.length - 1) {
      var next = createElement("button", "ce-sim-btn ce-sim-btn-primary", this.labels.next);
      next.type = "button";
      next.addEventListener("click", function () { self.goTo(index + 1); });
      controls.appendChild(next);
    } else {
      var finish = createElement("button", "ce-sim-btn ce-sim-btn-primary", this.labels.finish);
      finish.type = "button";
      finish.addEventListener("click", function () { self.finish(); });
      controls.appendChild(finish);
    }

    panel.appendChild(controls);
    this.renderPalette();

    var live = this.root.querySelector("[data-ce-sim-live]");
    if (live) live.textContent = this.labels.question + " " + (index + 1) + " " + this.labels.of + " " + this.questions.length;
  };

  Simulator.prototype.finish = function () {
    if (!this.attempt || this.attempt.completedAt) return;
    var currentScore = scoreAttempt(this.questions, this.attempt.answers);
    this._emit("simulator_finish_click", { unanswered_count: currentScore.unanswered });

    if (currentScore.unanswered > 0 && typeof global.confirm === "function") {
      if (!global.confirm(this.labels.finishWithUnanswered)) return;
    }

    this.stopTimer();
    this.attempt.completedAt = new Date().toISOString();
    this._save();

    var finalScore = scoreAttempt(this.questions, this.attempt.answers);
    this._emit("simulator_complete", {
      score_bucket: scoreBucket(finalScore.percent),
      unanswered_count: finalScore.unanswered,
      elapsed_seconds: this.attempt.elapsedSeconds
    });
    this.renderResult();
  };

  Simulator.prototype.renderResult = function () {
    if (!this.attempt) return;
    this.stopTimer();
    clearNode(this.root);

    var score = scoreAttempt(this.questions, this.attempt.answers);
    var section = createElement("section", "ce-sim-result");
    section.appendChild(createElement("h2", "ce-sim-result-title", this.labels.result));

    var grid = createElement("div", "ce-sim-result-grid");
    [
      { label: this.labels.hits, value: score.hits },
      { label: this.labels.errors, value: score.errors },
      { label: this.labels.unansweredResult, value: score.unanswered },
      { label: this.labels.score, value: score.percent + "%" },
      { label: this.labels.time, value: formatTime(this.attempt.elapsedSeconds) }
    ].forEach(function (item) {
      var card = createElement("div", "ce-sim-result-card");
      card.appendChild(createElement("strong", "ce-sim-result-value", item.value));
      card.appendChild(createElement("span", "ce-sim-result-label", item.label));
      grid.appendChild(card);
    });
    section.appendChild(grid);

    var actions = createElement("div", "ce-sim-actions");
    var review = createElement("button", "ce-sim-btn ce-sim-btn-primary", this.labels.reviewErrors);
    review.type = "button";
    review.addEventListener("click", this.reviewErrors.bind(this));
    review.disabled = score.errors + score.unanswered === 0;
    actions.appendChild(review);

    var retry = createElement("button", "ce-sim-btn ce-sim-btn-secondary", this.labels.retryAll);
    retry.type = "button";
    retry.addEventListener("click", this.restart.bind(this));
    actions.appendChild(retry);
    section.appendChild(actions);

    this.root.appendChild(section);
    this._emit("simulator_result_view", {
      score_bucket: scoreBucket(score.percent),
      unanswered_count: score.unanswered
    });
  };

  Simulator.prototype.reviewErrors = function () {
    var self = this;
    if (!this.attempt) return;

    this.reviewIndices = this.questions.map(function (question, index) {
      var answer = self.attempt.answers[index];
      return answer === question.correctIndex ? null : index;
    }).filter(function (index) { return index !== null; });

    if (!this.reviewIndices.length) {
      var live = this.root.querySelector("[data-ce-sim-live]");
      if (live) live.textContent = this.labels.noErrors;
      return;
    }

    this.reviewOnly = true;
    this._emit("simulator_review_start", { review_count: this.reviewIndices.length });
    this.renderReviewList();
  };

  Simulator.prototype.renderReviewList = function () {
    var self = this;
    clearNode(this.root);

    var section = createElement("section", "ce-sim-review");
    section.appendChild(createElement("h2", "ce-sim-result-title", this.labels.reviewErrors));

    this.reviewIndices.forEach(function (index) {
      var question = self.questions[index];
      var answer = self.attempt.answers[index];
      var card = createElement("article", "ce-sim-review-card");
      card.appendChild(createElement("h3", "ce-sim-review-question",
        self.labels.question + " " + (index + 1)));
      card.appendChild(createElement("p", "ce-sim-question-text", question.prompt));

      var userAnswer = Number.isInteger(answer) ? question.options[answer] : self.labels.unanswered;
      var correctAnswer = question.options[question.correctIndex];

      var chosen = createElement("p", "ce-sim-review-answer is-wrong");
      chosen.appendChild(createElement("strong", "", "Sua resposta: "));
      chosen.appendChild(global.document.createTextNode(userAnswer));
      card.appendChild(chosen);

      var correct = createElement("p", "ce-sim-review-answer is-correct");
      correct.appendChild(createElement("strong", "", this.labels.correct + ": "));
      correct.appendChild(global.document.createTextNode(correctAnswer));
      card.appendChild(correct);

      if (question.explanation) {
        var explanation = createElement("p", "ce-sim-feedback-explanation");
        explanation.appendChild(createElement("strong", "", self.labels.explanation + ": "));
        explanation.appendChild(global.document.createTextNode(question.explanation));
        card.appendChild(explanation);
      }
      if (question.reference) {
        var reference = createElement("p", "ce-sim-feedback-reference");
        reference.appendChild(createElement("strong", "", self.labels.reference + ": "));
        reference.appendChild(global.document.createTextNode(question.reference));
        card.appendChild(reference);
      }

      section.appendChild(card);
    });

    var back = createElement("button", "ce-sim-btn ce-sim-btn-secondary", this.labels.result);
    back.type = "button";
    back.addEventListener("click", function () { self.renderResult(); });
    section.appendChild(back);

    this.root.appendChild(section);
  };

  var api = {
    version: "1.0.0-p0",
    create: function (config) { return new Simulator(config); },
    normalizeQuestion: normalizeQuestion,
    normalizeQuestions: normalizeQuestions,
    scoreAttempt: scoreAttempt,
    progressBucket: progressBucket,
    scoreBucket: scoreBucket,
    sanitizeAttempt: sanitizeAttempt,
    storageKey: storageKey,
    _test: {
      createEmptyAttempt: createEmptyAttempt,
      formatTime: formatTime
    }
  };

  global.CESimulator = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
