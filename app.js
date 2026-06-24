const STORAGE_KEY = "classquiz-ai-mvp";

const demoClasses = [
  {
    id: "biology",
    name: "Honors Biology",
    teacherName: "Ms. Rivera",
    platform: "Google Classroom",
    section: "Period 2",
    subject: "biology",
    lastSyncedAt: "2026-06-24",
    materials: [
      {
        id: "bio-m1",
        title: "Cell Organelles Study Guide",
        type: "PDF",
        url: "#",
        topicKeywords: ["cell organelles", "mitochondria", "nucleus", "chloroplast", "ribosome"],
        text: "Cells contain organelles with specific functions. The nucleus stores DNA and controls cell activities. Mitochondria break down glucose to make ATP energy. Chloroplasts perform photosynthesis in plant cells. Ribosomes make proteins. The cell membrane controls what enters and leaves the cell."
      },
      {
        id: "bio-m2",
        title: "Photosynthesis Slides",
        type: "Google Slides",
        url: "#",
        topicKeywords: ["photosynthesis", "chloroplast", "glucose", "carbon dioxide", "oxygen"],
        text: "Photosynthesis happens in chloroplasts. Plants use sunlight, carbon dioxide, and water to make glucose and oxygen. Chlorophyll absorbs light energy."
      },
      {
        id: "bio-m3",
        title: "Cell Transport Assignment",
        type: "Assignment",
        url: "#",
        topicKeywords: ["cell membrane", "diffusion", "osmosis", "transport"],
        text: "Diffusion is movement from high concentration to low concentration. Osmosis is diffusion of water across a membrane. Active transport requires energy."
      }
    ]
  },
  {
    id: "algebra",
    name: "Algebra 1",
    teacherName: "Mr. Chen",
    platform: "Schoology",
    section: "Block A",
    subject: "algebra",
    lastSyncedAt: "2026-06-24",
    materials: [
      {
        id: "alg-m1",
        title: "Linear Equations Notes",
        type: "Google Doc",
        url: "#",
        topicKeywords: ["linear equations", "slope", "y-intercept", "graphing"],
        text: "A linear equation can be written as y = mx + b. The m value is the slope, and b is the y-intercept. Slope is rise over run."
      },
      {
        id: "alg-m2",
        title: "Quadratics Intro Worksheet",
        type: "Worksheet",
        url: "#",
        topicKeywords: ["quadratics", "parabola", "vertex", "factoring"],
        text: "Quadratic functions form parabolas. Standard form is ax^2 + bx + c. The vertex is the highest or lowest point."
      }
    ]
  },
  {
    id: "physics",
    name: "Physical Science",
    teacherName: "Dr. Patel",
    platform: "Google Classroom",
    section: "Period 5",
    subject: "physics",
    lastSyncedAt: "2026-06-24",
    materials: [
      {
        id: "phy-m1",
        title: "Newton's Laws Summary",
        type: "PDF",
        url: "#",
        topicKeywords: ["newton", "forces", "motion", "inertia", "acceleration"],
        text: "Newton's first law says objects stay at rest or in motion unless acted on by a net force. Newton's second law says force equals mass times acceleration. Newton's third law says every action has an equal and opposite reaction."
      }
    ]
  }
];

