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


const stripe = stripe(process.env.STRIPE_SECRET_KEY);



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
    const donationCollection = db.collection("donations");

    //reviews collecitons
    const reviewCollection = db.collection("reviews");

    //favourites collecitons
    const favoritesCollection = db.collection("favorites");

    //dashboard transactions history
    const transactionsCollection = db.collection("transactions");

//stripe transaction
// POST: Create Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  const { name, email, organization } = req.body;

  if (!name || !email || !organization) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Charity Role Activation",
              description: `For organization: ${organization}`,
            },
            unit_amount: 500, // $5.00
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cancel",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});



    //dashboard transactions
    app.get("/transactions", async (req, res) => {
  const email = req.query.email;
  const result = await transactionsCollection.find({ email }).toArray();
  res.send(result);
});


    //dashboard reviews
    app.get("/reviews", async (req, res) => {
  const email = req.query.email;
  const result = await reviewCollection.find({ email }).toArray();
  res.send(result);
});

app.delete("/reviews/:id", async (req, res) => {
  const id = req.params.id;
  const result = await reviewCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});




    //dashboard favorite
    app.get("/favorites", async(req, res) => {
      const email = req.query.email;
      const result = await favoritesCollection.find({email}).toArray();
      res.send(result);
    })
    app.delete("/favorites/:id", async (req, res) => {
  const id = req.params.id;
  const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});


    //reviews
    //  GET reviews for a specific donation
    app.get("/reviews/:donationId", async (req, res) => {
      try {
        const { donationId } = req.params;
        const reviews = await reviewCollection
          .find({ donationId })
          .sort({ createdAt: -1 }) // latest first
          .toArray();
        res.send(reviews);
      } catch (err) {
        console.error("GET reviews error:", err);
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
    });

    //  POST a new review
    app.post("/reviews", async (req, res) => {
      try {
        const review = req.body;
        review.createdAt = new Date(); // Add timestamp
        const result = await reviewCollection.insertOne(review);
        res.send(result);
      } catch (err) {
        console.error("POST review error:", err);
        res.status(500).send({ error: "Failed to post review" });
      }
    });

    //  DELETE a review by ID
    app.delete("/reviews/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await reviewCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        console.error("DELETE review error:", err);
        res.status(500).send({ error: "Failed to delete review" });
      }
    });

    // Favorite POST Route
    app.post("/favorites", async (req, res) => {
      try {
        const favorite = req.body;
        console.log("Incoming favorite data:", favorite);

        if (!favorite.donationId || !favorite.userEmail) {
          return res
            .status(400)
            .json({ message: "Missing donationId or userEmail" });
        }

        const result = await favoritesCollection.insertOne(favorite);
        res.send(result);
      } catch (error) {
        console.error("POST /favorites error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });


    //donations added
    app.post("/donations", async (req, res) => {
  const donation = req.body;
  const result = await donationCollection.insertOne(donation);
  res.send(result);
});


    //donations getting
    app.get("/donations", async (req, res) => {
      try {
        const donations = await donationCollection.find().toArray();
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
        const donation = await donationCollection.findOne(query);

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
