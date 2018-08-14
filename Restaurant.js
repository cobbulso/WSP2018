const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
    restaurantNumber: {
        type: String, enum: ['0', '1'], default: '1'
    },
    name: String,
    deliveryFee: String,
    imagePath: {
        type: String, default: '' //[{java: true}, {cpp: false}, ...]
    } 
}, {collection: 'restaurants'});


// a collection named 'contacts' is created
// 'contacts' collection uses contactSchema to store documents (data)
module.exports = mongoose.model('Restaurant', restaurantSchema);