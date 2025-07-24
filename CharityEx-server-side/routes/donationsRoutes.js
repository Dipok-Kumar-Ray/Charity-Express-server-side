// const express = require("express");
// const router = express.Router();
// const { client } = require("../config/db");
// const { ObjectId } = require("mongodb");

// // ==================== DONATION ROUTES START ====================

// // Get all donations
// router.get("/", async (req, res) => {
//   try {
//     const db = client().db("CharityEx_DB");
//     const donationsCollection = db.collection("donations");

//     const donations = await donationsCollection.find().toArray();
//     res.send(donations);
//   } catch (error) {
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

// // Get single donation details
// router.get("/:id", async (req, res) => {
//   try {
//     const db = client().db("CharityEx_DB");
//     const donationsCollection = db.collection("donations");

//     const id = req.params.id;
//     if (!ObjectId.isValid(id)) {
//       return res.status(400).send({ error: "Invalid donation ID" });
//     }

//     const donation = await donationsCollection.findOne({ _id: new ObjectId(id) });

//     if (!donation) {
//       return res.status(404).send({ error: "Donation not found" });
//     }

//     res.send(donation);
//   } catch (error) {
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

// // ==================== DONATION ROUTES END ====================

// module.exports = router;
