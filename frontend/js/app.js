/**
 * Controlador Principal - Problema del Agente Viajero (TSP)
 */

import { Api } from "./api.js";
import { GraphVisualizer } from "./graph_vis.js";

// Mapeo temático de nombres de ciudades para los nodos del Agente Viajero
const CITY_NAMES = {
  "A": "Metrópolis A (Sede)",
  "B": "Ciudad B",
  "C": "Ciudad C",
  "D": "Ciudad D",
  "E": "Ciudad E",
  "F": "Ciudad F",
  "G": "Ciudad G",
  "H": "Ciudad H",
  "I": "Ciudad I",
  "J": "Ciudad J"
};

const NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

// Estado global de la aplicación
const state = {
  n: 5,
  mode: "random", // 'random' | 'manual'
  unit: "km",     // 'km' | '$' | 'min'
  nodes: [],
  edges: [],
  matrix: {},
  currentStage: 1, // 1: Config, 2: Validación, 3: Exploración, 4: Óptimo
  
  // Estado del TSP
  tspResult: null,
  activeStepsList: [],
  currentStepIndex: 0,
  isPlaying: false,
  playTimer: null,
  playSpeed: 600,
  filterMode: "all",
  bestCostSoFar: null,
  bestRouteSoFar: null
};

let visualizer = null;

document.addEventListener("DOMContentLoaded", () => {
  visualizer = new GraphVisualizer("network-canvas");
  visualizer.setUnit(state.unit);
  setupEventListeners();
  updateStageIndicator(1);
  generateRandomGraph(5);

  function renderMath() {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX render error:", e);
      }
    }
  }

  renderMath();
  window.addEventListener("load", renderMath);
});

/**
 * Configuración de eventos
 */
