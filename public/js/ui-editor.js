$( document ).ready(function() {
	
	var editor = new nodeEditor();
	editor.loadNode();

	$(".node").on("click", async function (e) {
		editor.openScript($(this).data("id"))
	});
	
})
