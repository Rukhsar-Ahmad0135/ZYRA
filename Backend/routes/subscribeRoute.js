/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const express = require("express");
const router = express.Router();
const Subscriber = require("../models/Subscriber");

//@route POST /api/subscribers
//@desc Handle newsletter subscription
//@access public

router.post("/", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    try {
        //check if the email is already subscribed
        let subscriber = await Subscriber.findOne({ email });
        if (subscriber) {
            return res.status(400).json({ message: "Email is already subscribed" });
        }
        // create new subscriber
        subscriber = new Subscriber({ email });
        await subscriber.save();
        res.status(201).json({ message: "Successfully subscribe to the newletter" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});
module.exports = router;