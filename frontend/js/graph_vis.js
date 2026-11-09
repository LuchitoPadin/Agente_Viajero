/**
 * Renderizador de Grafos con Vis.js Network
 * Adaptado a la estética moderna de TSP Flow (estilo Matetb / HasseFlow)
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
    this.physicsEnabled = false;
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
        margin: 12,
        font: {
          color: isOrigin ? "#000000" : "#ffffff",
          size: 14,
          face: "Inter, sans-serif",
          multi: true,
          bold: { mod: "bold" }
        },
        color: {
          background: isOrigin ? "#ffffff" : "#171717",
          border: isOrigin ? "#ffffff" : "#2a2a2a",
          highlight: {
            background: isOrigin ? "#f4f4f5" : "#262626",
            border: isOrigin ? "#ffffff" : "#38bdf8"
          }
        },
        borderWidth: isOrigin ? 2 : 1.5,
        shadow: {
          enabled: true,
          color: isOrigin ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.7)",
          size: isOrigin ? 16 : 8,
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
          color: "#a1a1aa",
          size: 13,
          background: "rgba(9, 9, 11, 0.95)",
          strokeWidth: 0,
          align: "middle"
        },
        color: {
          color: "rgba(255, 255, 255, 0.18)",
          highlight: "#38bdf8",
          hover: "#7dd3fc"
        },
        width: 1.5,
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
          gravitationalConstant: -75,
          centralGravity: 0.012,
          springLength: 140,
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
        navigationButtons: false,
        keyboard: false
      }
    };

    if (this.network) {
      this.network.destroy();
    }

    this.network = new vis.Network(this.container, data, options);

    this.network.once("stabilizationIterationsDone", () => {
      this.network.setOptions({ physics: { enabled: false } });
      this.physicsEnabled = false;
      this.fit();
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
    let activeEdgeWidth = 3.5;
    let nodeBorderColor = "#38bdf8";

    if (isOptimal) {
      activeEdgeColor = "#10b981"; // Esmeralda ganador
      activeEdgeWidth = 5;
      nodeBorderColor = "#10b981";
    } else if (!isValid) {
      activeEdgeColor = "#f43f5e"; // Ruta rota
      activeEdgeWidth = 3;
      nodeBorderColor = "#f43f5e";
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
            color: isOptimal ? "#6ee7b7" : (isValid ? "#38bdf8" : "#fca5a5"),
            size: 14,
            background: "rgba(9, 9, 11, 0.95)"
          }
        });
      } else {
        updatedEdges.push({
          id: edge.id,
          color: { color: "rgba(255, 255, 255, 0.05)" },
          width: 1,
          font: {
            color: "rgba(161, 161, 170, 0.2)",
            size: 11,
            background: "rgba(9, 9, 11, 0.5)"
          }
        });
      }
    });

    const updatedNodes = [];
    this.nodesDataSet.forEach((node, idx) => {
      const isInRoute = routeNodes.includes(node.id);
      const isOrigin = idx === 0;

      if (isInRoute) {
        updatedNodes.push({
          id: node.id,
          borderWidth: isOptimal ? 3 : 2,
          color: {
            border: isOptimal ? "#10b981" : (isValid ? "#38bdf8" : "#f43f5e")
          },
          shadow: {
            enabled: true,
            color: isOptimal ? "rgba(16, 185, 129, 0.7)" : (isValid ? "rgba(56, 189, 248, 0.6)" : "rgba(244, 63, 94, 0.5)"),
            size: isOptimal ? 22 : 14
          }
        });
      } else {
        updatedNodes.push({
          id: node.id,
          borderWidth: 1,
          color: {
            border: "#2a2a2a"
          },
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
          color: "rgba(255, 255, 255, 0.18)",
          highlight: "#38bdf8",
          hover: "#7dd3fc"
        },
        width: 1.5,
        font: {
          color: "#a1a1aa",
          size: 13,
          background: "rgba(9, 9, 11, 0.95)"
        }
      });
    });

    const resetNodes = [];
    this.nodesDataSet.forEach((node, idx) => {
      const isOrigin = idx === 0;
      resetNodes.push({
        id: node.id,
        borderWidth: isOrigin ? 2 : 1.5,
        color: {
          border: isOrigin ? "#ffffff" : "#2a2a2a"
        },
        shadow: {
          enabled: true,
          color: isOrigin ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.7)",
          size: isOrigin ? 16 : 8
        }
      });
    });

    this.edgesDataSet.update(resetEdges);
    this.nodesDataSet.update(resetNodes);
  }

  fit() {
    if (this.network) {
      this.network.fit({
        animation: { duration: 400, easingFunction: "easeInOutQuad" }
      });
    }
  }

  zoomIn() {
    if (this.network) {
      const scale = this.network.getScale();
      this.network.moveTo({ scale: scale * 1.25, animation: { duration: 250 } });
    }
  }

  zoomOut() {
    if (this.network) {
      const scale = this.network.getScale();
      this.network.moveTo({ scale: scale * 0.8, animation: { duration: 250 } });
    }
  }

  togglePhysics() {
    if (this.network) {
      this.physicsEnabled = !this.physicsEnabled;
      this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
      return this.physicsEnabled;
    }
    return false;
  }
}
