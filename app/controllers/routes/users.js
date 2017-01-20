var User = require("../../controllers/models/user.js");

exports.addUser = function (req, res) {
	var user = new User(req.body.username, req.body.password); 
	user.save(function(err, user) {
        if(err) {
            res.send(err);
        }
        else {
            res.json({message: "User added!", user });
        }		
	});
}



exports.getUsers = function (req, res) {
	User.find({}, function(data) {
		res.json(data);
	})
}
