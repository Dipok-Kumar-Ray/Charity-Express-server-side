// const express = require("express");
// const router = express.Router();
// const { client } = require("../config/db");
// const { ObjectId } = require("mongodb");

// // ==================== REVIEW & FAVORITES ROUTES START ====================

// // Get favorites by email
// router.get("/favorites", async (req, res) => {
//   const email = req.query.email;
//   if (!email) return res.status(400).send({ message: "Email is required" });

//   const db = client().db("CharityEx_DB");
//   const favoritesCollection = db.collection("favorites");

//   const favorites = await favoritesCollection.find({ email }).toArray();
//   res.send(favorites);
// });

// // Delete favorite
// router.delete("/favorites/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const favoritesCollection = db.collection("favorites");

//   const result = await favoritesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//   res.send(result);
// });

// // Get reviews by email
// router.get("/", async (req, res) => {
//   const email = req.query.email;
//   if (!email) return res.status(400).send({ message: "Email is required" });

//   const db = client().db("CharityEx_DB");
//   const reviewsCollection = db.collection("reviews");

//   const reviews = await reviewsCollection.find({ email }).toArray();
//   res.send(reviews);
// });

// // Delete review
// router.delete("/:id", async (req, res) => {
//   const db = client().db("CharityEx_DB");
//   const reviewsCollection = db.collection("reviews");

//   const result = await reviewsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//   res.send(result);
// });

// // ==================== REVIEW & FAVORITES ROUTES END ====================

// module.exports = router;
