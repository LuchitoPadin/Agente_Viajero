# 🗺️ Problema del Agente Viajero (TSP) - Algoritmo de Fuerza Bruta

Aplicación web interactiva desarrollada para resolver y visualizar el **Problema del Agente Viajero (Traveling Salesperson Problem - TSP)** utilizando estrictamente el algoritmo de **Fuerza Bruta**.

---

## 🚀 Características Principales

1. **Restricción Estricta de Nodos**: Soporta $n \in [5, 10]$ nodos etiquetados alfabéticamente (`A`, `B`, `C`, etc.).
2. **Grafo No Dirigido y Ponderado**: Conexiones bidireccionales con costos/pesos numéricos visibles en las aristas y en la **Matriz de Costos (Adyacencia)**.
3. **Modos de Generación**:
   - **🎲 Aleatorio**: Genera grafos conexos con ciclo hamiltoniano base garantizado y densidad de aristas configurable.
   - **✍️ Manual**: Formulario interactivo para agregar y eliminar aristas y pesos personalizados.
4. **Validación Matemática**:
   - Comprueba si el grafo admite al menos un Ciclo Hamiltoniano.
   - Si no lo admite, muestra el mensaje de error estructurado:
     > *"Faltan las siguientes aristas para completar un ciclo válido: [...]"*
     e incluye un botón para añadirlas automáticamente al grafo con un solo clic.
5. **Algoritmo de Fuerza Bruta Estricto**:
   - Evalúa exhaustivamente todas las permutaciones posibles partiendo de un nodo fijo: $(n-1)!$ rutas.
   - Desglose de costo individual por arista y suma acumulada.
6. **Ejecución Interactiva (Paso a Paso)**:
   - Controles: `⏮ Inicio`, `◀ Anterior`, `▶ Siguiente Paso`, `⏯ Reproducir / Pausar` y `⏭ Fin`.
   - Control de velocidad de reproducción (100 ms a 1500 ms).
   - Filtro entre *"Todas las permutaciones evaluadas"* y *"Solo ciclos válidos"*.
   - Visualización dinámica en el canvas mediante **Vis.js Network**.
7. **Módulo de Resultados**:
   - Resumen estadístico: total de permutaciones evaluadas, ciclos válidos y costo óptimo mínimo.
   - Resaltado visual en el grafo del **Ciclo Óptimo** (con estilo verde esmeralda luminoso).
   - Tabla completa con todos los ciclos hamiltonianos encontrados ordenados por costo. Al hacer clic en cualquier ciclo de la tabla, se dibuja y resalta de inmediato en el grafo.

---

## 🛠️ Estructura del Proyecto

```
Agente_Viajero/
├── backend/
│   ├── app.py                # Servidor Flask y API REST
│   ├── graph_logic.py        # Generación aleatoria, validación hamiltoniana y sugerencias
│   └── tsp_solver.py         # Algoritmo de fuerza bruta exhaustivo con desglose
├── frontend/
│   ├── index.html            # Interfaz interactiva de usuario
│   ├── css/
│   │   └── styles.css        # Diseño moderno, Dark Mode y Glassmorphism
│   └── js/
│       ├── api.js            # Cliente Fetch para la API REST
│       ├── graph_vis.js      # Renderizador dinámico con Vis.js Network
│       └── app.js            # Controlador de estado y reproducción paso a paso
├── tests/
│   └── test_tsp.py           # Suite de pruebas automatizadas
├── requisitos_del_proyecto_tsp.txt
├── run.py                    # Script de inicio rápido del servidor
└── README.md
```

---

## 💻 Cómo Ejecutar el Proyecto

1. Asegúrate de tener Python instalado (versión 3.8 o superior).
2. Ejecuta en la terminal:
   ```bash
   python run.py
   ```
3. Abre tu navegador web en:
   ```
   http://localhost:5000
   ```
   o bien:
   ```
   http://127.0.0.1:5000
   ```