const webResources = [
  {
    id: "web-bio-video-1",
    subject: "biology",
    topic: "cell organelles",
    type: "Video",
    title: "Khan Academy: Introduction to Cells",
    sourceName: "Khan Academy",
    url: "https://www.khanacademy.org/science/biology/structure-of-a-cell",
    reasonItHelps: "Explains organelles with beginner-friendly visuals."
  },
  {
    id: "web-bio-article-1",
    subject: "biology",
    topic: "cell organelles",
    type: "Article",
    title: "Britannica: Cell Organelles Overview",
    sourceName: "Britannica",
    url: "https://www.britannica.com/science/cell-biology",
    reasonItHelps: "Gives a reliable written explanation of cell structures."
  },
  {
    id: "web-bio-practice-1",
    subject: "biology",
    topic: "cell organelles",
    type: "Practice Quiz",
    title: "CK-12 Cell Organelles Practice",
    sourceName: "CK-12",
    url: "https://www.ck12.org/biology/cell-organelles/",
    reasonItHelps: "Gives extra practice questions after reviewing organelle functions."
  },
  {
    id: "web-bio-flashcards-1",
    subject: "biology",
    topic: "cell organelles",
    type: "Flashcards",
    title: "Organelle Function Flashcards",
    sourceName: "Study Stack",
    url: "https://www.studystack.com/",
    reasonItHelps: "Useful for memorizing organelle names and jobs."
  },
  {
    id: "web-bio-sim-1",
    subject: "biology",
    topic: "photosynthesis",
    type: "Simulation",
    title: "Photosynthesis Interactive Simulation",
    sourceName: "PhET",
    url: "https://phet.colorado.edu/",
    reasonItHelps: "Interactive simulations help connect inputs and outputs of photosynthesis."
  },
  {
    id: "web-alg-video-1",
    subject: "algebra",
    topic: "linear equations",
    type: "Video",
    title: "Khan Academy: Slope-intercept Form",
    sourceName: "Khan Academy",
    url: "https://www.khanacademy.org/math/algebra/linear-equations-and-inequalitie",
    reasonItHelps: "Explains slope and y-intercept step by step."
  },
  {
    id: "web-alg-exercise-1",
    subject: "algebra",
    topic: "linear equations",
    type: "Exercise",
    title: "IXL Linear Equations Practice",
    sourceName: "IXL",
    url: "https://www.ixl.com/math/algebra-1",
    reasonItHelps: "Gives repeated practice with instant feedback."
  },
  {
    id: "web-phy-video-1",
    subject: "physics",
    topic: "newton",
    type: "Video",
    title: "Crash Course: Newton's Laws",
    sourceName: "Crash Course",
    url: "https://www.youtube.com/user/crashcourse",
    reasonItHelps: "Explains Newton's laws with examples and visuals."
  },
  {
    id: "web-phy-worksheet-1",
    subject: "physics",
    topic: "forces",
    type: "Worksheet",
    title: "Physics Classroom Force Practice",
    sourceName: "The Physics Classroom",
    url: "https://www.physicsclassroom.com/",
    reasonItHelps: "Includes practice problems about forces and motion."
  }
];

const questionBank = [
  {
    subject: "biology",
    topic: "cell organelles",
    questionText: "Which organelle stores DNA and controls many cell activities?",
    choices: ["Mitochondria", "Nucleus", "Ribosome", "Cell membrane"],
    correctAnswer: "Nucleus",
    explanation: "The nucleus stores DNA and helps control cell activities.",
    weakTopic: "nucleus",
    sourceHint: "Cell Organelles Study Guide"
  },
  {
    subject: "biology",
    topic: "cell organelles",
    questionText: "What is the main job of mitochondria?",
    choices: ["Make ATP energy", "Store water", "Control what enters the cell", "Make sunlight"],
    correctAnswer: "Make ATP energy",
    explanation: "Mitochondria break down glucose and help produce ATP energy for the cell.",
    weakTopic: "mitochondria",
    sourceHint: "Cell Organelles Study Guide"
  },
  {
    subject: "biology",
    topic: "cell organelles",
    questionText: "Which organelle makes proteins?",
    choices: ["Ribosome", "Chloroplast", "Nucleus", "Vacuole"],
    correctAnswer: "Ribosome",
    explanation: "Ribosomes are responsible for protein production.",
    weakTopic: "ribosomes",
    sourceHint: "Cell Organelles Study Guide"
  },
  {
    subject: "biology",
    topic: "cell organelles",
    questionText: "Which structure controls what enters and leaves the cell?",
    choices: ["Cell membrane", "Ribosome", "Nucleus", "Chloroplast"],
    correctAnswer: "Cell membrane",
    explanation: "The cell membrane acts like a boundary and controls movement in and out of the cell.",
    weakTopic: "cell membrane",
    sourceHint: "Cell Organelles Study Guide"
  },
  {
    subject: "biology",
    topic: "photosynthesis",
    questionText: "Where does photosynthesis happen in plant cells?",
    choices: ["Mitochondria", "Chloroplasts", "Nucleus", "Ribosomes"],
    correctAnswer: "Chloroplasts",
    explanation: "Photosynthesis happens in chloroplasts, which contain chlorophyll.",
    weakTopic: "chloroplasts",
    sourceHint: "Photosynthesis Slides"
  },
  {
    subject: "algebra",
    topic: "linear equations",
    questionText: "In y = mx + b, what does m represent?",
    choices: ["The slope", "The y-intercept", "The x-value", "The answer"],
    correctAnswer: "The slope",
    explanation: "In slope-intercept form, m is the slope and b is the y-intercept.",
    weakTopic: "slope",
    sourceHint: "Linear Equations Notes"
  },
  {
    subject: "algebra",
    topic: "linear equations",
    questionText: "In y = mx + b, what does b represent?",
    choices: ["The slope", "The y-intercept", "The graph title", "The coefficient of x"],
    correctAnswer: "The y-intercept",
    explanation: "b is the y-intercept, where the line crosses the y-axis.",
    weakTopic: "y-intercept",
    sourceHint: "Linear Equations Notes"
  },
  {
    subject: "physics",
    topic: "newton",
    questionText: "Newton's third law says that every action has what?",
    choices: ["A faster speed", "An equal and opposite reaction", "No force", "A smaller mass"],
    correctAnswer: "An equal and opposite reaction",
    explanation: "Newton's third law is about action-reaction force pairs.",
    weakTopic: "Newton's third law",
    sourceHint: "Newton's Laws Summary"
  },
  {
    subject: "physics",
    topic: "forces",
    questionText: "Newton's second law is usually written as which equation?",
    choices: ["F = ma", "E = mc²", "v = d/t", "a = v/t"],
    correctAnswer: "F = ma",
    explanation: "Newton's second law says force equals mass times acceleration.",
    weakTopic: "Newton's second law",
    sourceHint: "Newton's Laws Summary"
  }
];

