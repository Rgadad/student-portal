// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Student = require("./models/student");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err));

// ------------------- ROUTES ---------------------

// Login Page
app.get("/", (req, res) => {
    res.render("login");
});

// Register Page
app.get("/register", (req, res) => {
    res.render("register");
});

// Register POST
app.post("/register", async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        const exists = await Student.findOne({ email });
        if (exists) return res.send("User already exists!");

        const hashedPass = await bcrypt.hash(password, 10);

        const student = new Student({
            name,
            email,
            phone,
            password: hashedPass
        });

        await student.save();
        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.send("Error occurred!");
    }
});

// Login POST
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await Student.findOne({ email });
    if (!user) return res.send("User not found!");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Incorrect password!");

    req.session.user = user;
    res.redirect("/dashboard");
});

// Dashboard (Protected)
app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/");

    res.render("dashboard", { user: req.session.user });
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// ------------------- Start Server (IMPORTANT for Render) -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