function setupEventListeners() {
  // Selector de Unidades (km, $, min)
  document.getElementById("btn-unit-km").addEventListener("click", () => setUnit("km"));
  document.getElementById("btn-unit-cost").addEventListener("click", () => setUnit("$"));
  document.getElementById("btn-unit-time").addEventListener("click", () => setUnit("min"));

  // Slider de Nodos
  const nSlider = document.getElementById("n-nodes-slider");
  const nDisplay = document.getElementById("n-nodes-display");
  nSlider.addEventListener("input", (e) => {
    state.n = Number(e.target.value);
    nDisplay.textContent = `${state.n} ciudades`;
    if (state.mode === "manual") {
      updateManualNodes();
    }
  });

  // Tabs de Modo
  const tabRandom = document.getElementById("tab-random");
  const tabManual = document.getElementById("tab-manual");
  const contentRandom = document.getElementById("content-random");
  const contentManual = document.getElementById("content-manual");

  tabRandom.addEventListener("click", () => {
    state.mode = "random";
    tabRandom.classList.add("active");
    tabManual.classList.remove("active");
    contentRandom.classList.add("active");
    contentManual.classList.remove("active");
  });

  tabManual.addEventListener("click", () => {
    state.mode = "manual";
    tabManual.classList.add("active");
    tabRandom.classList.remove("active");
    contentManual.classList.add("active");
    contentRandom.classList.remove("active");
    updateManualNodes();
  });

  // Botón Generar Aleatorio
  document.getElementById("btn-generate-random").addEventListener("click", () => {
    generateRandomGraph(state.n);
  });

  // Botón Agregar Arista Manual
  document.getElementById("btn-add-edge").addEventListener("click", addManualEdge);

  // Botón Validar Grafo
  document.getElementById("btn-validate-graph").addEventListener("click", validateCurrentGraph);

  // Botón Resolver TSP
  document.getElementById("btn-solve-tsp").addEventListener("click", solveTSP);

  // Controles de Reproducción Paso a Paso
  document.getElementById("btn-step-prev").addEventListener("click", () => {
    pausePlayback();
    goToStep(state.currentStepIndex - 1);
  });

  document.getElementById("btn-step-next").addEventListener("click", () => {
    pausePlayback();
    goToStep(state.currentStepIndex + 1);
  });

  document.getElementById("btn-step-play").addEventListener("click", togglePlayPause);

  document.getElementById("btn-step-start").addEventListener("click", () => {
    pausePlayback();
    goToStep(0);
  });

  document.getElementById("btn-step-end").addEventListener("click", () => {
    pausePlayback();
    goToStep(state.activeStepsList.length - 1);
  });

  // Velocidad
  const speedSlider = document.getElementById("speed-slider");
  const speedDisplay = document.getElementById("speed-display");
  speedSlider.addEventListener("input", (e) => {
    state.playSpeed = Number(e.target.value);
    speedDisplay.textContent = `${state.playSpeed}ms`;
    if (state.isPlaying) {
      pausePlayback();
      startPlayback();
    }
  });

  // Filtro
  const filterSelect = document.getElementById("step-filter-select");
  filterSelect.addEventListener("change", (e) => {
    state.filterMode = e.target.value;
    updateActiveStepsList();
  });

  // Modal Guía del Agente Viajero
  const guideModal = document.getElementById("guide-modal");
  const openGuideBtn = document.getElementById("btn-open-guide");
  if (openGuideBtn) {
    openGuideBtn.addEventListener("click", () => {
      guideModal.classList.add("active");
    });
  }
  const closeGuideBtn = document.getElementById("btn-close-guide");
  if (closeGuideBtn) {
    closeGuideBtn.addEventListener("click", () => {
      guideModal.classList.remove("active");
    });
  }
  const understoodBtn = document.getElementById("btn-modal-understood");
  if (understoodBtn) {
    understoodBtn.addEventListener("click", () => {
      guideModal.classList.remove("active");
    });
  }

  // Controles de Visualización del Grafo (Toolbar)
  document.getElementById("btn-graph-fit")?.addEventListener("click", () => visualizer?.fit());
  document.getElementById("btn-graph-zoom-in")?.addEventListener("click", () => visualizer?.zoomIn());
  document.getElementById("btn-graph-zoom-out")?.addEventListener("click", () => visualizer?.zoomOut());
  
  const btnPhysics = document.getElementById("btn-graph-physics");
  if (btnPhysics) {
    btnPhysics.addEventListener("click", () => {
      const isEnabled = visualizer?.togglePhysics();
      btnPhysics.textContent = isEnabled ? "⚡ Física: ON" : "⏸️ Física: OFF";
    });
  }

  // Botón Hero: Cargar Ejemplo 5 Ciudades
  document.getElementById("btn-hero-example")?.addEventListener("click", (e) => {
    e.preventDefault();
    state.n = 5;
    const nSlider = document.getElementById("n-nodes-slider");
    const nDisplay = document.getElementById("n-nodes-display");
    if (nSlider) nSlider.value = 5;
    if (nDisplay) nDisplay.textContent = "5 ciudades";
    generateRandomGraph(5);
    document.getElementById("programa")?.scrollIntoView({ behavior: "smooth" });
  });
}

function setUnit(newUnit) {
  state.unit = newUnit;
  visualizer.setUnit(newUnit);

  document.querySelectorAll(".metric-btn").forEach(b => b.classList.remove("active"));
  if (newUnit === "km") document.getElementById("btn-unit-km").classList.add("active");
  if (newUnit === "$") document.getElementById("btn-unit-cost").classList.add("active");
  if (newUnit === "min") document.getElementById("btn-unit-time").classList.add("active");

  document.querySelectorAll(".unit-label").forEach(el => el.textContent = newUnit);

  // Redibujar grafo con la nueva unidad
  if (state.nodes.length > 0) {
    visualizer.init(state.nodes, state.edges, CITY_NAMES);
    renderCostMatrix(state.nodes, state.matrix);
  }
}

function updateStageIndicator(stageNum) {
  state.currentStage = stageNum;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`stage-indicator-${i}`);
    if (i <= stageNum) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  }
}

/**
 * Generar Grafo de Ciudades Aleatorio
 */
