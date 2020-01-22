

var parser = require('fast-xml-parser');
var he = require('he');
var vm = require('vm');


module.exports = function (inp, callback) {
	doit();
  callback(null, inp + ' BAR (' + process.pid + ')')
}


var xml = '<?xml version="1.0" encoding="UTF-8"?><record"><leader>02215cam a22005174i 4500</leader>  <controlfield tag="001">005279249</controlfield>  <controlfield tag="003">FI-MELINDA</controlfield>  <controlfield tag="005">20190806074756.0</controlfield>  <controlfield tag="008">081231s2008    xxkaf    b    001 0 eng  </controlfield>  <datafield tag="020" ind1=" " ind2=" ">    <subfield code="a">0-19-442245-3</subfield>    <subfield code="q">nidottu</subfield>  </datafield>  <datafield tag="020" ind1=" " ind2=" ">    <subfield code="a">978-0-19-442245-1</subfield>    <subfield code="q">nidottu</subfield>  </datafield>  <datafield tag="035" >    <subfield code="a">FCC005279249</subfield>  </datafield>  <datafield tag="041" ind1="0" ind2=" ">    <subfield code="a">eng</subfield>  </datafield>  <datafield tag="050" ind1="0" ind2="0">    <subfield code="a">P37</subfield>    <subfield code="b">.W73 2008</subfield>  </datafield>  <datafield tag="072" ind1=" " ind2="7">    <subfield code="a">85</subfield>    <subfield code="2">kkaa</subfield>  </datafield>  <datafield tag="082" ind1="0" ind2="4">    <subfield code="a">401.9</subfield>    <subfield code="2">22</subfield>  </datafield>  <datafield tag="100" ind1="1" ind2=" ">    <subfield code="a">Wray, Alison </subfield></datafield></record>';


var sandbox = {
	data: xml,
	parser:parser,
	out: null
}

var c = vm.createContext(sandbox);

var scriptVM = new vm.createScript('out = parser.parse(data);');

function doit() {
	for(var i = 0; i < 120000; i++) {
		//var json = parser.parse(xml, {ignoreAttributes : false});
		scriptVM.runInContext(c)
		c.data = xml;
	}

	console.log("Done");
}
