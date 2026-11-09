import os
import sys

# Asegurar que el directorio raíz y backend estén en sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app

if __name__ == "__main__":
    print("=" * 60)
    print("  AGENTE VIAJERO (TSP) - FUERZA BRUTA")
    print("  Iniciando servidor local en:")
    print("   -> http://127.0.0.1:5000")
    print("   -> http://localhost:5000")
    print("=" * 60)
    
    # host='127.0.0.1' y use_reloader=False evitan procesos hijos duplicados
    # y conflictos al depurar en VS Code o terminal
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)


