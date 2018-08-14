/*
 * Jeongin Park
 * Web Server Programming - Term project
 */

const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const nodemailer = require("nodemailer");
const passport = require('passport');
const flash = require('connect-flash');	// flash: to store messages in session
const morgan = require('morgan');		// morgan: to log every request

const uploadImagePrefix = 'image-';
const uploadDir = './public/uploads';

/*
    Here we are configuring our SMTP Server details.
    STMP is mail server which is responsible for sending and recieving email.
*/
const smtpTransport = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
    auth: {
        user: "jeongin1230@gmail.com",
        pass: "sksmsqkrwjd1"
    }
});
var rand, mailOptions, host, link;
/*------------------SMTP Over-----------------------------*/

//set storage options of multer
const storageOptions = multer.diskStorage({
	destination: (req, file, callback) => {
		// upload dir path
		callback(null, uploadDir);
	},
	filename: (req, file, callback) => {
		callback(null, uploadImagePrefix + Date.now() + path.extname(file.originalname));
	}
});

//run and connect to the database
require('./models/database');
const Restaurant = require('./Restaurant');
const Menu = require('./Menu');
const User = require('./models/user');

//configure multer
const MAX_FILESIZE = 1024 * 1024 * 3;	//3MB
const fileTypes = /jpeg|jpg|png|gif/;	//accepted file types in regexp

const upload = multer({
	storage: storageOptions,
	limits: {
		fileSize: MAX_FILESIZE
	},
	fileFilter: (req, file, callback) => {
		const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = fileTypes.test(file.mimetype);
		if (mimetype && extname) {
			return callback(null, true);
		} else {
			return callback('Error: Images only');
		}
	}
}).single('imageUpload'); // parameter name at <form> of index.ejs

const app = express();
app.set('view engine', 'ejs');
app.set('views', './ejs_views');
app.use(cookieParser());
app.use('/static', express.static(__dirname + '/static'));
app.use('/public', express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: false}));
app.use(morgan('dev'));	// log every request to the console

app.use(session({
	secret: 'mysecretkey',
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 60*60*1000,
		path: '/'
	}
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(multer({dest: 'public/uploads/'}).single('imageUpload'));
const csrf = require('csurf');	// protection against cross site request forgery
app.use(csrf({cookie: true}));				// csrf() must be set after cookieParser and session

// star db and use passport
require('./models/database');
require('./config/passport');

const ShoppingCart = require('./ShoppingCart');
app.locals.store_title = 'I-Deliver';

app.get('/', (req, res) => {
	console.log(req.cookies);
	console.log(req.session);
	Restaurant.find({}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('mainpage_admin', {results, req, user: req.user, csrfToken: req.csrfToken()});
		}
	});
});

app.get('/manageUsers', (req, res) => {
	User.find({}, (err, results) => {
		if (err) {
			return res.render.status(500).send('<h1>Error</h1>');
		}
		return res.render('manageUsers', {req, results, user: req.user});
	});
});

app.get('/signup', (req, res) => {
	const messages = req.flash('signuperror');
	res.render('signup', {req, user: req.user, csrfToken: req.csrfToken(), messages});
});

app.post('/signup', passport.authenticate('localsignup', {
	successRedirect: '/send',
	failureRedirect: '/mainpage_admin',
	failureFlash: true
}));

app.get('/send', (req, res) => {
	rand = Math.floor((Math.random() * 100) + 54);
	host = req.get('host');
	link = "http://" + req.get('host') + "/verify?id=" + rand;
	if(req.user.verify != 'verified') {
		mailOptions = {
			to: req.user.email,
			subject: "Please confirm your Email account",
			html: "Hello,<br> your verification code is " + req.user.verify
		}
		smtpTransport.sendMail(mailOptions, (err) => {
			if (err) {
				res.status(500).send('<h1>error</h1>');
			} else {
				console.log('Email sent');
			}
		});
	}
	return res.render('send', {csrfToken: req.csrfToken(), req, user: req.user});
});

app.post('/send', (req, res) => {
	console.log(req.body.passcode);
	console.log(req.user.verify);
	console.log(req.user._id);
	if (req.body.passcode == req.user.verify) {
		const query = {_id: req.user._id};
		const value = {
			$set: {
				verify: 'verified'
			}
		};
		User.findOneAndUpdate(query, value, (err, results) => {
			console.log("query = " + query);
            console.log("value = " + value);
			if (err) {
				return res.redirect('/mainpage_admin');
			}
            
			return res.render('verify', {req});
		});
	} else {
		res.redirect('/mainpage_admin');
	}

})

