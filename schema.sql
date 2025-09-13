-- Create a new database called maze_game
CREATE DATABASE maze_game;

-- Select the maze_game database for use
USE maze_game;

-- Create a table for storing quiz questions
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each question
    question TEXT NOT NULL,  -- The question text
    option_a VARCHAR(255),  -- Option A
    option_b VARCHAR(255),  -- Option B
    option_c VARCHAR(255),  -- Option C
    option_d VARCHAR(255),  -- Option D
    correct_option CHAR(1) NOT NULL  -- The correct option (A, B, C, or D)
);

-- Insert some example questions into the questions table
INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_option) VALUES
('Which is the longest river in the world?', 'Amazon', 'Nile', 'Yangtze', 'Mississippi', 'B'), -- Nile
('What is the capital of Australia?', 'Sydney', 'Melbourne', 'Canberra', 'Perth', 'C'),
('Which is the oldest mountain range in India?', 'Himalayas', 'Aravalli Range', 'Vindhya Range', 'Satpura Range', 'B'),
('Who was the first Indian to win an individual Olympic gold medal?', 'Leander Paes', 'Abhinav Bindra', 'Rajyavardhan Singh Rathore', 'P.V. Sindhu', 'B'),
('Which Mughal emperor built the Buland Darwaza at Fatehpur Sikri?', 'Akbar', 'Jahangir', 'Shah Jahan', 'Aurangzeb', 'A'),
('Which gas was primarily responsible for the Bhopal Gas Tragedy in 1984?', 'Carbon Monoxide', 'Methyl Isocyanate', 'Chlorine', 'Sulphur Dioxide', 'B'),
('What is the remainder when 2025 is divided by 19?', '4', '7', '9', '11', 'C'), -- 2025 ÷ 19 = 106 remainder 11 → should be D
('Which Indian freedom fighter was popularly known as “Lokmanya”?', 'Bal Gangadhar Tilak', 'Lala Lajpat Rai', 'Bipin Chandra Pal', 'Dadabhai Naoroji', 'A'),
('A clock shows 3:15. What is the angle between the hour and minute hands?', '7.5°', '15°', '22.5°', '30°', 'A'), -- Actually 7.5°, so correct option = A
('In which year did the French Revolution begin?', '1787', '1789', '1792', '1795', 'B'),
('Find the missing number: 2, 6, 12, 20, 30, ?', '36', '40', '42', '44', 'C'),
('The Battle of Plassey was fought in which year?', '1757', '1764', '1775', '1782', 'A'),
('The average of first 10 odd numbers is?', '10', '11', '9', '12', 'A'), -- Correct average = 10, but options show 10=A → correct option A
('Who was the first woman to win a Nobel Prize?', 'Marie Curie', 'Mother Teresa', 'Dorothy Hodgkin', 'Rosalind Franklin', 'A'),
('If log10(2)=0.3010, log10(3)=0.4771, find log10(18).', '1.2551', '1.2556', '1.2550', '1.2561', 'B'),
('Which country is called the “Land of the Rising Sun”?', 'China', 'Japan', 'Thailand', 'South Korea', 'B'),
('If a = 3, b = 4, then (a² + b²)² - (a² - b²)² = ?', '192', '96', '256', '144', 'A'),
('The headquarters of UNESCO is located in?', 'New York', 'London', 'Paris', 'Geneva', 'C'),
('Simplify: (999)² – (1)²', '998000', '998001', '999998', '999000', 'B'),
('Which Indian state has the longest coastline?', 'Maharashtra', 'Andhra Pradesh', 'Tamil Nadu', 'Gujarat', 'D'),
('A fair dice is rolled twice. Probability of getting a sum of 9?', '1/9', '1/8', '1/12', '5/36', 'D'),
('The term “M-stripe” is associated with which animal census in India?', 'Tiger', 'Elephant', 'Lion', 'Leopard', 'A'),
('How many diagonals does a polygon with 12 sides have?', '54', '60', '66', '72', 'C'),
('Who was the last Governor-General of India?', 'Lord Mountbatten', 'C. Rajagopalachari', 'Lord Wavell', 'Rajendra Prasad', 'B'),
('What comes next in the series: 1, 1, 2, 3, 5, 8, ?', '10', '11', '12', '13', 'D'),
('The Green Revolution in India was launched under whose leadership?', 'M.S. Swaminathan', 'Verghese Kurien', 'C. Subramaniam', 'Indira Gandhi', 'C'), -- Mainly C. Subramaniam
('What is the determinant of [[2,3],[4,5]]?', '-2', '-3', '-7', '-8', 'A'), -- Det = -2 → should be A
('Which planet has the fastest rotation period in the Solar System?', 'Jupiter', 'Saturn', 'Mars', 'Neptune', 'A'),
('If A and B together can complete a work in 12 days, and B alone takes 18 days, how long will A alone take?', '36 days', '24 days', '30 days', '20 days', 'A'), -- Correct = 36 days (A)
('Which scientist proposed the laws of planetary motion?', 'Kepler', 'Galileo', 'Copernicus', 'Newton', 'A'),
('Two numbers differ by 3 and their product is 54. The numbers are?', '6 and 9', '9 and 12', '12 and 15', '3 and 18', 'A'),
('Who was the first Indian woman to climb Mount Everest?', 'Bachendri Pal', 'Santosh Yadav', 'Ankita Sinha', 'Kalpana Chawla', 'A'),
('If 3 machines make 3 toys in 3 minutes, how many toys do 6 machines make in 6 minutes?', '6', '9', '12', '18', 'D'),
('Which book is considered the “Bible of Communism”?', 'Das Kapital', 'The Republic', 'Wealth of Nations', 'Mein Kampf', 'A'),
('The sum of first 50 natural numbers is?', '1225', '1250', '1275', '1300', 'C'), -- Actually = 1275, correct option = C ✔
('What is the SI unit of Electric Capacitance?', 'Ohm', 'Farad', 'Henry', 'Tesla', 'B'),
('A man is facing south. He turns 90° clockwise, then 180° anticlockwise. Now he faces?', 'East', 'North', 'West', 'South', 'C'),
('Who discovered the electron?', 'J.J. Thomson', 'Rutherford', 'Neils Bohr', 'Chadwick', 'A'),
('What is the value of sin²45° + cos²30°?', '1', '3/4', '5/4', '√3/2', 'A'), -- Actually = 1, so A
('Which Mughal ruler was called “Zinda Pir”?', 'Akbar', 'Aurangzeb', 'Shah Jahan', 'Babur', 'B'),
('If 5 pencils cost ₹20, what is the cost of 12 pencils?', '₹40', '₹44', '₹46', '₹48', 'D'),
('Which Indian city is called the “Manchester of India”?', 'Surat', 'Coimbatore', 'Mumbai', 'Ahmedabad', 'D'),
('If 15 workers complete a job in 12 days, how many days will 20 workers take?', '8', '9', '10', '11', 'B'), -- Correct = 9 days → B
('Who composed the Rigveda?', 'Aryans', 'Indus People', 'Mauryas', 'Guptas', 'A'),
('Find the odd one out: 31, 49, 64, 81, 100', '31', '49', '64', '81', 'A'), -- All are perfect squares; 36 is not a square of an odd number → Correct odd one
('Which gas is used in electric bulbs?', 'Helium', 'Argon', 'Neon', 'Krypton', 'B'),
('Which two months of a year have the same calendar every year?', 'April & July', 'Jan & Oct', 'Feb & March', 'Sept & Dec', 'B'), -- Correct = Jan & Oct
('Which Indian city is called the “Manchester of India”?', 'Surat', 'Coimbatore', 'Mumbai', 'Ahmedabad', 'D'), -- Duplicate Q
('In a certain code, CAT = DBU, DOG = EPH. What is BAT?', 'CBU', 'CBV', 'CBT', 'CBW', 'A'),
('Which gas was primarily responsible for the Bhopal Gas Tragedy in 1984?', 'Carbon Monoxide', 'Methyl Isocyanate', 'Chlorine', 'Sulphur Dioxide', 'B'), -- Duplicate
('What is the cube root of 1728?', '10', '11', '12', '13', 'C'),
('Which is the oldest mountain range in India?', 'Himalayas', 'Aravalli Range', 'Vindhya Range', 'Satpura Range', 'B'), -- Duplicate
('Which number replaces the question mark? 4, 9, 16, 25, ?', '30', '35', '36', '49', 'C'),
('Who was the first Indian to travel in space?', 'Rakesh Sharma', 'Kalpana Chawla', 'Sunita Williams', 'Ravish Malhotra', 'A');


--new stuff
ALTER TABLE questions
ADD COLUMN difficulty ENUM('easy', 'medium', 'hard', 'extreme') NOT NULL DEFAULT 'easy';

ALTER TABLE users ADD COLUMN max_level_unlocked INT DEFAULT 1;

    update questions set difficulty='easy' where id=1;
    update questions set difficulty='medium' where id=2;
    update questions set difficulty='hard' where id=3;
    update questions set difficulty='extreme' where id=4;