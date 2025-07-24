const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

//stripe payment system
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);


   //JWT Middleware

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};


   //Database Connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oclat4d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("CharityEx_DB");

    // Collections
    const donationsCollection = db.collection("donations");
    const reviewsCollection = db.collection("reviews");
    const favoritesCollection = db.collection("favorites");
    const transactionsCollection = db.collection("transactions");
    const usersCollection = db.collection("users");
    const requestsCollection = db.collection("requests");
    const charityRequestsCollection = db.collection("charity-request-status");


      // Verify Restaurant Middleware

    const verifyRestaurant = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (user?.role !== "restaurant") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };


      // ADMIN ROUTES


    // Get all charity requests
    app.get("/admin/charity-requests", async (req, res) => {
      const result = await charityRequestsCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    // Update status of a charity request
    app.patch("/admin/charity-requests/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const result = await charityRequestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      // update transaction status as well
      const request = await charityRequestsCollection.findOne({ _id: new ObjectId(id) });

      if (request) {
        await transactionsCollection.updateOne(
          { transactionId: request.transactionId },
          { $set: { status } }
        );
      }

      res.send(result);
    });


      // CHARITY ROUTES


    // Charity Profile
    app.get("/charity/profile", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const charityProfile = await db.collection("charity").findOne({ email });
      res.send(charityProfile || {});
    });

// GET /charity/requests?email=
app.get("/charity/requests", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ message: "Email required" });
    }

    // সরাসরি email দিয়ে filter করো
    const result = await charityRequestsCollection.find({ email }).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching charity requests:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


    // Delete charity request
app.delete("/charity/requests/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await charityRequestsCollection.deleteOne(query);
  res.send(result);
});

    // Create charity request
    app.post("/charity-request", async (req, res) => {
      const { name, email, orgName, mission, transactionId } = req.body;

      if (!name || !email || !orgName || !mission || !transactionId) {
        return res.status(400).send({ message: "All fields are required" });
      }

      const exists = await charityRequestsCollection.findOne({
        email,
        status: { $in: ["Pending", "Approved"] },
      });

      if (exists) {
        return res.status(400).send({ message: "Request already submitted or approved" });
      }

      // Insert into charityRequests
      const charityRequest = {
        name,
        email,
        orgName,
        mission,
        transactionId,
        status: "Pending",
        date: new Date(),
      };
      await charityRequestsCollection.insertOne(charityRequest);

      // Insert into transactions
      const transaction = {
        transactionId,
        email,
        amount: 25,
        date: new Date(),
        purpose: "Charity Role Request",
        status: "Pending",
      };
      await transactionsCollection.insertOne(transaction);

      res.send({ success: true });
    });

    // Charity request status check
    app.get("/charity-request-status", async (req, res) => {
      const email = req.query.email;
      const result = await charityRequestsCollection.findOne({
        email,
        status: { $in: ["Pending", "Approved"] },
      });

      res.send({ exists: !!result });
    });

    // GET My Pickups
app.get("/charity/pickups", async (req, res) => {
  const email = req.query.email;
  const result = await requestsCollection
    .find({ charityEmail: email, status: "Accepted" })
    .toArray();
  res.send(result);
});

// PUT Confirm Pickup
app.put("/charity/pickups/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: { status: "Picked Up", pickupDate: new Date() },
  };
  const result = await requestsCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// GET Received Donations
app.get("/charity/received", async (req, res) => {
  const email = req.query.email;
  const result = await requestsCollection
    .find({ charityEmail: email, status: "Picked Up" })
    .toArray();
  res.send(result);
});


     //  PAYMENT ROUTES


    // Create Payment Intent
    app.post("/create-payment-intent", async (req, res) => {
      const { amount } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses cents
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({ clientSecret: paymentIntent.client_secret });
    });

    // After Stripe payment success
app.post("/transactions", async (req, res) => {
  const transaction = req.body; 
  transaction.date = new Date();
  transaction.status = "Approved";
  const result = await transactionsCollection.insertOne(transaction);
  res.send(result);
});

// GET transactions for charity
app.get("/charity/transactions", async (req, res) => {
  const email = req.query.email;
  const result = await transactionsCollection.find({ email }).toArray();
  res.send(result);
});

 
      // FAVORITES & REVIEWS
 

    // Get favorites
    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      const favorites = await favoritesCollection.find({ email }).toArray();
      res.send(favorites);
    });

    // Delete favorite
    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Get reviews
    app.get("/reviews", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      const reviews = await reviewsCollection.find({ email }).toArray();
      res.send(reviews);
    });

    // POST Review
app.post("/reviews", async (req, res) => {
  const review = req.body; 
  review.reviewDate = new Date(); // save review date
  const result = await reviewsCollection.insertOne(review);
  res.send(result);
});


    // Delete review
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


      // RESTAURANT ROUTES
 

    // Get user role
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ role: user?.role || "user" });
    });

    // Add donation (protected)
    app.post("/donations", verifyJWT, verifyRestaurant, async (req, res) => {
      const donation = req.body;
      donation.status = "Pending";
      donation.createdAt = new Date();

      const result = await donationsCollection.insertOne(donation);
      res.send(result);
    });

    // Get my donations
    app.get("/donations", async (req, res) => {
      const email = req.query.email;
      const result = await donationsCollection.find({ restaurantEmail: email }).toArray();
      res.send(result);
    });

    // Delete donation
    app.delete("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const result = await donationsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update donation
    app.patch("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await donationsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title: updatedData.title,
            foodType: updatedData.foodType,
            quantity: updatedData.quantity,
            pickupTime: updatedData.pickupTime,
            location: updatedData.location,
            image: updatedData.image,
          },
        }
      );

      res.send(result);
    });

    // Get donation requests
    app.get("/requests", async (req, res) => {
      const email = req.query.email;
      const result = await requestsCollection.find({ restaurantEmail: email }).toArray();
      res.send(result);
    });

    // Accept/Reject request
    app.patch("/requests/:id", async (req, res) => {
      const id = req.params.id;
      const { status, donationId } = req.body;

      const result = await requestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      if (status === "Accepted") {
        await requestsCollection.updateMany(
          { donationId: donationId, _id: { $ne: new ObjectId(id) } },
          { $set: { status: "Rejected" } }
        );
      }

      res.send(result);
    });


       //USER ROUTES
 

    // Get all users
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    // Add user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Update user role
    app.patch("/updateRole/:id", async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.updateOne(query, { $set: { role } });

      res.send(result);
    });


       //PUBLIC DONATION ROUTES


    // Get all donations
    app.get("/donations", async (req, res) => {
      const donations = await donationsCollection.find().toArray();
      res.send(donations);
    });

    // Get donation details
    app.get("/donations/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid donation ID" });
      }

      const donation = await donationsCollection.findOne({ _id: new ObjectId(id) });

      if (!donation) {
        return res.status(404).send({ error: "Donation not found" });
      }

      res.send(donation);
    });

 
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Do not close client here to keep server alive
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Donation Server is running");
});


app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