async function generateRandomGraph(n) {
  try {
    hideAlert();
    resetTSPExecution();
    updateStageIndicator(1);

    const minW = Math.max(5,  Math.min(50,  Number(document.getElementById("min-weight-input")?.value) || 10));
    const maxW = Math.max(10, Math.min(150, Number(document.getElementById("max-weight-input")?.value) || 150));
    const prob = Math.max(0.2, Math.min(0.9, (Number(document.getElementById("edge-prob-slider")?.value) || 55) / 100));

    const data = await Api.generateGraph(n, minW, maxW, prob);
    state.nodes = data.nodes;
    state.edges = data.edges;
    state.matrix = data.matrix;

    visualizer.init(state.nodes, state.edges, CITY_NAMES);
    renderCostMatrix(state.nodes, state.matrix);

    showAlert("Red vial de ciudades generada con éxito. Conexidad y ciclo hamiltoniano garantizados.", "success");
    updateStageIndicator(2);
  } catch (err) {
    showAlert(err.message, "danger");
  }
}

/**
 * Actualizar selects del formulario manual
 */
function updateManualNodes() {
  const currentLabels = NODE_LABELS.slice(0, state.n);
  const sourceSelect = document.getElementById("manual-source-select");
  const targetSelect = document.getElementById("manual-target-select");

  sourceSelect.innerHTML = "";
  targetSelect.innerHTML = "";

  currentLabels.forEach(label => {
    const name = CITY_NAMES[label] || `Ciudad ${label}`;
    sourceSelect.add(new Option(`${label} - ${name}`, label));
    targetSelect.add(new Option(`${label} - ${name}`, label));
  });

  state.nodes = currentLabels;
  state.edges = state.edges.filter(e => currentLabels.includes(e.source) && currentLabels.includes(e.target));

  renderManualEdgesList();
  visualizer.init(state.nodes, state.edges, CITY_NAMES);
  state.matrix = buildLocalMatrix(state.nodes, state.edges);
  renderCostMatrix(state.nodes, state.matrix);
}

/**
 * Agregar arista manual
 */
function addManualEdge() {
  const source = document.getElementById("manual-source-select").value;
  const target = document.getElementById("manual-target-select").value;
  const weightInput = document.getElementById("manual-weight-input");
  const weight = Number(weightInput.value);

  if (source === target) {
    showAlert("No se permiten bucles: el agente debe viajar entre dos ciudades distintas.", "warning");
    return;
  }
  if (!weight || weight <= 0) {
    showAlert("El valor del tramo vial debe ser un número positivo.", "warning");
    return;
  }
  if (weight < 5 || weight > 150) {
    showAlert("El valor del tramo debe estar entre 5 y 150 km. Ajusta el valor e intenta nuevamente.", "warning");
    return;
  }

  const existingIdx = state.edges.findIndex(
    e => (e.source === source && e.target === target) || (e.source === target && e.target === source)
  );

  const unitTxt = state.unit === "$" ? `$${weight}` : `${weight} ${state.unit}`;

  if (existingIdx !== -1) {
    state.edges[existingIdx].weight = weight;
    showAlert(`Se actualizó el costo del tramo (${source} ↔ ${target}) a ${unitTxt}.`, "success");
  } else {
    state.edges.push({ source, target, weight });
    showAlert(`Carretera (${source} ↔ ${target}, ${unitTxt}) conectada al mapa.`, "success");
  }

  renderManualEdgesList();
  visualizer.init(state.nodes, state.edges, CITY_NAMES);
  state.matrix = buildLocalMatrix(state.nodes, state.edges);
  renderCostMatrix(state.nodes, state.matrix);
  resetTSPExecution();
}

/**
 * Eliminar arista manual
 */
function removeEdge(source, target) {
  state.edges = state.edges.filter(
    e => !( (e.source === source && e.target === target) || (e.source === target && e.target === source) )
  );
  renderManualEdgesList();
  visualizer.init(state.nodes, state.edges, CITY_NAMES);
  state.matrix = buildLocalMatrix(state.nodes, state.edges);
  renderCostMatrix(state.nodes, state.matrix);
  resetTSPExecution();
}

