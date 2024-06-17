const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1yjvy4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

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
    // await client.connect();

    const usersCollection = client.db('UserManagement').collection('allusers');

    app.get('/events', async (req, res) => {
      const date = req.query.date;

      const query = {};
      const options = await allEvent.find(query).toArray();
      console.log(options);
      const bookingQuery = { date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.name === option.name
        );
        const bookedSlot = optionBooked.map((book) => book.slot);
        const remainingSlot = option.slots.filter(
          (slot) => !bookedSlot.includes(slot)
        );
        option.slots = remainingSlot;
      });
      res.send(options);
    });

    // jwt
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: '' });
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      try {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    // stripe
    app.post('/create-payment-intent', async (req, res) => {
      const { booking } = req.body;
      const price = booking.price;
      const amount = price * 100;

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(400).send({
          error: error.message,
        });
      }
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
  res.send('Server is running');
});
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
