import itertools
import random
from typing import Dict, List, Any, Tuple, Optional

# Letras estándar para los nodos (hasta 10 nodos según regla n ∈ [5, 10])
NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]


def get_node_labels(n: int) -> List[str]:
    """Retorna las etiquetas para n nodos."""
    if not (5 <= n <= 10):
        raise ValueError("El número de nodos (n) debe estar estrictamente en el rango [5, 10].")
    return NODE_LABELS[:n]


def build_adjacency_matrix(nodes: List[str], edges: List[Dict[str, Any]]) -> Dict[str, Dict[str, Optional[int]]]:
    """
    Construye la matriz de adyacencia (matriz de costos).
    Como el grafo es NO DIRIGIDO, la matriz es simétrica.
    """
    matrix: Dict[str, Dict[str, Optional[int]]] = {u: {v: None for v in nodes} for u in nodes}
    for u in nodes:
        matrix[u][u] = 0

    for edge in edges:
        u = edge["source"]
        v = edge["target"]
        w = int(edge["weight"])
        if u in matrix and v in matrix:
            matrix[u][v] = w
            matrix[v][u] = w

    return matrix


def generate_random_graph(n: int, min_weight: int = 5, max_weight: int = 60, extra_edge_prob: float = 0.55) -> Dict[str, Any]:
    """
    Genera un grafo aleatorio conexo y no dirigido con n nodos.
    Garantiza la existencia de al menos un Ciclo Hamiltoniano base,
    más aristas adicionales para tener variedad de rutas.
    """
    if not (5 <= n <= 10):
        raise ValueError("El número de nodos debe estar entre 5 y 10.")

    nodes = get_node_labels(n)
    edges_set = set()
    edges_list: List[Dict[str, Any]] = []

    # 1. Crear un Ciclo Hamiltoniano inicial para garantizar conexidad y solución válida
    shuffled_nodes = nodes.copy()
    random.shuffle(shuffled_nodes)

    for i in range(n):
        u = shuffled_nodes[i]
        v = shuffled_nodes[(i + 1) % n]
        edge_key = tuple(sorted([u, v]))
        weight = random.randint(min_weight, max_weight)
        edges_set.add(edge_key)
        edges_list.append({"source": edge_key[0], "target": edge_key[1], "weight": weight})

    # 2. Agregar aristas adicionales con probabilidad extra_edge_prob
    all_possible_pairs = list(itertools.combinations(nodes, 2))
    for u, v in all_possible_pairs:
        edge_key = tuple(sorted([u, v]))
        if edge_key not in edges_set:
            if random.random() < extra_edge_prob:
                weight = random.randint(min_weight, max_weight)
                edges_set.add(edge_key)
                edges_list.append({"source": edge_key[0], "target": edge_key[1], "weight": weight})

    matrix = build_adjacency_matrix(nodes, edges_list)

    return {
        "nodes": nodes,
        "edges": edges_list,
        "matrix": matrix,
        "is_connected": True,
        "has_hamiltonian_cycle": True
    }


def find_hamiltonian_cycle_validation(nodes: List[str], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Verifica si el grafo actual permite al menos un Ciclo Hamiltoniano.
    Si no lo permite, calcula las aristas mínimas sugeridas para completarlo.
    """
    n = len(nodes)
    if not (5 <= n <= 10):
        return {
            "valid": False,
            "error": "El número de nodos debe estar entre 5 y 10.",
            "has_hamiltonian_cycle": False,
            "suggested_edges": []
        }

    # Conjunto de aristas existentes (pares ordenados para no dirigido)
    existing_edges = set()
    for e in edges:
        u, v = e["source"], e["target"]
        existing_edges.add(tuple(sorted([u, v])))

    # Para buscar si existe ciclo hamiltoniano:
    # Fijamos el primer nodo para no repetir ciclos por rotación
    start_node = nodes[0]
    other_nodes = nodes[1:]

    valid_cycles_found = 0
    best_missing_count = n + 1
    best_suggested_edges: List[Tuple[str, str]] = []

    # Probar permutaciones
    for perm in itertools.permutations(other_nodes):
        route = [start_node] + list(perm) + [start_node]
        missing_in_this_route = []

        for i in range(n):
            u, v = route[i], route[i + 1]
            edge_key = tuple(sorted([u, v]))
            if edge_key not in existing_edges:
                missing_in_this_route.append(edge_key)

        if len(missing_in_this_route) == 0:
            valid_cycles_found += 1
            # Con encontrar al menos uno ya sabemos que tiene ciclo hamiltoniano
            # pero podemos seguir o parar rápido si solo queremos validar existencia
            break
        else:
            # Rastrear la permutación que requiera menos aristas faltantes
            if len(missing_in_this_route) < best_missing_count:
                best_missing_count = len(missing_in_this_route)
                best_suggested_edges = missing_in_this_route

    if valid_cycles_found > 0:
        return {
            "valid": True,
            "has_hamiltonian_cycle": True,
            "message": "El grafo contiene al menos un Ciclo Hamiltoniano válido.",
            "suggested_edges": []
        }
    else:
        # Formatear las aristas sugeridas
        formatted_suggestions = [
            {"source": u, "target": v, "suggested_weight": 10}
            for u, v in best_suggested_edges
        ]
        return {
            "valid": False,
            "has_hamiltonian_cycle": False,
            "message": f"Faltan las siguientes aristas para completar un ciclo válido: {', '.join([f'({u}-{v})' for u, v in best_suggested_edges])}",
            "missing_edges_count": len(best_suggested_edges),
            "suggested_edges": formatted_suggestions
        }
