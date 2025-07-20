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

    const usersCollection = db.collection("users");


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



    //stripe transaction
    // POST: Create Checkout Session
    app.post("/create-checkout-session", async (req, res) => {
      const { orgName, email } = req.body;

      if (!orgName || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Charity Role Request for ${orgName}`,
                },
                unit_amount: 1000, // $10 in cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: "http://localhost:5173/success",
          cancel_url: "http://localhost:5173/cancel",
          metadata: {
            email,
            orgName,
          },
        });

        res.json({ url: session.url }); // Send session URL
      } catch (err) {
        console.error("Stripe session error:", err.message);
        res.status(500).json({ error: err.message });
      }
    });

    app.delete("/transactions/:id", async (req, res) => {
      const id = req.params.id;
      const result = await db
        .collection("transactions")
        .deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/transactions/:id", async (req, res) => {
      const { status } = req.body;
      const id = req.params.id;

      const result = await db.collection("transactions").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { status },
        }
      );
      res.send(result);
    });

    app.get("/transactions", async (req, res) => {
      const email = req.query.email;
      const result = await db
        .collection("transactions")
        .find({ email })
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    app.post("/transactions", async (req, res) => {
      const transaction = req.body;

      if (!transaction?.email || !transaction?.transactionId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      transaction.status = "Pending";
      transaction.date = new Date();

      const result = await db.collection("transactions").insertOne(transaction);
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
      const result = await reviewCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    //dashboard favorite
    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
      const result = await favoritesCollection.find({ email }).toArray();
      res.send(result);
    });
    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const result = await favoritesCollection.deleteOne({
        _id: new ObjectId(id),
      });
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
