const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

//Must remove "/" from your production URL
app.use(
  cors({
    origin: [
      "http://localhost:5173"
    //   "https://assignment-11-volunteer.web.app",
    //   "https://assignment-11-volunteer.firebaseapp.com",
    ],
    credentials: true,
  })
);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.yh51je0.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;
// console.log(uri);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const articlesCollection = client.db('newswispDB').collection('articles');
    const viewCollection = client.db('newswispDB').collection('views');
    const publishersCollection = client.db('newswispDB').collection('publishers');
    const usersCollection = client.db('newswispDB').collection('users');


    app.get('/articles', async (req, res) => {
      const result = await articlesCollection.find().toArray();
      res.send(result);
    });

    app.post('/articles', async (req, res) => {
      const addData = req.body;
      const result = await articlesCollection.insertOne(addData);
      res.send(result);
    });
    
    app.get('/article/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await articlesCollection.findOne(query);
      res.send(result);
    });
    
    app.post('/views', async (req, res) => {
      const addView = req.body;
      const result = await viewCollection.insertOne(addView);
      res.send(result);
    });

    app.post('/publishers', async (req, res) => {
      const addPublisher = req.body;
      const result = await publishersCollection.insertOne(addPublisher);
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = {email : user.email}
      const existingUser = await usersCollection.findOne(query)
      if (existingUser){
        return res.send({message: 'user already exists'})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // const status = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'admin'
          }
        }
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send({ error: "An error occurred while updating the post" });
      }
    });

    

  // Connect the client to the server	(optional starting in v4.7)
//   await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
         // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});