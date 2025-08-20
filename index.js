const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const admin = require('firebase-admin');

const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// app.use(cors());
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'https://charity-express-d807c.web.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));



// JWT Middleware
//verifyToken



// Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oclat4d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// const admin = require("firebase-admin");

var serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


async function run() {
  try {
    // await client.connect();
    const db = client.db("CharityEx_DB");

    // Collections
    const donationsCollection = db.collection("donations");
    const reviewsCollection = db.collection("reviews");
    const favoritesCollection = db.collection("favorites");
    const transactionsCollection = db.collection("transactions");
    const usersCollection = db.collection("users");
    const requestsCollection = db.collection("requests");
    const charityRequestsCollection = db.collection("charity-request-status");
    const charityCollection = db.collection("charity");
    const cardRequest=db.collection("card");
    const featuredCollection = db.collection("featured");

    // Verify Restaurant Middleware
  // verifyToken middleware


const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
// console.log(authHeader);
    // 1. Header check
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({ message: "Unauthorized: No token provided" });
    }

    // 2. Token extract
    const token = authHeader.split(" ")[1];
// console.log(token);
    // 3. Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.status(403).send({ message: "Forbidden: Invalid or expired token" });
      }

      // 4. Save decoded data (email, role ইত্যাদি)
      req.user = decoded;

      next();
    });
  } catch (error) {
    console.error("verifyToken error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};





//////
//VERIFY CHARITY ....
const verifyRestaurant = async (req, res, next) => {
  console.log("Email from token:", req.user.email); // Debug

  const user = await usersCollection.findOne({ email: req.user.email });
  console.log("User from DB:", user); // Debug

  if (!user || user.role !== "restaurant") {
    return res.status(403).send({ message: "Forbidden access" });
  }
  next();
};






    //firebase tokenlksfjfasefjf
    const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // এখানে email, uid থাকবে
    next();
  } catch (error) {
    res.status(403).send({ message: "Forbidden" });
  }
};




    //restaurant lskfjsfdjfofjo;fj;ofjfojfo;jfo;rej





//VERIFY CHARITY ...
const verifyCharity = async (req, res, next) => {
  const email = req.user?.email;
  const user = await db.collection("users").findOne({ email });

if (!user || user.role?.toLowerCase() !== "charity") {
  return res.status(403).send({ message: "Forbidden: Charity access only" });
}

  next();
};





//VERITY ADMIN
const verifyAdmin = async (req, res, next) => {
  const email = req.user?.email;
  const user = await db.collection("users").findOne({ email });

  if (user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden" });
  }
  next();
};


////////////////////////////////

