const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "https://employee-management-31485.web.app",
      "https://employee-management-31485.firebaseapp.com/",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x4h5cla.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const reviewsCollection = client.db("qtDB").collection("reviews");
    const servicesCollection = client.db("qtDB").collection("services");
    const usersCollection = client.db("qtDB").collection("users");

    const verifyAdmin = async (req, res, next) => {
      const email = req?.user?.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "Admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyHR = async (req, res, next) => {
      const email = req?.user?.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "HR";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyEmployee = async (req, res, next) => {
      const email = req?.user?.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "Employee";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get(
      "/all-verified-employee",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const query1 = { role: "Employee" } && { verified: true };
        const query2 = { role: "HR" };
        const result = await usersCollection
          .find({ $or: [query1, query2] })
          .toArray();
        res.send(result);
      }
    );

    app.get("/employees", verifyToken, verifyHR, async (req, res) => {
      const query = { role: "Employee" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get(
      "/privateInfo/:email",
      verifyToken,
      verifyEmployee,
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      }
    );

    app.get("/usersInfo/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/user-promote/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateUser = {
        $set: {
          role: "HR",
        },
      };
      const result = await usersCollection.updateOne(
        query,
        updateUser,
        options
      );
      res.send(result);
    });

    app.delete("/fire-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.patch(
      "/userTask/:email",
      verifyToken,
      verifyEmployee,
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const options = { upsert: true };
        const newTasks = req.body;
        const updatedTask = {
          $set: {
            tasks: newTasks,
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updatedTask,
          options
        );
        res.send(result);
      }
    );

    app.patch("/user-verification/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const newVerification = req.body;
      const query = { _id: new ObjectId(id) };
      const verified = {
        $set: {
          verified: !newVerification.verified,
        },
      };
      const result = usersCollection.updateOne(query, verified);
      res.send(result);
    });

    app.patch("/user-payment/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const newPayments = req.body;
      const options = { upsert: true };
      const updatedPayments = {
        $set: {
          payments: newPayments,
        },
      };
      const result = await usersCollection.updateOne(
        query,
        updatedPayments,
        options
      );
      res.send(result);
    });

  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("em running");
});

app.listen(port, () => {
  console.log(`prt is running on ${port}`);
});