function renderManualEdgesList() {
  const container = document.getElementById("manual-edges-list");
  container.innerHTML = "";

  if (state.edges.length === 0) {
    container.innerHTML = '<div style="padding:0.75rem; color:var(--text-dim); text-align:center; font-size:0.8rem;">Sin carreteras añadidas aún.</div>';
    return;
  }

  state.edges.forEach(e => {
    const item = document.createElement("div");
    item.className = "edge-list-item";
    const unitTxt = state.unit === "$" ? `$${e.weight}` : `${e.weight} ${state.unit}`;
    item.innerHTML = `
      <span class="edge-pill">(${e.source} ↔ ${e.target})</span>
      <span>${unitTxt}</span>
      <button class="btn-icon-danger" title="Eliminar carretera">✕</button>
    `;
    item.querySelector("button").addEventListener("click", () => removeEdge(e.source, e.target));
    container.appendChild(item);
  });
}

/**
 * Validar si el mapa admite Ciclo Hamiltoniano
 */
async function validateCurrentGraph() {
  try {
    hideAlert();
    updateStageIndicator(2);
    const result = await Api.validateGraph(state.nodes, state.edges);
    const val = result.validation;

    if (val.has_hamiltonian_cycle) {
      showAlert("El mapa de ciudades contiene al menos un Ciclo Hamiltoniano válido. ¡El agente puede realizar su viaje!", "success");
      updateStageIndicator(3);
    } else {
      showMissingEdgesAlert(val);
    }
    state.matrix = result.matrix;
    renderCostMatrix(state.nodes, state.matrix);
  } catch (err) {
    showAlert(err.message, "danger");
  }
}

function showMissingEdgesAlert(validation) {
  const msg = validation.message;
  const suggestions = validation.suggested_edges || [];

  const alertContainer = document.getElementById("alert-container");
  alertContainer.className = "alert-box alert-warning";
  alertContainer.style.display = "flex";

  alertContainer.innerHTML = `
    <div><strong>Advertencia para el Agente:</strong> ${msg}</div>
    ${suggestions.length > 0 ? `
      <div>
        <button id="btn-fix-missing-edges" class="btn btn-secondary btn-sm" style="margin-top:0.35rem;">
          ➕ Añadir carreteras sugeridas automáticamente
        </button>
      </div>
    ` : ""}
  `;

  const btnFix = document.getElementById("btn-fix-missing-edges");
  if (btnFix) {
    btnFix.addEventListener("click", () => {
      suggestions.forEach(s => {
        const exists = state.edges.some(
          e => (e.source === s.source && e.target === s.target) || (e.source === s.target && e.target === s.source)
        );
        if (!exists) {
          state.edges.push({
            source: s.source,
            target: s.target,
            weight: s.suggested_weight || 20
          });
        }
      });
      renderManualEdgesList();
      visualizer.init(state.nodes, state.edges, CITY_NAMES);
      state.matrix = buildLocalMatrix(state.nodes, state.edges);
      renderCostMatrix(state.nodes, state.matrix);
      showAlert("Carreteras añadidas. El mapa ahora cuenta con rutas de viaje válidas para el agente.", "success");
      updateStageIndicator(3);
    });
  }
}

/**
 * Resolver el Problema del Agente Viajero (Fuerza Bruta)
 */
