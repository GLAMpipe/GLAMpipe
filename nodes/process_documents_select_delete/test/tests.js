
var chai = require("chai");
var fs = require("fs");
var _eval = require('eval');

var sw = require("../../../app/node-test-sandbox.js");

// read node script directly from file, wrap it to "exports" and eval
var buf = fs.readFileSync("./run.js", "utf8");
buf = "exports.run = function(context, out) {" + buf + "}";
var node = _eval(buf, true);

var xml1 = fs.readFileSync("./test/valid_no_content.xml", "utf8");


var sandbox = sw.createSandbox({});
//console.log(sandbox)
//sandbox.context.node = node;
sandbox.context.node.settings = {};
sandbox.context.node.params = {};
sandbox.context.node.params.in_field = "field1";
sandbox.context.node.settings.select = "Matti Meikäläinen";

var doc1 = {
	field1: "Matti Meikäläinen",
	_id:1001
};

var doc2 = {
	_id:"12345",
	_id:1002
};

var doc3 = {
	field1: "$$£f\"gðf‚{",
	_id:1003
};
	
var doc4 = {
	field1: ["Matti Meikäläinen","","something"],
	_id:1004
};


var doc5 = {
	field1: 1001,
	_id:1005
};

var doc6 = {
	field1: ["PakuPeku","Matti Meikäläinen"],
	_id:1006
};

describe('select-node', function() {
	
  it('simple field match', function() {

	sandbox.context.doc = doc1;	
    node.run(sandbox.context, sandbox.out);
	chai.assert.equal(sandbox.out.value, doc1._id);
  });

  it('simple field mismatch', function() {
	  
	sandbox.context.node.settings.select = "do not match";
	sandbox.context.doc = doc1;	
    node.run(sandbox.context, sandbox.out);
	chai.assert.deepEqual(sandbox.out.value, null);
  });

  it('input key missing', function() {

	sandbox.context.doc = doc2;	
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value, null);

  });

  it('weird characters in input', function() {

	sandbox.context.node.settings.select = "$$£f\"gðf‚{";
	sandbox.context.doc = doc3;	
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value, doc3._id);
  });

  it('numeric match with string/number', function() {

	sandbox.context.node.settings.select = "1001";
	sandbox.context.doc = doc5;	
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value, doc5._id);
  });


  it('multiple select match', function() {

	sandbox.context.node.settings.select = "ressu;pökö;Matti Meikäläinen";
	sandbox.context.doc = doc1;	
    node.run(sandbox.context, sandbox.out);
	chai.assert.equal(sandbox.out.value, doc1._id);
  });

  it('array doc match', function() {

	sandbox.context.node.settings.select = "PakuPeku";
	sandbox.context.doc = doc6;	
    node.run(sandbox.context, sandbox.out);
	chai.assert.equal(sandbox.out.value, doc6._id);
  });

  it('numeric comparision (greater than)', function() {

	sandbox.context.node.settings.select = "1000";
	sandbox.context.node.settings.numeric = "on";
	sandbox.context.node.settings.comparision = ">";
	sandbox.context.doc = doc5;	
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value, doc5._id);
  });


  
});
