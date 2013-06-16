define(['mongoose'],
    function(mongoose){
        var mongoose = require('mongoose');

        var User = mongoose.model('User',mongoose.Schema({
            name: { type: String, required: true, index: { unique: true } },
            password: { type: String, required: true },
            salt: {type: String}
        }));

        User

        return User;
    }
);