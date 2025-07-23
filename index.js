const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

//Middleware
app.use(cors());
app.use(express.json());

// const stripe = stripe(process.env.PAYMENT_GATEWAY_KEY);
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

// const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oclat4d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("CharityEx_DB");

    //Donations Collection
    const donationsCollection = db.collection("donations");

    //reviews collecitons
    const reviewsCollection = db.collection("reviews");

    //favourites collecitons
    const favoritesCollection = db.collection("favorites");

    //dashboard transactions history
    const transactionsCollection = db.collection("transactions");

    const usersCollection = db.collection("users");

    //requests colletions
    const requestsCollection = db.collection("requests");

    //charity requestsCollections
    const charityRequestsCollection = db.collection("charity-request-status");




            //ADMIN AQCUISTIIONS START


// Get all charity requests (Admin only)
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


            //ADMIN AQCUISTIIONS END




            //CHARITY  AQCUISITONS START


    // POST /charity-request
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


app.get("/charity-request-status", async (req, res) => {
  const email = req.query.email;
  const result = await charityRequestsCollection.findOne({
    email,
    status: { $in: ["Pending", "Approved"] },
  });

  res.send({ exists: !!result });
});



// POST /create-payment-intent
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe uses cents
    currency: "usd",
    payment_method_types: ["card"],
  });

  res.send({ clientSecret: paymentIntent.client_secret });
});


// GET /transactions?email=user@example.com
app.get("/transactions", async (req, res) => {
  const email = req.query.email;
  const result = await transactionsCollection
    .find({ email })
    .sort({ date: -1 })
    .toArray();
  res.send(result);
});


// GET /favorites?email=
app.get("/favorites", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: "Email is required" });

  const favorites = await favoritesCollection.find({ email }).toArray();
  res.send(favorites);
});

// DELETE /favorites/:id
app.delete("/favorites/:id", async (req, res) => {
  const id = req.params.id;
  const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

//reviews email id
app.get("/reviews", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: "Email is required" });

  const reviews = await reviewsCollection.find({ email }).toArray();
  res.send(reviews);
});

//reviews delete
app.delete("/reviews/:id", async (req, res) => {
  const id = req.params.id;
  const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});


//transactions email id
app.get("/transactions", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: "Email is required" });

  const transactions = await transactionsCollection
    .find({ email })
    .sort({ date: -1 })
    .toArray();
  res.send(transactions);
});

            //CHARITY AQCUISITIONS END


            //RESTAURANT ROLE START
//My donations
app.get("/donations", async (req, res) => {
  const email = req.query.email;
  const result = await donationsCollection.find({ restaurantEmail: email }).toArray();
  res.send(result);
});

//donations delete
app.delete("/donations/:id", async (req, res) => {
  const id = req.params.id;
  const result = await donationsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

//donations update
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



//request for restaurant donations
app.get("/requests", async (req, res) => {
  const email = req.query.email;
  const result = await requestsCollection.find({ restaurantEmail: email }).toArray();
  res.send(result);
});


//accept and reject a requested
app.patch("/requests/:id", async (req, res) => {
  const id = req.params.id;
  const { action, donationId } = req.body;

  const updateCurrent = await requestsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: action } }
  );

  // If accepted, reject others for same donation
  if (action === "Accepted") {
    await requestsCollection.updateMany(
      {
        _id: { $ne: new ObjectId(id) },
        donationId: donationId,
      },
      { $set: { status: "Rejected" } }
    );
  }

  res.send(updateCurrent);
});



            
            //RESTAURANT ROLE END


    //getting all role
    app.get('/users/role', async(req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({email});
      res.send(user);
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const user = await usersCollection.find().toArray();
      res.send(user);
    });

    //role updata


app.patch("/updateRole/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // ✅ destructure from body

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const query = { _id: new ObjectId(id) };

    const result = await usersCollection.updateOne(query, {
      $set: { role }, // ✅ role will be string now
    });

    res.send(result);
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Add new donation
app.post("/donations", async (req, res) => {
  const donation = req.body;
  // Default status set as Pending
  donation.status = "Pending";
  donation.createdAt = new Date();

  const result = await donationsCollection.insertOne(donation);
  res.send(result);
});


    //donations getting
    app.get("/donations", async (req, res) => {
      try {
        const donations = await donationsCollection.find().toArray();
        res.send(donations);
      } catch (error) {
        console.error("Error fetching donations:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    //donations details page
    app.get("/donations/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid donation ID" });
        }

        const query = { _id: new ObjectId(id) };
        const donation = await donationsCollection.findOne(query);

        if (!donation) {
          return res.status(404).send({ error: "Donation not found" });
        }

        res.send(donation);
      } catch (error) {
        console.error("Error fetching donation:", error.message);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Donation Server is running");
});
app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
