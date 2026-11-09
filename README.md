# 🗺️ Problema del Agente Viajero (TSP Flow) - Algoritmo de Fuerza Bruta

Aplicación web interactiva desarrollada para resolver, simular y visualizar el **Problema del Agente Viajero (Traveling Salesperson Problem - TSP)** utilizando estrictamente el algoritmo de **Fuerza Bruta**.

La interfaz gráfica cuenta con un diseño oscuro ultra-moderno inspirado en plataformas académicas como **[matetb.netlify.app](https://matetb.netlify.app/)**, integrando conceptos formales de la **Lectura 7 (Matemática Computacional)** y la presentación del **Problema del Agente Viajero (Grupo N.º 7)**.

---

## 👥 Equipo de Desarrollo (Grupo N.º 7)

* **Bances Chinchay, Roller Neisser**
* **Campana Rojas, Alejandro Matias**
* **Ruiz Bueno, Lucia Victoria**
* **Hervias Muedas, Luis Augusto**

*Departamento de Ciencias – Matemática Computacional*

---

## 🚀 Características Principales

1. **Pantalla de Bienvenida (Hero Section)**:
   - Explicación intuitiva y académica de qué trata el TSP y cómo funciona el método de Fuerza Bruta.
   - Isla resumen con métricas esenciales: $(n-1)!$ permutaciones con origen fijo, $\frac{(n-1)!}{2}$ ciclos no dirigidos, complejidad factorial $O(n!)$ y 100% de garantía de óptimo global.
   - Acceso directo al simulador interactivo y carga rápida de ejemplo de 5 ciudades.

2. **Fundamentos Teóricos e Instrucciones**:
   - Definición formal de vértice, arista no dirigida, peso (distancia, costo o tiempo) y ciclo hamiltoniano.
   - **Teorema de Dirac**: Condición suficiente para grafos hamiltonianos ($\deg(v) \ge \frac{n}{2}$).
   - **Procedimiento de Fuerza Bruta en 6 Fases**:
     1. *Elegir Inicio (Sede A)* $\to$ 2. *Generar Rutas* $\to$ 3. *Verificar Ciclo* $\to$ 4. *Calcular Costo* $\to$ 5. *Comparar Récord* $\to$ 6. *Ciclo Óptimo*.
   - **Tabla de Explosión Combinatoria**: Comparativa de crecimiento factorial para $n \in [5, 10]$ con tiempos de cómputo estimados.

3. **Restricción Estricta de Nodos**:
   - Rango acotado a $n \in [5, 10]$ nodos etiquetados alfabéticamente (`A`, `B`, `C`, etc.) con la Ciudad A como sede de partida fija.

4. **Modos de Generación del Grafo**:
   - **🎲 Aleatorio Conexo**: Genera grafos ponderados con ciclo hamiltoniano garantizado y densidad de aristas configurable.
   - **✍️ Modo Manual**: Formulario interactivo para agregar/eliminar carreteras y pesos personalizados.

5. **Validación Matemática**:
   - Detección de ciclos hamiltonianos. Si el grafo no admite ninguno, entrega un mensaje estructurado indicando exactamente qué aristas faltan con un botón para añadirlas automáticamente en 1 clic.

6. **Simulador y Reproducción Paso a Paso**:
   - Controles multimedia: `⏮ Inicio`, `◀ Anterior`, `▶ Reproducir / Pausar`, `Sig ▶` y `⏭ Fin`.
   - Control de velocidad (100 ms a 1500 ms) y filtro (*"Todas las permutaciones"* vs *"Solo ciclos válidos"*).
   - Barra de herramientas sobre el mapa: centrado automático, zoom in/out y activación de física.
   - Tokens visuales de ruta, desglose aritmético por arista y estado de validez.

7. **Matriz de Costos y Resultados**:
   - Matriz de adyacencia simétrica interactiva con valores ponderados en km, \$ o min.
   - Tabla completa con todos los ciclos ordenados por menor costo. Al hacer clic en cualquier ciclo, se proyecta y resalta de inmediato en el mapa de ciudades.
   - Resaltado especial en verde esmeralda luminoso para el **Ciclo Óptimo Ganador**.

8. **Modelo Matemático Aplicado (PLE)**:
   - Formulación de Programación Lineal Entera con fórmulas en KaTeX: función objetivo de costo mínimo y restricciones de grado y eliminación de subtours (Miller-Tucker-Zemlin).
   - Aplicaciones en el mundo real: logística y reparto, taladrado de placas de circuitos impresos (PCB), semaforización urbana y robótica.

---

## 🛠️ Estructura del Proyecto

```
Agente_Viajero/
├── backend/
│   ├── app.py                # Servidor Flask y API REST con endpoints /generate, /validate, /solve
│   ├── graph_logic.py        # Generación aleatoria conexa, validación hamiltoniana y sugerencias
│   └── tsp_solver.py         # Algoritmo de fuerza bruta exhaustivo con desglose de aristas
├── frontend/
│   ├── index.html            # Interfaz de usuario completa estilo HasseFlow / matetb
│   ├── css/
│   │   └── styles.css        # Paleta oscura, glassmorphism, reglas de contraste y efectos neón
│   └── js/
│       ├── api.js            # Cliente HTTP Fetch para la API REST
│       ├── graph_vis.js      # Renderizador dinámico con Vis.js Network y controles de cámara
│       └── app.js            # Controlador reactivo de estado y reproducción paso a paso
├── tests/
│   └── test_tsp.py           # Suite de pruebas unitarias automatizadas
├── Lectura 7_Agente viajero.pdf
├── Problema del Agente Viajero.pdf
├── requisitos_del_proyecto_tsp.txt
├── requirements.txt
├── run.py                    # Script de arranque del servidor local
└── README.md
```

---

## 💻 Cómo Ejecutar el Proyecto

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Iniciar el servidor
```bash
python run.py
```

### 3. Abrir en el navegador
Ingresa a cualquiera de las siguientes direcciones:
* **http://localhost:5000**
* **http://127.0.0.1:5000**
