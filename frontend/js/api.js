/**
 * Módulo de Comunicación con API Híbrida:
 * 1. Intenta conectarse al Backend Flask (API REST en Python).
 * 2. Si no hay backend Python disponible (por ejemplo en GitHub Pages o Netlify),
 *    utiliza automáticamente el motor en JavaScript (client_engine.js) sin interrupciones.
 */

import {
  generateClientRandomGraph,
  validateClientGraph,
  solveClientTSP
} from "./client_engine.js";

const API_BASE = (typeof window !== "undefined" && window.location.protocol === "file:")
  ? "http://127.0.0.1:5000"
  : "";

// Detectar si estamos en un hosting puramente estático como GitHub Pages
const isStaticHost = typeof window !== "undefined" && 
  (window.location.hostname.includes("github.io") || window.location.hostname.includes("netlify.app"));

export const Api = {
  /**
   * Generar grafo aleatorio
   */
  async generateGraph(n, minWeight = 5, maxWeight = 50, extraProb = 0.55) {
    if (!isStaticHost) {
      try {
        const response = await fetch(`${API_BASE}/api/graph/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            n: Number(n),
            min_weight: Number(minWeight),
            max_weight: Number(maxWeight),
            extra_prob: Number(extraProb)
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) return data.data;
        }
      } catch (e) {
        console.warn("Backend no disponible. Usando motor cliente en JavaScript.", e);
      }
    }

    // Modo Fallback Cliente (GitHub Pages / Standalone)
    return generateClientRandomGraph(n, minWeight, maxWeight, extraProb);
  },

  /**
   * Validar si un grafo admite Ciclo Hamiltoniano
   */
  async validateGraph(nodes, edges) {
    if (!isStaticHost) {
      try {
        const response = await fetch(`${API_BASE}/api/graph/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges })
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn("Backend no disponible para validación. Usando motor cliente.", e);
      }
    }

    // Modo Fallback Cliente
    const val = validateClientGraph(nodes, edges);
    return {
      success: true,
      validation: val,
      matrix: val.matrix
    };
  },

  /**
   * Ejecutar resolución por Fuerza Bruta
   */
  async solveTSP(nodes, edges, maxSteps = 600) {
    if (!isStaticHost) {
      try {
        const response = await fetch(`${API_BASE}/api/tsp/solve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodes,
            edges,
            max_steps: Number(maxSteps)
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          return data.results;
        }
        if (response.status === 422) {
          const err = new Error(data.error || "El grafo no contiene ciclo hamiltoniano.");
          err.validation = data.validation;
          throw err;
        }
      } catch (e) {
        if (e.validation) throw e;
        console.warn("Backend no disponible para TSP solve. Usando motor cliente.", e);
      }
    }

    // Modo Fallback Cliente
    const validation = validateClientGraph(nodes, edges);
    if (!validation.has_hamiltonian_cycle) {
      const err = new Error("El grafo actual no contiene ningún Ciclo Hamiltoniano.");
      err.validation = validation;
      throw err;
    }

    return solveClientTSP(nodes, edges, maxSteps);
  },

  /**
   * Obtener página de pasos
   */
  async getStepsPage(nodes, edges, page = 1, pageSize = 50) {
    if (!isStaticHost) {
      try {
        const response = await fetch(`${API_BASE}/api/tsp/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges, page, page_size: pageSize })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) return data.data;
        }
      } catch (e) {
        console.warn("Backend no disponible para paginación de pasos.", e);
      }
    }

    return {
      page,
      page_size: pageSize,
      steps: []
    };
  }
};
