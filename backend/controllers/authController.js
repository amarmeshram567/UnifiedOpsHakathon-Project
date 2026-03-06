const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");


// REGISTER
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user exists
        const userExists = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
            [name, email, hashedPassword]
        );

        // Create JWT
        const token = jwt.sign(
            { id: newUser.rows[0].id, email: newUser.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0],
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


// LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.rows[0].password_hash
        );

        if (!validPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create JWT
        const token = jwt.sign(
            { id: user.rows[0].id, email: user.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );


        //console.log(user.rows[0])


        res.json({
            message: "Login successful",
            user: user.rows[0],
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};