if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const path = require('path');
const axios = require('axios');
const helmet = require('helmet');
const express = require('express');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const passport = require('passport');
const User = require('./models/user');
const flash = require('connect-flash');
const session = require('express-session');
const userRoutes = require('./routes/users');
const LocalStrategy = require('passport-local');
const reviewRoutes = require('./routes/reviews');
const Restaurant = require('./models/restaurant');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const mongoSanitize = require('express-mongo-sanitize');
const restaurantsRoutes = require('./routes/restaurants');
const MongoDBStore = require("connect-mongo");

const dbUrl = process.env.DB_URL;
//const dbUrl = 'mongodb://localhost:27017/food-app';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// Make sure you comment below code because if you uncomment it and run app.js in your local host this
// leads to timeout, Because I already upload the api response to the mongoDB server so the data loads
// from the  server not from the api. I do this because to enhance the speed to load the restaurant page.

/* const seedDB = async () => {
	const res = await axios.get(`https://api.documenu.com/v2/restaurants/search/fields?fullmenu=true&exact=true&size=30&page=1&key=${process.env.DOCUMENU_API_KEY}`);
    for (let i=0;i<24;i++) {
		const img = await axios.get(`https://api.unsplash.com/photos/random?query=restaurants&&client_id=${process.env.UNSPLASH_API_KEY}`);
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
}) */

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({
     replaceWith: '_'
}));

const secret = process.env.SECRET;

const store = MongoDBStore.create({
     mongoUrl: dbUrl,
     secret,
     touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
     console.log("SESSION STORE ERROR", e)
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/',userRoutes);
app.use('/restaurants', restaurantsRoutes);
app.use('/restaurants/:id/reviews',reviewRoutes);

app.get('/', (req, res) => {
    res.render('home')
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
});