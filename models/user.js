const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
    role: {
        type: String, 
    },
    firstName: {
        type: String, required: true, trim: true, unique: false
    },
    lastName: {
        type: String, required: true, trim: true, unique: false
    },
    email: {
        type: String, required: true, trim: true, unique: true
    },    
    password: {
        type: String, required: true, minlength: 4
    },
    streetAddress: {
        type: String, required: true, trim: true, unique: false
    },
    city: {
        type: String, required: true, trim: true, unique: false
    },
    state: {
        type: String, required: true, trim: true, unique: false
    },
    zipCode: {
        type: String, required: true, trim: true, unique: false
    },
    favoriteFood: {
        type: String, required: false, trim: true, unique: false
    },
    verify: {
        type: String
    }
});

userSchema.methods.encryptPassword = function(password, callback) {
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return callback(err);
        else return callback(null, hash);
    });
}

userSchema.methods.verifyPassword = function(password, callback) {
    bcrypt.compare(password, this.password, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

// a collection named 'contacts' is created
// 'contacts' collection uses contactSchema to store documents (data)
module.exports = mongoose.model('user', userSchema);