app.get('/verify', (req, res, err) => {
	if((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
		console.log("Domain is matched. Information is from Authentic email");
		if(req.query.id == rand) {
			return res.render('verify', {req, user: req.user});
		} else {
			return res.status(500).send('<h1>error</h1>', err);
		}
	} else {
		return res.end("<h1>Request is from unknown source");
	}
});

app.get('/login', (req, res) => {
	const messagesuccess = req.flash('signupsuccess');
	const messageerror = req.flash('loginerror');
	res.render('login', {req, csrfToken: req.csrfToken()});
});

app.post('/login', passport.authenticate('locallogin', {
	successRedirect: '/mypage',
	failureRedirect: '/login',
	failureFlash: true
}));

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

app.get('/mypage', isLoggedIn, (req, res) => {
	// get user stored in session object and pass it
	res.render('mypage', {req, user: req.user});
});

app.get('/editUserInfo', (req, res) => {
	const user = JSON.parse(req.query.userInfo);
	res.render('editUserInfo', {csrfToken: req.csrfToken(), req, user});
});

app.post('/editUserInfo', (req, res) => {
	const query = {_id: req.body._id};
	const value = {
		$set: {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			password: req.body.password,
			streetAddress: req.body.streetAddress,
			city: req.body.city,
			state: req.body.state,
			zipCode: req.body.zipCode,
			favoriteFood: req.body.favoriteFood
		}
	};

	User.findOneAndUpdate(query, value, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Edit Error</h1>', err);
		}
		return res.redirect('/manageUsers');
	});	
});

app.get('/editMyInfo', (req, res) => {
	const user = JSON.parse(req.query.userInfo);
	res.render('editMyInfo', {req, user: req.user, csrfToken: req.csrfToken()});
});

app.post('/editMyInfo', (req, res) => {
	const query = {_id: req.body._id};
	const value = {
		$set: {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			password: req.body.password,
			streetAddress: req.body.streetAddress,
			city: req.body.city,
			state: req.body.state,
			zipCode: req.body.zipCode,
			favoriteFood: req.body.favoriteFood
		}
	};

	User.findOneAndUpdate(query, value, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Edit Error</h1>', err);
		}
		return res.redirect('/mypage');
	});	
});

app.get('/unregisterMe', (req, res) => {
	const query = {_id: req.query._id};
	User.remove(query, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Remove Error</h1>', err);
		}
		res.redirect('/mainpage_admin');
	});
});

app.get('/unregisterUser', (req, res) => {
	const query = {_id: req.query._id};
	User.remove(query, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Remove Error</h1>', err);
		}
		res.redirect('/manageUsers');
	});
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.render('errorpage', {message: 'Login required to access this page.'});
	}
};

app.get('/mainpage_admin', (req, res) => {
	Restaurant.find({}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('mainpage_admin', {results, req, user: req.user, csrfToken: req.csrfToken()});
		}
	});
});

app.get('/addRestaurant', (req, res) => {
	Restaurant.find({}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('addRestaurant', {results, req, user: req.user, restaurant: req.restaurant ,csrfToken: req.csrfToken()});
		}
	});
});

app.post('/addRestaurant', (req, res) => {
	const newRestaurant = new Restaurant({
		name: req.body.name,
		deliveryFee: req.body.deliveryFee
	});
	newRestaurant.save((err, results) => {
		if (err) {
			res.status(500).send('<h1>save() error</h1>', err);
		}
		res.redirect('/addRestImage');
	});
});

app.get('/addRestImage', (req, res) => {
	Restaurant.find({restaurantNumber: "1"}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('addRestImage', {results, req, user: req.user, restaurant: req.restaurant, csrfToken: req.csrfToken()});
		}
	});	
});

app.post('/addRestImage', (req, res) => {
	upload(req, res, (err) => {
		const query = {restaurantNumber: "1"};
		const value = {
			$set: {
				imagePath: uploadDir + '/' + req.file.filename,
				restaurantNumber: '0'
			}
		};
		Restaurant.findOneAndUpdate(query, value, (err, results) => {
			if (err) {
				res.status(500).send('<h1>Edit Error</h1>', err);
			}
			return res.redirect('/mainpage_admin');
		});
	});
})

