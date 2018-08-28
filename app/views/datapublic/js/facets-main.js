

var g_user = "";

$( document ).ready(function() {
	
	$("#pageinfo").html(config.pageinfo);
	if(config.fetch_date) $("#fetch-date").text(config.fetch_date);
		
	var admin = new refjyx(config);
	admin.doPoll();
	admin.initFilters();
	admin.render();
	admin.renderFilteredCount("#item-count");

/*
	// show login status for shibboleth users
	$.getJSON(config.gp_url + "/auth", function (response) {
		if(response.error)
			alert(response.error);
		else {
			$(".site-links-container").replaceWith("<div>" + response.shibboleth.user + "</div>");
			g_user = response.shibboleth.user;
		}
		
	}).fail(function(jqXHR) {
		if (jqXHR.status == 302) {
			window.location.reload(true); // force re-authentication
		} else {
			alert("Istuntosi luultavasti vanhentui. Kokeile ladata sivu uudelleen.");
		}
	});
*/

	// click handler for static checboxes
	$(document).on("click", ".filter-or input", function(e) {
		var d = $(e.target);
		var key = d.parents("div").attr("id");
		admin.setCheckboxOnOff(key, d.attr("value"), d.is(':checked'));	
		admin.renderFilteredCount();
	})

	// click handler for facets
	$(document).on("change", ".list-group-item input", function(e) {
		var checked = $(this).prop("checked");
		var value = $(this).data("value").toString(); // needed for numerical values like year
		var key = $(e.target).parents("div.panel-collapse").attr("id");
		admin.setFacetOnOff({"key": key, "value": value, "checked": checked});
		admin.renderFilteredCount();
	})
			
	// click handler for facet sorts
	$(document).on("click", ".sort-switch .btn-primary", function(e) {
		var value = $(e.target).data("sort");
		var key = $(e.target).parents("div").data("facet");
		admin.setFacetSort({"key": key, "value": value});
		e.preventDefault();
	})

	// click handler for panel collapse
	$(document).on('hidden.bs.collapse', '.panel-collapse', function (e) {
		admin.setFacetCollapse(e.currentTarget.id, true);
		// hide sort
		$(e.currentTarget).parents(".panel").find(".sort-switch").addClass("hidden");
	})

	// click handler for panel show
	$(document).on('show.bs.collapse', '.panel-collapse', function (e) {
		admin.setFacetCollapse(e.currentTarget.id, false);
		$(e.currentTarget).parents(".panel").find(".sort-switch").removeClass("hidden");
	})

	// click handler for bucket characters
	$(document).on("click", ".bucket_link", function(e) {
		var holder_id = $(e.target).parent().attr("id");
		admin.showBucket(holder_id, $(this).text());
		e.preventDefault();
	})

    // paging handler
	$("#data-prev").on("click", function (e) {
		admin.prevPage();
	});

	$("#data-next").on("click", function (e) {
		admin.nextPage();
	});

	$(document).on("click", "th", function(e) {
		if(admin.sort === $(this).data("key")) {
			admin.sortReverse == 1 ? admin.sortReverse = 0: admin.sortReverse = 1;
		} else {
			admin.sort = $(this).data("key");
			admin.sortReverse = 0;
		}
		$("#sort").text("sorted by: " + $(this).text());
		admin.renderFilteredSet();
	})
/*

	// *************** EDIT tools ********************
	// click handler for key edit
	$(document).on('click', '.edit-key', function (e) {
		var d = $(e.target).parent();
		var holder = d.parent();
		var text = d.parents("td").text();
		d.hide();
		holder.append("<textarea class='data'>"+text+"</textarea>");
		holder.append("<button class='save-key' data-id='"+d.data("id")+"' data-key='"+d.data("key")+"'>tallenna</button>");
		holder.append("<button class='cancel-key' data-id='"+d.data("id")+"' data-key='"+d.data("key")+"'>peru</button>");
		d.parent().find("div").hide();
		e.preventDefault();
	})

	$(document).on('click', '.edit-options', function (e) {
		e.preventDefault();
		admin.renderDropdown(e);
	})

	// click handler for key save
	$(document).on('click', '.save-key', function (e) {
		var d = $(this);
		admin.saveEdit(d);
		e.preventDefault();
	})

	// click handler for cancel
	$(document).on('click', '.cancel-key', function (e) {
		var d = $(this);
		admin.cancelEdit();
		e.preventDefault();
	})

	// click handler for edit dropdowns
	$(document).on('change', '.edit-dropdown', function (e) {
		admin.saveStatusDropdown($(this));
	})


	// ESC cancels open edits
	$(document).keyup(function(e) {
		 if (e.keyCode == 27) { // escape key maps to keycode `27`
			admin.cancelEdit();
		}
	});
*/
});



function getUserShort() {
	if(!g_user) {
		return "";
	}
	var first = g_user.split(".")[0];
	var last = g_user.split(".")[1];
	return first[0].toUpperCase() + first.substr(1) + " " + last[0].toUpperCase();
}


