const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');
const User = mongoose.model('User');


// Resolve the authenticated user from the JWT payload (set by express-jwt as
// req.payload) and hand their name to the callback. Mongoose 8 dropped
// callback support, so the query is awaited and failures reject.
const getUser = async (req, res, callback) => {
    if (!req.payload || !req.payload.email) {
      return res
        .status(404)
        .json({"message": "User not found"});
    }
    try {
      const user = await User.findOne({ email: req.payload.email }).exec();
      if (!user) {
        return res
          .status(404)
          .json({"message": "User not found"});
      }
      callback(req, res, user.name);
    } catch (err) {
      console.log(err);
      return res
        .status(404)
        .json(err);
    }
  };

// Get: /trips - list all the trips
const tripsList = async(req, res) => {
    try {
        const q = await Model
            .find({}) // No filter, return all records
            .exec();

        if(!q)
        { // Database returned no data
            return res
                .status(404)
                .json({ "message": "No trips found" });
        } else { // Return resulting trip list
            return res
                .status(200)
                .json(q);
        }
    } catch (err) {
        // e.g. no DB connection: Mongoose buffering times out and rejects here
        // instead of crashing the process.
        return res
            .status(500)
            .json(err);
    }
};


// Get: /trips/:tripCode - list a single trip
const tripsFindByCode = async(req, res) => {
    try {
        const q = await Model
            .find({'code' : req.params.tripCode}) // Return a single record
            .exec();

        if(!q)
        { // Database returned no data
            return res
                .status(404)
                .json({ "message": "No trip found" });
        } else { // Return resulting trip list
            return res
                .status(200)
                .json(q);
        }
    } catch (err) {
        return res
            .status(500)
            .json(err);
    }
};


// POST: /trips - Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsAddTrip = async(req, res) => {
    getUser(req, res,
        async (req, res) => {
            try {
                const trip = await Trip.create({
                    code: req.body.code,
                    name: req.body.name,
                    length: req.body.length,
                    start: req.body.start,
                    resort: req.body.resort,
                    perPerson: req.body.perPerson,
                    image: req.body.image,
                    description: req.body.description
                });
                return res
                    .status(201)
                    .json(trip);
            } catch (err) {
                return res
                    .status(400)
                    .json(err);
            }
        }
    );
};


// PUT: /trips/:tripCode - Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsUpdateTrip = async (req, res) => {
    getUser(req, res, (req, res) => {
            Trip.findOneAndUpdate(
                { 'code': req.params.tripCode }, 
                {
                    code: req.body.code,
                    name: req.body.name,
                    length: req.body.length,
                    start: req.body.start,
                    resort: req.body.resort,
                    perPerson: req.body.perPerson,
                    image: req.body.image,
                    description: req.body.description
                }, 
                { new: true }
            ).then(trip => {
                    if (!trip) {
                        return res
                            .status(404)
                            .send({ message: "Trip not found with code" + req.params.tripCode });
                    }
                    res.send(trip);
                }).catch(err => {
                    if (err.kind === 'ObjectId') {
                        return res
                            .status(404)
                            .send({ message: "Trip not found with code" + req.params.tripCode });
                    }
                    return res
                        .status(500)
                        .json(err);
                });
        }
    );
};
  

module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip
};