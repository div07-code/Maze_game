from flask import Flask, render_template, request, jsonify, session, redirect, url_for # type: ignore
import random
import mysql.connector # type: ignore
from mysql.connector import Error # type: ignore
from flask_cors import CORS # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash # type: ignore
from datetime import timedelta

app = Flask(__name__)

CORS(app)
app.secret_key = 'supersecretkey'

# Level Configurations
levels = {
    1: {"cols": 10, "rows": 10, "difficulty": "easy", "wall_break_limit": 10, "time_limit": 50},
    2: {"cols": 20, "rows": 20, "difficulty": "medium", "wall_break_limit": 7, "time_limit": 120},
    3: {"cols": 30, "rows": 30, "difficulty": "hard", "wall_break_limit": 5, "time_limit": 180},
    4: {"cols": 40, "rows": 40, "difficulty": "extreme", "wall_break_limit": 3, "time_limit": 200}
}

# MySQL Configuration
config = {
    'host': 'localhost',
    'database': 'maze_game',
    'user': 'root',
    'password': 'root'
}

def get_db_connection():
    return mysql.connector.connect(**config)

@app.route('/')
def landing():
 
    return render_template('landing.html')

@app.route('/start_game')
def start_game():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    session['current_level'] = 1  # Always start at level 1
    return redirect(url_for('select_level'))


@app.route('/index')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    if 'current_level' not in session:
        return redirect(url_for('start_game'))
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            return redirect(url_for('level_select'))
        return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
        conn.commit()
        cursor.close()
        conn.close()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))


@app.route('/get_question')
def get_question():
    level = session.get('current_level', 1)
    difficulty = levels.get(level, levels[1])['difficulty']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM questions WHERE difficulty = %s ORDER BY RAND() LIMIT 1", (difficulty,))
    question = cursor.fetchone()
    cursor.close()
    conn.close()

    if question:
        return jsonify({
            'id': question['id'],
            'question': question['question'],
            'options': {
                'A': question['option_a'],
                'B': question['option_b'],
                'C': question['option_c'],
                'D': question['option_d']
            },
        })
    else:
        return jsonify({'error': 'No questions available in the database'}), 404

@app.route('/get_level_config')
def get_level_config():
    level = session.get('current_level', 1)
    config = levels.get(level, levels[1])
    return jsonify(config)

@app.route('/next_level', methods=['POST'])
def next_level():
    user_id = session.get('user_id')
    current = session.get('current_level', 1)

    if current < 4:
        session['current_level'] = current + 1

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update max_level_unlocked in DB
        cursor.execute("UPDATE users SET max_level_unlocked = GREATEST(max_level_unlocked, %s) WHERE id = %s",
                       (session['current_level'], user_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'level': session['current_level'], 'message': 'Level up!'})

    return jsonify({'message': 'You have completed all levels!'})

@app.route('/reset_game')
def reset_game():
    session['current_level'] = 1
    return redirect(url_for('index'))

@app.route('/get_unlocked_levels')
def get_unlocked_levels():
    user_id = session.get('user_id')
    if not user_id:
        # Instead of returning a login page (HTML), return a JSON error
        return jsonify({'error': 'Not logged in'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT max_level_unlocked FROM users WHERE id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    max_unlocked = result[0] if result else 1

    return jsonify({
        'unlocked_levels': max_unlocked,
        'total_levels': len(levels)
    })



@app.route('/select_level/<int:level>')
def select_level(level):
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT max_level_unlocked FROM users WHERE id = %s", (user_id,))
    max_unlocked = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    if level <= max_unlocked:
        # ✅ Always reset timer by resetting session current_level
        session['current_level'] = level
        return redirect(url_for('index'))
    else:
        return "This level is locked!", 403
    
@app.route('/level_select')
def level_select():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('select_level.html')  # Create this file


@app.route('/validate_answer', methods=['POST'])
def validate_answer():
    data = request.json
    qid = data['id']
    answer = data['answer']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT correct_option FROM questions WHERE id=%s", (qid,))
    correct = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    return jsonify({'correct': answer == correct})


if __name__ == '__main__':
    app.run(debug=True)