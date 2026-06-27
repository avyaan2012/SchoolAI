const STORAGE_KEY = "classquiz-ai-google-only";

const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/presentations.readonly"
].join(" ");

let accessToken = null;
let tokenClient = null;
let state = loadState();
let currentClassId = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let selectedAnswers = {};

function defaultState() {
  return {
    connectedPlatform: null,
    connectedAt: null,
    lastSyncedAt: null,
    classes: [],
    attempts: []
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

function getClientId() {
  if (typeof GOOGLE_CLIENT_ID === "undefined") return "";
  return String(GOOGLE_CLIENT_ID || "").trim();
}

function hasValidClientId() {
  const clientId = getClientId();
  return clientId && clientId !== "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE";
}

function setStatus(message, type = "info") {
  const boxes = [document.getElementById("statusBox"), document.getElementById("syncStatus")];
  boxes.forEach(box => {
    if (!box) return;
    box.className = `status-box ${type}`;
    box.innerHTML = message;
  });
}

function clearStatus() {
  setStatus("", "info");
}

async function connectGoogleClassroom() {
  if (!hasValidClientId()) {
    setStatus(
      `<strong>Missing Google Client ID.</strong><br />Open <code>config.js</code>, paste your OAuth Web Client ID, commit the change, and reload this page.`,
      "error"
    );
    showPage("home");
    return;
  }

  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    setStatus(
      `<strong>Google Identity Services did not load yet.</strong><br />Reload the page and try again. If it still fails, check your internet connection or browser extensions.`,
      "error"
    );
    return;
  }

  setStatus("Opening Google permission popup...", "info");

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: getClientId(),
    scope: CLASSROOM_SCOPES,
    callback: async tokenResponse => {
      if (tokenResponse.error) {
        setStatus(`<strong>Google authorization failed.</strong><br />${escapeHtml(tokenResponse.error)}`, "error");
        return;
      }

      accessToken = tokenResponse.access_token;
      state.connectedPlatform = "Google Classroom";
      state.connectedAt = new Date().toISOString();
      saveState();

      try {
        await syncGoogleClassroom();
        showPage("dashboard");
      } catch (error) {
        showReadableError(error);
      }
    }
  });

  tokenClient.requestAccessToken({ prompt: "consent" });
}

async function syncGoogleClassroom() {
  if (!accessToken) {
    throw new Error("You need to connect Google Classroom first. Click Sync Google Classroom and approve access.");
  }

  setStatus("Syncing courses from Google Classroom...", "info");

  const coursesResponse = await classroomFetch("/courses?pageSize=20&courseStates=ACTIVE");
  const courses = coursesResponse.courses || [];

  if (courses.length === 0) {
    state.classes = [];
    state.lastSyncedAt = new Date().toISOString();
    saveState();
    renderAll();
    setStatus("Google Classroom connected, but no active classes were returned for this account.", "warning");
    return;
  }

  const importedClasses = [];

  for (const course of courses) {
    setStatus(`Syncing materials for <strong>${escapeHtml(course.name || "Untitled course")}</strong>...`, "info");

    const materials = [];

    try {
      const courseWorkResponse = await classroomFetch(`/courses/${encodeURIComponent(course.id)}/courseWork?pageSize=50`);
      const courseWorkItems = courseWorkResponse.courseWork || [];
      for (const item of courseWorkItems) {
        const material = convertCourseWorkToMaterial(course, item);
        await enrichMaterialWithSlidesText(material);
        materials.push(material);
      }
    } catch (error) {
      materials.push(makeErrorMaterial("Coursework sync error", error.message));
    }

    try {
      const materialResponse = await classroomFetch(`/courses/${encodeURIComponent(course.id)}/courseWorkMaterials?pageSize=50`);
      const courseMaterials = materialResponse.courseWorkMaterial || [];
      for (const item of courseMaterials) {
        const material = convertCourseWorkMaterialToMaterial(course, item);
        await enrichMaterialWithSlidesText(material);
        materials.push(material);
      }
    } catch (error) {
      materials.push(makeErrorMaterial("Class material sync error", error.message));
    }

    importedClasses.push({
      id: course.id,
      name: course.name || "Untitled Class",
      teacherName: course.ownerId ? `Owner ID: ${course.ownerId}` : "Teacher not shown by API",
      platform: "Google Classroom",
      section: course.section || "No section listed",
      subject: guessSubject(`${course.name || ""} ${course.descriptionHeading || ""} ${course.description || ""}`),
      description: course.description || course.descriptionHeading || "",
      alternateLink: course.alternateLink || "#",
      lastSyncedAt: new Date().toISOString(),
      materials
    });
  }

  state.classes = importedClasses;
  state.lastSyncedAt = new Date().toISOString();
  saveState();
  renderAll();

  const totalResources = importedClasses.reduce((sum, cls) => sum + cls.materials.length, 0);
  setStatus(`Sync complete. Imported <strong>${importedClasses.length}</strong> classes and <strong>${totalResources}</strong> resources.`, "success");
}

