const API = "https://gde-kot-production.up.railway.app"; // ✅ твой Railway backend

async function getCats() {
  const res = await fetch(`${API}/cats`);
  return await res.json();
}

async function createCat(cat) {
  const res = await fetch(`${API}/cats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cat),
  });
  return await res.json();
}

async function updateCatStatus(id, status) {
  const res = await fetch(`${API}/cats/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return await res.json();
}
