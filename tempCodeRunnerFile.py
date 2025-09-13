from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import random
import mysql.connector
from mysql.connector import Error
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)
app.secret_key = 'supersecretkey'

# MySQL Configuration
config = {
    'host': 'localhost',
    'database': 'maze_game',
    'user': 'root',
    'password': 'nithuniha'
}

def get_db_connection():
    return mysql.connector.connect(**config)

@app.route('/')
def landing():
    if 'user_id' in session:
        return redirect(url_for('index'))  # index = game/dashboard
    return render_template('landing.html')

@app.route('/index')  # or call this /dashboard or /game
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')  # Your game or main content


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
            return redirect(url_for('index'))
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
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM questions ORDER BY RAND() LIMIT 1")
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
            'answer': question['correct_option']
        })
    else:
        return jsonify({'error': 'No questions available in the database'}), 404


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
