// const express = require("express");
// const router = express.Router();
// const { client } = require("../config/db");
// const { ObjectId } = require("mongodb");
// const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

// // ==================== CHARITY ROLE START ====================

// // Charity profile
// router.get("/profile", async (req, res) => {
//   try {
//     const email = req.query.email;
//     if (!email) return res.status(400).send({ message: "Email required" });

//     const db = client().db("CharityEx_DB");
//     const charityCollection = db.collection("charity");

//     const charityProfile = await charityCollection.findOne({ email });
//     res.send(charityProfile || {});
//   } catch (error) {
//     res.status(500).send({ message: "Server error", error });
//   }
// });

// // Get charity requests by email
// router.get("/requests", async (req, res) => {
//   const email = req.query.email;
//   const db = client().db("CharityEx_DB");
//   const charityRequestsCollection = db.collection("charity-request-status");

//   const result = await charityRequestsCollection
//     .find({ email: { $regex: new RegExp(`^${email}$`, "i") } })
//     .toArray();

//   res.send(result);
// });

// // Delete charity request
// router.delete("/requests/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const charityRequestsCollection = db.collection("charity-request-status");

//   const result = await charityRequestsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//   res.send(result);
// });

// // Submit new charity request
// router.post("/request", async (req, res) => {
//   const { name, email, orgName, mission, transactionId } = req.body;

//   if (!name || !email || !orgName || !mission || !transactionId) {
//     return res.status(400).send({ message: "All fields are required" });
//   }

//   const db = client().db("CharityEx_DB");
//   const charityRequestsCollection = db.collection("charity-request-status");
//   const transactionsCollection = db.collection("transactions");

//   const exists = await charityRequestsCollection.findOne({
//     email,
//     status: { $in: ["Pending", "Approved"] },
//   });

//   if (exists) {
//     return res.status(400).send({ message: "Request already submitted or approved" });
//   }

//   // Insert into charity requests
//   await charityRequestsCollection.insertOne({
//     name,
//     email,
//     orgName,
//     mission,
//     transactionId,
//     status: "Pending",
//     date: new Date(),
//   });

//   // Insert into transactions
//   await transactionsCollection.insertOne({
//     transactionId,
//     email,
//     amount: 25,
//     date: new Date(),
//     purpose: "Charity Role Request",
//     status: "Pending",
//   });

//   res.send({ success: true });
// });

// // Charity request status check
// router.get("/request-status", async (req, res) => {
//   const email = req.query.email;
//   const db = client().db("CharityEx_DB");
//   const charityRequestsCollection = db.collection("charity-request-status");

//   const result = await charityRequestsCollection.findOne({
//     email,
//     status: { $in: ["Pending", "Approved"] },
//   });

//   res.send({ exists: !!result });
// });

// // Create Stripe Payment Intent
// router.post("/create-payment-intent", async (req, res) => {
//   const { amount } = req.body;

//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: amount * 100,
//     currency: "usd",
//     payment_method_types: ["card"],
//   });

//   res.send({ clientSecret: paymentIntent.client_secret });
// });

// // ==================== CHARITY ROLE END ====================

// module.exports = router;
