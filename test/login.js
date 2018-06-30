


let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

var User = require("..//app/controllers/user.js");
var config = require("..//config/config.js");

let url = "http://localhost:3000/api/v1";


chai.use(chaiHttp);

if(config.authentication !== "local") {
	console.log("Skipping authentication testing")
	return;
}

describe('Users', () => {
    beforeEach((done) => {
        User.removeAll(() => { 
           done();         
        });     
    });

	describe('/GET users', () => {
	  it('it should GET all the users', (done) => {
		chai.request(url)
			.get('/users')
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('array');
				res.body.length.should.be.eql(0);
			  done();
			});
	  });
	});


	describe('/POST user', () => {
	  it('add user', (done) => {
		let user = {
			email: "arihayri",
			password: "salasana"
		}
		chai.request(url)
			.post('/signup')
			.send(user)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				//res.body.should.have.property('upserted');
			  done();
			});
	  });
	});


	describe('/POST user', () => {
	  it('add user with invalid username', (done) => {
		let user = {
			username: "arihä'9068'645ä",
			password: "salasana"
		}
		chai.request(url)
			.post('/users')
			.send(user)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('error');
			  done();
			});
	  });
	});

});
