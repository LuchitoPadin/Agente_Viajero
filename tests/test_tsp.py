import json
import unittest
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app


class TestTSPEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")

    def test_generate_graph_range(self):
        # n = 5
        res5 = self.client.post("/api/graph/generate", json={"n": 5})
        self.assertEqual(res5.status_code, 200)
        data5 = res5.get_json()
        self.assertTrue(data5["success"])
        self.assertEqual(len(data5["data"]["nodes"]), 5)
        self.assertTrue(data5["data"]["has_hamiltonian_cycle"])

        # n = 10 (límite superior)
        res10 = self.client.post("/api/graph/generate", json={"n": 10})
        self.assertEqual(res10.status_code, 200)
        data10 = res10.get_json()
        self.assertTrue(data10["success"])
        self.assertEqual(len(data10["data"]["nodes"]), 10)

    def test_solve_tsp_brute_force(self):
        nodes = ["A", "B", "C", "D", "E"]
        edges = [
            {"source": "A", "target": "B", "weight": 10},
            {"source": "B", "target": "C", "weight": 10},
            {"source": "C", "target": "D", "weight": 10},
            {"source": "D", "target": "E", "weight": 10},
            {"source": "E", "target": "A", "weight": 10},
            {"source": "A", "target": "C", "weight": 30}
        ]

        res = self.client.post("/api/tsp/solve", json={"nodes": nodes, "edges": edges})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        results = data["results"]
        # (5-1)! = 24 permutaciones evaluadas (fuerza bruta completa, sin deduplicar pasos)
        self.assertEqual(results["total_permutations"], 24)
        # El ciclo mínimo debe costar 50
        self.assertEqual(results["optimal_cost"], 50)
        self.assertIsNotNone(results["optimal_cycle"])
        # Con deduplicación de reversos: ciclos únicos >= 1 y <= (n-1)!/2 = 12
        self.assertGreaterEqual(len(results["valid_cycles"]), 1)
        self.assertLessEqual(len(results["valid_cycles"]), 12)

    def test_missing_edges_validation(self):
        nodes = ["A", "B", "C", "D", "E"]
        edges = [
            {"source": "A", "target": "B", "weight": 10},
            {"source": "B", "target": "C", "weight": 15}
        ]

        res = self.client.post("/api/graph/validate", json={"nodes": nodes, "edges": edges})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        val = data["validation"]
        self.assertFalse(val["has_hamiltonian_cycle"])
        self.assertIn("Faltan las siguientes aristas para completar un ciclo válido", val["message"])
        self.assertTrue(len(val["suggested_edges"]) > 0)


if __name__ == "__main__":
    unittest.main()