async function classroomFetch(path) {
  const response = await fetch(`https://classroom.googleapis.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const googleMessage = data?.error?.message || response.statusText || "Unknown Google Classroom API error";
    const status = data?.error?.status ? ` (${data.error.status})` : "";
    throw new Error(`${response.status}${status}: ${googleMessage}`);
  }

  return data;
}

async function slidesFetch(presentationId) {
  const fields = encodeURIComponent("title,slides/pageElements/shape/text/textElements/textRun/content");
  const response = await fetch(`https://slides.googleapis.com/v1/presentations/${encodeURIComponent(presentationId)}?fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const googleMessage = data?.error?.message || response.statusText || "Unknown Google Slides API error";
    const status = data?.error?.status ? ` (${data.error.status})` : "";
    throw new Error(`${response.status}${status}: ${googleMessage}`);
  }

  return data;
}

async function enrichMaterialWithSlidesText(material) {
  const driveAttachments = (material.attachments || []).filter(a => a.type === "Drive File" && a.id);
  if (!driveAttachments.length) return material;

  const extractedSections = [];

  for (const attachment of driveAttachments) {
    try {
      setStatus(`Reading slide text from <strong>${escapeHtml(attachment.title)}</strong>...`, "info");
      const presentation = await slidesFetch(attachment.id);
      const slideText = extractTextFromPresentation(presentation);
      if (slideText.trim().length > 20) {
        attachment.extractedText = slideText;
        attachment.readStatus = "Slide text imported";
        extractedSections.push(`Slide deck: ${attachment.title}\n${slideText}`);
      }
    } catch (error) {
      // This can happen if the Drive file is a Doc/PDF instead of Slides, or if permission is blocked.
      attachment.readStatus = `Could not read as Google Slides: ${error.message}`;
    }
  }

  if (extractedSections.length) {
    material.text = `${material.text}\n\n--- Extracted Google Slides Text ---\n${extractedSections.join("\n\n")}`;
    material.hasExtractedSlideText = true;
    material.topicKeywords = extractKeywords(material.text);
  } else {
    material.hasExtractedSlideText = false;
  }

  return material;
}

function extractTextFromPresentation(presentation) {
  const slides = presentation.slides || [];
  const chunks = [];

  slides.forEach((slide, slideIndex) => {
    const pieces = [];
    (slide.pageElements || []).forEach(element => {
      const textElements = element?.shape?.text?.textElements || [];
      textElements.forEach(textElement => {
        const content = textElement?.textRun?.content;
        if (content) pieces.push(content);
      });
    });

    const clean = pieces.join(" ").replace(/\s+/g, " ").trim();
    if (clean) chunks.push(`Slide ${slideIndex + 1}: ${clean}`);
  });

  return chunks.join("\n");
}

function convertCourseWorkToMaterial(course, item) {
  return {
    id: `cw-${course.id}-${item.id}`,
    externalId: item.id,
    courseId: course.id,
    title: item.title || "Untitled coursework",
    type: readableCourseWorkType(item.workType || "COURSE_WORK"),
    url: item.alternateLink || "#",
    text: buildMaterialText(item),
    topicKeywords: extractKeywords(`${item.title || ""} ${item.description || ""}`),
    createdAt: item.creationTime || "",
    dueDate: formatDueDate(item.dueDate, item.dueTime),
    source: "courseWork",
    attachments: extractAttachments(item.materials || [])
  };
}

