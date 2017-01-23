"use strict";

let mongojs = require('mongojs');
var bcrypt   = require('bcrypt-nodejs');
let database = require('../../../config/database');
let db = mongojs(database.initDBConnect());
let collection = db.collection("users");


class User {
	constructor(email, pass) {
		this.local= {
			email: email,
			password: pass
		}
	}

	setPassword(password) {
		this.local.password = bcrypt.hashSync(password);
	}

	save(cb) {
		if(this.validate()) {
			console.log(this);
			collection.update(this.local, this, {upsert:true} ,function (err, result) {
				if (err) {
					console.log("err :" + err);
					cb({error: err})
				} else {
					 console.log('MONGO: inserted to users');
					cb(result);
				}
			}); 
		} else {
			cb({error:"invalid email"})
		}
	}
	
	validate() {
		 return /^[0-9a-zA-Z_.-@]+$/.test(this.local.email);
	}

	validPassword(password) {
		return bcrypt.compareSync(password, this.local.password);
	}
	

	// find all users
	static find(query, cb) {

		collection.find(query, {"local.email":1}, function (err, result) {
			if (err) {
				console.log(err);
				cb([])
			} else {
				cb(result);
			} 
		}); 
	}

	// find user by email
	static findOne(email, cb) {
		collection.findOne({"local.email":email}, function (err, result) {
			if (err) {
				cb(err)
			} else if(result) {
				console.log(result);
				var user = new User(result.local.email, result.local.password);
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




