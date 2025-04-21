const map = L.map("map");
const defaultView = [43.238949, 76.889709];
let tempMarker = null;
let selectedCoords = null;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
}).addTo(map);

map.setView(defaultView, 13);

// 📍 Кнопка "Где я?"
document.getElementById("locate-btn").addEventListener("click", async () => {
  if (!navigator.geolocation) return alert("Геолокация не поддерживается");

  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 15);

    selectedCoords = { lat: latitude, lng: longitude };

    if (tempMarker) map.removeLayer(tempMarker);

    tempMarker = L.marker([latitude, longitude], { draggable: true })
      .addTo(map)
      .bindPopup("Выбранная точка")
      .openPopup();

    tempMarker.on("dragend", (e) => {
      const newPos = e.target.getLatLng();
      selectedCoords = { lat: newPos.lat, lng: newPos.lng };
    });
  } catch (err) {
    alert("Не удалось получить геолокацию");
    console.warn(err);
  }
});

// 🐾 Загрузка всех котов
getCats().then((cats) => {
  cats.forEach(addCatMarker);
});

// ➕ Добавление кота
document.getElementById("submit-cat").addEventListener("click", async () => {
  const desc = document.getElementById("cat-desc").value;
  const status = document.getElementById("cat-status").value;
  const photo = document.getElementById("cat-photo").files[0];

  if (!selectedCoords) {
    alert("Сначала нажми 📍 чтобы указать точку");
    return;
  }

  if (!desc.trim()) {
    alert("Введите описание кота");
    return;
  }

  const formData = new FormData();
  formData.append("description", desc);
  formData.append("status", status);
  formData.append("location_lat", selectedCoords.lat);
  formData.append("location_lng", selectedCoords.lng);
  if (photo) formData.append("photo", photo);

  try {
    const res = await fetch("/cats", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(await res.text());

    const newCat = await res.json();
    if (newCat.approved) {
      addCatMarker(newCat); // покажем на карте
      showToast("🐾 Ты герой! Кот добавлен!");
    } else {
      showToast("✅ Отправлено на модерацию! Появится после проверки.");
    }
    // Удаляем временную метку и координаты
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
    selectedCoords = null;

    // Очищаем форму
    document.getElementById("cat-desc").value = "";
    document.getElementById("cat-photo").value = "";
    document.getElementById("cat-status").value = "hungry";
  } catch (err) {
    console.error(err);
    alert("Ошибка: " + err.message);
  }
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 4000);
}