function convertCourseWorkMaterialToMaterial(course, item) {
  return {
    id: `mat-${course.id}-${item.id}`,
    externalId: item.id,
    courseId: course.id,
    title: item.title || "Untitled material",
    type: "Material",
    url: item.alternateLink || "#",
    text: buildMaterialText(item),
    topicKeywords: extractKeywords(`${item.title || ""} ${item.description || ""}`),
    createdAt: item.creationTime || "",
    dueDate: "",
    source: "courseWorkMaterial",
    attachments: extractAttachments(item.materials || [])
  };
}

function buildMaterialText(item) {
  const pieces = [];
  if (item.title) pieces.push(item.title);
  if (item.description) pieces.push(stripHtml(item.description));
  const attachments = extractAttachments(item.materials || []);
  if (attachments.length) {
    pieces.push(`Attachments: ${attachments.map(a => `${a.type}: ${a.title}`).join("; ")}`);
  }
  return pieces.join("\n\n").trim() || "No description text was returned by Google Classroom for this item.";
}

function extractAttachments(materials) {
  return materials.map(material => {
    if (material.driveFile) {
      return {
        type: "Drive File",
        id: material.driveFile.driveFile?.id || "",
        title: material.driveFile.driveFile?.title || "Google Drive file",
        url: material.driveFile.driveFile?.alternateLink || "#"
      };
    }
    if (material.link) {
      return {
        type: "Link",
        title: material.link.title || material.link.url || "Link",
        url: material.link.url || "#"
      };
    }
    if (material.youtubeVideo) {
      return {
        type: "YouTube Video",
        title: material.youtubeVideo.title || "YouTube video",
        url: material.youtubeVideo.alternateLink || "#"
      };
    }
    if (material.form) {
      return {
        type: "Google Form",
        title: material.form.title || "Google Form",
        url: material.form.formUrl || "#"
      };
    }
    return { type: "Attachment", title: "Attachment", url: "#" };
  });
}

function readableCourseWorkType(workType) {
  const labels = {
    ASSIGNMENT: "Assignment",
    SHORT_ANSWER_QUESTION: "Short Answer Question",
    MULTIPLE_CHOICE_QUESTION: "Multiple Choice Question",
    COURSE_WORK: "Coursework"
  };
  return labels[workType] || workType.replaceAll("_", " ");
}

