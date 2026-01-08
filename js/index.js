import Quiz from "./quiz.js";
import Question from "./question.js";

let quizOptionsForm = document.getElementById("quizOptions");
let playerNameInput = document.getElementById("playerName");
let categoryInput = document.getElementById("categoryMenu");
let difficultyOptions = document.getElementById("difficultyOptions");
let questionsNumber = document.getElementById("questionsNumber");
let startQuizBtn = document.getElementById("startQuiz");
let questionsContainer = document.querySelector(".questions-container");

let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  let overlay = questionsContainer.querySelector(".loading-overlay");
  if (overlay) overlay.remove();
}

function showError(errorMessage) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${escapeHtml(errorMessage)}</p>
      <button class="btn-play retry-btn" type="button">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  let retryBtn = questionsContainer.querySelector(".retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", resetToStart);
  }
}

function validateForm() {
  let questionCount = Number(questionsNumber.value);

  if (!questionsNumber.value) {
    return { isValid: false, error: "Please enter the number of questions." };
  }

  if (Number.isNaN(questionCount)) {
    return { isValid: false, error: "Number of questions must be a number." };
  }

  if (questionCount < 1) {
    return { isValid: false, error: "Minimum number of questions is 1." };
  }

  if (questionCount > 50) {
    return { isValid: false, error: "Maximum number of questions is 50." };
  }

  return { isValid: true, error: null };
}

function showFormError(errorMessage) {
  let existingError = quizOptionsForm.querySelector(".form-error");
  if (existingError) existingError.remove();

  let errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.innerHTML = `
    <i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(errorMessage)}
  `;

  startQuizBtn.parentElement.insertBefore(errorDiv, startQuizBtn);

  setTimeout(() => {
    errorDiv.classList.add("fade-out");
    setTimeout(() => errorDiv.remove(), 300);
  }, 3000);
}

function resetToStart() {
  questionsContainer.innerHTML = "";
  playerNameInput.value = "";
  questionsNumber.value = "10";
  categoryInput.value = "";
  difficultyOptions.value = "easy";
  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}

async function startQuiz() {
  let validation = validateForm();
  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  let playerName = playerNameInput.value.trim() || "Player";
  let category = categoryInput.value;
  let difficulty = difficultyOptions.value;
  let numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);
  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    let questions = await currentQuiz.getQuestions();
    hideLoading();

    if (!questions || questions.length === 0) {
      showError("No questions returned from the API. Please try again.");
      return;
    }

    let firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError(error?.message || "Failed to load questions. Please try again.");
  }
}

startQuizBtn.addEventListener("click", startQuiz);

questionsNumber.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startQuiz();
});

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startQuiz();
});

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}