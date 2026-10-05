import urllib.request
import json
import unittest

BASE_URL = "http://127.0.0.1:5000"

def post_json(endpoint, payload):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(endpoint):
    with urllib.request.urlopen(f"{BASE_URL}{endpoint}") as resp:
        return json.loads(resp.read().decode("utf-8"))

class TestTSPEndpoints(unittest.TestCase):

    def test_health(self):
        res = get_json("/api/health")
        self.assertEqual(res["status"], "online")

    def test_generate_graph_range(self):
        # n = 5
        res5 = post_json("/api/graph/generate", {"n": 5})
        self.assertTrue(res5["success"])
        self.assertEqual(len(res5["data"]["nodes"]), 5)
        self.assertTrue(res5["data"]["has_hamiltonian_cycle"])

        # n = 10 (límite superior)
        res10 = post_json("/api/graph/generate", {"n": 10})
        self.assertTrue(res10["success"])
        self.assertEqual(len(res10["data"]["nodes"]), 10)

    def test_solve_tsp_brute_force(self):
        # Grafo con 5 nodos
        nodes = ["A", "B", "C", "D", "E"]
        # Ciclo simple: A-B (10), B-C (10), C-D (10), D-E (10), E-A (10)
        # y una cuerda: A-C (30)
        edges = [
            {"source": "A", "target": "B", "weight": 10},
            {"source": "B", "target": "C", "weight": 10},
            {"source": "C", "target": "D", "weight": 10},
            {"source": "D", "target": "E", "weight": 10},
            {"source": "E", "target": "A", "weight": 10},
            {"source": "A", "target": "C", "weight": 30}
        ]

        res = post_json("/api/tsp/solve", {"nodes": nodes, "edges": edges})
        self.assertTrue(res["success"])
        results = res["results"]
        # (5-1)! = 24 permutaciones
        self.assertEqual(results["total_permutations"], 24)
        # El ciclo mínimo debe costar 50
        self.assertEqual(results["optimal_cost"], 50)
        self.assertIsNotNone(results["optimal_cycle"])
        self.assertTrue(len(results["valid_cycles"]) >= 2)
        print("Ciclo optimo encontrado:", results["optimal_cycle"]["formatted_route"], "con costo:", results["optimal_cost"])

    def test_missing_edges_validation(self):
        # Grafo sin ciclo hamiltoniano
        nodes = ["A", "B", "C", "D", "E"]
        edges = [
            {"source": "A", "target": "B", "weight": 10},
            {"source": "B", "target": "C", "weight": 15}
        ]

        res = post_json("/api/graph/validate", {"nodes": nodes, "edges": edges})
        self.assertTrue(res["success"])
        val = res["validation"]
        self.assertFalse(val["has_hamiltonian_cycle"])
        self.assertIn("Faltan las siguientes aristas para completar un ciclo válido", val["message"])
        self.assertTrue(len(val["suggested_edges"]) > 0)
        print("Mensaje de validacion exitoso:", val["message"])

if __name__ == "__main__":
    unittest.main()
