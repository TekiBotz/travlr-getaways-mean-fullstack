const express = require('express'); // Express app
const router = express.Router(); // Router logic
const jwt = require('express-jwt');
const auth = jwt({
    secrete: process.env.JWT_SECRETE,
    userProperty: 'payLoad'
});

// This is where we import the controllers we will route
const authController = require('../controllers/authentication');
const tripsController = require('../controllers/trips');


router
    .route('/login')
    .post(authController.login);

router
    .route('/register')
    .post(authController.register);

// Define route for our trips endpoint
router
    .route('/trips')
    .get(tripsController.tripsList) // GET Method routes tripList
    .post(auth, tripsController.tripsAddTrip); // POST Method Adds a Trip

// GET Method routes tripsFindByCode - requires parameter
// PUT Method routes tripsUpdateTrip - requires parameter
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(auth, tripsController.tripsUpdateTrip);
    
module.exports = router;