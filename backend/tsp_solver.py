import itertools
from typing import Dict, List, Any, Optional, Tuple

def solve_tsp_brute_force(
    nodes: List[str], 
    edges: List[Dict[str, Any]], 
    max_steps_to_include: int = 500
) -> Dict[str, Any]:
    """
    Resuelve el Problema del Agente Viajero (TSP) mediante FUERZA BRUTA ESTRICTA.
    Evalúa sistemáticamente todas las permutaciones posibles partiendo de un nodo fijo.
    
    Retorna:
    - Resumen con total de permutaciones evaluadas
    - Cantidad de ciclos hamiltonianos válidos
    - Ciclo óptimo (mínimo costo)
    - Lista de todos los ciclos válidos ordenados por costo
    - Pasos de evaluación detallados (hasta max_steps_to_include para visualización interactiva)
    """
    n = len(nodes)
    if not (5 <= n <= 10):
        raise ValueError("El número de nodos debe estar estrictamente entre 5 y 10.")

    # Mapa de pesos de aristas (pares no dirigidos ordenados)
    edge_weights: Dict[Tuple[str, str], int] = {}
    for e in edges:
        u, v = e["source"], e["target"]
        w = int(e["weight"])
        edge_weights[tuple(sorted([u, v]))] = w

    start_node = nodes[0]
    other_nodes = nodes[1:]

    total_permutations = 0
    valid_cycles: List[Dict[str, Any]] = []
    optimal_cycle: Optional[Dict[str, Any]] = None
    min_cost = float("inf")

    steps_sample: List[Dict[str, Any]] = []

    # Conjunto para deduplicar ciclos por su firma de aristas (grafo no dirigido:
    # A→B→C→A y A→C→B→A son el mismo ciclo recorrido en sentido contrario)
    seen_cycle_signatures: set = set()

    # Fuerza bruta estricta: itertools.permutations genera todas las ordenaciones de los n-1 nodos
    perm_index = 0
    for perm in itertools.permutations(other_nodes):
        perm_index += 1
        total_permutations += 1
        route = [start_node] + list(perm) + [start_node]
        
        is_valid = True
        accumulated_cost = 0
        edge_breakdown = []
        missing_edges = []

        # Verificar cada segmento consecutivo del ciclo
        for i in range(n):
            u, v = route[i], route[i + 1]
            key = tuple(sorted([u, v]))
            if key in edge_weights:
                cost = edge_weights[key]
                accumulated_cost += cost
                edge_breakdown.append({
                    "from": u,
                    "to": v,
                    "cost": cost,
                    "exists": True,
                    "cumulative": accumulated_cost
                })
            else:
                is_valid = False
                missing_edges.append(f"({u}-{v})")
                edge_breakdown.append({
                    "from": u,
                    "to": v,
                    "cost": None,
                    "exists": False,
                    "cumulative": None
                })

        step_data = {
            "index": perm_index,
            "route": route,
            "is_valid": is_valid,
            "total_cost": accumulated_cost if is_valid else None,
            "edge_breakdown": edge_breakdown,
            "missing_edges": missing_edges,
            "formatted_route": " → ".join(route)
        }

        if is_valid:
            # Firma canónica del ciclo: frozenset de aristas (no dirigidas)
            # Esto elimina duplicados por reverso: A→B→C→A == A→C→B→A
            sig = frozenset(
                tuple(sorted([route[i], route[i + 1]]))
                for i in range(n)
            )

            if sig not in seen_cycle_signatures:
                seen_cycle_signatures.add(sig)
                cycle_info = {
                    "index": perm_index,
                    "route": route,
                    "formatted_route": " → ".join(route),
                    "total_cost": accumulated_cost,
                    "edge_breakdown": edge_breakdown
                }
                valid_cycles.append(cycle_info)

                if accumulated_cost < min_cost:
                    min_cost = accumulated_cost
                    optimal_cycle = cycle_info

        # Guardar en steps_sample hasta el límite configurado para la animación
        if perm_index <= max_steps_to_include:
            steps_sample.append(step_data)

    # Ordenar ciclos válidos de menor a mayor costo
    valid_cycles.sort(key=lambda c: c["total_cost"])

    return {
        "total_permutations": total_permutations,
        "valid_cycles_count": len(valid_cycles),
        "optimal_cycle": optimal_cycle,
        "optimal_cost": min_cost if optimal_cycle is not None else None,
        "valid_cycles": valid_cycles,
        "steps_count": len(steps_sample),
        "steps": steps_sample,
        "has_more_steps": total_permutations > max_steps_to_include
    }


def get_permutation_step_page(
    nodes: List[str], 
    edges: List[Dict[str, Any]], 
    page: int = 1, 
    page_size: int = 50
) -> Dict[str, Any]:
    """
    Permite obtener una página específica de pasos de permutación
    para grafos grandes (n >= 8) sin sobrecargar la memoria.
    """
    n = len(nodes)
    start_index = (page - 1) * page_size
    end_index = start_index + page_size

    edge_weights: Dict[Tuple[str, str], int] = {}
    for e in edges:
        u, v = e["source"], e["target"]
        edge_weights[tuple(sorted([u, v]))] = int(e["weight"])

    start_node = nodes[0]
    other_nodes = nodes[1:]

    page_steps = []
    current_index = 0

    for perm in itertools.permutations(other_nodes):
        current_index += 1
        if current_index <= start_index:
            continue
        if current_index > end_index:
            break

        route = [start_node] + list(perm) + [start_node]
        is_valid = True
        accumulated_cost = 0
        edge_breakdown = []
        missing_edges = []

        for i in range(n):
            u, v = route[i], route[i + 1]
            key = tuple(sorted([u, v]))
            if key in edge_weights:
                cost = edge_weights[key]
                accumulated_cost += cost
                edge_breakdown.append({
                    "from": u, "to": v, "cost": cost, "exists": True, "cumulative": accumulated_cost
                })
            else:
                is_valid = False
                missing_edges.append(f"({u}-{v})")
                edge_breakdown.append({
                    "from": u, "to": v, "cost": None, "exists": False, "cumulative": None
                })

        page_steps.append({
            "index": current_index,
            "route": route,
            "is_valid": is_valid,
            "total_cost": accumulated_cost if is_valid else None,
            "edge_breakdown": edge_breakdown,
            "missing_edges": missing_edges,
            "formatted_route": " → ".join(route)
        })

    return {
        "page": page,
        "page_size": page_size,
        "steps": page_steps
    }
