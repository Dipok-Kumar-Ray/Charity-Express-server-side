// const { client } = require("../config/db");

// const verifyRestaurant = async (req, res, next) => {
//   const email = req.decoded.email;
//   const db = client().db("CharityEx_DB");
//   const usersCollection = db.collection("users");

//   const user = await usersCollection.findOne({ email });
//   if (user?.role !== "restaurant") {
//     return res.status(403).send({ message: "forbidden access" });
//   }
//   next();
// };

// module.exports = verifyRestaurant;
