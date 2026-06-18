/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the license file for more information.
 */

const express = require("express");
const User= require("../models/Users");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// @route post /api/users/register
// @desc register a new user
// @access public

router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        //registeration logic
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });
        user = new User({ name, email, password, role: role || 'customer' });
        await user.save();

        //create jwt payload
        const payload = { user: { id: user._id, role: user.role } };

        // sign and return the token along with user data
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "40h" },
            (err, token) => {
                if (err) throw err;
                // send token and user data in response
                res.status(201).json({
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    token,
                });
            }
        ); 
    }
    catch (error) {
        console.error("Register error details:", {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
        });
        res.status(500).json({
            message: "Server error",
            details: {
                message: error?.message,
                name: error?.name,
            },
        });
    }
});

//@route POST /api/users/login
//@desc authenticate user
//@access public
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });
        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Create jwt payload
        const payload = { user: { id: user._id, role: user.role } };

        // Sign and return the token along with user data
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "40h" },
            (err, token) => {
                if (err) throw err;
                //send the user and token in response
                res.json({
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    token
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

//@route GET /api/users/profile
//@desc get loggedin users profile (protected route)
//@access private
router.get("/profile", protect, async (req, res) => {
    res.json(req.user);
});
module.exports = router;