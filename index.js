


const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://assignment-12-newspaper.web.app",
    "https://assignment-12-newspaper.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
}));

app.use(express.json());
app.use(cookieParser());

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  // console.log(token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // console.log(err);
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.yh51je0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const articlesCollection = client.db("newswispDB").collection("articles");
    const viewCollection = client.db("newswispDB").collection("views");
    const publishersCollection = client.db("newswispDB").collection("publishers");
    const usersCollection = client.db("newswispDB").collection("users");

    // Verify Admin Middleware
    const verifyAdmin = async (req, res, next) => {
      // console.log('Verifying admin');
      const user = req.user;
      const query = { email: user?.email };
      const result = await usersCollection.findOne(query);
      if (!result || result?.role !== 'admin') {
        return res.status(401).send({ message: 'unauthorized access!!' });
      }
      next();
    };

    app.get("/articles", async (req, res) => {
      try {
        const result = await articlesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });
    app.get("/articles-admin",verifyToken, verifyAdmin, async (req, res) => {
      try {
        const size = parseInt(req.query.size);
        const page = parseInt(req.query.page) - 1;  
    
        const totalArticles = await articlesCollection.countDocuments(); 
        const articles = await articlesCollection.find()
          .skip(page * size)
          .limit(size)
          .toArray();
    
        res.send({
          totalArticles,
          articles,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });
    app.get("/articles-route", async (req, res) => {
      try {
        const { publisher, tags, title } = req.query;
        const query = { status: "Approved" };
    
        if (publisher) {
          query.publisher = publisher;
        }
    
        if (tags) {
          query.tags = { $in: tags.split(",") }; // Use $in instead of $all
        }
        
    
        if (title) {
          query.title = { $regex: title, $options: "i" }; // Case-insensitive regex search
        }
    
        const articles = await articlesCollection.find(query).toArray();
        const totalArticles = articles.length; // Total count without pagination
    
        res.send({
          totalArticles,
          articles,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });
    
    

    // Auth related API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });

    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true });
        // console.log('Logout successful');
      } catch (err) {
        res.status(500).send(err);
      }
    });

    app.post("/articles", async (req, res) => {
      try {
        const addData = req.body;
        const result = await articlesCollection.insertOne(addData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/article/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await articlesCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/views", async (req, res) => {
      try {
        const addView = req.body;
        const result = await viewCollection.insertOne(addView);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/publishers",  async (req, res) => {
      try {
        const addPublisher = req.body;
        const result = await publishersCollection.insertOne(addPublisher);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/publishers",  async (req, res) => {
      const result = await publishersCollection.find().toArray();
      res.send(result);
    });
    // app.get("/users-counter",  async (req, res) => {
    //   const result = await usersCollection.find().toArray();
    //   console.log(result);
    //   res.send(result);
    // });
    app.post('/articles/:articleId/increment-view', async (req, res) => {
      const { articleId } = req.params;
    
      try {
        const article = await Article.findById(articleId);
    
        if (!article) {
          return res.status(404).json({ error: 'Article not found' });
        }
    
        // Increment view count
        article.views += 1;
        await article.save();
    
        return res.status(200).json({ message: 'View count incremented successfully' });
      } catch (error) {
        console.error('Error incrementing view count:', error);
        return res.status(500).json({ error: 'Failed to increment view count' });
      }
    });
    app.get("/users-counter", async (req, res) => {
      try {
          const users = await usersCollection.find().toArray();
  
          const allUsersCount = users.length;
          const normalUsersCount = users.filter(user => user.role === 'guest').length;
          const premiumUsersCount = users.filter(user => user.role === 'premium').length;
  
          res.send({
              allUsersCount,
              normalUsersCount,
              premiumUsersCount,
          });
      } catch (error) {
          console.error(error);
          res.status(500).send("Internal Server Error");
      }
  });
  
  

    // Get all users data from db
    // app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    //   const result = await usersCollection.find().toArray();
    //   res.send(result);
    // });

    

    app.get("/users", async (req, res) => {
      try {
        const size = parseInt(req.query.size) || 10; 
        const page = parseInt(req.query.page) - 1 || 0; 
    
        const totalUsers = await usersCollection.countDocuments(); 
        const users = await usersCollection.find()
          .skip(page * size)
          .limit(size)
          .toArray();
    
        res.send({
          totalUsers,
          users,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });
    app.get("/articles", async (req, res) => {
      try {
        const { publisher, tags, title, size = 10, page = 1 } = req.query;
        const query = { status: "Approved" };
    
        if (publisher) {
          query.publisher = publisher;
        }
    
        if (tags) {
          query.tags = { $all: tags.split(",") }; 
        }
    
        if (title) {
          query.title = { $regex: title, $options: "i" }; 
        }
    
        const totalArticles = await articlesCollection.countDocuments(query);
        const articles = await articlesCollection.find(query)
          .skip((page - 1) * size)
          .limit(parseInt(size))
          .toArray();
    
        res.send({
          totalArticles,
          articles,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });
    

    // Save a user data in db
    app.put('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        if (user.status === 'Requested') {
          const result = await usersCollection.updateOne(query, {
            $set: { status: user?.status },
          });
          return res.send(result);
        } else {
          return res.send(isExist);
        }
      }

      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(`Looking for user with email: ${email}`);
      const result = await usersCollection.findOne({ email });
      if (result) {
        res.send(result);
      } else {
        res.status(404).send({ message: "User not found" });
      }
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { role: 'admin' }
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
     


app.patch('/article/:id', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const update = req.body;

  try {
    const result = await articlesCollection.updateOne(
      { _id: new ObjectId(id) }, 
      { $set: update }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Article status updated successfully', modifiedCount: result.modifiedCount });
    } else {
      res.status(404).json({ message: 'Article not found or no changes applied' });
    }
  } catch (error) {
    console.error("Error updating article status:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
  
    
    

    // app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    
    //   let updatedField = {};
    //   if (req.body.role) {
    //     updatedField = {
    //       $set: { role: req.body.role }
    //     };
    //   } else if (req.body.status) {
    //     updatedField = {
    //       $set: { status: req.body.status }
    //     };
    //   } else {
    //     return res.status(400).json({ message: "Invalid update operation" });
    //   }
    
    //   try {
    //     const result = await usersCollection.updateOne(filter, updatedField);
    //     res.json(result);
    //   } catch (error) {
    //     console.error("Error updating user:", error);
    //     res.status(500).json({ message: "Error updating user" });
    //   }
    // });
    

    app.get("/my-articles/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await articlesCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/article/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await articlesCollection.deleteOne(query);
      res.send(result);
    });


    app.post("/articles/decline", async (req, res) => {
      try {
        const { articleId, reason } = req.body;
        const result = await articlesCollection.updateOne(
          { _id: new ObjectId(articleId) },
          { $set: { status: "Declined", declineReason: reason } }
        );
        if (result.modifiedCount > 0) {
          res.send({ message: "Article declined successfully" });
        } else {
          res.status(404).send({ message: "Article not found" });
        }
      } catch (error) {
        console.error("Error declining article:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get('/admin-stat',verifyToken, verifyAdmin, async (req, res) => {
      const articleDetails = await articlesCollection.aggregate([
          { $group: { _id: "$publisher", count: { $sum: 1 } } }
      ]).toArray();
      
      const responseData = articleDetails.map(item => [item._id, item.count]);
      
      // console.log(responseData);
      res.send(responseData);
  });
    
  app.patch('/update/:id', async (req, res) => {
    const ar = req.body
  const id = req.params.id;
  // const articleData = req.body;
  const filter = { _id: new ObjectId(id) }

  const updateDoc = {
    $set: {
      title: ar.title,
      description:ar.description,
      image:ar.image
    },
  };
  const result = await articlesCollection.updateOne(filter, updateDoc);
res.send(result)
});


app.get('/update/:id', async (req, res) => {
  const id = req.params.id;
  // const articleData = req.body;
  const query = { _id: new ObjectId(id) };

    const result = await articlesCollection.findOne(query);

     res.send(result)
});



  } finally {
    // Do not close the client connection in a long-running server
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});


