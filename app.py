from flask import Flask, request, jsonify, render_template
import sqlite3, os

app = Flask(__name__)

# === Inicializar DB ===
def init_db():
    if not os.path.exists("database.db"):
        conn = sqlite3.connect("database.db")
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS activos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS operaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activo TEXT,
                fecha TEXT,
                inversion REAL,
                cantidad REAL,
                precio REAL,
                tipo TEXT
            )
        """)
        conn.commit()
        conn.close()

init_db()

# === Página principal ===
@app.route('/')
def index():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("SELECT nombre FROM activos")
    activos = [row[0] for row in c.fetchall()]
    conn.close()
    return render_template('index.html', activos=activos)

# === Página de tabla de cada activo ===
@app.route('/tabla/<activo>')
def tabla(activo):
    return render_template('tabla.html', activo=activo)

# === Guardar activo nuevo ===
@app.route('/agregar_activo', methods=['POST'])
def agregar_activo():
    data = request.json
    nombre = data.get('nombre')
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    try:
        c.execute("INSERT INTO activos (nombre) VALUES (?)", (nombre,))
        conn.commit()
    except sqlite3.IntegrityError:
        pass
    conn.close()
    return jsonify({"status": "ok"})

# === Eliminar activo y sus operaciones ===
@app.route('/eliminar_activo/<nombre>', methods=['DELETE'])
def eliminar_activo(nombre):
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('DELETE FROM operaciones WHERE activo = ?', (nombre,))
    c.execute('DELETE FROM activos WHERE nombre = ?', (nombre,))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

# === Guardar operaciones ===
@app.route('/guardar/<activo>', methods=['POST'])
def guardar(activo):
    datos = request.json
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('DELETE FROM operaciones WHERE activo = ?', (activo,))
    for fila in datos:
        c.execute('''
            INSERT INTO operaciones (activo, fecha, inversion, cantidad, precio, tipo)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (activo, fila['fecha'], fila['inversion'], fila['cantidad'], fila['precio'], fila['tipo']))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

# === Cargar operaciones ===
@app.route('/cargar/<activo>')
def cargar(activo):
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('SELECT fecha, inversion, cantidad, precio, tipo FROM operaciones WHERE activo = ?', (activo,))
    filas = [
        {"fecha": row[0], "inversion": row[1], "cantidad": row[2], "precio": row[3], "tipo": row[4]}
        for row in c.fetchall()
    ]
    conn.close()
    return jsonify(filas)

if __name__ == '__main__':
    app.run(debug=True)
