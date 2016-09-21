
// pdfx output as json
var data = context.data;

out.setter = {};

if (data.references && data.references.url) {
	out.setter.extracted_references_url = data.references.url;
}

if (data.references && data.references.pdf) {
	out.setter.extracted_references_pdf = data.references.pdf;
}

context.vars.success_counter++;
