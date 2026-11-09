import sys
sys.path.insert(0, 'c:/Users/luish/Documents/Agente_Viajero')
from backend.tsp_solver import solve_tsp_brute_force

# Grafo completo K5: todas las aristas posibles
nodes = ['A','B','C','D','E']
edges = [
    {'source':'A','target':'B','weight':10},
    {'source':'A','target':'C','weight':20},
    {'source':'A','target':'D','weight':30},
    {'source':'A','target':'E','weight':40},
    {'source':'B','target':'C','weight':15},
    {'source':'B','target':'D','weight':25},
    {'source':'B','target':'E','weight':35},
    {'source':'C','target':'D','weight':12},
    {'source':'C','target':'E','weight':22},
    {'source':'D','target':'E','weight':18},
]

r = solve_tsp_brute_force(nodes, edges)
print("=== Verificacion de deduplicacion ===")
print(f"Total permutaciones evaluadas : {r['total_permutations']}  (esperado: 24 = 4!)")
print(f"Ciclos hamiltonianos unicos   : {r['valid_cycles_count']}  (esperado: 12 = 4!/2)")
print(f"Costo optimo                  : {r['optimal_cost']}")
print(f"Ruta optima                   : {r['optimal_cycle']['formatted_route']}")
print()
print("Todos los ciclos unicos (ordenados por costo):")
for c in r['valid_cycles']:
    print(f"  [{c['total_cost']:>4}] {c['formatted_route']}")
