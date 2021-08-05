const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

/* In Mongoose, a virtual is a property that
 is not stored in MongoDB. Virtuals are typically
  used for computed properties on documents */

const opts = {toJSON: {virtuals: true}};

const RestaurantSchema = new Schema({
    title: [String],
    images: [String],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    open_hours: String,
    location: String,
    cuisines: [],
    menu: [],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
    
},opts);

module.exports = mongoose.model('Restaurant',RestaurantSchema);