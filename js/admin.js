document.addEventListener("DOMContentLoaded", async () => {
  if (sessionStorage.getItem("buballoAdmin") !== "true") {
    window.location.href = "login.html";
    return;
  }

  await Buballo.loadData();
  setupLogout();
  setupEventForm();
  Buballo.setupCalendarNavigation(() => Buballo.state.eventos);
  renderAll();
});

function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("buballoAdmin");
    window.location.href = "index.html";
  });
}

function setupEventForm() {
  const eventForm = document.getElementById("eventForm");

  document.getElementById("resetEventForm").addEventListener("click", resetEventForm);

  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(eventForm));
    data.destacado = eventForm.destacado.checked;
    const id = data.id;
    delete data.id;

    try {
      if (id) {
        await Buballo.api.send(`/api/eventos/${id}`, "PUT", data);
      } else {
        await Buballo.api.send("/api/eventos", "POST", data);
      }

      document.getElementById("eventMessage").textContent = "Evento guardado. Ya aparece en invitados.";
      await refreshData();
      resetEventForm();
    } catch (error) {
      document.getElementById("eventMessage").textContent = error.message;
    }
  });
}

async function refreshData() {
  await Buballo.loadData();
  renderAll();
}

function renderAll() {
  renderAdminEvents();
  Buballo.renderCalendar(Buballo.state.eventos);
}

function renderAdminEvents() {
  const list = document.getElementById("adminEventList");
  const eventos = [...Buballo.state.eventos].sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`));

  list.innerHTML = eventos.map((evento) => {
    const clan = Buballo.getEventClan(evento);
    return `
      <article class="admin-item" style="border-left-color:${clan.color}">
        <span>${Buballo.formatDate(evento.fecha)} · ${Buballo.escapeHtml(evento.hora)}</span>
        <h3>${Buballo.escapeHtml(evento.nombre)}</h3>
        <p>${Buballo.escapeHtml(clan.nombre)} · ${Buballo.escapeHtml(evento.estado)}</p>
        <div class="item-actions">
          <button data-edit-event="${evento.id}">Editar</button>
          <button data-toggle-featured="${evento.id}">${evento.destacado ? "Quitar destacado" : "Destacar"}</button>
          <button class="delete" data-delete-event="${evento.id}">Eliminar</button>
        </div>
      </article>
    `;
  }).join("");

  list.querySelectorAll("[data-edit-event]").forEach((button) => {
    button.addEventListener("click", () => editEvent(button.dataset.editEvent));
  });
  list.querySelectorAll("[data-toggle-featured]").forEach((button) => {
    button.addEventListener("click", () => toggleFeatured(button.dataset.toggleFeatured));
  });
  list.querySelectorAll("[data-delete-event]").forEach((button) => {
    button.addEventListener("click", () => deleteEvent(button.dataset.deleteEvent));
  });
}

function editEvent(id) {
  const evento = Buballo.state.eventos.find((item) => item.id === id);
  if (!evento) return;

  const form = document.getElementById("eventForm");
  form.elements.id.value = evento.id;
  form.nombre.value = evento.nombre;
  form.clan.value = evento.clan || "";
  form.fecha.value = evento.fecha;
  form.hora.value = evento.hora;
  form.descripcion.value = evento.descripcion;
  form.estado.value = evento.estado;
  form.destacado.checked = evento.destacado;
  document.getElementById("eventFormTitle").textContent = "Editar evento";
  document.getElementById("eventMessage").textContent = "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function toggleFeatured(id) {
  const evento = Buballo.state.eventos.find((item) => item.id === id);
  if (!evento) return;
  await Buballo.api.send(`/api/eventos/${id}`, "PUT", { ...evento, destacado: !evento.destacado });
  await refreshData();
}

async function deleteEvent(id) {
  if (!confirm("¿Eliminar este evento?")) return;
  await Buballo.api.send(`/api/eventos/${id}`, "DELETE");
  await refreshData();
}

function resetEventForm() {
  const form = document.getElementById("eventForm");
  form.reset();
  form.elements.id.value = "";
  document.getElementById("eventFormTitle").textContent = "Crear evento";
  document.getElementById("eventMessage").textContent = "";
}