async function solveTSP() {
  try {
    pausePlayback();
    hideAlert();

    const btnSolve = document.getElementById("btn-solve-tsp");
    btnSolve.disabled = true;
    btnSolve.innerHTML = "⏳ Evaluando permutaciones del agente...";

    const res = await Api.solveTSP(state.nodes, state.edges, 600);
    state.tspResult = res;

    // Actualizar métricas
    document.getElementById("stat-total-perms").textContent = res.total_permutations.toLocaleString();
    document.getElementById("stat-valid-cycles").textContent = res.valid_cycles_count.toLocaleString();
    
    const optCostTxt = res.optimal_cost !== null 
      ? (state.unit === "$" ? `$${res.optimal_cost}` : `${res.optimal_cost} ${state.unit}`)
      : "N/A";
    document.getElementById("stat-optimal-cost").textContent = optCostTxt;

    updateActiveStepsList();
    renderResultsTable(res.valid_cycles, res.optimal_cycle);

    document.getElementById("stepper-panel").style.display = "flex";
    document.getElementById("results-panel").style.display = "flex";

    btnSolve.disabled = false;
    btnSolve.innerHTML = "🚀 Calcular Rutas del Agente (Fuerza Bruta)";

    updateStageIndicator(3);
    const firstValidIndex = state.activeStepsList.findIndex(s => s.is_valid);
    goToStep(firstValidIndex !== -1 ? firstValidIndex : 0);
    showAlert(`Búsqueda exhaustiva concluida: ${res.total_permutations.toLocaleString()} rutas evaluadas. Se encontraron ${res.valid_cycles_count} ciclos hamiltonianos válidos.`, "success");
  } catch (err) {
    document.getElementById("btn-solve-tsp").disabled = false;
    document.getElementById("btn-solve-tsp").innerHTML = "🚀 Calcular Rutas del Agente (Fuerza Bruta)";
    if (err.validation) {
      showMissingEdgesAlert(err.validation);
    } else {
      showAlert(err.message, "danger");
    }
  }
}

function updateActiveStepsList() {
  if (!state.tspResult) return;

  if (state.filterMode === "valid_only") {
    state.activeStepsList = state.tspResult.valid_cycles.map(c => ({
      index: c.index,
      route: c.route,
      formatted_route: c.formatted_route,
      is_valid: true,
      total_cost: c.total_cost,
      edge_breakdown: c.edge_breakdown,
      missing_edges: []
    }));
  } else {
    state.activeStepsList = state.tspResult.steps;
  }

  state.bestCostSoFar = null;
  state.bestRouteSoFar = null;
  goToStep(0);
}

function goToStep(index) {
  if (!state.activeStepsList || state.activeStepsList.length === 0) return;

  if (index < 0) index = 0;
  if (index >= state.activeStepsList.length) index = state.activeStepsList.length - 1;

  state.currentStepIndex = index;
  const currentStep = state.activeStepsList[index];

  const total = state.activeStepsList.length;
  document.getElementById("step-counter-text").textContent = `Ruta ${index + 1} de ${total}`;
  const progressPercent = ((index + 1) / total) * 100;
  document.getElementById("progress-fill").style.width = `${progressPercent}%`;

  renderCurrentStepDisplay(currentStep);

  const isGlobalOptimal = state.tspResult.optimal_cycle && 
                          currentStep.is_valid && 
                          currentStep.total_cost === state.tspResult.optimal_cost;

  if (currentStep.is_valid) {
    if (state.bestCostSoFar === null || currentStep.total_cost < state.bestCostSoFar) {
      state.bestCostSoFar = currentStep.total_cost;
      state.bestRouteSoFar = currentStep.formatted_route;
    }
  }

  const recordElem = document.getElementById("step-record-cost");
  if (recordElem) {
    if (state.bestCostSoFar !== null) {
      recordElem.textContent = state.unit === "$" ? `$${state.bestCostSoFar}` : `${state.bestCostSoFar} ${state.unit}`;
    } else {
      recordElem.textContent = "—";
    }
  }

  if (isGlobalOptimal) {
    updateStageIndicator(4);
  }

  visualizer.highlightRoute(currentStep.route, isGlobalOptimal, currentStep.is_valid);
  highlightTableRow(currentStep.formatted_route);
}

