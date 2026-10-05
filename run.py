import os
import sys

# Asegurar que el directorio raíz y backend estén en sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from backend.app import app


def get_available_port(default_port=5000):

    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", default_port)) != 0:
            return default_port
    # Si el puerto 5000 está ocupado por otro proceso, buscar el siguiente disponible
    for p in range(default_port + 1, default_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                print(f"\n[AVISO] El puerto {default_port} está en uso. Usando puerto alternativo: {p}")
                return p
    return default_port


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    selected_port = get_available_port(port)
    print("=" * 60)
    print("  AGENTE VIAJERO (TSP) - FUERZA BRUTA")
    print(f"  Servidor iniciado en:")
    print(f"   -> http://localhost:{selected_port}")
    print(f"   -> http://127.0.0.1:{selected_port}")
    print("=" * 60)
    try:
        app.run(host="0.0.0.0", port=selected_port, debug=True)
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario.")

