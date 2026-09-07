const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');

// Get: /trips - list all the trips
const tripsList = async(req, res) => {
    const q = await Model
    .find({}) // No filter, return all records
    .exec();

    if(!q) 
    { // Database returned no data
        return res
                .status(404)
                .json(err);
    } else { // Return resulting trip list
        return res
            .status(200)
            .json(q);
    }
};


// Get: /trips/:tripCode - list a single trip
const tripsFindByCode = async(req, res) => {
    const q = await Model
    .find({'code' : req.params.tripCode}) // Return a single record
    .exec();

    if(!q) 
    { // Database returned no data
        return res
                .status(404)
                .json(err);
    } else { // Return resulting trip list
        return res
            .status(200)
            .json(q);
    }
};


// POST: /trips - Adds a new Trip
const tripsAddTrip = async (req, res) => {
    try {
        // Call getUser to fetch user information
        const user = await getUser(req, res);

        // Create a new Trip object with request body data
        const newTrip = new Trip({
            code: req.body.code,
            name: req.body.name,
            length: req.body.length,
            start: req.body.start,
            resort: req.body.resort,
            perPerson: req.body.perPerson,
            image: req.body.image,
            description: req.body.description,
            // Assuming you want to associate the trip with the user
            user: user._id
        });

        // Save the new trip to the database
        const savedTrip = await newTrip.save();

        // Respond with the saved trip
        return res.status(201).json(savedTrip);
    } catch (err) {
        // Handle errors
        return res.status(400).json(err);
    }
};




// PUT: /trips/:tripCode - Adds a new Trip
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
        )
        .then(trip => {
            if (!trip) {
                return res.status(404)
                          .send({
                              message: "Trip not found with code " + req.params.tripCode
                          });
            }
            res.send(trip);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404)
                          .send({
                              message: "Trip not found with code " + req.params.tripCode
                          });
            }
            return res.status(500) // server error
                      .json(err);
        });
    });
}


getUser(req, res, (userName) => {  // Corrected callback structure
    const locationId = req.params.locationid;
    if (locationId) {
      Loc
        .findById(locationId)
        .select('reviews')
        .exec((err, location) => {
          if (err) {
            return res
              .status(400)
              .json(err);
          } else if (!location) {
            return res
              .status(404)
              .json({ "message": "Location not found" });
          } else {
            doAddReview(req, res, location, userName);
          }
        });
    } else {
      res
        .status(404)
        .json({ "message": "Location ID is required" });
    }
  });
  
  
module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip
};