
// pdfx output as json
var data = context.data;

out.setter = {  extracted_references_url:null,
				extracted_references_pdf:null};

if (data.references && data.references.url) {
	out.setter.extracted_references_url = data.references.url;
}

if (data.references && data.references.pdf) {
	out.setter.extracted_references_pdf = data.references.pdf;
}

if(data.error)
	out.setter.error = data.error;
else
	context.vars.success_counter++;
