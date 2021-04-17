const express = require('express');
require('dotenv').config();
const port = 5000;
const DB_NAME = process.env.DB_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
// console.log(DB_NAME);
const ObjectId = require('mongodb').ObjectId;
const MongoClient = require('mongodb').MongoClient;

// Old
// const uri = `mongodb+srv://Book-Life:${DB_PASSWORD}@cluster0.zsxmj.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;

// Current
const uri = `mongodb+srv://Book-Life:${DB_PASSWORD}@cluster0.vlgzx.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;

const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res)=>{
    res.send("Hello World");
})
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  // Old version -> main project
  // const bookCollection = client.db(DB_NAME).collection("all_books");
  // const userBookCollection = client.db(DB_NAME).collection("user_books");

  // Current version -> real project
  const bookCollection = client.db(DB_NAME).collection("book-list");
  const userBookCollection = client.db(DB_NAME).collection("user-book-list");
  const ordersCollection = client.db(DB_NAME).collection("order-list");

  // perform actions on the collection object
  console.log("Mongo Connected");
  // Book Collections
  app.post('/addBook', (req, res) =>{
    //   console.log(req.body);
      const bookData = req.body;
      bookCollection.insertOne(bookData)
      .then(data => {
        //   console.log(data.ops[0]);
          res.send(data.ops[0]);
      })
      .catch(err=> console.log(err))
  })

  app.get('/allBooks', (req, res) =>{
      // console.log(204)
      const search = req.query.search;
      // console.log(search," => ");
      bookCollection.find({bookName: {$regex: search}})
      .toArray((err, documents) => {
          // console.log(documents);
          res.send(documents);
      })
  })

  // Delete a book from MongoDB by id using (params)...
  app.get('/delete/:id', (deleteReq, deleteRes) =>{
    const id = deleteReq.params.id;
    bookCollection.deleteOne({_id: ObjectId(id)})
    .then(document => {
        // console.log(document.deletedCount);
        deleteRes.send(document);
    })
  })
  
  // User Collections
  app.get('/delete/user-book/:id', (req, res) =>{
    const id = req.params.id;
    // console.log(id)
    userBookCollection.deleteOne({_id: ObjectId(id)})
    .then(document => {
        res.send(document);
    })
  })

  app.get('/all-users-books', (req, res) =>{
    userBookCollection.find({})
    .toArray((err, documents) =>{
      res.send(documents);
    })
  })

  app.get('/user-books', (req, res) =>{
    const userEmail = req.query.email;
    // console.log(userEmail);
    userBookCollection.find({userEmail})
    .toArray((err, documents) =>{
      // console.log(documents);
      res.send(documents);
    })
  })

  app.get('/delete/user-books/email', (req, res) =>{
    const userEmail = req.query.email;
    // console.log(userEmail);
    userBookCollection.deleteMany({userEmail})
    .then(document => {
      // console.log(document.deletedCount);
      res.send(document);
    })
  })

  app.post('/user-book/update-from-table/:id', (req, res) =>{
    const id = req.params.id;
    const quantity = req.body.quantity;
    // console.log( quantity, " ", id)
    userBookCollection.updateOne({_id: ObjectId(id)}, {
      $set: { quantity }
    })
    .then(result => {
      // console.log(result.modifiedCount);
      res.send(result);
    })
  })

  app.post('/user/add-book', (req, res) =>{
    const userBookData = req.body;
    // console.log(userBookData)
    userBookCollection.insertOne(userBookData)
    .then(data => {
        res.send(data.ops[0])
    })
    .catch(err => console.log(err))
  })

  app.post('/user-book/update-from-book-card/:id', (req, res)=>{
    // console.log(req.params.id,"\n",req.body);
    const id = req.params.id;
    // console.log(id);
    const userEmail = req.query.email;
    const userBookData = req.body;
    userBookCollection.findOne({_id: ObjectId(id), userEmail})
    .then(data => {
      // console.log("Old data => ",  data);
        data.quantity += userBookData.quantity;
        // console.log("Updated data => ", data);
        userBookCollection.updateOne({_id: ObjectId(id)},{
          $set: { quantity: data.quantity }
        })
        .then(result => {
          res.send(result);
        })
    })
    .catch(err => console.log(err))
  })

  // Order Collection
  app.get('/user-order',(req, res)=>{
    const email = req.query.email;
    ordersCollection.findOne({email})
    .then(data => {
      // console.log(data, " =>");
      res.send(data);
    })
  })

  function orderInsertion(order, email, res){

    // console.log(email)
    ordersCollection.insertOne({order, email})
    .then(data => {
      // console.log(data.ops[0]);
      res.send(data.ops[0]);
    })
  }

  app.post('/update-user/orders', (req, res) =>{
    const order = req.body;
    const email = req.query.email;
    // console.log(email);
    ordersCollection.findOne({email})
    .then(data => {
      // console.log(data);
      if(!data){
        orderInsertion(order, email, res);
      }
      else{
        ordersCollection.updateOne({email},{
          $set: {email, order}
        })
        .then(result => {
          // console.log(result);
          res.send(result);
        })
      }
    })
    
  })
//   client.close();
});

app.listen(process.env.PORT || port)