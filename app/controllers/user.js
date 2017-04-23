"use strict";

let mongojs = require('mongojs');
var bcrypt   = require('bcrypt-nodejs');
let database = require('../../config/database');
let config = require('../../config/config');
let db = mongojs(database.initDBConnect());
let collection = db.collection("mp_users");


class User {
	constructor(email, pass) {
		this.local= {
			email: email
		}
        if(pass)
            this.local.password = pass;

		this.id = null;
	}
	
	setPassword(password) {
		this.local.password = bcrypt.hashSync(password);
	}

	save(cb) {
        if(config.canRegister) {
            var self = this;
            if(this.validate()) {
                collection.update(this.local, this, {upsert:true} ,function (err, result) {
                    if (err) {
                        console.log("err :" + err);
                        cb({error: err})
                    } else {
                        self.id = result.upserted[0]._id; // set id for serializer
                        cb(null);
                    }
                }); 
            } else {
                cb({error:"invalid email"})
            }
        } else {
            cb("Sorry, registering disabled!")
        }
	}
	
	validate() {
		 return /^[0-9a-zA-Z_.-@]+$/.test(this.local.email);
	}

	validPassword(password) {
		return bcrypt.compareSync(password, this.local.password);
	}
	

	// find all users
	static findAll(req, res) {
		collection.find({}, {"local.email":1}, function (err, result) {
			if (err) {
				console.log(err);
				res.json([])
			} else {
				res.json(result);
			} 
		}); 
	}


	// find user by email
	static findOne(email, cb) {
		collection.findOne({"local.email":email}, function (err, result) {
			if (err) {
				cb(err)
			} else if(result) {
				var user = new User(result.local.email, result.local.password);
				user.id = result._id; 
				cb(null, user);
			} else {
				cb(null, null);
			}
		}); 
	}

	static findById(id, cb) {
		collection.findOne({"_id":mongojs.ObjectId(id)}, function (err, result) {
			if (err) {
				cb(err)
			} else if(result) {
				var user = new User(result.local.email);
				user.id = result._id; 
				cb(null, user);
			} else {
				cb(null, null);
			}
		}); 
	}

	
	static removeAll(cb) {
		collection.remove({}, function (err, result) {
			if (err) {
				console.log(err);
				cb(result)
			} else {
				cb(result);
			} 
		}); 		
		
	}
}

module.exports = User ;




