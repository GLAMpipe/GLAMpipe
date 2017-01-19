
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
	field2: "some content"
};

var doc2 = {
	_id:"12345",
	field2: "some content"
};

var doc3 = {
	field1: "$$£f\"gðf‚{",
	field2: "some content"
};
	
var doc4 = {
	field1: ["Matti Meikäläinen","","something"],
	field2: "some content"
};


var doc5 = {
	field1: 1001,
	field2: "some content"
};

describe('select-node', function() {
	
  it('simple field match', function() {

	sandbox.context.doc = doc1;	
    node.run(sandbox.context, sandbox.out);
	chai.assert.deepEqual(sandbox.out.value, doc1);
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
    chai.assert.equal(sandbox.out.value, doc3);
  });

  it('numeric match with string/number', function() {

	sandbox.context.node.settings.select = "1001";
	sandbox.context.doc = doc5;	
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value, doc5);
  });


  it('numeric comparision (greater than)', function() {

	sandbox.context.node.settings.select = "1000";
	sandbox.context.node.settings.numeric = "on";
	sandbox.context.node.settings.comparision = ">";
	sandbox.context.doc = doc5;	
    node.run(sandbox.context, sandbox.out);
    chai.assert.equal(sandbox.out.value, doc5);
  });
  
});