function renderCurrentStepDisplay(step) {
  const tokensContainer = document.getElementById("current-route-tokens");
  tokensContainer.innerHTML = "";

  step.route.forEach((node, i) => {
    const token = document.createElement("span");
    token.className = `node-token ${i === 0 || i === step.route.length - 1 ? 'origin' : ''}`;
    token.textContent = `${node}`;
    tokensContainer.appendChild(token);

    if (i < step.route.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "arrow-token";
      arrow.textContent = "→";
      tokensContainer.appendChild(arrow);
    }
  });

  const costBox = document.getElementById("current-cost-box");
  const costValue = document.getElementById("current-cost-value");
  const costFormula = document.getElementById("current-cost-formula");
  const statusBadge = document.getElementById("step-status-badge");

  if (step.is_valid) {
    costBox.className = "cost-box";
    const isOpt = state.tspResult.optimal_cycle && step.total_cost === state.tspResult.optimal_cost;
    
    if (isOpt) {
      costBox.classList.add("optimal");
      statusBadge.innerHTML = '<span class="chip chip-optimal">🏆 Ruta Óptima del Agente</span>';
    } else {
      statusBadge.innerHTML = '<span class="badge badge-emerald">✔ Ciclo Hamiltoniano Válido</span>';
    }

    const costStr = state.unit === "$" ? `$${step.total_cost}` : `${step.total_cost} ${state.unit}`;
    costValue.textContent = costStr;

    const formulaParts = step.edge_breakdown.map(e => {
      const w = state.unit === "$" ? `$${e.cost}` : `${e.cost}`;
      return `${e.from}-${e.to}(${w})`;
    });
    costFormula.textContent = `Tramos: ${formulaParts.join(" + ")} = ${costStr}`;
  } else {
    costBox.className = "cost-box invalid";
    statusBadge.innerHTML = '<span class="badge" style="color:var(--accent-rose); border-color:var(--accent-rose);">✖ Ruta Descartada (Carretera inexistente)</span>';
    costValue.textContent = "Incalculable";
    costFormula.innerHTML = `
      <span>El agente no puede viajar por: <strong>${step.missing_edges.join(", ")}</strong></span>
      <div style="margin-top:0.35rem; font-size:0.75rem; color:#fde68a;">
        ℹ️ En Fuerza Bruta se evalúan todas las combinaciones; las que no tienen carretera se descartan. 
        <button id="btn-jump-next-valid" style="background:rgba(56,189,248,0.15); border:1px solid #38bdf8; color:#7dd3fc; border-radius:4px; padding:0.15rem 0.45rem; font-size:0.72rem; cursor:pointer; margin-left:0.3rem;">
          Ir al siguiente ciclo válido ⏩
        </button>
      </div>
    `;

    const btnJump = document.getElementById("btn-jump-next-valid");
    if (btnJump) {
      btnJump.addEventListener("click", () => {
        // Buscar el siguiente paso que sea válido
        for (let i = state.currentStepIndex + 1; i < state.activeStepsList.length; i++) {
          if (state.activeStepsList[i].is_valid) {
            goToStep(i);
            return;
          }
        }
        // Si no hay más adelante, buscar desde el principio
        for (let i = 0; i < state.activeStepsList.length; i++) {
          if (state.activeStepsList[i].is_valid) {
            goToStep(i);
            return;
          }
        }
      });
    }
  }
}

