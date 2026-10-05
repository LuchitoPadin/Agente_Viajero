/**
 * Módulo de Comunicación con la API REST de Python
 */

const API_BASE = (typeof window !== "undefined" && window.location.protocol === "file:")
  ? "http://127.0.0.1:5000"
  : "";



export const Api = {
  /**
   * Generar grafo aleatorio
   */
  async generateGraph(n, minWeight = 5, maxWeight = 50, extraProb = 0.55) {
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
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error al generar el grafo.");
    }
    return data.data;
  },

  /**
   * Validar si un grafo admite Ciclo Hamiltoniano
   */
  async validateGraph(nodes, edges) {
    const response = await fetch(`${API_BASE}/api/graph/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Error al validar el grafo.");
    }
    return data;
  },

  /**
   * Ejecutar resolución por Fuerza Bruta
   */
  async solveTSP(nodes, edges, maxSteps = 1000) {
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
    if (!response.ok) {
      // Si el error contiene la validación estructurada de aristas faltantes
      const errorObj = new Error(data.error || "Error al resolver el TSP.");
      errorObj.validation = data.validation;
      throw errorObj;
    }
    return data.results;
  },

  /**
   * Obtener página de pasos
   */
  async getStepsPage(nodes, edges, page = 1, pageSize = 50) {
    const response = await fetch(`${API_BASE}/api/tsp/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges, page, page_size: pageSize })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error al obtener pasos adicionales.");
    }
    return data.data;
  }
};
