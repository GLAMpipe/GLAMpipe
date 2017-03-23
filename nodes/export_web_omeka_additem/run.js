
/*
TODO:
- check that user has at least "title" field mapped
- tags and collection not working
*/


var response = context.data;

if(response) {
	out.setter = {"item_upload_handle": response.handle, "item_upload_uuid": response.uuid};
}


