// All logic from create, take, manage, and quiz

// ==== CREATE QUIZ ====
function generateQuestions(isEdit = false, existingQuiz = []) {
  const quizId = document.getElementById("quizId").value.trim();
  const num = parseInt(document.getElementById("numQuestions").value);
  const form = document.getElementById("quizForm");
  const container = document.getElementById("questionsContainer");
  const message = document.getElementById("message");

  if (!quizId) {
    message.textContent = "Please enter a Quiz ID.";
    return;
  }

  const quizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");
  if (!isEdit && quizzes[quizId]) {
    message.textContent = "Quiz ID already exists. Choose a unique one.";
    return;
  }

  container.innerHTML = "";
  form.classList.remove("hidden");
  message.textContent = "";

  for (let i = 1; i <= num; i++) {
    const existing = existingQuiz[i - 1] || {};
    const block = document.createElement("div");
    block.innerHTML = `
      <h4>Question ${i}</h4>
      <input type="text" name="q${i}" placeholder="Enter question" value="${existing.question || ''}" required>
      ${[1,2,3,4].map(j => `<input type="text" name="q${i}opt${j}" placeholder="Option ${j}" value="${existing.options?.[j-1] || ''}" required>`).join('')}
      <input type="number" name="q${i}ans" placeholder="Correct Option (1-4)" min="1" max="4" value="${existing.answer !== undefined ? existing.answer+1 : ''}" required>
      <hr>
    `;
    container.appendChild(block);
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const quiz = [];

    for (let i = 1; i <= num; i++) {
      quiz.push({
        question: formData.get(`q${i}`),
        options: [
          formData.get(`q${i}opt1`),
          formData.get(`q${i}opt2`),
          formData.get(`q${i}opt3`),
          formData.get(`q${i}opt4`)
        ],
        answer: parseInt(formData.get(`q${i}ans`)) - 1
      });
    }

    quizzes[quizId] = quiz;
    localStorage.setItem("allQuizzes", JSON.stringify(quizzes));
    message.textContent = `✅ Quiz '${quizId}' saved successfully!`;
    form.classList.add("hidden");
  };
}

// ==== TAKE QUIZ LOGIN ====
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.onsubmit = function (e) {
    e.preventDefault();
    const quizId = document.getElementById("quizIdInput").value.trim();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const quizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");

    if (!quizzes[quizId]) {
      document.getElementById("errorMsg").classList.remove("hidden");
      return;
    }

    localStorage.setItem("candidate", JSON.stringify({ name, email }));
    localStorage.setItem("currentQuizId", quizId);
    location.href = "quiz.html";
  };
}

// ==== QUIZ FUNCTIONALITY ====
if (window.location.pathname.includes("quiz.html")) {
  const quizId = localStorage.getItem("currentQuizId");
  const allQuizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");
  const quiz = allQuizzes[quizId] || [];

  const form = document.getElementById("quizForm");
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  const resultEl = document.getElementById("result");
  const finalScoreEl = document.getElementById("final-score");
  const endContainer = document.getElementById("end-container");
  const timerEl = document.getElementById("timer");
  const pauseBtn = document.getElementById("pauseBtn");
  const progressEl = document.getElementById("progress");

  let index = 0;
  let score = 0;
  let timeLeft = 90;
  let timer;
  let isPaused = false;

  function loadQuestion() {
    const q = quiz[index];
    questionEl.textContent = `Q${index + 1}. ${q.question}`;
    optionsEl.innerHTML = "";
    resultEl.textContent = "";

    q.options.forEach((opt, i) => {
      const label = document.createElement("label");
      label.classList.add("option");
      label.innerHTML = `<input type="radio" name="answer" value="${i}"> ${opt}`;
      optionsEl.appendChild(label);
    });
    updateProgress();
  }

  function updateProgress() {
    const percent = Math.round((index / quiz.length) * 100);
    progressEl.style.width = percent + "%";
    progressEl.textContent = percent + "%";
  }

  function startTimer() {
    timer = setInterval(() => {
      if (!isPaused) {
        timeLeft--;
        timerEl.textContent = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(timer);
          showResult();
        }
      }
    }, 1000);
  }

  pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";
    form.querySelector("button").disabled = isPaused;
    form.classList.toggle("paused", isPaused);
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    if (isPaused) return;

    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) {
      resultEl.textContent = "Please select an option.";
      resultEl.style.color = "red";
      return;
    }

    if (parseInt(selected.value) === quiz[index].answer) score++;
    index++;

    if (index < quiz.length) {
      loadQuestion();
    } else {
      updateProgress();
      clearInterval(timer);
      showResult();
    }
  };

  function showResult() {
    form.classList.add("hidden");
    endContainer.classList.remove("hidden");
    finalScoreEl.innerHTML = `Your Score: <strong>${score}/${quiz.length}</strong>`;
  }

  // Start Quiz
  loadQuestion();
  startTimer();
}

// === Expose for manage.html ===
window.editQuiz = function(id) {
  localStorage.setItem("editQuizId", id);
  location.href = "create.html";
};

