export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = String(category ?? "");
    this.difficulty = String(difficulty ?? "");
    this.numberOfQuestions = Number(numberOfQuestions ?? 0);
    this.playerName = String(playerName ?? "");

    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async getQuestions() {
    let apiUrl = this.buildApiUrl();
    let apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(`Failed to fetch questions (${apiResponse.status})`);
    }

    let responseData = await apiResponse.json();

    if (!responseData || responseData.response_code !== 0) {
      throw new Error(
        `API error: response_code=${responseData?.response_code ?? "unknown"}`
      );
    }

    this.questions = Array.isArray(responseData.results) ? responseData.results : [];
    this.currentQuestionIndex = 0;
    return this.questions;
  }

  buildApiUrl() {
    let apiBaseUrl = "https://opentdb.com/api.php";

    let queryParams = new URLSearchParams();
    queryParams.set("amount", String(this.numberOfQuestions));

    if (this.category) queryParams.set("category", String(this.category));

    if (this.difficulty) queryParams.set("difficulty", String(this.difficulty));

    queryParams.set("type", "multiple");

    return `${apiBaseUrl}?${queryParams.toString()}`;
  }

  incrementScore() {
    this.score += 1;
  }

  getCurrentQuestion() {
    if (
      !Array.isArray(this.questions) ||
      this.currentQuestionIndex < 0 ||
      this.currentQuestionIndex >= this.questions.length
    ) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  nextQuestion() {
    this.currentQuestionIndex += 1;
    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    let totalQuestions = Number(this.numberOfQuestions) || 0;
    if (totalQuestions <= 0) return 0;
    return Math.round((this.score / totalQuestions) * 100);
  }

  saveHighScore() {
    let existingScores = this.getHighScores();

    let totalQuestions = Number(this.numberOfQuestions) || 0;
    let scorePercentage = this.getScorePercentage();

    let newScoreEntry = {
      name: this.playerName || "Player",
      score: this.score,
      total: totalQuestions,
      percentage: scorePercentage,
      difficulty: this.difficulty || "",
      date: new Date().toISOString(),
    };

    existingScores.push(newScoreEntry);

    existingScores.sort((firstScore, secondScore) => {
      let percentageDiff = (secondScore.percentage ?? 0) - (firstScore.percentage ?? 0);
      if (percentageDiff !== 0) return percentageDiff;

      let scoreDiff = (secondScore.score ?? 0) - (firstScore.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      return String(secondScore.date).localeCompare(String(firstScore.date));
    });

    let topTenScores = existingScores.slice(0, 10);
    localStorage.setItem("quizHighScores", JSON.stringify(topTenScores));
  }

  getHighScores() {
    try {
      let savedScores = localStorage.getItem("quizHighScores");
      if (!savedScores) return [];
      let parsedScores = JSON.parse(savedScores);
      return Array.isArray(parsedScores) ? parsedScores : [];
    } catch {
      return [];
    }
  }

  isHighScore() {
    let savedScores = this.getHighScores();
    let currentPercentage = this.getScorePercentage();

    if (savedScores.length < 10) return true;

    let lowestPercentage = savedScores.reduce((minimum, scoreEntry) => {
      let entryPercentage = Number(scoreEntry?.percentage ?? 0);
      return entryPercentage < minimum ? entryPercentage : minimum;
    }, Infinity);

    return currentPercentage > lowestPercentage;
  }

  endQuiz() {
    let finalPercentage = this.getScorePercentage();
    let isNewHighScore = this.isHighScore();

    if (isNewHighScore) {
      this.saveHighScore();
    }

    let allHighScores = this.getHighScores();
    let highScoreBadge = isNewHighScore
      ? `<p class="high-score-badge">🏆 New High Score!</p>`
      : "";

    let scoreDisplay = `<p class="final-score">Score: <strong>${this.score}</strong> / ${this.numberOfQuestions} (<strong>${finalPercentage}%</strong>)</p>`;

    let highScoresList =
      allHighScores.length === 0
        ? `<li>No high scores yet.</li>`
        : allHighScores
            .map((scoreEntry, rankIndex) => {
              let playerName = scoreEntry?.name ?? "Player";
              let percentage = scoreEntry?.percentage ?? 0;
              let difficultyInfo = scoreEntry?.difficulty ? ` • ${scoreEntry.difficulty}` : "";
              let rawScore = `${scoreEntry?.score ?? 0}/${scoreEntry?.total ?? 0}`;
              return `<li><span class="rank">#${
                rankIndex + 1
              }</span> <span class="name">${playerName}</span> <span class="value">${percentage}%</span> <span class="meta">(${rawScore}${difficultyInfo})</span></li>`;
            })
            .join("");

    return `
      <div class="results-screen">
        <h2>Quiz Complete!</h2>
        <p class="player-name">Well done, <strong>${
          this.playerName || "Player"
        }</strong>!</p>
        ${scoreDisplay}
        ${highScoreBadge}
        <div class="high-scores">
          <h3>High Scores</h3>
          <ol class="high-scores-list">
            ${highScoresList}
          </ol>
        </div>
      </div>
    `;
  }
}