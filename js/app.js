const Buballo = (() => {
  const state = {
    eventos: [],
    calendarDate: new Date()
  };

  const api = {
    async get(path) {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudieron cargar los datos");
      return response.json();
    },
    async send(path, method, body) {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error de servidor" }));
        throw new Error(error.message || "Error de servidor");
      }
      return response.status === 204 ? null : response.json();
    }
  };

  function colorFromText(text) {
    const colors = ["#7c5cff", "#00d4ff", "#ff3d6e", "#ffcc33", "#3ce28a", "#ff8f3d", "#45a3ff"];
    const index = String(text || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  function getEventClan(evento) {
    return {
      nombre: evento.clan || "Clan no indicado",
      color: evento.clanColor || colorFromText(evento.clan)
    };
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(year, month - 1, day));
  }

  function eventCard(evento) {
    const clan = getEventClan(evento);
    return `
      <article class="event-card" data-event-id="${evento.id}" style="border-left-color:${clan.color}">
        <span>${formatDate(evento.fecha)} · ${evento.hora}</span>
        <h3>${escapeHtml(evento.nombre)}</h3>
        <p>${escapeHtml(evento.descripcion)}</p>
        <div class="tag-row">
          <span class="tag">${escapeHtml(clan.nombre)}</span>
          <span class="tag">${escapeHtml(evento.estado)}</span>
          ${evento.destacado ? '<span class="tag">Destacado</span>' : ""}
        </div>
      </article>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openEventModal(evento) {
    const modal = document.getElementById("eventModal");
    const content = document.getElementById("modalContent");
    if (!modal || !content) return;
    const clan = getEventClan(evento);
    content.innerHTML = `
      <p class="eyebrow" style="color:${clan.color}">${escapeHtml(clan.nombre)}</p>
      <h2>${escapeHtml(evento.nombre)}</h2>
      <p>${escapeHtml(evento.descripcion)}</p>
      <div class="tag-row">
        <span class="tag">${formatDate(evento.fecha)}</span>
        <span class="tag">${escapeHtml(evento.hora)}</span>
        <span class="tag">${escapeHtml(evento.estado)}</span>
      </div>
      <p><strong>Servidor:</strong> ${escapeHtml(evento.lugar || "Bubaloo")}</p>
      ${evento.destacado ? "<p><strong>Evento destacado de la comunidad.</strong></p>" : ""}
    `;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function setupModal() {
    const modal = document.getElementById("eventModal");
    const close = document.getElementById("closeModal");
    if (!modal || !close) return;
    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    };
    close.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
  }

  function getCalendarBounds(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    return { year, month, start };
  }

  function renderCalendar(events = state.eventos) {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("calendarTitle");
    if (!grid || !title) return;
    const { year, month, start } = getCalendarBounds(state.calendarDate);
    title.textContent = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(state.calendarDate);
    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateKey = current.toISOString().slice(0, 10);
      const dayEvents = events.filter((evento) => evento.fecha === dateKey);
      days.push(`
        <div class="calendar-day ${current.getMonth() !== month ? "muted" : ""}">
          <span class="day-number">${current.getDate()}</span>
          ${dayEvents.map((evento) => {
            const clan = getEventClan(evento);
            return `<button class="calendar-event" data-event-id="${evento.id}" style="background:${clan.color}">${escapeHtml(evento.nombre)}</button>`;
          }).join("")}
        </div>
      `);
    }
    grid.innerHTML = days.join("");
    grid.querySelectorAll("[data-event-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const evento = state.eventos.find((item) => item.id === button.dataset.eventId);
        if (evento) openEventModal(evento);
      });
    });
  }

  function setupCalendarNavigation(getEvents = () => state.eventos) {
    const prev = document.getElementById("prevMonth");
    const next = document.getElementById("nextMonth");
    if (prev) prev.addEventListener("click", () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
      renderCalendar(getEvents());
    });
    if (next) next.addEventListener("click", () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
      renderCalendar(getEvents());
    });
  }

  async function loadData() {
    const eventos = await api.get("/api/eventos");
    state.eventos = eventos;
    return state;
  }

  function setupLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = document.getElementById("loginMessage");
      const payload = Object.fromEntries(new FormData(form));
      try {
        // Intenta autenticar contra el backend si está disponible
        await api.send("/api/login", "POST", payload);
        sessionStorage.setItem("buballoAdmin", "true");
        window.location.href = "admin.html";
      } catch (error) {
        // Fallback rápido e inseguro para GitHub Pages u entornos sin servidor
        if (payload.usuario === "admin" && payload.password === "12345678") {
          sessionStorage.setItem("buballoAdmin", "true");
          window.location.href = "admin.html";
        } else {
          message.textContent = "Credenciales incorrectas (o servidor no disponible)";
        }
      }
    });
  }

  function setupGuest() {
    if (!document.body.classList.contains("guest-page")) return;
    const search = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const list = document.getElementById("guestEventList");

    const filteredEvents = () => {
      const query = search.value.trim().toLowerCase();
      return state.eventos.filter((evento) => {
        const clan = getEventClan(evento);
        const text = `${evento.nombre} ${evento.descripcion} ${evento.lugar} ${clan.nombre}`.toLowerCase();
        return (!query || text.includes(query))
          && (!statusFilter.value || evento.estado === statusFilter.value);
      });
    };

    const renderGuest = () => {
      const eventos = filteredEvents();
      list.innerHTML = eventos.length ? eventos.map(eventCard).join("") : '<p class="form-message">No hay eventos con esos filtros.</p>';
      list.querySelectorAll("[data-event-id]").forEach((card) => {
        card.addEventListener("click", () => {
          const evento = state.eventos.find((item) => item.id === card.dataset.eventId);
          if (evento) openEventModal(evento);
        });
      });
      renderCalendar(eventos);
    };

    const syncGuestData = async () => {
      await loadData();
      renderGuest();
    };

    [search, statusFilter].forEach((control) => control.addEventListener("input", renderGuest));
    window.addEventListener("focus", syncGuestData);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) syncGuestData();
    });
    setInterval(syncGuestData, 10000);
    setupCalendarNavigation(filteredEvents);
    renderGuest();
  }

  return {
    api,
    state,
    loadData,
    setupLogin,
    setupGuest,
    setupModal,
    renderCalendar,
    setupCalendarNavigation,
    getEventClan,
    eventCard,
    openEventModal,
    escapeHtml,
    formatDate
  };
})();

document.addEventListener("DOMContentLoaded", async () => {
  Buballo.setupLogin();
  Buballo.setupModal();
  if (document.body.classList.contains("guest-page")) {
    await Buballo.loadData();
    Buballo.setupGuest();
  }
});
