export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = typeof onQuizEnd === "function" ? onQuizEnd : () => {};

    this.questionData = this.quiz.getCurrentQuestion();
    this.index = this.quiz.currentQuestionIndex;

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 30;

    this.handleKeyPress = this.handleKeyPress.bind(this);

    if (!this.questionData) return;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);

    this.wrongAnswers = (this.questionData.incorrect_answers || []).map((answer) =>
      this.decodeHtml(answer)
    );

    this.allAnswers = this.shuffleAnswers();
  }

  decodeHtml(htmlText) {
    let parser = new DOMParser().parseFromString(
      String(htmlText ?? ""),
      "text/html"
    );
    return parser.documentElement.textContent || "";
  }

  shuffleAnswers() {
    let answersArray = [...this.wrongAnswers, this.correctAnswer];

    for (let i = answersArray.length - 1; i > 0; i--) {
      let randomIndex = Math.floor(Math.random() * (i + 1));
      [answersArray[i], answersArray[randomIndex]] = [answersArray[randomIndex], answersArray[i]];
    }

    return answersArray;
  }

  getProgress() {
    let totalQuestions = Number(this.quiz.numberOfQuestions) || 0;
    if (totalQuestions <= 0) return 0;
    return Math.round(((this.index + 1) / totalQuestions) * 100);
  }

  displayQuestion() {
    if (!this.questionData) {
      this.container.innerHTML = this.quiz.endQuiz();
      this.onQuizEnd();
      return;
    }

    let progressPercentage = this.getProgress();

    let answersHtml = this.allAnswers
      .map((answer, answerIndex) => {
        let keyNumber = answerIndex + 1;
        return `
          <button class="answer-btn" data-answer="${this.escapeAttribute(
            answer
          )}" type="button">
            <span class="answer-key">${keyNumber}</span>
            <span class="answer-text">${this.escapeHtml(answer)}</span>
          </button>
        `;
      })
      .join("");

    let questionHtml = `
      <div class="game-card question-card">
        
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${
      this.quiz.numberOfQuestions
    }</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${progressPercentage}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.escapeHtml(this.category)}</span>
          </div>

          <div class="stat-badge difficulty ${this.sanitizeClass(
            this.quiz.difficulty
          )}">
            <i class="fa-solid ${this.getDifficultyIcon(
              this.quiz.difficulty
            )}"></i>
            <span>${this.escapeHtml(this.quiz.difficulty)}</span>
          </div>

          <div class="stat-badge timer" id="timerBadge">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value" id="timerValue">${
              this.timeRemaining
            }</span>s
          </div>

          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
        </div>

        <h2 class="question-text">${this.escapeHtml(this.question)}</h2>

        <div class="answers-grid">
          ${answersHtml}
        </div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value" id="scoreValue">${
              this.quiz.score
            }</div>
          </div>
        </div>

        <div id="statusArea"></div>
      </div>
    `;

    this.container.innerHTML = questionHtml;
    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    this.answerButtons = Array.from(
      this.container.querySelectorAll(".answer-btn")
    );

    this.answerButtons.forEach((button) => {
      button.addEventListener("click", () => this.checkAnswer(button));
    });

    document.addEventListener("keydown", this.handleKeyPress);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.handleKeyPress);
  }

  handleKeyPress(keyEvent) {
    if (this.answered) return;

    let validKeys = ["1", "2", "3", "4"];
    if (!validKeys.includes(keyEvent.key)) return;

    let buttonIndex = Number(keyEvent.key) - 1;
    let selectedButton = this.answerButtons?.[buttonIndex];
    if (selectedButton) this.checkAnswer(selectedButton);
  }

  startTimer() {
    let timerDisplay = this.container.querySelector("#timerValue");
    let timerBadge = this.container.querySelector("#timerBadge");

    if (!timerDisplay) return;

    timerDisplay.textContent = String(this.timeRemaining);

    this.timerInterval = setInterval(() => {
      if (this.answered) return;

      this.timeRemaining -= 1;
      timerDisplay.textContent = String(this.timeRemaining);

      if (this.timeRemaining <= 10 && timerBadge) {
        timerBadge.classList.add("warning");
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    this.disableAllButtons();

    this.highlightCorrectAnswer(true);

    let statusDisplay = this.container.querySelector("#statusArea");
    if (statusDisplay) {
      statusDisplay.innerHTML = `
        <div class="time-up-message">
          <i class="fa-solid fa-clock"></i> TIME'S UP!
        </div>
      `;
    }

    this.animateQuestion(450);
  }

  checkAnswer(selectedButton) {
    if (this.answered) return;

    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    let selectedAnswer = this.decodeHtml(
      selectedButton.getAttribute("data-answer") || ""
    );

    let isAnswerCorrect =
      selectedAnswer.trim().toLowerCase() === this.correctAnswer.trim().toLowerCase();

    if (isAnswerCorrect) {
      selectedButton.classList.add("correct");
      this.quiz.incrementScore();
    } else {
      selectedButton.classList.add("wrong");
      this.highlightCorrectAnswer(false);
    }

    this.disableAllButtons(selectedButton);

    let scoreDisplay = this.container.querySelector("#scoreValue");
    if (scoreDisplay) scoreDisplay.textContent = String(this.quiz.score);

    this.animateQuestion(450);
  }

  highlightCorrectAnswer(timeExpired = false) {
    let normalizedCorrect = this.correctAnswer.trim().toLowerCase();
    let allButtons = Array.from(this.container.querySelectorAll(".answer-btn"));

    let correctButton = allButtons.find((button) => {
      let buttonAnswer = this.decodeHtml(button.getAttribute("data-answer") || "");
      return buttonAnswer.trim().toLowerCase() === normalizedCorrect;
    });

    if (!correctButton) return;

    if (timeExpired) {
      correctButton.classList.add("correct");
    } else {
      correctButton.classList.add("correct-reveal");
    }
  }

  getNextQuestion() {
    let hasMoreQuestions = this.quiz.nextQuestion();

    if (hasMoreQuestions) {
      let nextQuestion = new Question(this.quiz, this.container, this.onQuizEnd);
      nextQuestion.displayQuestion();
      return;
    }

    this.container.innerHTML = this.quiz.endQuiz();

    let playAgainButton = this.container.querySelector(".btn-restart");
    if (playAgainButton) {
      playAgainButton.addEventListener("click", () => this.onQuizEnd());
    } else {
      this.onQuizEnd();
    }
  }

  async animateQuestion(animationDuration = 450) {
    let questionCard = this.container.querySelector(".question-card");
    await this.waitDelay(1500);

    if (questionCard) questionCard.classList.add("exit");

    await this.waitDelay(animationDuration);

    this.getNextQuestion();
  }

  disableAllButtons(excludeButton = null) {
    let allButtons = Array.from(this.container.querySelectorAll(".answer-btn"));
    allButtons.forEach((button) => {
      if (excludeButton && button === excludeButton) {
        button.disabled = true;
        return;
      }
      button.classList.add("disabled");
      button.disabled = true;
    });
  }

  waitDelay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  escapeHtml(text) {
    return String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  escapeAttribute(text) {
    return String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;");
  }

  sanitizeClass(text) {
    return String(text ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }

  getDifficultyIcon(difficultyLevel) {
    let level = String(difficultyLevel ?? "").toLowerCase();
    if (level === "easy") return "fa-face-smile";
    if (level === "medium") return "fa-face-meh";
    if (level === "hard") return "fa-skull";
    return "fa-gauge-high";
  }
}