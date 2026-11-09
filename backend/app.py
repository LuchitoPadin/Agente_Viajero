import os
import sys
from flask import Flask, request, jsonify, send_from_directory
# Añadir carpeta backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.graph_logic import (
        get_node_labels, 
        generate_random_graph, 
        build_adjacency_matrix, 
        find_hamiltonian_cycle_validation
    )
    from backend.tsp_solver import solve_tsp_brute_force, get_permutation_step_page
except ImportError:
    from graph_logic import (
        get_node_labels, 
        generate_random_graph, 
        build_adjacency_matrix, 
        find_hamiltonian_cycle_validation
    )
    from tsp_solver import solve_tsp_brute_force, get_permutation_step_page


FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/")
def index():
    """Servir index.html del frontend."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def static_proxy(path):
    """Servir archivos estáticos (css, js, etc.)."""
    return send_from_directory(FRONTEND_DIR, path)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Verificar estado del backend."""
    return jsonify({
        "status": "online",
        "service": "TSP Brute Force API",
        "version": "1.0.0"
    })


@app.route("/api/graph/generate", methods=["POST"])
def generate_graph_endpoint():
    """
    Genera un grafo aleatorio no dirigido conexo con n nodos garantizando ciclo hamiltoniano.
    """
    try:
        data = request.get_json() or {}
        n = int(data.get("n", 5))

        if not (5 <= n <= 10):
            return jsonify({
                "success": False,
                "error": "El número de nodos (n) debe estar estrictamente en el rango [5, 10]."
            }), 400

        min_w = max(5,  min(50,  int(data.get("min_weight", 10))))
        max_w = max(10, min(150, int(data.get("max_weight", 150))))
        extra_prob = max(0.2, min(0.9, float(data.get("extra_prob", 0.55))))

        graph_data = generate_random_graph(n, min_weight=min_w, max_weight=max_w, extra_edge_prob=extra_prob)

        return jsonify({
            "success": True,
            "data": graph_data
        })
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Error interno: {str(e)}"}), 500


@app.route("/api/graph/validate", methods=["POST"])
def validate_graph_endpoint():
    """
    Valida si el grafo manual o actual admite al menos un Ciclo Hamiltoniano.
    Devuelve error estructurado y sugerencias de aristas si no lo admite.
    """
    try:
        data = request.get_json() or {}
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])

        n = len(nodes)
        if not (5 <= n <= 10):
            return jsonify({
                "success": False,
                "error": "El número de nodos (n) debe estar estrictamente en el rango [5, 10]."
            }), 400

        validation = find_hamiltonian_cycle_validation(nodes, edges)
        matrix = build_adjacency_matrix(nodes, edges)

        return jsonify({
            "success": True,
            "validation": validation,
            "matrix": matrix
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al validar grafo: {str(e)}"}), 500


@app.route("/api/tsp/solve", methods=["POST"])
def solve_tsp_endpoint():
    """
    Resuelve el TSP usando Fuerza Bruta estricta.
    Retorna permutaciones, ciclos válidos, ciclo óptimo y pasos para la UI interactiva.
    """
    try:
        data = request.get_json() or {}
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])
        max_steps = int(data.get("max_steps", 600))

        n = len(nodes)
        if not (5 <= n <= 10):
            return jsonify({
                "success": False,
                "error": "El número de nodos debe estar entre 5 y 10."
            }), 400

        # Primero validar si tiene ciclo
        validation = find_hamiltonian_cycle_validation(nodes, edges)
        if not validation["has_hamiltonian_cycle"]:
            return jsonify({
                "success": False,
                "error": "El grafo actual no contiene ningún Ciclo Hamiltoniano.",
                "validation": validation
            }), 422

        results = solve_tsp_brute_force(nodes, edges, max_steps_to_include=max_steps)

        return jsonify({
            "success": True,
            "results": results
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Error al ejecutar TSP: {str(e)}"}), 500


@app.route("/api/tsp/steps", methods=["POST"])
def get_steps_endpoint():
    """
    Paginación de pasos para grafos con muchas permutaciones (n >= 8).
    """
    try:
        data = request.get_json() or {}
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])
        page = int(data.get("page", 1))
        page_size = int(data.get("page_size", 50))

        page_result = get_permutation_step_page(nodes, edges, page=page, page_size=page_size)
        return jsonify({
            "success": True,
            "data": page_result
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)
