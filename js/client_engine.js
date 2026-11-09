/**
 * Motor de Grafos y TSP en JavaScript para despliegue estático (GitHub Pages / Netlify)
 * Replican fielmente la lógica de backend/graph_logic.py y backend/tsp_solver.py
 */

const NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export function getClientNodeLabels(n) {
  if (n < 5 || n > 10) {
    throw new Error("El número de nodos (n) debe estar estrictamente en el rango [5, 10].");
  }
  return NODE_LABELS.slice(0, n);
}

export function buildClientAdjacencyMatrix(nodes, edges) {
  const matrix = {};
  nodes.forEach(u => {
    matrix[u] = {};
    nodes.forEach(v => {
      matrix[u][v] = u === v ? 0 : null;
    });
  });

  edges.forEach(edge => {
    const u = edge.source;
    const v = edge.target;
    const w = Number(edge.weight);
    if (matrix[u] && matrix[v]) {
      matrix[u][v] = w;
      matrix[v][u] = w;
    }
  });

  return matrix;
}

export function generateClientRandomGraph(n, minWeight = 5, maxWeight = 60, extraEdgeProb = 0.55) {
  if (n < 5 || n > 10) {
    throw new Error("El número de nodos debe estar entre 5 y 10.");
  }

  const nodes = getClientNodeLabels(n);
  const edgesSet = new Set();
  const edgesList = [];

  // 1. Crear un Ciclo Hamiltoniano base inicial barajado para garantizar conexidad
  const shuffled = [...nodes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i < n; i++) {
    const u = shuffled[i];
    const v = shuffled[(i + 1) % n];
    const key = [u, v].sort().join("-");
    const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
    edgesSet.add(key);
    const [source, target] = key.split("-");
    edgesList.push({ source, target, weight });
  }

  // 2. Agregar aristas adicionales según extraEdgeProb
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const u = nodes[i];
      const v = nodes[j];
      const key = [u, v].sort().join("-");
      if (!edgesSet.has(key)) {
        if (Math.random() < extraEdgeProb) {
          const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
          edgesSet.add(key);
          const [source, target] = key.split("-");
          edgesList.push({ source, target, weight });
        }
      }
    }
  }

  const matrix = buildClientAdjacencyMatrix(nodes, edgesList);

  return {
    nodes,
    edges: edgesList,
    matrix,
    is_connected: true,
    has_hamiltonian_cycle: true
  };
}

// Generador de permutaciones en JavaScript
function* permute(arr) {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permute(rest)) {
      yield [arr[i], ...p];
    }
  }
}

export function validateClientGraph(nodes, edges) {
  const n = nodes.length;
  if (n < 5 || n > 10) {
    return {
      valid: false,
      error: "El número de nodos debe estar entre 5 y 10.",
      has_hamiltonian_cycle: false,
      suggested_edges: []
    };
  }

  const existingEdges = new Set();
  edges.forEach(e => {
    existingEdges.add([e.source, e.target].sort().join("-"));
  });

  const startNode = nodes[0];
  const otherNodes = nodes.slice(1);

  let validCyclesFound = 0;
  let bestMissingCount = n + 1;
  let bestSuggestedEdges = [];

  for (const perm of permute(otherNodes)) {
    const route = [startNode, ...perm, startNode];
    const missingInThisRoute = [];

    for (let i = 0; i < n; i++) {
      const key = [route[i], route[i + 1]].sort().join("-");
      if (!existingEdges.has(key)) {
        missingInThisRoute.push(key);
      }
    }

    if (missingInThisRoute.length === 0) {
      validCyclesFound++;
      break;
    } else {
      if (missingInThisRoute.length < bestMissingCount) {
        bestMissingCount = missingInThisRoute.length;
        bestSuggestedEdges = missingInThisRoute;
      }
    }
  }

  const matrix = buildClientAdjacencyMatrix(nodes, edges);

  if (validCyclesFound > 0) {
    return {
      valid: true,
      has_hamiltonian_cycle: true,
      message: "El mapa de ciudades contiene al menos un Ciclo Hamiltoniano válido.",
      suggested_edges: [],
      matrix
    };
  } else {
    const formattedSuggestions = bestSuggestedEdges.map(key => {
      const [u, v] = key.split("-");
      return { source: u, target: v, suggested_weight: 10 };
    });

    return {
      valid: false,
      has_hamiltonian_cycle: false,
      message: `Faltan las siguientes aristas para completar un ciclo válido: ${formattedSuggestions.map(s => `(${s.source}-${s.target})`).join(", ")}`,
      missing_edges_count: formattedSuggestions.length,
      suggested_edges: formattedSuggestions,
      matrix
    };
  }
}

export function solveClientTSP(nodes, edges, maxStepsToInclude = 600) {
  const n = nodes.length;
  if (n < 5 || n > 10) {
    throw new Error("El número de nodos debe estar estrictamente entre 5 y 10.");
  }

  const edgeWeights = new Map();
  edges.forEach(e => {
    edgeWeights.set([e.source, e.target].sort().join("-"), Number(e.weight));
  });

  const startNode = nodes[0];
  const otherNodes = nodes.slice(1);

  let totalPermutations = 0;
  const validCycles = [];
  let optimalCycle = null;
  let minCost = Infinity;

  const stepsSample = [];
  let permIndex = 0;

  for (const perm of permute(otherNodes)) {
    permIndex++;
    totalPermutations++;
    const route = [startNode, ...perm, startNode];

    let isValid = true;
    let accumulatedCost = 0;
    const edgeBreakdown = [];
    const missingEdges = [];

    for (let i = 0; i < n; i++) {
      const u = route[i];
      const v = route[i + 1];
      const key = [u, v].sort().join("-");

      if (edgeWeights.has(key)) {
        const cost = edgeWeights.get(key);
        accumulatedCost += cost;
        edgeBreakdown.push({
          from: u,
          to: v,
          cost,
          exists: true,
          cumulative: accumulatedCost
        });
      } else {
        isValid = false;
        missingEdges.push(`(${u}-${v})`);
        edgeBreakdown.push({
          from: u,
          to: v,
          cost: null,
          exists: false,
          cumulative: null
        });
      }
    }

    const stepData = {
      index: permIndex,
      route,
      is_valid: isValid,
      total_cost: isValid ? accumulatedCost : null,
      edge_breakdown: edgeBreakdown,
      missing_edges: missingEdges,
      formatted_route: route.join(" → ")
    };

    if (isValid) {
      const cycleInfo = {
        index: permIndex,
        route,
        formatted_route: route.join(" → "),
        total_cost: accumulatedCost,
        edge_breakdown: edgeBreakdown
      };
      validCycles.push(cycleInfo);

      if (accumulatedCost < minCost) {
        minCost = accumulatedCost;
        optimalCycle = cycleInfo;
      }
    }

    if (permIndex <= maxStepsToInclude) {
      stepsSample.push(stepData);
    }
  }

  validCycles.sort((a, b) => a.total_cost - b.total_cost);

  return {
    total_permutations: totalPermutations,
    valid_cycles_count: validCycles.length,
    optimal_cycle: optimalCycle,
    optimal_cost: optimalCycle ? minCost : null,
    valid_cycles: validCycles,
    steps_count: stepsSample.length,
    steps: stepsSample,
    has_more_steps: totalPermutations > maxStepsToInclude
  };
}
