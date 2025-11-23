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
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "maze_game",
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci",
    "use_unicode": True
}


def get_db_connection():
    print("CONFIG TYPE:", type(config), config)
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
        cursor.execute("UPDATE users SET max_level_unlocked = GREATEST(max_level_unlocked, %s) WHERE id = %s",
                       (session['current_level'], user_id))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'level': session['current_level'], 'message': 'Level up!'})

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
        # Always reset timer by resetting session current_level
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

@app.route('/submit_score', methods=['POST'])
def submit_score():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    data = request.json or {}
    score = int(data.get('score', 0))
    walls_broken = int(data.get('walls_broken', 0))
    time_left = int(data.get('time_left', 0))
    level = session.get('current_level', 1)
    user_id = session['user_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1) Insert attempt (history)
        cursor.execute("""
            INSERT INTO attempts (user_id, level, score, walls_broken, time_left)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, level, score, walls_broken, time_left))

        # 2) Upsert into scores (store player's best total or best per-level - adjust as needed)
        # Example: keep best score per user across all levels in 'scores' table
        cursor.execute("""
            INSERT INTO scores (user_id, level, score)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score))
        """, (user_id, level, score))

        # 3) Check & award achievements
        # Award FIRST_WIN if this is the user's first win (count attempts)
        cursor.execute("SELECT COUNT(*) FROM attempts WHERE user_id = %s", (user_id,))
        attempts_count = cursor.fetchone()[0]

        # helper: award achievement by code
        def award(code):
            cursor.execute("SELECT id FROM achievements WHERE code = %s", (code,))
            row = cursor.fetchone()
            if not row:
                return
            ach_id = row[0]
            try:
                cursor.execute("""
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (%s, %s)
                """, (user_id, ach_id))
            except Exception:
                # ignore unique constraint or other issues
                pass

        # FIRST_WIN
        if attempts_count == 1:
            award('FIRST_WIN')

        # NO_WALL_BREAK: this attempt had zero walls broken
        if walls_broken == 0:
            award('NO_WALL_BREAK')

        # FAST_FINISH: >= 30s left
        if time_left >= 30:
            award('FAST_FINISH')

        # WALL_BREAKER: count total walls broken across attempts; award when >=10
        cursor.execute("SELECT COALESCE(SUM(walls_broken),0) FROM attempts WHERE user_id = %s", (user_id,))
        total_wb = cursor.fetchone()[0]
        if total_wb >= 10:
            award('WALL_BREAKER')

        conn.commit()
    except Exception as e:
        conn.rollback()
        print("🔥 submit_score ERROR:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({'message': 'Score submitted and recorded', 'score': score})

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get user info
    cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()

    # Get user's achievements (join)
    cursor.execute("""
        SELECT a.code, a.title, a.description, ua.awarded_at
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = %s
        ORDER BY ua.awarded_at DESC
    """, (user_id,))
    user_achievements = cursor.fetchall()

    # Get all defined achievements (to show locked ones)
    cursor.execute("SELECT code, title, description FROM achievements ORDER BY id")
    all_achievements = cursor.fetchall()

    # Get user's attempts (history)
    cursor.execute("""
        SELECT level, score, walls_broken, time_left, created_at
        FROM attempts
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 100
    """, (user_id,))
    attempts = cursor.fetchall()

    # Optional: aggregate stats
    cursor.execute("SELECT SUM(score) as total_score, COUNT(*) as attempts_count FROM attempts WHERE user_id = %s", (user_id,))
    stats = cursor.fetchone()

    cursor.close()
    conn.close()

    return render_template('profile.html',
                           user=user,
                           user_achievements=user_achievements,
                           all_achievements=all_achievements,
                           attempts=attempts,
                           stats=stats)

if __name__ == '__main__':
        app.run(debug=True, use_reloader=False)
