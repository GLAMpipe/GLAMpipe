


out.value = null;
var outputs = [];

if(!context.error && context.response.statusCode == 200) {
	var data = context.data;
	try {
		var json = context.parser.toJson(data);
		//console.log(json);
		var refs = JSON.parse(json);

		
		context.vars.success_counter++;

		if(refs.TEI.text.back.div.listBibl.biblStruct) {
			if(Array.isArray(refs.TEI.text.back.div.listBibl.biblStruct)) {
				refs.TEI.text.back.div.listBibl.biblStruct.forEach(function(ref) {
					var output = createRef(context.doc);	
					extractData(ref, output);
					outputs.push(output);
				})
			} else {
				var output = createRef(context.doc);	
				extractData(refs.TEI.text.back.div.listBibl.biblStruct, output);
				outputs.push(output);				
			}
		} else {
			var output = createRef(context.doc);
			output.status = "extraction error";
			output.gr_status = "extraction error";
			outputs.push(output);	
		}
		
		
	
	} catch (e) {
		var output = createRef(context.doc);
		output.status = "file error";
		output.gr_status = "file error";
		outputs.push(output);
	}	
	
	out.value = outputs;
		
} else {
	//out.console.log(context.error.message);
	var output = createRef(context.doc);
	output.status = "file error";
	output.gr_status = "file error";
	out.value = [output];
}




function extractData (ref, output) {
	
	// separate journals and monographs based on if there is "analytic" or not
	if(ref.analytic) {
		output.gr_article = ref.analytic.title.$t;
		if(ref.monogr && ref.monogr.title) {
			if(ref.monogr.title.level && ref.monogr.title.level === "j") // journal
				output.gr_journal = ref.monogr.title.$t;
			else
				output.gr_compilation = ref.monogr.title.$t;
		}
	} else if(ref.monogr) {
		output.gr_monogr = ref.monogr.title.$t;
		// authors
		if(ref.monogr.author) {
			if( Array.isArray(ref.monogr.author)) {
				
				ref.monogr.author.forEach(function(author) {
					output.gr_authors.push(getAuthor(author));
				})
			} else {
				output.gr_authors.push(getAuthor(ref.monogr.author));
			}
		}
	}
	
	if(ref.monogr.imprint) {
		var im = ref.monogr.imprint;
		// published date
		if(im.date && im.date.type) {
			if(im.date.type === "published" && im.date.when)
				output.gr_publish_year = im.date.when;
		}
		
		// publisher	
		if(im.publisher) {
			output.gr_publisher = im.publisher;
		}		
	}		
}

function getAuthor (author) {
	var names = [];
	if(author.persName && author.persName.surname) {
		if(author.persName.surname.type)
			names.push(author.persName.surname.$t);
		else
			names.push(author.persName.surname);
	}	
	if(author.persName && author.persName.forename) {
		if(author.persName.forename.type)
			names.push(author.persName.forename.$t);
		else
			names.push(author.persName.forename);	
	}

	return names.join(", ");
}

function createRef (source) {
	var ref = JSON.parse(JSON.stringify(source));
	delete ref._id;
	ref.gr_article = "";
	ref.gr_monogr = "";
	ref.gr_compilation = "";
	ref.gr_journal = "";
	ref.gr_publisher = "";
	ref.gr_publish_year = "";
	ref.gr_authors = [];
	ref.gr_status = "ok";
	return ref;
}