const roleMap = {
  'admin4@gmail.com': 'admin',
  'charity1@gmail.com': 'charity',
  'restaurant1@gmail.com': 'restaurant'
};

 app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!email || !name) {
    return res.status(400).json({ message: 'Name and Email required' });
  }

  try {
    const emailLower = email.toLowerCase();

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Role assign using roleMap
    const assignedRole = roleMap[emailLower] || 'user';

    const newUser = {
      name,
      email: emailLower,
      role: assignedRole.toLowerCase(),
      createdAt: new Date(),
      lastLogin: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: 'User registered',
      user: newUser
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}); 








 app.post('/login', async (req, res) => {
  const { email } = req.body;

  try {
    const emailLower = email.toLowerCase();

    const user = await usersCollection.findOne({ email: emailLower });
    if (user){
      const token = jwt.sign({ email: user.email, role: user.role.toLowerCase() }, process.env.JWT_SECRET, { expiresIn: '14d' });

    return res.json({ message: 'Login successful', user: { name: user.name, email: user.email, role: user.role }, token });

    }

    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    // Update lastLogin date
    await usersCollection.insertOne();

    // JWT token with user email and role
    const token = jwt.sign({ email: user.email, role: user.role.toLowerCase() }, process.env.JWT_SECRET, { expiresIn: '14d' });

    res.json({ message: 'Login successful', user: { name: user.name, email: user.email, role: user.role }, token });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}); 

/* app.get('/users/:email', async (req, res) => {
  const email = req.params.email;
  const user = await db.collection('users').findOne({ email });
  res.send(user); // এতে role থাকবে
});
 */
app.get('/users/:email', async (req, res) => {
  const email = req.params.email.toLowerCase();

  try {
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // photoURL সহ রিটার্ন করো
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      photoURL: user.photoURL || "/default.png"  // fallback
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});





    //lk;sfjfojfor;weijferwopifjopifjofijfoijerfopierfjopfj




    app.get("/stripe-test", (req, res) => {
      if (!process.env.PAYMENT_GATEWAY_KEY) {
        return res.status(500).send("Stripe key missing");
      }
      res.send("Stripe is configured correctly!");
    });

    //    ADMIN ROUTES

    //All Requests (Admin)
// GET /admin/role-requests  verifyToken, verifyAdmin,
app.get("/admin/role-requests",  async (req, res) => {
  const requests = await db.collection("charity_requests").find().toArray();
  res.send(requests);
});


//Approve Role Request editing ...
// PATCH /admin/role-requests/approve/:id admin chaile role change kore dite parbe .....
// PATCH /admin/role-requests/approve/:id
app.patch("/admin/role-requests/approve/:id", async (req, res) => {
  const id = req.params.id;

  // ১. রিকোয়েস্ট approve করো
  const request = await db.collection("charity_requests").findOne({ _id: new ObjectId(id) });

  if (!request) return res.status(404).send({ message: "Request not found" });

  // ২. স্ট্যাটাস আপডেট করো
  await db.collection("charity_requests").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Approved" } }
  );

  // ৩. ইউজারের role update করো
  await db.collection("users").updateOne(
    { email: request.email },
    { $set: { role: "Charity" } }
  );

  res.send({ message: "Request Approved and User role updated" });
});




// Reject Role Request admin chaile role chang kore dicche ...
// PATCH /admin/role-requests/reject/:id    verifyToken, verifyAdmin,
app.patch("/admin/role-requests/reject/:id",verifyToken, verifyAdmin,  async (req, res) => {
  const id = req.params.id;
  await db.collection("charity_requests").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Rejected" } }
  );
  res.send({ message: "Request Rejected" });
});





//GET ALL USERS (ADMIN ONLY)
// GET /admin/users
app.get("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch users" });
  }
});

// PATCH /admin/users/:id/role
app.patch("/admin/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update role" });
  }
});

// DELETE /admin/users/:id
app.delete("/admin/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete user" });
  }
});








    //Admin profile connecting ...
    // POST /users (signup or Google login এর পর user // POST /users (called on signup or first login)
app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    return res.send(existingUser);
  }

  const newUser = {
    name,
    email,
    role: "User",
    createdAt: new Date(),
  };

  const result = await db.collection("users").insertOne(newUser);
  res.send(result);
});


    //connecting ...
  /*   app.get("/users/:email", async (req, res) => {
      const email = decodeURIComponent(req.params.email);
      const user = await usersCollection.findOne({ email });

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      res.send(user);
    }); */

    //All verified donations
    app.get(
      "/admin/verified-donations",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const result = await donationsCollection
          .find({ status: "Verified" })
          .toArray();
        res.send(result);
      }
    );

    //feature a donations
    app.post(
      "/admin/feature-donation",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { donationId } = req.body;

        // Check if already featured
        const existing = await db
          .collection("featured")
          .findOne({ donationId });
        if (existing) {
          return res.status(400).send({ message: "Already featured" });
        }

        // Find donation details
        const donation = await donationsCollection.findOne({
          _id: new ObjectId(donationId),
        });
        if (!donation) {
          return res.status(404).send({ message: "Donation not found" });
        }

        // Insert into featured collection
        const featuredDonation = {
          donationId,
          title: donation.title,
          foodType: donation.foodType,
          restaurantName: donation.restaurantName,
          image: donation.image,
          date: new Date(),
        };

        const result = await db
          .collection("featured")
          .insertOne(featuredDonation);
        res.send(result);
      }
    );

    //all featured donations(public / home page)
    app.get("/featured/donations", async (req, res) => {
      try {
        const result = await featuredCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch featured donations", error: err.message });
      }
    });

    //👌👌👌👌👌👌👌👌👌👌👌👌👌👌
    //Verified Donations ফেচ (Feature করার জন্য)

