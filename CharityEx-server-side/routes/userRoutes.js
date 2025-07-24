// const express = require("express");
// const router = express.Router();
// const { client } = require("../config/db");
// const { ObjectId } = require("mongodb");

// // ==================== USER ROUTES START ====================

// // Get all users
// router.get("/", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const usersCollection = db.collection("users");

//   const users = await usersCollection.find().toArray();
//   res.send(users);
// });

// // Get user by email (for role check)
// router.get("/role", async (req, res) => {
//   const email = req.query.email;
//   const db = client().db("CharityEx_DB");
//   const usersCollection = db.collection("users");

//   const user = await usersCollection.findOne({ email });
//   res.send(user);
// });

// // Add new user
// router.post("/", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const usersCollection = db.collection("users");

//   const user = req.body;
//   const result = await usersCollection.insertOne(user);
//   res.send(result);
// });

// // Update user role
// router.patch("/updateRole/:id", async (req, res) => {
//   try {
//     const db = client().db("CharityEx_DB");
//     const usersCollection = db.collection("users");

//     const { id } = req.params;
//     const { role } = req.body;

//     if (!role) {
//       return res.status(400).json({ message: "Role is required" });
//     }

//     const result = await usersCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: { role } }
//     );

//     res.send(result);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ==================== USER ROUTES END ====================

// module.exports = router;
