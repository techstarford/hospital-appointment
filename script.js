const doctors = [
  {
    id: "D001",
    name: "Dr. Sarah Namusoke",
    specialty: "General Medicine",
    gender: "Female",
    experience: "8 years",
    hours: "Mon–Fri · 8:00 AM–4:00 PM",
    initials: "SN",
    photo: "doctor-sarah-namusoke.jpg",
    color: "pink",
  },
  {
    id: "D002",
    name: "Dr. Daniel Kato",
    specialty: "Cardiology",
    gender: "Male",
    experience: "12 years",
    hours: "Mon–Thu · 9:00 AM–3:00 PM",
    initials: "DK",
    photo: "doctor-daniel-kato.jpg",
    color: "blue",
  },
  {
    id: "D003",
    name: "Dr. Aisha Nabbosa",
    specialty: "Pediatrics",
    gender: "Female",
    experience: "7 years",
    hours: "Mon–Fri · 8:00 AM–2:00 PM",
    initials: "AN",
    photo: "doctor-aisha-nabbosa.jpg",
    color: "purple",
  },
  {
    id: "D004",
    name: "Dr. Peter Okello",
    specialty: "Dermatology",
    gender: "Male",
    experience: "10 years",
    hours: "Tue–Sat · 9:00 AM–4:00 PM",
    initials: "PO",
    photo: "doctor-peter-okello.jpg",
    color: "green",
  },
  {
    id: "D005",
    name: "Dr. Grace Atim",
    specialty: "Gynecology",
    gender: "Female",
    experience: "9 years",
    hours: "Mon–Fri · 8:00 AM–3:00 PM",
    initials: "GA",
    photo: "doctor-grace-atim.jpg",
    color: "pink",
  },
  {
    id: "D006",
    name: "Dr. Michael Ssemanda",
    specialty: "Orthopedics",
    gender: "Male",
    experience: "11 years",
    hours: "Mon–Wed · 10:00 AM–4:00 PM",
    initials: "MS",
    photo: "doctor-michael-ssemanda.jpg",
    color: "blue",
  },
];

const $ = (id) => document.getElementById(id);
const pages = [
  "dashboard",
  "doctors",
  "booking",
  "confirmation",
  "details",
  "appointments",
];
let currentPage = "dashboard";
let currentAppointmentId = null;
let currentDoctorId = null;
let toastTimer;

function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem("hosappoint_appointments") || "[]");
  } catch {
    return [];
  }
}
function saveAppointments(items) {
  localStorage.setItem("hosappoint_appointments", JSON.stringify(items));
}
function getPatient() {
  try {
    return JSON.parse(sessionStorage.getItem("hosappoint_patient") || "null");
  } catch {
    return null;
  }
}
function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function doctorPhotoHTML(doctor, className = "doctor-photo") {
  const photo = `assets/${doctor.photo}`;

  return `
    <div class="${className} ${doctor.color || "blue"}">
      <img
        src="${photo}"
        alt="${doctor.name}"
        onerror="this.style.display='none';
          this.parentElement.classList.add('photo-fallback');
          this.parentElement.textContent='${doctor.initials || "DR"}'"
      >
    </div>
  `;
}

