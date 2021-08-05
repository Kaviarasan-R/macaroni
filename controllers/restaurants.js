const Restaurant = require('../models/restaurant');

module.exports.index = async (req, res) => {
    const restaurants = await Restaurant.find({}).populate('popupText');
    res.render('restaurants/index', { restaurants })
}

module.exports.showRestaurant = async (req, res,) => {
    const restaurant = await Restaurant.findById(req.params.id).populate({
    path: 'reviews',
    populate: {
        path: 'author'
    }
}).populate('author');
    if (!restaurant) {
        req.flash('error', 'Cannot find that restaurant!');
        return res.redirect('/restaurants');
    }
    res.render('restaurants/show', { restaurant });
}

