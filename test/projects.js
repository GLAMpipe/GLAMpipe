


let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

var User = require("..//app/controllers/user.js");

let url = "http://localhost:3000/api/v1";

var projectId = null;

chai.use(chaiHttp);


describe('Projects', () => {


	describe('/GET users', () => {
		it('it should GET all the projects', (done) => {
			chai.request(url)
				.get('/projects')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('array');
					//res.body.length.should.be.eql(0);
					done();
				});
		});
	});


	describe('/POST project', () => {
		it('try to create project without title', (done) => {
			let project = {
				title: ""
			};
			chai.request(url)
				.post('/projects')
				.send(project)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.should.not.have.property('project');
					done();
				});
		});
	});


	describe('/POST project', () => {
		it('create project', (done) => {
			let project = {
				title: "CHAI-test project"
			};
			chai.request(url)
				.post('/projects')
				.send(project)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.project.should.have.property('_id');
					projectId = res.body.project._id;
					done();
				});
		});
	});

	describe('/DELETE project', () => {
		it('delete project', (done) => {
			let project = {
				t: "CHAI-test project"
			};
			chai.request(url)
				.delete('/projects/' + projectId)
				.send()
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.should.be.deep.equal({'status': 'ok'});
				    done();
				});
		});
	});





});