app.get('/edit_restaurant', (req, res) => {
	Restaurant.find({name: req.query.restaurantInfo}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {			
			res.render('edit_restaurant', {results, req, user: req.user, restaurant: req.restaurant ,csrfToken: req.csrfToken()});
		}
	});
});

app.post('/edit_restaurant', (req, res) => {
	const query = {name: req.body.restaurantName};
	const value = {
		$set: {
			deliveryFee: req.body.deliveryFee
		}
	};

	Restaurant.findOneAndUpdate(query, value, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Edit Error</h1>', err);
		}
		return res.redirect('/mainpage_admin');
	});
});

app.get('/menuList', (req, res) => {
	Menu.find({restName: req.query.restaurantInfo}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('menuList', {results, req, user: req.user, csrfToken: req.csrfToken()});
		}
	});
});

app.get('/addMenu', (req, res) => {
	Menu.find({}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('addMenu', {results, req, user: req.user, restaurant: req.restaurant ,csrfToken: req.csrfToken()});
		}
	});
});

app.post('/addMenu', (req, res) => {
	upload(req, res, (err) => {
		const newMenu = new Menu({
			restName: req.body.restName,
			name: req.body.name,
			description: req.body.description,
			price: req.body.price,
			deliveryFee: req.body.deliveryFee
		});
		newMenu.save((err, results) => {
			if (err) {
				res.status(500).send('<h1>save() error</h1>', err);
			}
			return res.redirect('/mainpage_admin');
		});
	});
});

app.get('/edit_menu', (req, res) => {
	Menu.find({name: req.query.menuInfo}, (err, results) => {
		if (err) {
			res.status(500).send('<h1>find() error</h1>', err);
		} else {
			res.render('edit_menu', {results, req, user: req.user, menu: req.menu ,csrfToken: req.csrfToken()});
		}
	});
});

app.post('/edit_menu', (req, res) => {
	const query = {name: req.body.menuName};
	const value = {
		$set: {
			description: req.body.description,
			price: req.body.price
		}
	};

	Menu.findOneAndUpdate(query, value, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Edit Error</h1>', err);
		}
		return res.redirect('/mainpage_admin');
	});
});

app.get('/remove_restaurant', (req, res) => {
	const query = {_id: req.query._id};
	Restaurant.remove(query, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Remove Error</h1>', err);
		}
		fs.unlink(req.query.imagePath, (err) => {
			if (err) {
				throw err;
			}
		});
		res.redirect('/mainpage_admin');
	});
});

app.get('/remove_menu', (req, res) => {
	const query = {_id: req.query._id};
	Menu.remove(query, (err, results) => {
		if (err) {
			res.status(500).send('<h1>Remove Error</h1>', err);
		}
		res.redirect('/mainpage_admin');
	});
});

app.get('/shoppingcart', (req, res) => {
	if (!req.session.shoppingcart) {
		res.redirect('/checkouterror');
	}		
});

app.post('/add', (req, res) => {
	const menu_name = req.body.menuInfo;
	if (!menu_name) {
		res.redirect('/');
	}
	
	if (!req.session.shoppingcart) {
		req.session.shoppingcart = new ShoppingCart().serialize();
	}

	const shoppingcart = ShoppingCart.deserialize(req.session.shoppingcart);
	
	Menu.find({name: menu_name}, (err, results) => {
		const menu = new Menu(results[0]);		
		shoppingcart.add(menu);
		req.session.shoppingcart = shoppingcart.serialize();
		return res.render('shoppingcart', {shoppingcart, results, req, user: req.user, Menu: req.menu});
	});
});

app.get('/keepshopping', (req, res) => {
	return res.redirect('/mainpage_admin');
})

app.get('/checkout', (req, res) => {
	if (!req.session.shoppingcart) {
		res.redirect('/checkouterror');
	} else {
		const shoppingcart = ShoppingCart.deserialize(req.session.shoppingcart);
		res.render('checkout', {req, user: req.user});
	}
});

app.get('/checkouterror', (req, res) => {
	res.render('checkouterror', {req, user: req.user});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log('Server stated at port', port);
});