let state = loadState();
let currentClassId = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let selectedAnswers = {};

function defaultState() {
  return {
    connectedPlatform: null,
    classes: [],
    attempts: [],
    settings: {
      allowWebResources: true
    }
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mockConnect(platform) {
  state.connectedPlatform = platform;
  syncDemoClasses();
  showPage("dashboard");
}

function syncDemoClasses() {
  if (!state.connectedPlatform) state.connectedPlatform = "Google Classroom Demo";
  state.classes = JSON.parse(JSON.stringify(demoClasses));
  saveState();
  renderAll();
}

function resetDemoData() {
  state = defaultState();
  state.connectedPlatform = "Google Classroom Demo";
  state.classes = JSON.parse(JSON.stringify(demoClasses));
  state.attempts = [];
  saveState();
  renderAll();
  alert("Demo data reset.");
}

function deleteLocalData() {
  if (!confirm("Delete all local data from this browser?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  renderAll();
  showPage("home");
}

function saveSettings() {
  state.settings.allowWebResources = document.getElementById("allowWebToggle").checked;
  saveState();
}

function renderAll() {
  renderDashboard();
  renderQuizClassSelect();
  renderSettings();
}

function renderDashboard() {
  const connectionText = document.getElementById("connectionText");
  if (!connectionText) return;

  connectionText.textContent = state.connectedPlatform
    ? `Connected to ${state.connectedPlatform}. Demo classes are synced.`
    : "Not connected yet. Use demo sync to import classes.";

  document.getElementById("classCount").textContent = state.classes.length;
  document.getElementById("attemptCount").textContent = state.attempts.length;

  const weakTopics = new Set();
  state.attempts.forEach(attempt => attempt.weakTopics.forEach(topic => weakTopics.add(topic)));
  document.getElementById("weakTopicCount").textContent = weakTopics.size;

  const classList = document.getElementById("classList");
  classList.innerHTML = "";

  if (state.classes.length === 0) {
    classList.innerHTML = `<div class="warning">No classes synced yet. Click “Sync Classes” to load demo classes.</div>`;
  } else {
    state.classes.forEach(cls => {
      const card = document.createElement("div");
      card.className = "class-card";
      card.innerHTML = `
        <h3>${cls.name}</h3>
        <p>${cls.teacherName} • ${cls.platform} • ${cls.section}</p>
        <div class="tag-row">
          <span class="tag">${cls.materials.length} resources</span>
          <span class="tag">Last synced: ${cls.lastSyncedAt}</span>
        </div>
        <button class="secondary">Open Class</button>
      `;
      card.querySelector("button").onclick = () => openClass(cls.id);
      classList.appendChild(card);
    });
  }

  const recentResults = document.getElementById("recentResults");
  recentResults.innerHTML = "";

  if (state.attempts.length === 0) {
    recentResults.innerHTML = `<div class="warning">No quiz attempts yet. Generate a practice quiz to see results here.</div>`;
    return;
  }

  state.attempts.slice(-4).reverse().forEach(attempt => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = `
      <h3>${attempt.title}</h3>
      <p>Score: <strong>${attempt.score}%</strong></p>
      <div class="tag-row">
        ${attempt.weakTopics.map(topic => `<span class="tag">${topic}</span>`).join("")}
      </div>
    `;
    recentResults.appendChild(div);
  });
}

function openClass(classId) {
  currentClassId = classId;
  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return;

  const details = document.getElementById("classDetails");
  details.innerHTML = `
    <div class="page-title-row">
      <div>
        <h2>${cls.name}</h2>
        <p>${cls.teacherName} • ${cls.platform} • ${cls.section}</p>
      </div>
      <button class="primary" onclick="prepareQuizForClass('${cls.id}')">Generate Practice Quiz</button>
    </div>
    <h3>Imported Class Resources</h3>
    <div class="card-grid">
      ${cls.materials.map(material => `
        <div class="resource-card">
          <div class="tag-row">
            <span class="tag class-resource">Class Resource</span>
            <span class="tag">${material.type}</span>
          </div>
          <h3>${material.title}</h3>
          <p>${material.text}</p>
          <p><strong>Topics:</strong> ${material.topicKeywords.join(", ")}</p>
        </div>
      `).join("")}
    </div>
  `;

  showPage("classPage");
}

function prepareQuizForClass(classId) {
  document.getElementById("quizClassSelect").value = classId;
  const cls = state.classes.find(c => c.id === classId);
  if (cls && cls.subject === "algebra") document.getElementById("topicInput").value = "linear equations";
  if (cls && cls.subject === "physics") document.getElementById("topicInput").value = "newton";
  if (cls && cls.subject === "biology") document.getElementById("topicInput").value = "cell organelles";
  showPage("quizSetup");
}

function renderQuizClassSelect() {
  const select = document.getElementById("quizClassSelect");
  if (!select) return;

  select.innerHTML = "";
  if (state.classes.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No classes synced yet";
    option.value = "";
    select.appendChild(option);
    return;
  }

  state.classes.forEach(cls => {
    const option = document.createElement("option");
    option.value = cls.id;
    option.textContent = cls.name;
    select.appendChild(option);
  });
}

function startQuiz() {
  if (state.classes.length === 0) {
    alert("Sync demo classes first.");
    syncDemoClasses();
    return;
  }

  const classId = document.getElementById("quizClassSelect").value;
  const topic = document.getElementById("topicInput").value.trim().toLowerCase();
  const difficulty = document.getElementById("difficultySelect").value;
  const count = Number(document.getElementById("questionCountSelect").value);

  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return alert("Choose a class first.");

  const relevantMaterials = findRelevantMaterials(cls, topic);
  const enoughClassResources = relevantMaterials.length >= 2 || relevantMaterials.some(m => m.text.length > 180);

  let possibleQuestions = questionBank.filter(q =>
    q.subject === cls.subject &&
    (q.topic.includes(topic) || topic.includes(q.topic) || q.questionText.toLowerCase().includes(topic) || q.weakTopic.toLowerCase().includes(topic))
  );

  if (possibleQuestions.length === 0) {
    possibleQuestions = questionBank.filter(q => q.subject === cls.subject);
  }

  const quizQuestions = possibleQuestions.slice(0, count).map((q, index) => {
    const sourceMaterial = cls.materials.find(m => q.sourceHint && m.title.includes(q.sourceHint)) || relevantMaterials[0] || cls.materials[0];
    return {
      id: `q-${index + 1}`,
      ...q,
      sourceMaterialId: sourceMaterial ? sourceMaterial.id : null,
      sourceMaterialTitle: sourceMaterial ? sourceMaterial.title : "No matching class material",
      usedWebResource: !enoughClassResources && state.settings.allowWebResources
    };
  });

  const usedWebResources = !enoughClassResources && state.settings.allowWebResources;
  currentQuiz = {
    id: `quiz-${Date.now()}`,
    classId,
    className: cls.name,
    subject: cls.subject,
    topic,
    difficulty,
    questions: quizQuestions,
    relevantMaterials,
    usedWebResources
  };
  currentQuestionIndex = 0;
  selectedAnswers = {};

  renderQuizQuestion();
  showPage("quizPage");
}

function findRelevantMaterials(cls, topic) {
  const terms = topic.split(/\s+/).filter(Boolean);
  return cls.materials.filter(material => {
    const haystack = `${material.title} ${material.topicKeywords.join(" ")} ${material.text}`.toLowerCase();
    return terms.some(term => haystack.includes(term));
  });
}

function renderQuizQuestion() {
  if (!currentQuiz) return;
  const question = currentQuiz.questions[currentQuestionIndex];
  document.getElementById("quizTitle").textContent = `${currentQuiz.className}: ${capitalize(currentQuiz.topic)}`;

  const sourceNote = document.getElementById("quizSourceNote");
  if (currentQuiz.usedWebResources) {
    sourceNote.innerHTML = `Not enough school resources were found for this topic, so we added trusted web resources to help you study.`;
  } else {
    sourceNote.innerHTML = `AI-generated from your class materials.`;
  }

  document.getElementById("progressBadge").textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;

  const box = document.getElementById("questionBox");
  box.innerHTML = `
    <p class="question-title">${question.questionText}</p>
    <div class="tag-row">
      <span class="tag class-resource">Class Resource: ${question.sourceMaterialTitle}</span>
      ${question.usedWebResource ? `<span class="tag web-resource">Web Resource support used</span>` : ""}
    </div>
    <div class="choices">
      ${question.choices.map(choice => `
        <label class="choice">
          <input type="radio" name="answer" value="${escapeHtml(choice)}" ${selectedAnswers[question.id] === choice ? "checked" : ""} />
          <span>${choice}</span>
        </label>
      `).join("")}
    </div>
  `;

  box.querySelectorAll("input[name='answer']").forEach(input => {
    input.addEventListener("change", () => {
      selectedAnswers[question.id] = input.value;
    });
  });
}

function nextQuestion() {
  if (!currentQuiz) return;
  if (currentQuestionIndex < currentQuiz.questions.length - 1) {
    currentQuestionIndex++;
    renderQuizQuestion();
  }
}

function previousQuestion() {
  if (!currentQuiz) return;
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuizQuestion();
  }
}

function submitQuiz() {
  if (!currentQuiz) return;

  const unanswered = currentQuiz.questions.filter(q => !selectedAnswers[q.id]);
  if (unanswered.length > 0) {
    const proceed = confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`);
    if (!proceed) return;
  }

  const results = currentQuiz.questions.map(q => {
    const answer = selectedAnswers[q.id] || "No answer";
    return {
      question: q,
      answer,
      isCorrect: answer === q.correctAnswer
    };
  });

  const correctCount = results.filter(r => r.isCorrect).length;
  const score = Math.round((correctCount / results.length) * 100);
  const weakTopics = [...new Set(results.filter(r => !r.isCorrect).map(r => r.question.weakTopic))];

  const attempt = {
    id: `attempt-${Date.now()}`,
    title: `${currentQuiz.className} - ${capitalize(currentQuiz.topic)}`,
    score,
    weakTopics,
    createdAt: new Date().toISOString(),
    quiz: currentQuiz,
    results
  };

  state.attempts.push(attempt);
  saveState();
  renderResults(attempt);
  showPage("results");
}

function renderResults(attempt) {
  const resultSummary = document.getElementById("resultSummary");
  const weakText = attempt.weakTopics.length ? attempt.weakTopics.join(", ") : "No major weak topics detected.";
  resultSummary.innerHTML = `
    <div class="result-card ${attempt.score >= 70 ? "correct" : "incorrect"}">
      <h3>${attempt.title}</h3>
      <p>Your score: <strong>${attempt.score}%</strong></p>
      <p><strong>Weak topics:</strong> ${weakText}</p>
    </div>
  `;

  const answerReview = document.getElementById("answerReview");
  answerReview.innerHTML = attempt.results.map(result => `
    <div class="result-card ${result.isCorrect ? "correct" : "incorrect"}">
      <h3>${result.question.questionText}</h3>
      <p><strong>Your answer:</strong> ${result.answer}</p>
      <p><strong>Correct answer:</strong> ${result.question.correctAnswer}</p>
      <p>${result.question.explanation}</p>
      <div class="tag-row">
        <span class="tag class-resource">Class Resource: ${result.question.sourceMaterialTitle}</span>
      </div>
    </div>
  `).join("");

  renderRecommendations(attempt);
  renderStudyPlan(attempt);
}

function renderRecommendations(attempt) {
  const cls = state.classes.find(c => c.id === attempt.quiz.classId);
  const weakTopics = attempt.weakTopics.length ? attempt.weakTopics : [attempt.quiz.topic];

  const classRecs = cls.materials.filter(material => {
    const text = `${material.title} ${material.topicKeywords.join(" ")} ${material.text}`.toLowerCase();
    return weakTopics.some(topic => text.includes(topic.toLowerCase())) || material.topicKeywords.some(keyword => attempt.quiz.topic.includes(keyword));
  }).slice(0, 4);

  const webRecs = state.settings.allowWebResources
    ? webResources.filter(resource =>
        resource.subject === cls.subject &&
        weakTopics.some(topic => resource.topic.includes(topic.toLowerCase()) || topic.toLowerCase().includes(resource.topic))
      ).slice(0, 5)
    : [];

  const classBox = document.getElementById("classRecommendations");
  if (classRecs.length === 0) {
    classBox.innerHTML = `<div class="warning">No matching class resources found for this weak topic.</div>`;
  } else {
    classBox.innerHTML = classRecs.map(material => `
      <div class="resource-card">
        <div class="tag-row">
          <span class="tag class-resource">Class Resource</span>
          <span class="tag">${material.type}</span>
        </div>
        <h3>${material.title}</h3>
        <p>Review this because it matches your quiz topic or weak areas.</p>
        <a href="${material.url}" target="_blank" rel="noreferrer">Open resource</a>
      </div>
    `).join("");
  }

  const webBox = document.getElementById("webRecommendations");
  if (!state.settings.allowWebResources) {
    webBox.innerHTML = `<div class="warning">Web resources are turned off in Settings.</div>`;
  } else if (webRecs.length === 0) {
    webBox.innerHTML = `<div class="warning">No web resources needed or found for this topic.</div>`;
  } else {
    webBox.innerHTML = webRecs.map(resource => `
      <div class="resource-card">
        <div class="tag-row">
          <span class="tag web-resource">Web Resource</span>
          <span class="tag">${resource.type}</span>
        </div>
        <h3>${resource.title}</h3>
        <p><strong>${resource.sourceName}</strong></p>
        <p>${resource.reasonItHelps}</p>
        <a href="${resource.url}" target="_blank" rel="noreferrer">Open resource</a>
      </div>
    `).join("");
  }
}

function renderStudyPlan(attempt) {
  const weakTopics = attempt.weakTopics.length ? attempt.weakTopics : [attempt.quiz.topic];
  const steps = [];

  steps.push(`Review the class material connected to ${weakTopics[0]} for 15 minutes.`);

  if (weakTopics.length > 1) {
    steps.push(`Make a quick summary of these weak topics: ${weakTopics.join(", ")}.`);
  } else {
    steps.push(`Write down the definition and function of ${weakTopics[0]}.`);
  }

  if (attempt.quiz.usedWebResources && state.settings.allowWebResources) {
    steps.push("Use one recommended web video or article to get another explanation.");
    steps.push("Complete one practice exercise or quiz from the web resources section.");
  } else if (state.settings.allowWebResources) {
    steps.push("Use a web practice quiz only if the class resources still feel confusing.");
  }

  steps.push("Retake a short practice quiz after reviewing.");

  const studyPlan = document.getElementById("studyPlan");
  studyPlan.innerHTML = steps.map((step, index) => `
    <label class="choice">
      <input type="checkbox" />
      <span><strong>Step ${index + 1}:</strong> ${step}</span>
    </label>
  `).join("");
}

function renderSettings() {
  const toggle = document.getElementById("allowWebToggle");
  if (toggle) toggle.checked = state.settings.allowWebResources;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderAll();
