var c = context;
if(context.response && context.response.statusCode == 200 && context.data.resultCount) {
	var numFound = parseInt(context.data.resultCount, 10);
		var pageCount = Math.ceil(numFound/c.var.limit)  ;
		out.say('progress', 'Fetching page ' + c.var.page + ' of '+pageCount+ ' Total records: ' + numFound);
		var imgBase = 'https://api.finna.fi';
		var finnaBase = 'https://finna.fi';
		var result = [];
		var out_records = [];
		c.var.page++;

		if (context.data.records && Array.isArray(context.data.records)) {
			if(context.node.settings.raw === "true")
				out_records = context.data.records;
			else
				createDocs(context.data.records);
		}

		// check that we do have some records
		if(out_records.length === 0) {
			out.value = null;
			out.say('error', 'Your query failed! No records in the set');
		} else {
			out.value = out_records;
			c.var.total_count += out_records.length;
			 var limit = parseInt(context.node.settings.limit);
			 if (limit <= 0 || isNaN(limit))
				 limit = 999999999;

			 /* check if there is any data left on the server */
			if(c.var.page <= pageCount && c.var.page <= limit)
				 out.url = c.var.url + '&page=' + c.var.page + c.var.fields_str;
		}

} else {
	out.say('error', 'Your query failed! Please check query');
	out.value = null;
}




function createDocs (recs) {

		/* we do some data cleaning here */
		out.say("progress", recs);
		for(var i = 0; i < recs.length; i++) {

			 var out_rec = {};
			 out_rec.rights = '';
			 out_rec.description = '';
			 out_rec.title = '';
			 out_rec.title_short = '';
			 out_rec.title_sub = '';
			 out_rec.image_url = '';
			 out_rec.thumbnail_html = '';
			 out_rec.id = '';
			 out_rec.full_record = '';
			 out_rec.rights = '';
			 out_rec.year = '';
			 out_rec.subjects = [];
			 out_rec.buildings = [];
			 out_rec.formats = [];
			 out_rec.authors = [];
			 out_rec.institutions = [];
			 out_rec.isbns = [];
			 out_rec.isbn_clean = "";
			 out_rec.series_name = [];
			 out_rec.series_additional = [];
			 out_rec.series_issn = [];
			 out_rec.publishers = [];
			 out_rec.subjects = [];
			 out_rec.record_url = "";
			 out_rec.physical_descriptions = [];
			 out_rec.query = c.var.query_url;

			 if(recs[i].images) {
				 out_rec.image_url = imgBase + recs[i].images[0];
				 out_rec.thumbnail_html = '<img src=\"' + out_rec.image_url + '&w=300&h=300\"/>';
			 }

			 /* make sure that we always have 'subjects' as ARRAY */
			if (recs[i].subjects && Array.isArray(recs[i].subjects)) {
				 var subjects = recs[i].subjects;
				 var arr = [];
				 for(var j = 0; j < subjects.length; j++) {
					if(Array.isArray(subjects[j]))
						arr.push(subjects[j][0]);
					else
						arr.push(subjects[j]);
				 }
				 out_rec.subjects = arr;
			 }

			 if (recs[i].title)
				 out_rec.title = recs[i].title;

			 if (recs[i].shortTitle)
				 out_rec.title_short = recs[i].shortTitle;

			 if (recs[i].subTitle)
				 out_rec.title_sub = recs[i].subTitle;

			 if (recs[i].year)
				 out_rec.year = recs[i].year;

			 if (recs[i].id)
				 out_rec.finna_id = recs[i].id;

			 if (recs[i].fullRecord)
				 out_rec.full_record = recs[i].fullRecord;

			 if (recs[i].summary)
				 out_rec.description = recs[i].summary;

			 if (out_rec.imageRights)
				 recs[i].rights =  recs[i].imageRights.copyright;

			 /* institutions */
			 if (recs[i].institutions && recs[i].institutions.constructor.name == 'Array') {
				 var institutions = recs[i].institutions;
				 var institutionsArr = [];
				 for(var j = 0; j < institutions.length; j++) {
					 institutionsArr.push(institutions[j].translated);
				 }
				 out_rec.institutions = institutionsArr;
			 }

			if (recs[i].isbns)
				 out_rec.isbns = recs[i].isbns;

			if (recs[i].cleanIsbn)
				 out_rec.isbn_clean = recs[i].cleanIsbn;
				 
			if (recs[i].physicalDescriptions)
				out_rec.physical_descriptions = recs[i].physicalDescriptions;

			if (recs[i].publishers)
				 out_rec.publishers = recs[i].publishers;

			if(recs[i].recordPage)
				 out_rec.record_url = finnaBase + recs[i].recordPage;
			
			// subjects is array of arrays
			if(recs[i].subjects && Array.isArray(recs[i].subjects)) {
				if(Array.isArray(recs[i].subjects[0]) && typeof recs[i].subjects[0][0] === "string")
					out_rec.subjects.push(recs[i].subjects[0][0]);
			}
				 
			 /* series */
			 if (recs[i].series && Array.isArray(recs[i].series)) {
				 var series = recs[i].series;
				 for(var j = 0; j < series.length; j++) {
					 if(series[j].name)
						out_rec.series_name.push(series[j].name);
					else
						out_rec.series_name.push("");
						
					 if(series[j].issn)
						out_rec.series_issn.push(series[j].issn);
					else
						out_rec.series_issn.push("");
						
					 if(series[j].additional)
						out_rec.series_additional.push(series[j].additional);
					else
						out_rec.series_additional.push("");
				 }
			 }

			 /* buildings */
			 if (recs[i].buildings && recs[i].buildings.constructor.name == 'Array') {
				 var buildings = recs[i].buildings;
				 var buildingsArr = [];
				 for(var j = 0; j < buildings.length; j++) {
					 buildingsArr.push(buildings[j].translated);
				 }
				 out_rec.buildings = buildingsArr;
			 }


			 /* formats */
			 if (recs[i].formats && recs[i].formats.constructor.name == 'Array') {
				 var formats = recs[i].formats;
				 var formatsArr = [];
				 for(var j = 0; j < formats.length; j++) {
					 formatsArr.push(formats[j].translated);
				 }
				 out_rec.formats = formatsArr;
			 }


			 /* authors */
			 if(recs[i].nonPresenterAuthors && recs[i].nonPresenterAuthors.constructor.name == 'Array') {
				 var authors = recs[i].nonPresenterAuthors;
				 var authorArr = [];
				 for(var j = 0; j < authors.length; j++) {
					 authorArr.push(authors[j].name);
				 }
				 out_rec.authors = authorArr;
			 }

			 out_records.push(out_rec);

		 }

}
