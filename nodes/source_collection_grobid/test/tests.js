
var chai = require("chai");
var fs = require("fs");
var _eval = require('eval');

var sw = require("../../../app/node-test-sandbox.js");

// read node script directly from file, wrap it to "exports" and eval
var buf = fs.readFileSync("./run.js", "utf8");
buf = "exports.run = function(context, out) {" + buf + "}";
var node = _eval(buf, true);

var xml1 = fs.readFileSync("./test/valid_no_content.xml", "utf8");
var xml2 = fs.readFileSync("./test/one_monograph.xml", "utf8");
var xml3 = fs.readFileSync("./test/one_monograph_and_article.xml", "utf8");
var xml4 = fs.readFileSync("./test/only_one_author.xml", "utf8");
var xml5 = fs.readFileSync("./test/monograph_no_author.xml", "utf8");

var sandbox = sw.createSandbox({});

var doc = {
	_id:"12345"
};
	
sandbox.context.doc = doc;

var result2 = [
	 {
	  "gr_article": "",
	  "gr_authors": [
		"Author, First",
		"Author, Second",
		"Author"
	  ],
	  "gr_compilation": "",
	  "gr_journal": "",
	  "gr_monogr": "I am a monograph",
	  "gr_publish_year": "1998",
	  "gr_publisher": "Cambridge University Press",
	  "gr_status" : "ok"
	 }
   ];

var result3 = [
	 {
	  "gr_article": "",
	  "gr_authors": [
		"Author, First",
		"Author, Second",
		"Author"
	  ],
	  "gr_compilation": "",
	  "gr_journal": "",
	  "gr_monogr": "I am a monograph",
	  "gr_publish_year": "1998",
	  "gr_publisher": "Cambridge University Press",
	  "gr_status" : "ok"
	 },
	{
	  "gr_article": "I am an article",
	  "gr_authors": [],
	  "gr_compilation": "",
	  "gr_journal": "I am a journal",
	  "gr_monogr": "",
	  "gr_publish_year": "1985",
	  "gr_publisher": "Cambridge University Press",
	  "gr_status" : "ok"
	}

   ];	

var result4 = [
	 {
	  "gr_article": "",
	  "gr_authors": [
		"Author, First"
	  ],
	  "gr_compilation": "",
	  "gr_journal": "",
	  "gr_monogr": "I am a monograph",
	  "gr_publish_year": "",
	  "gr_publisher": "",
	  "gr_status" : "ok"
	 }
   ];

var result5 = [
	 {
	  "gr_article": "",
	  "gr_authors": [],
	  "gr_compilation": "",
	  "gr_journal": "",
	  "gr_monogr": "I am a monograph",
	  "gr_publish_year": "",
	  "gr_publisher": "",
	  "gr_status" : "ok"
	 }
   ];

describe('GROBID-node', function() {
	
  it('error in GROBID output', function() {

	sandbox.context.error = "error";
	sandbox.context.response = {statusCode:200};
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value[0].status, "file error");
    chai.assert.equal(sandbox.out.value[0].gr_status, "file error");
  });

  it('valid but empty xml', function() {

	sandbox.context.data = xml1;
	delete sandbox.context.error;
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value[0].status, "extraction error");
    chai.assert.equal(sandbox.out.value[0].gr_status, "extraction error");
  });

  it('invalid xml', function() {

	sandbox.context.data = "giberisha ";
	delete sandbox.context.error;
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value[0].status, "file error");
    chai.assert.equal(sandbox.out.value[0].gr_status, "file error");
  });


  it('bad server response', function() {

	sandbox.context.response = {statusCode:500};
	delete sandbox.context.error;
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value[0].status, "file error");
    chai.assert.equal(sandbox.out.value[0].gr_status, "file error");
  });
  
   it('just one monograph', function() {

	sandbox.context.data = xml2;
	sandbox.context.response = {statusCode:200};
    node.run(sandbox.context, sandbox.out);
    //console.log(sandbox.out.value);
    chai.assert.deepEqual(sandbox.out.value, result2);
  });

   it('one monograph and journal article', function() {

	sandbox.context.data = xml3;
    node.run(sandbox.context, sandbox.out);
    //console.log(sandbox.out.value);
    chai.assert.deepEqual(sandbox.out.value, result3);
  });

   it('only one author', function() {

	sandbox.context.data = xml4;
    node.run(sandbox.context, sandbox.out);
    //console.log(sandbox.out.value);
    chai.assert.deepEqual(sandbox.out.value, result4);
  });
 
    it('no author', function() {

	sandbox.context.data = xml5;
    node.run(sandbox.context, sandbox.out);
    //console.log(sandbox.out.value);
    chai.assert.deepEqual(sandbox.out.value, result5);
  });
  
});
