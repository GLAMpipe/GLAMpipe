"use strict";

let mongojs = require('mongojs');
let database = require('../../../config/database');
let db = mongojs(database.initDBConnect());
let collection = db.collection("users");


class User {
	constructor(user, pass) {
		this.cred = {
			username: user,
			password: pass
		}
	}

	save(cb) {
		if(this.validate()) {
			console.log(this);
			collection.update(this.cred, this.cred, {upsert:true} ,function (err, result) {
				if (err) {
					console.log(err);
					cb({error: err})
				} else {
					 console.log('MONGO: inserted to users');
					cb(result);
				}
			}); 
		} else {
			cb({error:"invalid username"})
		}
	}
	
	validate() {
		 return /^[0-9a-zA-Z_.-]+$/.test(this.cred.username);
	}
	
	static find(query, cb) {

		collection.find(query, {username:1}, function (err, result) {
			if (err) {
				console.log(err);
				cb([])
			} else {
				cb(result);
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
