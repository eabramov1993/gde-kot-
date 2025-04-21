async function getCats() {
  const res = await fetch("/cats");
  return await res.json();
}

async function createCat(cat) {
  const res = await fetch("/cats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cat),
  });
  return await res.json();
}

async function updateCatStatus(id, status) {
  const res = await fetch(`/cats/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return await res.json();
}
