const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const menuSchema = new Schema({
	restName: String,
    name: String,
	description: String,
	price: Number,
	deliveryFee: Number
}, {collection: 'menus'});


// a collection named 'contacts' is created
// 'contacts' collection uses contactSchema to store documents (data)
module.exports = mongoose.model('Menu', menuSchema);