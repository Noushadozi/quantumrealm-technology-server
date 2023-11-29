const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x4h5cla.mongodb.net/?retryWrites=true&w=majority`;

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

    const reviewCollection = client.db("emDB").collection("reviews");
    const servicesCollection = client.db("emDB").collection("services");
    const usersCollection = client.db("emDB").collection("users");

    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
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

    app.get("/all-verified-employee", async (req, res) => {
      const query1 = { role: "Employee" } && { verified: true };
      const query2 = { role: "HR" };
      const result = await usersCollection
        .find({ $or: [query1, query2] })
        .toArray();
        res.send(result);
      });
      
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

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


    app.patch("/userTask/:email", async (req, res) => {
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
    });

    app.patch("/user-verification/:id", async (req, res) => {
      const id = req.params.id;
      const newVerification = req.body;
      console.log(newVerification);
      const query = { _id: new ObjectId(id) };
      const verified = {
        $set: {
          verified: !newVerification.verified,
        },
      };
      const result = usersCollection.updateOne(query, verified);
      res.send(result);
    });

    app.patch("/user-payment/:id", async (req, res) => {
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

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