function formatDueDate(dueDate, dueTime) {
  if (!dueDate) return "No due date";
  const month = String(dueDate.month).padStart(2, "0");
  const day = String(dueDate.day).padStart(2, "0");
  const year = dueDate.year;
  if (!dueTime) return `${year}-${month}-${day}`;
  const hour = String(dueTime.hours || 0).padStart(2, "0");
  const minute = String(dueTime.minutes || 0).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function makeErrorMaterial(title, message) {
  return {
    id: `error-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    type: "Sync Error",
    url: "#",
    text: message,
    topicKeywords: ["sync", "error"],
    attachments: []
  };
}

function showReadableError(error) {
  const message = error?.message || String(error);
  let help = "";

  if (message.includes("403")) {
    help = "This is usually a scope, permission, test-user, or school-admin issue. Check your OAuth scopes, add yourself as a test user, and make sure your school allows the app.";
  } else if (message.includes("401")) {
    help = "This usually means the access token expired or was not accepted. Click Sync Google Classroom again.";
  } else if (message.includes("origin") || message.includes("redirect")) {
    help = "Check that your GitHub Pages origin is added in your Google OAuth client settings.";
  }

  setStatus(`<strong>Sync failed.</strong><br />${escapeHtml(message)}${help ? `<br /><br />${escapeHtml(help)}` : ""}`, "error");
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
    ? `Connected to ${state.connectedPlatform}. Last sync: ${state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleString() : "not synced yet"}.`
    : "Not connected yet. Click Sync Google Classroom.";

  document.getElementById("classCount").textContent = state.classes.length;
  document.getElementById("attemptCount").textContent = state.attempts.length;
  document.getElementById("resourceCount").textContent = state.classes.reduce((sum, cls) => sum + cls.materials.length, 0);

  const classList = document.getElementById("classList");
  classList.innerHTML = "";

  if (state.classes.length === 0) {
    classList.innerHTML = `<div class="warning">No Google Classroom classes imported yet. Click “Sync Google Classroom.” This version has no demo fallback.</div>`;
  } else {
    state.classes.forEach(cls => {
      const card = document.createElement("div");
      card.className = "class-card";
      card.innerHTML = `
        <h3>${escapeHtml(cls.name)}</h3>
        <p>${escapeHtml(cls.teacherName)} • ${escapeHtml(cls.platform)} • ${escapeHtml(cls.section)}</p>
        <div class="tag-row">
          <span class="tag">${cls.materials.length} resources</span>
          <span class="tag">Subject guess: ${escapeHtml(cls.subject)}</span>
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
    recentResults.innerHTML = `<div class="warning">No quiz attempts yet.</div>`;
    return;
  }

  state.attempts.slice(-4).reverse().forEach(attempt => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = `
      <h3>${escapeHtml(attempt.title)}</h3>
      <p>Score: <strong>${attempt.score}%</strong></p>
      <div class="tag-row">
        ${attempt.weakTopics.map(topic => `<span class="tag">${escapeHtml(topic)}</span>`).join("")}
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
        <h2>${escapeHtml(cls.name)}</h2>
        <p>${escapeHtml(cls.teacherName)} • ${escapeHtml(cls.platform)} • ${escapeHtml(cls.section)}</p>
        ${cls.alternateLink && cls.alternateLink !== "#" ? `<p><a href="${escapeAttribute(cls.alternateLink)}" target="_blank" rel="noreferrer">Open in Google Classroom</a></p>` : ""}
      </div>
      <button class="primary" onclick="prepareQuizForClass('${escapeAttribute(cls.id)}')">Generate Practice Quiz</button>
    </div>
    <h3>Imported Google Classroom Resources</h3>
    <div class="card-grid">
      ${cls.materials.map(material => `
        <div class="resource-card ${material.type === "Sync Error" ? "danger-zone" : ""}">
          <div class="tag-row">
            <span class="tag class-resource">Class Resource</span>
            <span class="tag">${escapeHtml(material.type)}</span>
            ${material.hasExtractedSlideText ? `<span class="tag class-resource">Slides Text Read</span>` : ""}
            ${material.dueDate ? `<span class="tag">Due: ${escapeHtml(material.dueDate)}</span>` : ""}
          </div>
          <h3>${escapeHtml(material.title)}</h3>
          <p>${escapeHtml(truncate(material.text, 450))}</p>
          ${material.attachments?.length ? `
            <p><strong>Attachments:</strong></p>
            <ul>
              ${material.attachments.map(a => `<li>${escapeHtml(a.type)}: <a href="${escapeAttribute(a.url)}" target="_blank" rel="noreferrer">${escapeHtml(a.title)}</a>${a.readStatus ? ` <span class="tag">${escapeHtml(a.readStatus)}</span>` : ""}</li>`).join("")}
            </ul>
          ` : ""}
          ${material.url && material.url !== "#" ? `<a href="${escapeAttribute(material.url)}" target="_blank" rel="noreferrer">Open Classroom item</a>` : ""}
        </div>
      `).join("")}
    </div>
  `;

  showPage("classPage");
}

function prepareQuizForClass(classId) {
  document.getElementById("quizClassSelect").value = classId;
  const cls = state.classes.find(c => c.id === classId);
  const topKeyword = cls?.materials?.flatMap(m => m.topicKeywords || []).find(k => k.length > 3) || "";
  document.getElementById("topicInput").value = topKeyword;
  showPage("quizSetup");
}

function renderQuizClassSelect() {
  const select = document.getElementById("quizClassSelect");
  if (!select) return;

  select.innerHTML = "";
  if (state.classes.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No Google Classroom classes synced yet";
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

async function startQuiz() {
  if (state.classes.length === 0) {
    alert("No classes imported. Click Sync Google Classroom first. This version has no fallback data.");
    showPage("dashboard");
    return;
  }

  const classId = document.getElementById("quizClassSelect").value;
  const topic = document.getElementById("topicInput").value.trim().toLowerCase();
  const count = Number(document.getElementById("questionCountSelect").value);

  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return alert("Choose a class first.");

  const relevantMaterials = findRelevantMaterials(cls, topic);
  const materialsForQuiz = relevantMaterials.length ? relevantMaterials : cls.materials.filter(m => m.type !== "Sync Error");

  if (materialsForQuiz.length === 0) {
    alert("This class has no usable materials yet. Try syncing again or choose another class.");
    return;
  }

  let quizQuestions;
  try {
    setStatus("Generating AI practice quiz from imported Classroom materials and extracted slide text...", "info");
    quizQuestions = await generateAIQuestionsFromMaterials(materialsForQuiz, topic || cls.name, count, cls);
  } catch (error) {
    setStatus(`<strong>AI quiz generation failed.</strong><br />${escapeHtml(error.message)}<br /><br />Make sure the Vercel API is deployed and GEMINI_API_KEY is set.`, "error");
    alert(`AI quiz generation failed: ${error.message}`);
    return;
  }

  currentQuiz = {
    id: `quiz-${Date.now()}`,
    classId,
    className: cls.name,
    topic: topic || cls.name,
    questions: quizQuestions,
    relevantMaterials: materialsForQuiz
  };

  currentQuestionIndex = 0;
  selectedAnswers = {};

  renderQuizQuestion();
  showPage("quizPage");
}

function findRelevantMaterials(cls, topic) {
  const terms = topic.split(/\s+/).filter(term => term.length >= 3);
  if (terms.length === 0) return cls.materials.filter(m => m.type !== "Sync Error");

  return cls.materials.filter(material => {
    if (material.type === "Sync Error") return false;
    const haystack = `${material.title} ${material.topicKeywords.join(" ")} ${material.text}`.toLowerCase();
    return terms.some(term => haystack.includes(term));
  });
}

async function generateAIQuestionsFromMaterials(materials, topic, count, cls) {
  const cleanMaterials = materials.filter(m => m.type !== "Sync Error");
  const compactMaterials = cleanMaterials.map(material => ({
    id: material.id,
    title: material.title,
    type: material.type,
    url: material.url,
    hasExtractedSlideText: !!material.hasExtractedSlideText,
    text: truncate(material.text, 3500)
  }));

  const endpoint = getAiEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      count,
      className: cls.name,
      subject: cls.subject,
      materials: compactMaterials
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `AI endpoint returned ${response.status}`);
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("The AI did not return usable questions.");
  }

  return data.questions.slice(0, count).map((question, index) => {
    const source = cleanMaterials.find(m => m.id === question.sourceMaterialId)
      || cleanMaterials.find(m => m.title === question.sourceMaterialTitle)
      || cleanMaterials[0];

    const choices = Array.isArray(question.choices) ? question.choices.filter(Boolean).map(String) : [];
    const correctAnswer = String(question.correctAnswer || choices[0] || "");

    if (!choices.includes(correctAnswer)) choices.unshift(correctAnswer);

    while (choices.length < 4) {
      choices.push(["Review the source material", "Not enough information", "Ask the teacher", "None of the above"][choices.length] || "Extra option");
    }

    return {
      id: `q-${index + 1}`,
      questionText: String(question.questionText || `Question ${index + 1} about ${topic}`),
      choices: shuffle([...new Set(choices)]).slice(0, 4),
      correctAnswer,
      explanation: String(question.explanation || "This answer is based on your imported Classroom material."),
      weakTopic: String(question.weakTopic || topic || "class material"),
      sourceMaterialId: source?.id || "",
      sourceMaterialTitle: source?.title || question.sourceMaterialTitle || "Imported resource",
      reviewHint: String(question.reviewHint || "Review the linked source material for this topic."),
      slideRange: String(question.slideRange || "")
    };
  });
}

function getAiEndpoint() {
  if (typeof AI_API_URL !== "undefined" && String(AI_API_URL || "").trim()) {
    return String(AI_API_URL).trim();
  }
  return "/api/generate-quiz";
}

function renderQuizQuestion() {
  if (!currentQuiz) return;
  const question = currentQuiz.questions[currentQuestionIndex];
  document.getElementById("quizTitle").textContent = `${currentQuiz.className}: ${capitalize(currentQuiz.topic)}`;
  document.getElementById("quizSourceNote").textContent = "Generated by AI from imported Google Classroom materials. If Google Slides text was readable, the AI used the slide text too.";
  document.getElementById("progressBadge").textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;

  const box = document.getElementById("questionBox");
  box.innerHTML = `
    <p class="question-title">${escapeHtml(question.questionText)}</p>
    <div class="tag-row">
      <span class="tag class-resource">Class Resource: ${escapeHtml(question.sourceMaterialTitle)}</span>
    </div>
    <div class="choices">
      ${question.choices.map(choice => `
        <label class="choice">
          <input type="radio" name="answer" value="${escapeAttribute(choice)}" ${selectedAnswers[question.id] === choice ? "checked" : ""} />
          <span>${escapeHtml(choice)}</span>
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

async function submitQuiz() {
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
  await generateAndRenderAIReview(attempt);
}

function renderResults(attempt) {
  const resultSummary = document.getElementById("resultSummary");
  const weakText = attempt.weakTopics.length ? attempt.weakTopics.join(", ") : "No major weak topics detected.";
  resultSummary.innerHTML = `
    <div class="result-card ${attempt.score >= 70 ? "correct" : "incorrect"}">
      <h3>${escapeHtml(attempt.title)}</h3>
      <p>Your score: <strong>${attempt.score}%</strong></p>
      <p><strong>Weak topics:</strong> ${escapeHtml(weakText)}</p>
    </div>
  `;

  const answerReview = document.getElementById("answerReview");
  answerReview.innerHTML = attempt.results.map(result => `
    <div class="result-card ${result.isCorrect ? "correct" : "incorrect"}">
      <h3>${escapeHtml(result.question.questionText)}</h3>
      <p><strong>Your answer:</strong> ${escapeHtml(result.answer)}</p>
      <p><strong>Correct answer:</strong> ${escapeHtml(result.question.correctAnswer)}</p>
      <p>${escapeHtml(result.question.explanation)}</p>
      ${!result.isCorrect && result.question.reviewHint ? `<p><strong>AI review hint:</strong> ${escapeHtml(result.question.reviewHint)}</p>` : ""}
      <div class="tag-row">
        <span class="tag class-resource">Class Resource: ${escapeHtml(result.question.sourceMaterialTitle)}</span>
      </div>
    </div>
  `).join("");

  renderRecommendations(attempt);
  renderStudyPlan(attempt);
}

function renderRecommendations(attempt) {
  const classBox = document.getElementById("classRecommendations");
  const webBox = document.getElementById("webRecommendations");
  if (classBox) {
    classBox.innerHTML = `<div class="warning">AI review is loading class resource suggestions based on the questions you missed...</div>`;
  }
  if (webBox) {
    webBox.innerHTML = `<div class="warning">AI review is loading web resource ideas after checking your class materials...</div>`;
  }
}

function renderStudyPlan(attempt) {
  const studyPlan = document.getElementById("studyPlan");
  if (!studyPlan) return;
  studyPlan.innerHTML = `<div class="warning">AI study plan is loading...</div>`;
}

async function generateAndRenderAIReview(attempt) {
  const wrongResults = attempt.results.filter(result => !result.isCorrect);

  const classBox = document.getElementById("classRecommendations");
  const webBox = document.getElementById("webRecommendations");
  const studyPlan = document.getElementById("studyPlan");

  if (wrongResults.length === 0) {
    if (classBox) classBox.innerHTML = `<div class="result-card correct"><h3>Great job.</h3><p>You did not miss any questions, so the AI did not find an urgent class resource to review. You can still review the source materials used in the quiz.</p></div>`;
    if (webBox) webBox.innerHTML = `<div class="warning">No web resources needed because you got every question correct.</div>`;
    if (studyPlan) studyPlan.innerHTML = `<div class="result-card correct"><h3>Study Plan</h3><p>Do a quick 5-minute review of your class notes, then try a harder 20–25 question quiz.</p></div>`;
    return;
  }

  try {
    const review = await generateAIReview(attempt, wrongResults);
    attempt.aiReview = review;
    saveState();
    renderAIReview(review, attempt);
  } catch (error) {
    const message = `AI review failed: ${error.message}. Make sure /api/generate-review is deployed and GEMINI_API_KEY is set in Vercel.`;
    if (classBox) classBox.innerHTML = `<div class="status-box error"><strong>AI review failed.</strong><br />${escapeHtml(message)}</div>`;
    if (webBox) webBox.innerHTML = `<div class="status-box error">Web resource suggestions require the AI review endpoint.</div>`;
    if (studyPlan) studyPlan.innerHTML = `<div class="status-box error">Study plan requires the AI review endpoint.</div>`;
  }
}

async function generateAIReview(attempt, wrongResults) {
  const cls = state.classes.find(c => c.id === attempt.quiz.classId);
  const materials = (attempt.quiz.relevantMaterials || cls?.materials || [])
    .filter(material => material.type !== "Sync Error")
    .slice(0, 14)
    .map(material => ({
      id: material.id,
      title: material.title,
      type: material.type,
      url: material.url,
      hasExtractedSlideText: !!material.hasExtractedSlideText,
      text: truncate(material.text, 5000)
    }));

  const wrongAnswers = wrongResults.map(result => ({
    questionText: result.question.questionText,
    studentAnswer: result.answer,
    correctAnswer: result.question.correctAnswer,
    explanation: result.question.explanation,
    weakTopic: result.question.weakTopic,
    sourceMaterialId: result.question.sourceMaterialId,
    sourceMaterialTitle: result.question.sourceMaterialTitle
  }));

  const response = await fetch(getReviewEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      className: attempt.quiz.className,
      topic: attempt.quiz.topic,
      weakTopics: attempt.weakTopics,
      wrongAnswers,
      materials
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `AI review endpoint returned ${response.status}`);
  }
  return data.review;
}

function getReviewEndpoint() {
  if (typeof AI_REVIEW_URL !== "undefined" && String(AI_REVIEW_URL || "").trim()) {
    return String(AI_REVIEW_URL).trim();
  }
  return "/api/generate-review";
}

function renderAIReview(review, attempt) {
  const classBox = document.getElementById("classRecommendations");
  const webBox = document.getElementById("webRecommendations");
  const studyPlan = document.getElementById("studyPlan");

  const classRecs = Array.isArray(review?.classResourceRecommendations) ? review.classResourceRecommendations : [];
  const webRecs = Array.isArray(review?.webResourceRecommendations) ? review.webResourceRecommendations : [];
  const plan = Array.isArray(review?.studyPlan) ? review.studyPlan : [];

  if (classBox) {
    if (classRecs.length === 0) {
      classBox.innerHTML = `<div class="warning">The AI did not find a specific class resource for the missed questions.</div>`;
    } else {
      classBox.innerHTML = classRecs.map(rec => `
        <div class="resource-card">
          <div class="tag-row">
            <span class="tag class-resource">AI Class Review</span>
            <span class="tag">${escapeHtml(rec.type || "Class Resource")}</span>
            ${rec.slideRange ? `<span class="tag class-resource">${escapeHtml(rec.slideRange)}</span>` : ""}
          </div>
          <h3>${escapeHtml(rec.title || "Class resource")}</h3>
          <p><strong>Review this:</strong> ${escapeHtml(rec.specificReview || rec.reason || "Review this material for the missed topic.")}</p>
          ${rec.relatedWrongQuestion ? `<p><strong>Because you missed:</strong> ${escapeHtml(rec.relatedWrongQuestion)}</p>` : ""}
          ${rec.url && rec.url !== "#" ? `<a href="${escapeAttribute(rec.url)}" target="_blank" rel="noreferrer">Open class resource</a>` : ""}
        </div>
      `).join("");
    }
  }

  if (webBox) {
    if (webRecs.length === 0) {
      webBox.innerHTML = `<div class="warning">The AI did not suggest web resources.</div>`;
    } else {
      webBox.innerHTML = webRecs.map(rec => {
        const safeUrl = rec.url || makeSearchUrl(rec.searchQuery || `${attempt.quiz.topic} ${rec.type || "study resource"}`);
        return `
          <div class="resource-card">
            <div class="tag-row">
              <span class="tag web-resource">AI Web Resource</span>
              <span class="tag">${escapeHtml(rec.type || "Resource")}</span>
              <span class="tag">${escapeHtml(rec.sourceName || "Trusted web")}</span>
            </div>
            <h3>${escapeHtml(rec.title || "Web resource")}</h3>
            <p>${escapeHtml(rec.reason || "This can help you review the topic in another way.")}</p>
            ${rec.searchQuery ? `<p><strong>Search:</strong> ${escapeHtml(rec.searchQuery)}</p>` : ""}
            <a href="${escapeAttribute(safeUrl)}" target="_blank" rel="noreferrer">Open / Search Resource</a>
          </div>
        `;
      }).join("");
    }
  }

  if (studyPlan) {
    if (plan.length === 0) {
      studyPlan.innerHTML = `<div class="warning">The AI did not create a study plan.</div>`;
    } else {
      studyPlan.innerHTML = plan.map((step, index) => `
        <label class="choice">
          <input type="checkbox" />
          <span><strong>Step ${index + 1}:</strong> ${escapeHtml(step)}</span>
        </label>
      `).join("");
    }
  }
}

function makeSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query || "study resource")}`;
}

function renderSettings() {
  const clientIdStatus = document.getElementById("clientIdStatus");
  if (!clientIdStatus) return;

  if (hasValidClientId()) {
    clientIdStatus.innerHTML = `<span class="tag class-resource">Configured</span> Client ID starts with <code>${escapeHtml(getClientId().slice(0, 16))}...</code>`;
  } else {
    clientIdStatus.innerHTML = `<span class="tag web-resource">Missing</span> Open <code>config.js</code> and paste your Google OAuth Web Client ID.`;
  }
}

function deleteLocalData() {
  if (!confirm("Delete imported classes and quiz attempts from this browser?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  accessToken = null;
  renderAll();
  showPage("home");
  setStatus("Local browser data deleted. Google Classroom was not changed.", "success");
}

function guessSubject(text) {
  const lower = text.toLowerCase();
  const subjects = [
    ["biology", ["biology", "cell", "photosynthesis", "organism", "genetics", "ecosystem"]],
    ["chemistry", ["chemistry", "atom", "molecule", "reaction", "periodic", "bond"]],
    ["physics", ["physics", "force", "motion", "energy", "newton", "electric", "magnet"]],
    ["algebra", ["algebra", "equation", "linear", "quadratic", "slope", "function"]],
    ["geometry", ["geometry", "triangle", "circle", "angle", "proof", "area"]],
    ["history", ["history", "civilization", "war", "government", "revolution"]],
    ["english", ["english", "essay", "novel", "poem", "grammar", "literature"]]
  ];

  for (const [subject, words] of subjects) {
    if (words.some(word => lower.includes(word))) return subject;
  }
  return "general";
}

function extractKeywords(text) {
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "this", "that", "your", "you", "are", "was", "were", "will", "have", "has",
    "class", "assignment", "material", "google", "classroom", "please", "about", "into", "what", "when", "where", "why", "how"
  ]);

  return [...new Set(stripHtml(text).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(word => word.length >= 4 && !stopWords.has(word)))].slice(0, 10);
}

function stripHtml(text) {
  const div = document.createElement("div");
  div.innerHTML = String(text || "");
  return div.textContent || div.innerText || "";
}

function truncate(text, maxLength) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength - 3) + "...";
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function capitalize(text) {
  const value = String(text || "");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(text) {
  return escapeHtml(text).replaceAll("`", "&#096;");
}

renderAll();

if (!hasValidClientId()) {
  setStatus("Paste your Google OAuth Web Client ID into config.js before connecting Classroom.", "warning");
}
