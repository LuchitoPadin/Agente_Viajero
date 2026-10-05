/**
 * Renderizador de Grafos con Vis.js Network
 * Adaptado a la temática del Problema del Agente Viajero (Ciudades, Rutas y Logística)
 */

export class GraphVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.network = null;
    this.nodesDataSet = null;
    this.edgesDataSet = null;
    this.unit = "km"; // 'km' | '$' | 'min'
    this.currentEdges = [];
    this.currentNodes = [];
  }

  setUnit(unit) {
    this.unit = unit;
  }

  formatWeight(weight) {
    if (this.unit === "$") return `$${weight}`;
    return `${weight} ${this.unit}`;
  }

  /**
   * Inicializa la red de ciudades y carreteras
   */
  init(nodesList, edgesList, cityNamesMap = {}) {
    this.currentNodes = [...nodesList];
    this.currentEdges = [...edgesList];

    // Preparar nodos de ciudades para Vis.js
    const visNodes = nodesList.map((nodeId, idx) => {
      const cityName = cityNamesMap[nodeId] || `Ciudad ${nodeId}`;
      const isOrigin = idx === 0;

      return {
        id: nodeId,
        label: isOrigin ? `🏛️ ${cityName}\n(Sede Origen)` : `🏢 ${cityName}`,
        shape: "box",
        margin: 10,
        font: {
          color: "#ffffff",
          size: 14,
          face: "Inter, sans-serif",
          multi: true,
          bold: { mod: "bold" }
        },
        color: {
          background: isOrigin ? "#0284c7" : "#1e293b",
          border: isOrigin ? "#38bdf8" : "#475569",
          highlight: {
            background: "#0369a1",
            border: "#7dd3fc"
          }
        },
        borderWidth: isOrigin ? 2.5 : 1.5,
        shadow: {
          enabled: true,
          color: isOrigin ? "rgba(56, 189, 248, 0.45)" : "rgba(0, 0, 0, 0.4)",
          size: 10,
          x: 0,
          y: 2
        }
      };
    });

    // Preparar aristas / conexiones viales (No dirigidas)
    const visEdges = edgesList.map((edge) => {
      const edgeId = `${edge.source}-${edge.target}`;
      return {
        id: edgeId,
        from: edge.source,
        to: edge.target,
        label: this.formatWeight(edge.weight),
        font: {
          color: "#94a3b8",
          size: 13,
          background: "rgba(10, 14, 23, 0.9)",
          strokeWidth: 0,
          align: "middle"
        },
        color: {
          color: "rgba(148, 163, 184, 0.35)",
          highlight: "#38bdf8",
          hover: "#0284c7"
        },
        width: 2,
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.15
        }
      };
    });

    this.nodesDataSet = new vis.DataSet(visNodes);
    this.edgesDataSet = new vis.DataSet(visEdges);

    const data = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet
    };

    const options = {
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -80,
          centralGravity: 0.015,
          springLength: 130,
          springConstant: 0.08,
          damping: 0.45
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 25
        }
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
        keyboard: false
      }
    };

    if (this.network) {
      this.network.destroy();
    }

    this.network = new vis.Network(this.container, data, options);

    this.network.once("stabilizationIterationsDone", () => {
      this.network.setOptions({ physics: { enabled: false } });
    });
  }

  /**
   * Resalta la ruta recorrida por el agente viajero
   */
  highlightRoute(routeNodes, isOptimal = false, isValid = true) {
    if (!this.edgesDataSet || !this.nodesDataSet) return;

    const routeEdgeKeys = new Set();
    for (let i = 0; i < routeNodes.length - 1; i++) {
      const u = routeNodes[i];
      const v = routeNodes[i + 1];
      routeEdgeKeys.add([u, v].sort().join("-"));
    }

    let activeEdgeColor = "#38bdf8"; // Cyan viajero
    let activeEdgeWidth = 4;
    let nodeBorderColor = "#38bdf8";

    if (isOptimal) {
      activeEdgeColor = "#10b981"; // Esmeralda ganador
      activeEdgeWidth = 5.5;
      nodeBorderColor = "#34d399";
    } else if (!isValid) {
      activeEdgeColor = "#f43f5e"; // Ruta rota
      activeEdgeWidth = 3;
      nodeBorderColor = "#fb7185";
    }

    const updatedEdges = [];
    this.edgesDataSet.forEach(edge => {
      const key = [edge.from, edge.to].sort().join("-");
      if (routeEdgeKeys.has(key)) {
        updatedEdges.push({
          id: edge.id,
          color: { color: activeEdgeColor },
          width: activeEdgeWidth,
          font: {
            color: isOptimal ? "#6ee7b7" : "#ffffff",
            size: 14,
            background: "rgba(10, 14, 23, 0.95)"
          }
        });
      } else {
        updatedEdges.push({
          id: edge.id,
          color: { color: "rgba(255, 255, 255, 0.07)" },
          width: 1.5,
          font: {
            color: "rgba(148, 163, 184, 0.25)",
            size: 12,
            background: "rgba(10, 14, 23, 0.4)"
          }
        });
      }
    });

    const updatedNodes = [];
    this.nodesDataSet.forEach(node => {
      const isInRoute = routeNodes.includes(node.id);
      if (isInRoute) {
        updatedNodes.push({
          id: node.id,
          borderWidth: 3,
          shadow: {
            enabled: true,
            color: isOptimal ? "rgba(16, 185, 129, 0.65)" : "rgba(56, 189, 248, 0.5)",
            size: 15
          }
        });
      } else {
        updatedNodes.push({
          id: node.id,
          borderWidth: 1,
          shadow: { enabled: false }
        });
      }
    });

    this.edgesDataSet.update(updatedEdges);
    this.nodesDataSet.update(updatedNodes);
  }

  /**
   * Restablece el grafo a su estado neutro
   */
  resetHighlight() {
    if (!this.edgesDataSet || !this.nodesDataSet) return;

    const resetEdges = [];
    this.edgesDataSet.forEach(edge => {
      resetEdges.push({
        id: edge.id,
        color: {
          color: "rgba(148, 163, 184, 0.35)",
          highlight: "#38bdf8",
          hover: "#0284c7"
        },
        width: 2,
        font: {
          color: "#94a3b8",
          size: 13,
          background: "rgba(10, 14, 23, 0.9)"
        }
      });
    });

    const resetNodes = [];
    this.nodesDataSet.forEach((node, idx) => {
      const isOrigin = idx === 0;
      resetNodes.push({
        id: node.id,
        borderWidth: isOrigin ? 2.5 : 1.5,
        shadow: {
          enabled: true,
          color: isOrigin ? "rgba(56, 189, 248, 0.4)" : "rgba(0, 0, 0, 0.4)",
          size: 8
        }
      });
    });

    this.edgesDataSet.update(resetEdges);
    this.nodesDataSet.update(resetNodes);
  }
}