// GET verified donations (Admin Feature page এ দেখানোর জন্য)
app.get("/donations/verified", async (req, res) => {
  const donations = await donationsCollection
    .find({ status: "Verified" })
    .toArray();
  res.send(donations);
});


// PATCH feature
app.patch("/donations/feature/:id", async (req, res) => {
  const { id } = req.params;
  const result = await donationsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isFeatured: true } }
  );
  res.send(result);
});

// GET featured
app.get("/donations/featured", async (req, res) => {
  const featuredDonations = await donationsCollection
    .find({ isFeatured: true })
    .toArray();
  res.send(featuredDonations);
});




    //👌👌👌👌👌👌👌👌👌👌👌👌👌👌
  
  



//😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎

    //All request (only admin)  verifyToken, verifyAdmin,
    app.get("/admin/requests",  async (req, res) => {
      const result = await requestsCollection
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    //delete admin only
    app.delete(
      "/admin/requests/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const result = await requestsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      }
    );

    ///belal
    app.get("/requests", async (req, res) => {
  try {
    const result = await requestsCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

///
app.patch("/requests/:id", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  try {
    const result = await cardRequest.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
//
app.delete("/requests/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await cardRequest.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});





//😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎

    app.get(
      "/admin/role-requests",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const result = await charityRequestsCollection
          .find()
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      }
    );

    app.patch(
      "/admin/role-requests/approve/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;

        // Get request
        const request = await charityRequestsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!request)
          return res.status(404).send({ message: "Request not found" });

        // Update user role
        await usersCollection.updateOne(
          { email: request.email },
          { $set: { role: "Charity" } }
        );

        // Update request status
        const result = await charityRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "Approved" } }
        );

        res.send(result);
      }
    );

    app.patch(
      "/admin/role-requests/reject/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;

        const result = await charityRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "Rejected" } }
        );

        res.send(result);
      }
    );


    //user role make Admin / Restaurant / Charity
// PATCH /users/role/:id verifyToken, verifyAdmin
app.patch("/users/role/:id",  async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    res.send({ success: true, result });
  } catch (err) {
    res.status(500).send({ message: "Failed to update role" });
  }
});


    // Get all donations (for admin)
    app.get("/admin/donations", async (req, res) => {
      const donations = await donationsCollection.find().toArray();
      res.send(donations);
    });

    // Verify donation
    app.patch("/admin/donations/verify/:id", async (req, res) => {
      const id = req.params.id;

      const result = await donationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "Verified" } }
      );

      res.send(result);
    });

    // Reject donation
    app.patch("/admin/donations/reject/:id", async (req, res) => {
      const id = req.params.id;

      const result = await donationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "Rejected" } }
      );

      res.send(result);
    });

    // Get all users
// GET /users  verifyToken, verifyAdmin,
app.get("/users",  async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch users" });
  }
});


    // Update role
    app.patch("/updateRole/:id", async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) return res.status(400).json({ message: "Role is required" });

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );
      res.send(result);
    });

// DELETE /users/:id admin only ...  verifyToken, verifyAdmin,
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    res.send({ success: true, result });
  } catch (err) {
    res.status(500).send({ message: "Failed to delete user" });
  }
});

//❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️