function go(page) {
  if (!pages.includes(page)) return;
  if (page === "booking" && !currentDoctorId) {
    showToast("Choose a doctor first.");
    page = "doctors";
  }
  currentPage = page;
  pages.forEach((p) => $(p + "Page").classList.toggle("hidden", p !== page));
  $("pageHeading").textContent = {
    dashboard: "Patient dashboard",
    doctors: "Find a doctor",
    booking: "Book an appointment",
    confirmation: "Appointment confirmation",
    details: "Appointment details",
    appointments: "My appointments",
  }[page];
  document
    .querySelectorAll(".nav-link[data-page]")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  if (page === "dashboard") renderDashboard();
  if (page === "doctors") renderDoctors();
  if (page === "appointments") renderAppointments();
  if (page === "booking") prepareBooking();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function enterApp(email) {
  const name = (email.split("@")[0] || "Patient")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  sessionStorage.setItem("hosappoint_patient", JSON.stringify({ email, name }));
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("patientName").textContent = name;
  $("welcomeName").textContent = name.split(" ")[0];
  $("avatarInitial").textContent = initials(name);
  $("patientEmail").value = email;
  $("fullName").value = name;
  go("dashboard");
}
function renderDashboard() {
  const items = getAppointments();
  $("totalAppointments").textContent = items.length;
  $("pendingAppointments").textContent = items.filter(
    (a) => a.status === "Pending confirmation",
  ).length;
  $("doctorCount").textContent = doctors.length;
  const target = $("dashboardAppointments");
  target.innerHTML = items.length
    ? items.slice().reverse().slice(0, 3).map(appointmentRow).join("")
    : emptyHTML(
        "No appointments yet",
        "Your appointment requests will appear here after you book a doctor.",
        "Browse doctors",
      );
}
function emptyHTML(title, description, button) {
  return `<div class="empty-state"><div>♡</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p>${button ? '<button class="btn primary" data-page="doctors">' + escapeHTML(button) + "</button>" : ""}</div>`;
}
function renderDoctors() {
  const query = $("doctorSearch").value.trim().toLowerCase(),
    specialty = $("specialtyFilter").value,
    gender = $("genderFilter").value;
  const matches = doctors.filter(
    (d) =>
      (!query || (d.name + " " + d.specialty).toLowerCase().includes(query)) &&
      (!specialty || d.specialty === specialty) &&
      (!gender || d.gender === gender),
  );
  $("doctorsGrid").innerHTML = matches
    .map(
      (d) =>
        `<article class="doctor-card"><div class="doctor-card-top">${doctorPhotoHTML(d)}<div><h4>${escapeHTML(d.name)}</h4><div class="specialty">${escapeHTML(d.specialty)}</div></div></div><div class="meta"><span class="available-dot"></span> Available for requests<br>♙ ${escapeHTML(d.gender)} · ${escapeHTML(d.experience)} experience<br>◷ ${escapeHTML(d.hours)}</div><button class="btn primary" data-book="${d.id}">Book appointment</button></article>`,
    )
    .join("");
  $("noDoctors").classList.toggle("hidden", matches.length !== 0);
  $("doctorsGrid").classList.toggle("hidden", matches.length === 0);
}
function prepareBooking() {
  const d = doctors.find((x) => x.id === currentDoctorId);
  if (!d) return;
  $("selectedDoctorId").value = d.id;
  $("selectedDoctorSummary").innerHTML =
    `${doctorPhotoHTML(d)}<div><strong>${escapeHTML(d.name)}</strong><small>${escapeHTML(d.specialty)} · ${escapeHTML(d.experience)} experience</small></div>`;
  const patient = getPatient();
  if (patient) {
    $("patientEmail").value = patient.email;
    if (!$("fullName").value) $("fullName").value = patient.name;
  }
}
function appointmentRow(a) {
  const d = doctors.find((x) => x.id === a.doctorId) || {
    name: a.doctorName,
    specialty: a.specialty,
    initials: "DR",
    color: "blue",
  };
  return `<article class="appointment-row">${doctorPhotoHTML(d, "doctor-avatar")}<div class="row-main"><h4>${escapeHTML(d.name)}</h4><p>${escapeHTML(d.specialty)} · ${escapeHTML(a.date)} at ${escapeHTML(a.time)}<br>Ref: ${escapeHTML(a.reference)}</p></div><span class="status">${escapeHTML(a.status)}</span><button class="row-action" data-details="${a.id}">Details</button></article>`;
}
function renderAppointments() {
  const items = getAppointments().slice().reverse();
  $("allAppointments").innerHTML = items.length
    ? items.map(appointmentRow).join("")
    : emptyHTML(
        "No appointment requests",
        "You have not submitted an appointment request yet.",
        "Find a doctor",
      );
}
function findAppointment(id) {
  return getAppointments().find((a) => a.id === id);
}
function renderDetails(id) {
  const a = findAppointment(id);
  if (!a) {
    showToast("Appointment details could not be found.");
    go("appointments");
    return;
  }
  currentAppointmentId = id;
  $("detailStatus").textContent = a.status;
  $("appointmentDetailsCard").innerHTML =
    `<div class="details-head"><div class="doctor-avatar">✓</div><div><h3>${escapeHTML(a.doctorName)}</h3><p>${escapeHTML(a.specialty)} · Reference ${escapeHTML(a.reference)}</p></div></div><div class="details-grid">${detailItem("Patient name", a.fullName)}${detailItem("Age", a.age)}${detailItem("Gender", a.gender)}${detailItem("Email", a.email)}${detailItem("Phone number", a.phone)}${detailItem("Location", a.location)}${detailItem("Preferred date", a.date)}${detailItem("Preferred time", a.time)}${detailItem("Reason for visit", a.concern, true)}${detailItem("Request status", a.status)}</div>`;
  go("details");
}
function detailItem(label, value, wide = false) {
  return `<div class="detail-item ${wide ? "wide" : ""}"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong></div>`;
}
function renderConfirmation(a) {
  $("confirmationReference").textContent = a.reference;
  $("confirmationSummary").innerHTML =
    `${summaryLine("Doctor", a.doctorName)}${summaryLine("Specialty", a.specialty)}${summaryLine("Date", a.date)}${summaryLine("Time", a.time)}${summaryLine("Patient", a.fullName)}${summaryLine("Status", a.status)}`;
  currentAppointmentId = a.id;
  go("confirmation");
}
function summaryLine(label, value) {
  return `<div class="summary-line"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`;
}
function minDateToday() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-page]");
  if (nav) {
    e.preventDefault();
    go(nav.dataset.page);
    return;
  }
  const book = e.target.closest("[data-book]");
  if (book) {
    currentDoctorId = book.dataset.book;
    go("booking");
    return;
  }
  const details = e.target.closest("[data-details]");
  if (details) {
    renderDetails(details.dataset.details);
  }
});
$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("loginEmail").value.trim(),
    password = $("loginPassword").value;
  if (!email || password.length < 4) {
    showToast("Enter a valid email and password of at least 4 characters.");
    return;
  }
  enterApp(email);
  showToast("Signed in to the demo portal.");
});
$("togglePassword").addEventListener("click", () => {
  const input = $("loginPassword"),
    show = input.type === "password";
  input.type = show ? "text" : "password";
  $("togglePassword").setAttribute(
    "aria-label",
    show ? "Hide password" : "Show password",
  );
});
$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("hosappoint_patient");
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
  $("loginPassword").value = "";
  showToast("You have signed out.");
});
["doctorSearch", "specialtyFilter", "genderFilter"].forEach((id) =>
  $(id).addEventListener(
    id === "doctorSearch" ? "input" : "change",
    renderDoctors,
  ),
);
$("appointmentDate").min = minDateToday();
$("bookingForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = doctors.find((x) => x.id === $("selectedDoctorId").value);
  if (!d) {
    showToast("Please select a doctor.");
    return;
  }
  const date = $("appointmentDate").value;
  if (date < minDateToday()) {
    $("appointmentDate").setCustomValidity("Choose today or a future date.");
    $("appointmentDate").reportValidity();
    return;
  } else {
    $("appointmentDate").setCustomValidity("");
  }
  const id =
    window.crypto && crypto.randomUUID ? crypto.randomUUID() : "a" + Date.now();
  const reference = "HA-" + Date.now().toString().slice(-6);
  const a = {
    id,
    reference,
    doctorId: d.id,
    doctorName: d.name,
    specialty: d.specialty,
    fullName: $("fullName").value.trim(),
    age: $("age").value,
    gender: $("gender").value,
    email: $("patientEmail").value.trim(),
    phone: $("phone").value.trim(),
    location: $("location").value.trim(),
    date,
    time: $("appointmentTime").value,
    concern: $("concern").value.trim(),
    status: "Pending confirmation",
    createdAt: new Date().toISOString(),
  };
  const items = getAppointments();
  items.push(a);
  saveAppointments(items);
  renderConfirmation(a);
  showToast("Appointment request saved in this browser.");
});
$("viewDetailsBtn").addEventListener("click", () =>
  renderDetails(currentAppointmentId),
);
$("appointmentDate").addEventListener("change", () => {
  $("appointmentDate").setCustomValidity("");
});
$("doctorCount").textContent = doctors.length;
