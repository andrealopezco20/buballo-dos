const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "eventos.json");
const CLANS_FILE = path.join(DATA_DIR, "clanes.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const file of [EVENTS_FILE, CLANS_FILE]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, "[]\n", "utf8");
    }
  }
}

async function readJson(file) {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeJson(file, data) {
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function makeId(prefix, value) {
  const slug = String(value || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42);
  return `${prefix}-${slug || "item"}-${Date.now().toString(36)}`;
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] ?? "").trim());
  if (missing.length) {
    const error = new Error(`Campos obligatorios faltantes: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function colorFromText(text) {
  const colors = ["#7c5cff", "#00d4ff", "#ff3d6e", "#ffcc33", "#3ce28a", "#ff8f3d", "#45a3ff"];
  const index = String(text || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === "admin" && password === "12345678") {
    return res.json({ ok: true, role: "admin" });
  }
  return res.status(401).json({ ok: false, message: "Credenciales incorrectas" });
});

app.get("/api/eventos", async (_req, res, next) => {
  try {
    res.json(await readJson(EVENTS_FILE));
  } catch (error) {
    next(error);
  }
});

app.post("/api/eventos", async (req, res, next) => {
  try {
    requireFields(req.body, ["nombre", "clan", "fecha", "hora", "descripcion", "estado"]);
    const eventos = await readJson(EVENTS_FILE);
    const nuevoEvento = {
      id: makeId("evt", req.body.nombre),
      nombre: req.body.nombre.trim(),
      clan: req.body.clan.trim(),
      clanColor: colorFromText(req.body.clan),
      categoria: "General",
      fecha: req.body.fecha,
      hora: req.body.hora,
      descripcion: req.body.descripcion.trim(),
      lugar: "Bubaloo",
      estado: req.body.estado,
      destacado: Boolean(req.body.destacado)
    };
    eventos.push(nuevoEvento);
    await writeJson(EVENTS_FILE, eventos);
    res.status(201).json(nuevoEvento);
  } catch (error) {
    next(error);
  }
});

app.put("/api/eventos/:id", async (req, res, next) => {
  try {
    requireFields(req.body, ["nombre", "clan", "fecha", "hora", "descripcion", "estado"]);
    const eventos = await readJson(EVENTS_FILE);
    const index = eventos.findIndex((evento) => evento.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Evento no encontrado" });
    eventos[index] = {
      ...eventos[index],
      nombre: req.body.nombre.trim(),
      clan: req.body.clan.trim(),
      clanColor: req.body.clanColor || colorFromText(req.body.clan),
      categoria: req.body.categoria || "General",
      fecha: req.body.fecha,
      hora: req.body.hora,
      descripcion: req.body.descripcion.trim(),
      lugar: "Bubaloo",
      estado: req.body.estado,
      destacado: Boolean(req.body.destacado)
    };
    await writeJson(EVENTS_FILE, eventos);
    res.json(eventos[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/eventos/:id", async (req, res, next) => {
  try {
    const eventos = await readJson(EVENTS_FILE);
    const nextEvents = eventos.filter((evento) => evento.id !== req.params.id);
    if (nextEvents.length === eventos.length) return res.status(404).json({ message: "Evento no encontrado" });
    await writeJson(EVENTS_FILE, nextEvents);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/clanes", async (_req, res, next) => {
  try {
    res.json(await readJson(CLANS_FILE));
  } catch (error) {
    next(error);
  }
});

app.post("/api/clanes", async (req, res, next) => {
  try {
    requireFields(req.body, ["nombre", "color", "descripcion"]);
    const clanes = await readJson(CLANS_FILE);
    const nuevoClan = {
      id: makeId("clan", req.body.nombre),
      nombre: req.body.nombre.trim(),
      color: req.body.color,
      descripcion: req.body.descripcion.trim()
    };
    clanes.push(nuevoClan);
    await writeJson(CLANS_FILE, clanes);
    res.status(201).json(nuevoClan);
  } catch (error) {
    next(error);
  }
});

app.put("/api/clanes/:id", async (req, res, next) => {
  try {
    requireFields(req.body, ["nombre", "color", "descripcion"]);
    const clanes = await readJson(CLANS_FILE);
    const index = clanes.findIndex((clan) => clan.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Clan no encontrado" });
    clanes[index] = {
      ...clanes[index],
      nombre: req.body.nombre.trim(),
      color: req.body.color,
      descripcion: req.body.descripcion.trim()
    };
    await writeJson(CLANS_FILE, clanes);
    res.json(clanes[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/clanes/:id", async (req, res, next) => {
  try {
    const [clanes, eventos] = await Promise.all([readJson(CLANS_FILE), readJson(EVENTS_FILE)]);
    if (eventos.some((evento) => evento.clanId === req.params.id)) {
      return res.status(409).json({ message: "No puedes eliminar un clan con eventos asociados" });
    }
    const nextClans = clanes.filter((clan) => clan.id !== req.params.id);
    if (nextClans.length === clanes.length) return res.status(404).json({ message: "Clan no encontrado" });
    await writeJson(CLANS_FILE, nextClans);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: status === 500 ? "Error interno del servidor" : error.message });
});

async function startServer(port = PORT) {
  await ensureDataFiles();
  return app.listen(port, () => {
    console.log(`BUBALLO EVENTS disponible en http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, readJson, writeJson };
