/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/Users");

//middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.user.id).select("-password");
            next();
        } catch (error) {
            console.error("Token verification failed:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

const admin = (req, res, next) => {
    // expects req.user.role from protect middleware
    if (req.user && req.user.role === "admin") return next();
    return res.status(403).json({ message: "Forbidden - admin only" });
};

module.exports = { protect, admin };
