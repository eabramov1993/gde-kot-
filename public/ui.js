const catMarkers = {};
const statusLabels = {
  hungry: "Покорми, пожалуйста 🥺",
  fed: "Я сыт и счастлив 😸",
  taken: "Я дома 🏠",
  in_treatment: "Я лечусь 👨‍⚕️",
  injured: "Я поранен 😿",
  default: "Неизвестный статус",
  moving: "Переезжаю 🧳",
};

const feedMessages = [
  "😺 Спасибо! Кот накормлен.",
  "🐟 Ты спас кота от голода!",
  "🎉 Отличная работа, герой!",
  "🫶 Кот тебе благодарен.",
  "🍖 Миссия выполнена!",
  "😸 Вкуснятина! Спасибо!",
];

function addCatMarker(cat) {
  const statusColors = {
    hungry: "#e74c3c",
    fed: "#f39c12",
    moving: "#f1c40f",
    taken: "#2ecc71",
    in_treatment: "#3498db",
    injured: "#9b59b6",
    default: "#95a5a6",
  };

  const color = statusColors[cat.status] || statusColors.default;

  const icon = L.divIcon({
    className: "custom-status-icon",
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: ${color};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  if (catMarkers[cat.id]) {
    map.removeLayer(catMarkers[cat.id]);
  }

  const marker = L.marker([cat.location_lat, cat.location_lng], { icon })
    .addTo(map)
    .on("click", () => openCatPanel(cat));

  catMarkers[cat.id] = marker;
}

function openCatPanel(cat) {
  const panel = document.getElementById("cat-panel");
  const content = document.getElementById("cat-panel-content");

  content.innerHTML = `
      <div class="cat-card">
        ${
          cat.photo_url
            ? `<img class="cat-photo" src="${cat.photo_url}" alt="Фото кота" />`
            : ""
        }
  
        <div class="cat-details">
          <div class="cat-field">
            <div class="cat-label">Описание</div>
            <div class="cat-value">${cat.description || "Без описания"}</div>
          </div>
  
          <div class="cat-field">
            <div class="cat-label">Статус</div>
            <div class="cat-value">${
              statusLabels[cat.status] || statusLabels.default
            }</div>
          </div>
        </div>
      </div>
    `;

  // === НОВОЕ ===
  if (cat.status === "moving" && !cat.confirmed) {
    if (!cat.confirm_photo_url) {
      /* ▲  фото ещё не отправлено → показываем кнопку */

      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "10px";
      wrapper.style.marginTop = "14px";

      const uploadBtn = document.createElement("label");
      uploadBtn.textContent = "📤 Отправить фото";
      uploadBtn.setAttribute("for", "confirm-photo");
      uploadBtn.className = "feed-btn";
      uploadBtn.style.cursor = "pointer";
      uploadBtn.style.textAlign = "center";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.id = "confirm-photo";
      fileInput.style.display = "none";

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("photo", file);

        const res = await fetch(`/cats/${cat.id}/confirm`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          alert("Ошибка подтверждения: " + (await res.text()));
          return;
        }

        const updated = await res.json();
        showToast("✅ Фото отправлено, ждём модерации!");
        openCatPanel(updated); // перерисуем панель
        addCatMarker(updated); // цвет маркера уже обновляется
      });

      wrapper.appendChild(fileInput);
      wrapper.appendChild(uploadBtn);
      content.appendChild(wrapper);
    } else {
      /* ▲  фото уже отправлено, но подтверждение ещё не прошло */

      const note = document.createElement("div");
      note.className = "cat-note";
      note.innerHTML =
        "<div class='cat-value'>⏳ Фото на модерации. Спасибо за заботу!</div>";
      content.appendChild(note);
    }
  }

  if (cat.status === "hungry") {
    const btn = document.createElement("button");
    btn.textContent = "Покормлю";
    btn.className = "feed-btn";
    btn.onclick = async () => {
      const updated = await updateCatStatus(cat.id, "fed");
      const randomMsg =
        feedMessages[Math.floor(Math.random() * feedMessages.length)];
      showToast(randomMsg);
      openCatPanel(updated);
      addCatMarker(updated); // 🔧 ДОБАВИЛ
    };
    content.appendChild(btn);
  }

  if ((cat.status === "hungry" || cat.status === "fed") && !cat.confirmed) {
    const btnTake = document.createElement("button");
    btnTake.textContent = "Заберу домой";
    btnTake.className = "feed-btn";
    btnTake.style.backgroundColor = "#ff9900";
    btnTake.onclick = async () => {
      const updated = await updateCatStatus(cat.id, "moving");
      showToast("🧳 Кот готовится к переезду!");
      openCatPanel(updated);
      addCatMarker(updated); // 🔧 уже было — оставляем
    };

    content.appendChild(btnTake);
  }

  overlay.classList.remove("hidden");
}

// Закрытие панели
const overlay = document.getElementById("cat-overlay");
const panel = document.getElementById("cat-panel");

overlay.addEventListener("click", (e) => {
  if (!panel.contains(e.target)) {
    overlay.classList.add("hidden");
  }
});
document.getElementById("close-panel").addEventListener("click", () => {
  overlay.classList.add("hidden");
});

// 📦 Загрузка всех котов при старте
async function loadCats() {
  const res = await fetch("/cats");
  const cats = await res.json();
  cats.forEach(addCatMarker);
}
loadCats();
