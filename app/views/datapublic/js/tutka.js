



function makeURNLink (arr, link) {
		if(Array.isArray(arr)) {
			var arr = arr.filter(Boolean);
			return "<a href='http://urn.fi/"+arr[0]+"'>" + link + "</a>";
		} else {
			return "<a href='http://urn.fi/" +arr+ "'>" + link + "</a>";
		}	
	}


$( document ).ready(function() {
	
	$("#pageinfo").html(config.pageinfo);
		
	var admin = new refjyx(config);
	admin.initFilters();
	admin.render();
	admin.renderFilteredCount("#item-count");
	
	// click handler for static checboxes
	$(".filter-or input").click(function(e) {
		var d = $(e.target);
		var key = d.parents("div").attr("id");
		admin.setCheckboxOnOff(key, d.attr("value"), d.is(':checked'));	
		admin.renderFilteredCount("#item-count");
	})

	// click handler for facets
	$(document).on("change", ".list-group-item input", function(e) {
		var checked = $(this).prop("checked");
		var value = $(this).data("value").toString(); // needed for numerical values like year
		var key = $(e.target).parents("div.panel-collapse").attr("id");
		admin.setFacetOnOff({"key": key, "value": value, "checked": checked});
		admin.renderFilteredCount("#item-count");
	})
			
	// click handler for facet sorts
	$(document).on("click", ".sort-switch .btn", function(e) {
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

    // paging handler
	$("#data-prev").on("click", function (e) {
		admin.prevPage();
	});

	$("#data-next").on("click", function (e) {
		admin.nextPage();
	});

});


