const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

function authHeaders() {
  let token = "";
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) token = JSON.parse(raw)?.token || "";
  } catch (_) {}
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchPublicApplicationForm(schoolId) {
  const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/application-form/public`);
  return res.json();
}

export async function submitApplicationForm(schoolId, formData) {
  const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/application-form/submit`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function fetchApplicationFormConfig(schoolId) {
  const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/application-form/config`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function saveApplicationFormConfig(schoolId, payload) {
  const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/application-form/config`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchApplications(schoolId, params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);

  const res = await fetch(
    `${API_BASE_URL}/api/schools/${schoolId}/application-form/applications?${qs}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function fetchUnseenApplicationsCount(schoolId) {
  const res = await fetch(
    `${API_BASE_URL}/api/schools/${schoolId}/application-form/applications/unseen-count`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function fetchApplicationById(schoolId, applicationId) {
  const res = await fetch(
    `${API_BASE_URL}/api/schools/${schoolId}/application-form/applications/${applicationId}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function updateApplicationStatus(schoolId, applicationId, payload) {
  const res = await fetch(
    `${API_BASE_URL}/api/schools/${schoolId}/application-form/applications/${applicationId}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return res.json();
}
