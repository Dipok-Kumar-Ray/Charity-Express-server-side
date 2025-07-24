// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");

// // Load environment variables
// dotenv.config();

// // App setup
// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// connectDB();

// // Routes
// app.use("/admin", require("./routes/adminRoutes"));
// app.use("/charity", require("./routes/charityRoutes"));
// app.use("/restaurant", require("./routes/restaurantRoutes"));
// app.use("/donations", require("./routes/donationRoutes"));
// app.use("/users", require("./routes/userRoutes"));
// app.use("/reviews", require("./routes/reviewRoutes"));

// // Root route
// app.get("/", (req, res) => {
//   res.send("Donation Server is running");
// });

// // Start server
// app.listen(port, () => {
//   console.log(`Server is running on port : ${port}`);
// });
