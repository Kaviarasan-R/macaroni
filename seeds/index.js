const mongoose = require('mongoose');
const seeds = require('./seedHelpers');
const Restaurant = require('../models/restaurant');
const axios = require('axios');

mongoose.connect('mongodb://localhost:27017/food-app', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error',console.error.bind(console,'connection error'));
db.once('open', () => {
    console.log('Database Connected Successfully');
});

const seedDB = async () => {
    await Restaurant.deleteMany({});
	const res = await axios.get(`https://api.documenu.com/v2/restaurants/search/fields?fullmenu=true&exact=true&size=30&page=1&key=${RESTAURANT_API_KEY}`);
    for (let i=0;i<24;i++) {
		const img = await axios.get(`https://api.unsplash.com/photos/random?query=restaurants&&client_id=${IMAGE_API_KEY}`);
        const restaurant = new Restaurant({
            title: `${res.data.data[i].restaurant_name}`, 
            geometry: {
                type: 'Point',
                coordinates: [
                    res.data.data[i].geo.lon,
                    res.data.data[i].geo.lat
                ]
            },
            images: [img.data.urls.small],
            open_hours: `${res.data.data[i].hours}`,
            cuisines: res.data.data[i].cuisines,
            location: `${res.data.data[i].address.formatted}`,
            menu: [ res.data.data[i].menus[0] ]
        })
        await restaurant.save();
    }
}


seedDB().then(() => {
    mongoose.connection.close();
})