app.post("/card", async (req, res) => {
  const requestData = req.body;
  try {
    const result = await cardRequest.insertOne(requestData);
    res.send({ insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



//
// ধরছি তুমি Node.js Express ব্যবহার করছো এবং cardRequest হলো MongoDB collection instance

app.get("/card", async (req, res) => {
  try {
    const requests = await cardRequest.find({}).toArray();
    res.send(requests);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


//
app.patch("/card/:id/status", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body; // expect status like "confirmed"

  try {
    const result = await cardRequest.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status.toLowerCase() } }
    );
    if (result.matchedCount === 1) {
      res.send({ message: "Status updated" });
    } else {
      res.status(404).send({ message: "Request not found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//
app.delete("/card/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await cardRequest.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.send({ message: "Deleted successfully" });
    } else {
      res.status(404).send({ message: "Request not found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


//❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️



    //All donations (only admin)  verifyToken, verifyAdmin,
    app.get("/admin/donations",  async (req, res) => {
      const result = await donationsCollection
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    //verify donations
    app.patch(
      "/admin/donations/verify/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;

        const result = await donationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "Verified" } }
        );

        res.send(result);
      }
    );

    //reject donations
    app.patch(
      "/admin/donations/reject/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;

        const result = await donationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "Rejected" } }
        );

        res.send(result);
      }
    );

    // Checking admin by email
    app.get("/users/admin", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      res.send({ isAdmin: user?.role === "admin" });
    });

    // Admin Profile Route
    // GET: Get user role by email
    app.get("/users/:email/role", verifyAdmin, async (req, res) => {
      try {
        const email = req.params.email;

        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send({ role: user.role || "user" });
      } catch (error) {
        console.error("Error getting user role:", error);
        res.status(500).send({ message: "Failed to get role" });
      }
    });
//verifyToken, verifyAdmin,
    app.get("/admin/profile",verifyToken, verifyAdmin,  async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });

     if (!user || user.role.toLowerCase() !== 'admin') {
  return res.status(403).send({ message: "Forbidden" });
}


      res.send(user);
    });

    // Get all charity requests
    app.get("/admin/charity-requests", async (req, res) => {
      const result = await charityRequestsCollection
        .find()
        .sort({ date: -1 })
        .toArray();
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

      // Update related transaction
      const request = await charityRequestsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (request) {
        await transactionsCollection.updateOne(
          { transactionId: request.transactionId },
          { $set: { status } }
        );
      }

      res.send(result);
    });

    //  CHARITY ROUTES

    //USER J DATA TA PATHACCHE SEI DATA TA ADMIN ADMIN APPROVE AND REJECT KORBE
    // সব Charity role request load করার জন্য
app.get("/charity-requests", async (req, res) => {
  try {
    const requests = await charityRequestsCollection.find().toArray();
    res.send(requests);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
//charity-request/ approve id
app.patch("/charity-requests/approve/:id", async (req, res) => {
  const id = req.params.id;
  const request = await charityRequestsCollection.findOne({ _id: new ObjectId(id) });

  if (!request) return res.status(404).send({ message: "Request not found" });

  // 1. Update user's role to Charity
  await usersCollection.updateOne(
    { email: request.email },
    { $set: { role: "charity" } }
  );

  // 2. Update request status to Approved
  await charityRequestsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Approved" } }
  );

  res.send({ message: "Request approved & role updated" });
});
//charity-requests/reject/:id
// PATCH /charity-requests/reject/:id
app.patch("/charity-requests/reject/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await charityRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Rejected" } }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to reject request", error });
  }
});







    // Charity Profile //checking done
    app.get("/charity/profile", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const charityProfile = await charityCollection("charity").findOne({ email });
      res.send(charityProfile || {});
    });

    // Create Checkout Session
    app.post("/create-checkout-session", async (req, res) => {
      try {
        const { name, email, orgName, mission } = req.body;

        if (!name || !email || !orgName || !mission) {
          return res.status(400).send({ message: "All fields required" });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Charity Role Request - ${orgName}`,
                },
                unit_amount: 2500,
              },
              quantity: 1,
            },
          ],
          success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `http://localhost:5173/request-charity?cancelled=true`,
          metadata: { name, email, orgName, mission },
        });

        res.send({ url: session.url });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to create checkout session" });
      }
    });

    // Charity users
    app.get("/users/charity", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email, role: "charity" });
      res.send(user);
    });

    // Charity request list
    app.get("/charity/requests", async (req, res) => {
      const email = req.query.email;
      const result = await requestsCollection
        .find({ charityEmail: email })
        .toArray();
      res.send(result);
    });

    // Delete charity request
    app.delete("/charity/requests/:id", async (req, res) => {
      const id = req.params.id;
      const result = await charityRequestsCollection.deleteOne({
        _id: new ObjectId(id),
      });
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
      if (exists)
        return res
          .status(400)
          .send({ message: "Request already submitted or approved" });

      await charityRequestsCollection.insertOne({
        name,
        email,
        orgName,
        mission,
        transactionId,
        status: "Pending",
        date: new Date(),
      });

      await transactionsCollection.insertOne({
        transactionId,
        email,
        amount: 25,
        date: new Date(),
        purpose: "Charity Role Request",
        status: "Pending",
      });

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

    // GET My Pickups start pickup🛻🛻🛻🛻🛻🛻🛻
    
//verifyFbToken, verifyEmail, 
    app.get("/requests/pickups", async (req, res) => {
  const email = req.query.email;

  try {
    const filter = {
      charityEmail: email,
      status: "accepted",
    };

    const result = await requestsCollection
      .find(filter)
      .sort({ pickedUpAt: -1 })
      .toArray();

    res.send(result);
  } catch (err) {
    console.error("Error fetching picked-up requests:", err);
    res.status(500).send({ message: "Failed to fetch picked up requests" });
  }
});
//verifyFbToken,verifyCharity,
app.patch("/requests/picked-up/:reqId",  async (req, res) => {
  const reqId = req.params.reqId;
  const { donationId } = req.body;
  const requestUpdate = await requestsCollection.updateOne(
    { _id: new ObjectId(reqId) },
    { $set: { status: "Picked Up", pickupTime: new Date().toISOString() } }
  );
  const donationUpdate = await donationsCollection.updateOne(
    { _id: new ObjectId(donationId) },
    { $set: { donationStatus: "Picked Up" } }
  );
  res.send({
    modifiedCount: requestUpdate.modifiedCount + donationUpdate.modifiedCount,
    message: "Pickup confirmed",
  });
});



    // end pickup🛻🛻🛻🛻🛻🛻🛻

    
// received donations start👌👌👌👌👌👌👌👌
//verifyFbToken, verifyEmail,verifyCharity,
app.get("/requests/received",  async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }
  const result = await requestsCollection
    .find({ charityEmail: email, status: "Picked Up" })
    .sort({ requestedAt: -1 })
    .toArray();
  res.send(result);
});
app.get("/requests/latest", async (req, res) => {
  const result = await requestsCollection
    .find()
    .sort({ _id: -1 })
    .limit(3)
    .toArray();
  res.send(result);
});