window.deleteQuiz = function(id) {
  if (confirm(`Are you sure you want to delete quiz '${id}'?`)) {
    const allQuizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");
    delete allQuizzes[id];
    localStorage.setItem("allQuizzes", JSON.stringify(allQuizzes));
    location.reload();
  }
};




// Add this function where quiz is submitted after answering all questions
function saveSubmission(quizId, name, email, score) {
  const allQuizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");
  if (!allQuizzes[quizId]) return;

  const quiz = allQuizzes[quizId];
  if (!quiz.responses) quiz.responses = [];

  quiz.responses.push({ name, email, score });
  localStorage.setItem("allQuizzes", JSON.stringify(allQuizzes));
}

// Final submission logic (this should be called when quiz ends and user submits answers)
function submitQuiz(quizId) {
  const name = document.getElementById("userName").value;
  const email = document.getElementById("userEmail").value;
  const score = calculateScore(); // assume this function returns correct score

  saveSubmission(quizId, name, email, score);
  alert(`Thank you ${name}, you scored ${score} marks.`);

  // Optional: redirect or clear UI after submission
  // location.href = "index.html";
}

// ========== TAKE QUIZ LOGIC ==========

let currentQuizId = "";
let quizData = [];
let selectedAnswers = [];

function loadQuiz() {
  const id = document.getElementById("quizIdInput").value.trim();
  const allQuizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");

  if (!allQuizzes[id]) {
    alert("❌ Quiz ID not found");
    return;
  }

  quizData = allQuizzes[id].questions;
  currentQuizId = id;

  document.getElementById("credentials").classList.remove("hidden");
}

function startQuiz() {
  const name = document.getElementById("userName").value;
  const email = document.getElementById("userEmail").value;

  if (!name || !email) {
    alert("Please enter both name and email to begin.");
    return;
  }

  document.getElementById("credentials").classList.add("hidden");
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById("quizContainer");
  container.innerHTML = "";
  container.classList.remove("hidden");

  selectedAnswers = [];

  quizData.forEach((q, idx) => {
    const div = document.createElement("div");
    div.classList.add("question-block");
    div.innerHTML = `<p><strong>Q${idx + 1}:</strong> ${q.question}</p>`;

    q.options.forEach((opt, i) => {
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${idx}`;
      input.value = i;
      input.onchange = () => selectedAnswers[idx] = parseInt(input.value);
      div.appendChild(input);
      div.appendChild(document.createTextNode(opt));
      div.appendChild(document.createElement("br"));
    });

    container.appendChild(div);
  });

  document.getElementById("submitBtn").classList.remove("hidden");
}

function calculateScore() {
  let score = 0;
  quizData.forEach((q, i) => {
    if (selectedAnswers[i] === q.answer) {
      score++;
    }
  });
  return score;
}

function saveSubmission(quizId, name, email, score) {
  const allQuizzes = JSON.parse(localStorage.getItem("allQuizzes") || "{}");
  if (!allQuizzes[quizId]) return;

  const quiz = allQuizzes[quizId];
  if (!quiz.responses) quiz.responses = [];

  quiz.responses.push({ name, email, score });
  localStorage.setItem("allQuizzes", JSON.stringify(allQuizzes));
}

// function submitQuiz() {
//   const name = document.getElementById("userName").value;
//   const email = document.getElementById("userEmail").value;

//   if (!name || !email) {
//     alert("Please enter your name and email.");
//     return;
//   }

//   const score = calculateScore();
//   saveSubmission(currentQuizId, name, email, score);

//   localStorage.setItem("quizResult", JSON.stringify({ name, email, score, total: quizData.length }));
//   window.location.href = "result.html";
// }

function submitQuiz() {
  const name = document.getElementById("userName").value;
  const email = document.getElementById("userEmail").value;

  if (!name || !email) {
    alert("Please enter your name and email.");
    return;
  }

  const score = calculateScore();
  saveSubmission(currentQuizId, name, email, score);

  // Show result on same page (REMOVE THIS):
  // document.getElementById("quizContainer").classList.add("hidden");
  // document.getElementById("submitBtn").classList.add("hidden");
  // document.getElementById("resultContainer").classList.remove("hidden");
  // document.getElementById("resultText").innerText = `Thank you, ${name} (Email: ${email})!\nYou scored ${score} out of ${quizData.length} marks.`;

  // ✅ Instead: store result and redirect
  localStorage.setItem("quizResult", JSON.stringify({
    name,
    email,
    score,
    total: quizData.length
  }));

  window.location.href = "result.html";
}



// === Attach listeners after DOM loaded ===
window.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadBtn");
  const startBtn = document.getElementById("beginQuiz");
  const submitBtn = document.getElementById("submitBtn");

  if (loadBtn) loadBtn.addEventListener("click", loadQuiz);
  if (startBtn) startBtn.addEventListener("click", startQuiz);
  if (submitBtn) submitBtn.addEventListener("click", submitQuiz);
});
