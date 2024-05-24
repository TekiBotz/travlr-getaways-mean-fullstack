var fs = require('fs');
var trips = JSON.parse(fs.readFileSync('./data/trips.json','utf8'));

/* GET travel view */
const travel = (reg, res) => {
    res.render('travel', { title: "Travlr Getaways", trips});
};

module.exports = {
    travel
};