// received donaions ends👌👌👌👌👌


    // app.get("/charity/pickups", async (req, res) => {
    //   const email = req.query.email;
    //   const result = await requestsCollection
    //     .find({ charityEmail: email, status: "Accepted" })
    //     .toArray();
    //   res.send(result);
    // });

    // // PUT Confirm Pickup
    // app.put("/charity/pickups/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const result = await requestsCollection.updateOne(
    //     { _id: new ObjectId(id) },
    //     { $set: { status: "Picked Up", pickupDate: new Date() } }
    //   );
    //   res.send(result);
    // });

    // GET Received Donations
    app.get("/charity/received", async (req, res) => {
      const email = req.query.email;
      const result = await requestsCollection
        .find({ charityEmail: email, status: "Picked Up" })
        .toArray();
      res.send(result);
  })

// index.js অথবা routes/payment.js done
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).send({ message: "Amount is required" });
    }

    // Stripe এ amount কে cents এ convert done
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
       automatic_payment_methods: { enabled: true },
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});


// GET /charity-requests 
app.get("/charity-requests", verifyAdmin, async (req, res) => {
  try {
    const requests = await db.collection("charity-requests").find().toArray();
    res.send(requests);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});




//transaction and admin approval system kora hocche ....
app.post("/charity-requests", async (req, res) => {
  try {
    const { name, email, organization, mission, transactionId, amount } = req.body;

    // Check if already pending or approved
    const existing = await charityRequestsCollection.findOne({
      email,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existing) {
      return res.status(400).send({ message: "Already requested or approved" });
    }

    const request = {
      name,
      email,
      organization,
      mission,
      transactionId,
      amount,
      status: "Pending",
      createdAt: new Date(),
    };

    await charityRequestsCollection.insertOne(request);
    res.send({ message: "Charity request submitted" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});



//❤️❤️❤️❤️❤️❤️❤️❤️❤️
app.post("/charity-requests", async (req, res) => {
  try {
    const { name, email, organization, mission, transactionId, amount } = req.body;

    // Validation
    if (!name || !email || !organization || !mission || !transactionId) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // Check duplicate pending/approved request
    const existing = await charityRequestsCollection.findOne({
      email,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existing) {
      return res.status(400).send({ message: "Already requested or approved" });
    }

    // Insert charity request (status Pending)
    const request = {
      name,
      email,
      organization,
      mission,
      transactionId,
      amount,
      status: "Pending",       // <-- Default status
      createdAt: new Date(),
    };

    await charityRequestsCollection.insertOne(request);

    // Insert transaction record (also Pending)
    await transactionsCollection.insertOne({
      transactionId,
      email,
      amount,
      purpose: "Charity Role Request",
      status: "Pending",       // <-- এখানে ও Pending থাকবে
      date: new Date(),
    });

    res.send({ message: "Charity request submitted successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});



//
app.get("/charity-requests/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const requests = await charityRequestsCollection
      .find({ email })
      .sort({ createdAt: -1 }) // সর্বশেষ আগে দেখাবে
      .toArray();

    res.send(requests);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});



//😒😒😒😒 Approve request admin (ADMIN ROLE)
// PATCH /charity-requests/approve/:id
app.patch("/charity-requests/approve/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // 1. Request status update
    const updateRequest = await charityRequestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Approved" } }
    );

    // 2. User role update
    const requestData = await charityRequestsCollection.findOne({ _id: new ObjectId(id) });
    if (requestData?.email) {
      await usersCollection.updateOne(
        { email: requestData.email },
        { $set: { role: "charity" } }
      );
    }

    res.send(updateRequest);
  } catch (error) {
    res.status(500).send({ message: "Failed to approve request", error });
  }
});


// Reject request
app.patch("/charity-requests/reject/:id", async (req, res) => {
  const id = req.params.id;
  const result = await charityRequestsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Rejected" } }
  );
  res.send(result);
});

//❤️❤️❤️❤️❤️❤️❤️❤️❤️



//charity admin ke request pathacche 
// GET: Check user request status
app.get("/charity-requests/:email", async (req, res) => {
  const email = req.params.email;
  const request = await charityRequestsCollection.findOne({ email });
  if (!request) {
    return res.send({ status: "None" });
  }
  res.send({ status: request.status });
});


// PATCH /charity-requests/:id
app.patch("/charity-requests/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "approved" or "rejected"

  try {
    const request = await db.collection("charity-requests").findOne({ _id: new ObjectId(id) });
    if (!request) return res.status(404).send({ message: "Request not found" });

    // If approved, update user role to charity
    if (status === "approved") {
      await db.collection("users").updateOne(
        { email: request.email },
        { $set: { role: "charity" } }
      );
    }

    // Update request status
    const result = await db.collection("charity-requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});






//transaction data getiing  connecting ....
// index.js এ transactionsCollection ব্যবহার করো
app.get("/transactions/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const transactions = await transactionsCollection
      .find({ email })
      .sort({ date: -1 }) // latest first
      .toArray();

    res.send(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

//transaction pending ....
app.get("/transactions", async (req, res) => {
  try {
    const transactions = await transactionsCollection
      .find()
      .sort({ date: -1 })
      .toArray();

    res.send(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});



    //Post transaction After Stripe payment success
app.post("/transactions", async (req, res) => {
  try {
    const { transactionId, email, amount, purpose, date } = req.body;

    const transaction = {
      transactionId,
      email,
      amount,
      purpose,
      date: date || new Date(),
    };

    await transactionsCollection.insertOne(transaction);
    res.send({ message: "Transaction saved" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


    // GET transactions for charity
    app.get("/charity/transactions", async (req, res) => {
      const email = req.query.email;
      const result = await transactionsCollection.find({ email }).toArray();
      res.send(result);
    });

    //   FAVORITES & REVIEWS

    //add to favorites connecting ...
    app.post("/favorites", async (req, res) => {
      const {
        userEmail,
        donationId,
        title,
        image,
        restaurantName,
        location,
        status,
        quantity,
      } = req.body;

      if (!userEmail || !donationId) {
        return res
          .status(400)
          .send({ message: "User email and donation ID are required" });
      }

      // Check if already saved
      const exists = await favoritesCollection.findOne({
        userEmail,
        donationId,
      });
      if (exists) {
        return res.status(400).send({ message: "Already saved to favorites" });
      }

      const favorite = {
        userEmail,
        donationId,
        title,
        image,
        restaurantName,
        location,
        status,
        quantity,
        date: new Date(),
      };

      const result = await favoritesCollection.insertOne(favorite);
      res.send(result);
    });

    //user favorites done

    // Get favorites done
    app.get("/favorites", async (req, res) => {
      const email = req.query.userEmail;
      if (!email) return res.status(400).send({ message: "Email is required" });
      console.log(email);

      const favorites = await favoritesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(favorites);
    });
    //  this is for faviorate all test
    app.get("/allFaviorateTest", async (req, res) => {
      const faviorateAll = await favoritesCollection.find().toArray();
      res.send(faviorateAll);
    });
    // Delete favorite done
    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const result = await favoritesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });





    app.get("/reviewsall", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });


//reviews section ee review dewar jonno get kora hoyeche
    // this is for get query data from reviews collection
    app.get("/reviews", async (req, res) => {
      const email = req.query.userEmail;
      console.log(email);

      if (!email) return res.status(400).send({ message: "Email is required" });

      const reviews = await reviewsCollection
        .find({ userEmail: email })
        .toArray();
      res.send(reviews);
    });

    // POST Review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      review.reviewDate = new Date();
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // Delete review done
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });



    //  RESTAURANT ROUTES

    // Get user role
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ role: user?.role || "user" });
    });

    // Add donation (protected)
    app.post("/donations",  verifyToken, verifyRestaurant,async (req, res) => {
  const donation = req.body;
  donation.status = "Pending";
  donation.createdAt = new Date();
  const result = await donationsCollection.insertOne(donation);
     res.send(result);
    });
  

    // Delete donation
    app.delete("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const result = await donationsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Update donation
    app.patch("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await donationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // Get donation requests
    app.get("/requests", async (req, res) => {
      const email = req.query.email;
      const result = await requestsCollection
        .find({ restaurantEmail: email })
        .toArray();
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

    // PUBLIC DONATION ROUTES

    // Get all donations
    app.get("/donations", async (req, res) => {
      const donations = await donationsCollection.find({status: "Verified"}).toArray();
      res.send(donations);
    });

    // Get donation details
    app.get("/donations/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id))
        return res.status(400).send({ error: "Invalid donation ID" });

      const donation = await donationsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!donation)
        return res.status(404).send({ error: "Donation not found" });

      res.send(donation);
    });


    //donations details page  to  available , pick-up, request button rendering ....
    // GET verified donations for homepage
    app.get('/donations', async (req, res) => {
      const result = await donationsCollection.find({ verified: true }).toArray();
      res.send(result);
    });

    // GET single donation by ID
    app.get('/donations/:id', async (req, res) => {
      const id = req.params.id;
      const result = await donationsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // PATCH update donation status
app.patch('/donations/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body; // expected: available/requested/accepted/pickedup
  try {
    const result = await donationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status.toLowerCase() } } // সবসময় lowercase save
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


    // POST create new donation
    app.post('/donations', async (req, res) => {
      const donation = req.body;
      donation.status = 'available';
      donation.verified = false;
      const result = await donationsCollection.insertOne(donation);
      res.send(result);
    });


// GET reviews by donationId
app.get('/reviews', async (req, res) => {
  const donationId = req.query.donationId;
  if (!donationId) return res.status(400).send({ error: "donationId is required" });
  const reviews = await reviewsCollection.find({ donationId }).toArray();
  res.send(reviews);
});

// POST add a review
app.post('/reviews', async (req, res) => {
  const review = req.body;
  // validation ...
  const result = await reviewsCollection.insertOne(review);
  res.send(result);
});

// POST create donation request
app.post('/requests', async (req, res) => {
  const requestData = req.body;
  // validation ...
  const result = await requestsCollection.insertOne(requestData);
  res.send(result);
});

//LatestCharityRequests
app.get("/requests/latest", async (req, res) => {
  const result = await requestsCollection
    .find()
    .sort({ _id: -1 })
    .limit(3)
    .toArray();
  res.send(result);
});




    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // keep connection open
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Donation Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