function togglePlayPause() {
  if (state.isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  state.isPlaying = true;
  document.getElementById("btn-step-play").innerHTML = "⏸ Pausar";
  document.getElementById("btn-step-play").classList.replace("btn-secondary", "btn-primary");

  state.playTimer = setInterval(() => {
    if (state.currentStepIndex < state.activeStepsList.length - 1) {
      goToStep(state.currentStepIndex + 1);
    } else {
      pausePlayback();
      updateStageIndicator(4);
    }
  }, state.playSpeed);
}

function pausePlayback() {
  state.isPlaying = false;
  if (state.playTimer) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
  const btn = document.getElementById("btn-step-play");
  if (btn) {
    btn.innerHTML = "▶ Reproducir";
    btn.classList.replace("btn-primary", "btn-secondary");
  }
}

function renderCostMatrix(nodes, matrix) {
  const table = document.getElementById("matrix-table");
  table.innerHTML = "";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.appendChild(document.createElement("th"));

  nodes.forEach(n => {
    const th = document.createElement("th");
    th.textContent = n;
    th.title = CITY_NAMES[n] || `Ciudad ${n}`;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  nodes.forEach(u => {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = u;
    th.title = CITY_NAMES[u] || `Ciudad ${u}`;
    row.appendChild(th);

    nodes.forEach(v => {
      const td = document.createElement("td");
      const val = matrix[u] ? matrix[u][v] : null;

      if (u === v) {
        td.className = "diagonal";
        td.textContent = "0";
      } else if (val !== null && val !== undefined) {
        td.className = "has-edge";
        td.textContent = val;
      } else {
        td.className = "no-edge";
        td.textContent = "—";
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
}

function renderResultsTable(validCycles, optimalCycle) {
  const tbody = document.getElementById("results-table-body");
  tbody.innerHTML = "";

  if (!validCycles || validCycles.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-dim);">No se encontraron ciclos hamiltonianos válidos en esta red de ciudades.</td></tr>';
    return;
  }

  validCycles.forEach((cycle, index) => {
    const tr = document.createElement("tr");
    const isOptimal = optimalCycle && cycle.total_cost === optimalCycle.total_cost;
    if (isOptimal) tr.className = "optimal-row";

    tr.setAttribute("data-route", cycle.formatted_route);
    const costFormatted = state.unit === "$" ? `$${cycle.total_cost}` : `${cycle.total_cost} ${state.unit}`;

    tr.innerHTML = `
      <td>${isOptimal ? '🥇' : `#${index + 1}`}</td>
      <td style="font-family:monospace; font-weight:700;">${cycle.formatted_route}</td>
      <td style="font-family:monospace; font-weight:800; color:${isOptimal ? 'var(--accent-emerald)' : 'var(--text-main)'};">
        ${costFormatted}
      </td>
      <td>
        ${isOptimal ? '<span class="chip chip-optimal">⭐ Ciclo Óptimo</span>' : '<span class="badge">Alternativa Válida</span>'}
      </td>
    `;

    tr.addEventListener("click", () => {
      pausePlayback();
      visualizer.highlightRoute(cycle.route, isOptimal, true);
      highlightTableRow(cycle.formatted_route);
      if (isOptimal) updateStageIndicator(4);
    });

    tbody.appendChild(tr);
  });
}

function highlightTableRow(formattedRoute) {
  const rows = document.querySelectorAll("#results-table-body tr");
  rows.forEach(r => {
    if (r.getAttribute("data-route") === formattedRoute) {
      r.classList.add("active-evaluated-row");
      r.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      r.classList.remove("active-evaluated-row");
    }
  });
}

function buildLocalMatrix(nodes, edges) {
  const matrix = {};
  nodes.forEach(u => {
    matrix[u] = {};
    nodes.forEach(v => {
      matrix[u][v] = u === v ? 0 : null;
    });
  });
  edges.forEach(e => {
    if (matrix[e.source] && matrix[e.target]) {
      matrix[e.source][e.target] = e.weight;
      matrix[e.target][e.source] = e.weight;
    }
  });
  return matrix;
}

function showAlert(message, type = "warning") {
  const container = document.getElementById("alert-container");
  container.className = `alert-box alert-${type}`;
  container.style.display = "flex";
  container.innerHTML = `<div>${message}</div>`;
}

function hideAlert() {
  const container = document.getElementById("alert-container");
  container.style.display = "none";
  container.innerHTML = "";
}

function resetTSPExecution() {
  pausePlayback();
  state.tspResult = null;
  state.activeStepsList = [];
  state.currentStepIndex = 0;
  state.bestCostSoFar = null;
  state.bestRouteSoFar = null;
  document.getElementById("stepper-panel").style.display = "none";
  document.getElementById("results-panel").style.display = "none";
  document.getElementById("results-table-body").innerHTML = "";
  visualizer?.resetHighlight();
}
