// const express = require("express");
// const router = express.Router();
// const { client } = require("../config/db");
// const { ObjectId } = require("mongodb");

// // ==================== ADMIN ROLE START ====================

// // Get all charity requests
// router.get("/charity-requests", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const charityRequestsCollection = db.collection("charity-request-status");

//   const result = await charityRequestsCollection.find().sort({ date: -1 }).toArray();
//   res.send(result);
// });

// // Update charity request status
// router.patch("/charity-requests/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const charityRequestsCollection = db.collection("charity-request-status");
//   const transactionsCollection = db.collection("transactions");

//   const id = req.params.id;
//   const { status } = req.body;

//   const result = await charityRequestsCollection.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: { status } }
//   );

//   const request = await charityRequestsCollection.findOne({ _id: new ObjectId(id) });
//   if (request) {
//     await transactionsCollection.updateOne(
//       { transactionId: request.transactionId },
//       { $set: { status } }
//     );
//   }

//   res.send(result);
// });

// // ==================== ADMIN ROLE END ====================

// module.exports = router;
