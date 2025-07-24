// const express = require("express");
// const router = express.Router();
// const { client } = require("../config/db");
// const { ObjectId } = require("mongodb");
// const verifyJWT = require("../middleware/verifyJWT");
// const verifyRestaurant = require("../middleware/verifyRestaurant");

// // ==================== RESTAURANT ROLE START ====================

// // Get user role by email
// router.get("/users/:email", async (req, res) => {
//   const email = req.params.email;
//   const db = client().db("CharityEx_DB");
//   const usersCollection = db.collection("users");

//   const user = await usersCollection.findOne({ email });
//   res.send({ role: user?.role || "user" });
// });

// // Add new donation (protected route)
// router.post("/donations", verifyJWT, verifyRestaurant, async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const donationsCollection = db.collection("donations");

//   const donation = req.body;
//   donation.status = "Pending";
//   donation.createdAt = new Date();

//   const result = await donationsCollection.insertOne(donation);
//   res.send(result);
// });

// // Get donations by restaurant email
// router.get("/donations", async (req, res) => {
//   const email = req.query.email;
//   const db = client().db("CharityEx_DB");
//   const donationsCollection = db.collection("donations");

//   const result = await donationsCollection.find({ restaurantEmail: email }).toArray();
//   res.send(result);
// });

// // Delete donation
// router.delete("/donations/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const donationsCollection = db.collection("donations");

//   const result = await donationsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//   res.send(result);
// });

// // Update donation
// router.patch("/donations/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const donationsCollection = db.collection("donations");

//   const updatedData = req.body;

//   const result = await donationsCollection.updateOne(
//     { _id: new ObjectId(req.params.id) },
//     {
//       $set: {
//         title: updatedData.title,
//         foodType: updatedData.foodType,
//         quantity: updatedData.quantity,
//         pickupTime: updatedData.pickupTime,
//         location: updatedData.location,
//         image: updatedData.image,
//       },
//     }
//   );

//   res.send(result);
// });

// // Get requests for restaurant donations
// router.get("/requests", async (req, res) => {
//   const email = req.query.email;
//   const db = client().db("CharityEx_DB");
//   const requestsCollection = db.collection("requests");

//   const result = await requestsCollection.find({ restaurantEmail: email }).toArray();
//   res.send(result);
// });

// // Accept or reject a request
// router.patch("/requests/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const requestsCollection = db.collection("requests");

//   const id = req.params.id;
//   const { status, donationId } = req.body; // "Accepted" or "Rejected"

//   // Update this request
//   const result = await requestsCollection.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: { status } }
//   );

//   // Auto-reject all other requests for same donation
//   if (status === "Accepted") {
//     await requestsCollection.updateMany(
//       { donationId: donationId, _id: { $ne: new ObjectId(id) } },
//       { $set: { status: "Rejected" } }
//     );
//   }

//   res.send(result);
// });

// // ==================== RESTAURANT ROLE END ====================

// module.exports = router;
