import os
import sys

# Asegurar que el directorio raíz y backend estén en sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")

    print("=" * 60)
    print("  AGENTE VIAJERO (TSP) - FUERZA BRUTA")
    print(f"  Iniciando servidor en:")
    print(f"   -> http://127.0.0.1:{port}")
    print(f"   -> http://localhost:{port}")
    print("=" * 60)
    
    app.run(host=host, port=port, debug=False, use_reloader=False)


