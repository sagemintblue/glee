jQuery(document).ready(function(){
	//activating the noConflict mode of jQuery
	jQuery.noConflict();
	
	/* initialize the searchBox */
	Glee.initBox();
	
	jQuery(document).bind('keydown',function(e){
		//pressing 'g' toggles the gleeBox
		if(jQuery(e.target).attr('id') != 'gleeSearchField' && e.keyCode == 71)
		{
			e.preventDefault();				
			if(Glee.searchBox.css('display') == "none")
			{					
				//reseting value of searchField
				Glee.searchField.attr('value','');	
				Glee.searchBox.fadeIn('fast');
				Glee.searchField.focus();					
			}
			else
			{
				Glee.searchBox.fadeOut('fast');					
			}
		}
	});
	Glee.searchField.bind('keydown',function(e){
		//pressing 'esc' hides the gleeBox
		if(e.keyCode == 27)
		{
			e.preventDefault();			
			LinkReaper.unreapAllLinks();			
			//reseting value of searchField
			Glee.searchField.attr('value','');				
			Glee.searchBox.fadeOut('fast');		
			Glee.searchField.blur();
		}
		else if(e.keyCode == 9)
		{
			e.stopPropagation();
			e.preventDefault();
		}
	});
	Glee.searchField.bind('keyup',function(e){			
		if(e.keyCode == 9)
		{
			e.preventDefault();
			if(Glee.searchField.attr('value') != "")
				Glee.setSubText(LinkReaper.getNextLink());
		}
		else if(Glee.searchField.attr('value') != "")
		{
			//reseting value of searchField					
			LinkReaper.reapLinks(jQuery(this).attr('value'));
				Glee.setSubText(LinkReaper.getNextLink());			
		}
		else if(Glee.searchField.attr('value') == "")
		{
			e.preventDefault();						
			LinkReaper.unreapAllLinks();
			Glee.setSubText(null);
		}
	});
});

var Glee = { 
	initBox: function(){
		//creating the div to be displayed
		var searchField = jQuery("<input type=\"text\" id=\"gleeSearchField\" value=\"\" />");
		var subText = jQuery("<div id=\"gleeSubText\">No links selected</div>");
		var searchBox = jQuery("<div id=\"gleeBox\"></div>");
		searchBox.append(searchField);
		searchBox.append(subText);
		this.searchBox = searchBox;
		this.searchField = searchField;
		this.subText = subText;
		jQuery(document.body).append(searchBox);
	},
	setSubText: function(el){
		if(!el)
		{
			this.subText.html("No links selected");
		}
		else if(typeof(el)!= "undefined")
		{
			this.subText.html(el.text());
		}
	}
}
