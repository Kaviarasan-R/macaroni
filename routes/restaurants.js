const express = require('express');
const router = express.Router();
const restaurants = require('../controllers/restaurants');
const catchAsync = require('../utils/catchAsync');

router.route('/').get(catchAsync(restaurants.index))

router.route('/:id').get(catchAsync(restaurants.showRestaurant))

module.exports = router;