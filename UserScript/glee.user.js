// ==UserScript==
// @name          Glee
// @namespace     http://colloki.org/
// @description   Keyboard Glee for your web
// @include       *
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.js
// @require 	  http://json.org/json2.js
// ==/UserScript==

jQuery(document).ready(function(){
	//activating the noConflict mode of jQuery
	jQuery.noConflict();
	
	/* initialize the searchBox */
	Glee.initBox();
	
	/* Setup CSS Styles */ 
	var reaperCSS = '.GleeReaped{background-color: #fbee7e !important;border: 1px dotted #818181 !important;} .GleeHL{background-color: #d7fe65 !important;-webkit-box-shadow: rgb(177, 177, 177) 0px 0px 9px !important;-moz-box-shadow: rgb(177, 177, 177) 0px 0px 9px !important;padding: 3px !important;color: #1c3249 !important;border: 1px solid #818181 !important;}';
	
	var gleeCSS = '#gleeBox{ z-index:100000;position:fixed; left:5%; top:35%; display:none; overflow:auto; height:165px;width:90%; background-color:#333; opacity:0.65; color:#fff; margin:0;font-family:Calibri,"Times New Roman",Arial,serif; padding:0;text-align:left;}#gleeSearchField{ width:90%; color:#fff; background-color:#333; margin:0; padding:5px;border:none; font-size:100px; font-family:Calibri,"Helvetica Neue",Arial,Helvetica,serif; }#gleeSubText, #gleeSubURL, #gleeSubActivity{font-size:15px;font-family:Calibri,Arial,Helvetica,serif;color:#fff; font-weight: normal;}#gleeSubText{ padding:5px;float:left;}#gleeSubURL{ padding:5px; display:inline; float:right;}#gleeSubActivity{padding:5px;color:#ccc;height:10px;display:inline;float:left;}';
	
	GM_addStyle(reaperCSS + gleeCSS);
		
	// Bind Keys
	jQuery(document).bind('keydown',function(e){
		var target = e.target || e.srcElement;
		//pressing 'g' toggles the gleeBox
		if(target.nodeName.toLowerCase() != 'input' && target.nodeName.toLowerCase() != 'textarea' && e.keyCode == 71)
		{
			e.preventDefault();
			Glee.userPosBeforeGlee = window.pageYOffset;
			if(Glee.searchBox.css('display') == "none")
			{
				//reseting value of searchField
				Glee.searchField.attr('value','');	
				Glee.searchBox.fadeIn(150);
				Glee.searchField.focus();			
			}
			else
			{
				Glee.searchBox.fadeOut(150);
				Glee.getBackInitialState();
			}
		}
	});
	Glee.searchField.bind('keydown',function(e){
		//pressing 'esc' hides the gleeBox
		if(e.keyCode == 27)
		{
			e.preventDefault();
			LinkReaper.unreapAllLinks();
			//resetting value of searchField
			Glee.getBackInitialState();						
			Glee.searchField.attr('value','');
			Glee.searchBox.fadeOut(150);
			Glee.searchField.blur();
		}
		else if(e.keyCode == 9)
		{
			e.stopPropagation();
			e.preventDefault();
		}
		else if(e.keyCode == 40 || e.keyCode == 38){
			Glee.scrollTimer = setInterval(function(){
			  Glee.simulateScroll((e.keyCode == 40 ? 1:0));
			},1);
		}
	});

	Glee.searchField.bind('keyup',function(e){
		var value = Glee.searchField.attr('value');	
		//check if the content of the text field has changed
		if(Glee.searchText != value)
		{
			e.preventDefault();
			if(value != "")
			{
				Glee.toggleActivity(1);	
				//check if it is the command mode
				if(value[0] == "*" || value[0] == "!")
				{
					Glee.resetTimer();
					Glee.toggleActivity(0);							
					//command to get all images on the page. 
					if(value == "*img")
					{				
						Glee.reapImages();
						Glee.selectedElement = LinkReaper.getFirst();
						Glee.setSubText(Glee.selectedElement,"a");
						Glee.scrollToElement(Glee.selectedElement);
					}
					else if(value == "*input") //command to get all input fields
					{
						
					}
					else if(value == "*a") //command to get all links
					{
						LinkReaper.reapAllLinks();
						Glee.selectedElement = LinkReaper.getFirst();
						Glee.setSubText(Glee.selectedElement,"a");
						Glee.scrollToElement(Glee.selectedElement);
					}
					// now searching through the commands declared inside Glee.commands
					else if(value.substr(1,value.length) in Glee.commands)
					{
						Glee.execCommand(value);
					}
					else
					{
						LinkReaper.unreapAllLinks();
						Glee.setSubText("Command not found", "msg");
					}
				}				
				else{
					//default behavior in non-command mode, i.e. search for links
					//if a timer exists, reset it
					Glee.resetTimer();

					// start the timer	
					Glee.timer = setTimeout(function(){
						LinkReaper.reapLinks(jQuery(Glee.searchField).attr('value'));
						Glee.selectedElement = LinkReaper.getFirst();
						Glee.setSubText(Glee.selectedElement,"a");
						Glee.scrollToElement(Glee.selectedElement);	
						Glee.toggleActivity(0);							
					},400);
				}	
			}
			else
			{
				//when searchField is empty
				Glee.resetTimer();
				// start the timer
				Glee.timer = setTimeout(function(){
					LinkReaper.unreapAllLinks();
					Glee.setSubText(null);				
					Glee.toggleActivity(0);																		
				},400);
			}
			Glee.searchText = value;
		}
		else if(e.keyCode == 9)  //if TAB is pressed
		{
			e.preventDefault();
			if(value != "")
			{
				if(e.shiftKey)
				{
					Glee.selectedElement = LinkReaper.getPrev();
				}
				else
				{
					Glee.selectedElement = LinkReaper.getNext();
				}
				Glee.setSubText(Glee.selectedElement,"a");
				Glee.scrollToElement(Glee.selectedElement);
			}
		}
		else if(e.keyCode == 13 && Glee.subURL.text() != "") //if ENTER is pressed
		{
			e.preventDefault();			
			if(e.shiftKey)
			{
				//opens a popup. susceptible to being blocked by a popup blocker. need a better way
				if(Glee.selectedElement)
				{
					window.open(Glee.selectedElement.attr("href"));
				}
				else
				{
					window.open(Glee.subURL.text());
				}
				return false;
			}
			else
			{
				if(Glee.selectedElement)
				{
					window.location = Glee.selectedElement.attr("href");
				}
				else
				{
					window.location = Glee.subURL.text();
				}
			}
		}
		else if(e.keyCode == 40 || e.keyCode == 38) //if UP/DOWN arrow keys are pressed
		{
			clearInterval(Glee.scrollTimer);
		}
	});
});

var Glee = { 
	searchText:"",
	commands:{
		"later"			: "Glee.readLater",
		"tweet" 		: "Glee.sendTweet",
		"shorten"		: "Glee.shortenURL",
		"read"			: "Glee.makeReadable"
	},
	
	initBox: function(){
		// Creating the div to be displayed
		var searchField = jQuery("<input type=\"text\" id=\"gleeSearchField\" value=\"\" />");
		var subText = jQuery("<div id=\"gleeSubText\">No Links selected</div>");
		var subURL = jQuery("<div id=\"gleeSubURL\"></div>")
		var subActivity	= jQuery("<div id=\"gleeSubActivity\"></div>")
		var sub = jQuery("<div id=\"gleeSub\"></div>");
		var searchBox = jQuery("<div id=\"gleeBox\"></div>");	
		sub.append(subText).append(subActivity).append(subURL);
		searchBox.append(searchField).append(sub);
		this.searchBox = searchBox;
		this.searchField = searchField;
		this.subText = subText;
		this.subURL = subURL;
		jQuery(document.body).append(searchBox);
	},	
	setSubText: function(val,type){
		if(type == "a")
		{
			if(val && typeof val!= "undefined")
			{
				//checking if it a linked image
				if(jQuery(val).find("img").length != 0)
				{
					var href = jQuery(val).attr("href");
					if(href.length > 80)
					{
						href = Glee.truncateURL(href);
					}
					this.subURL.html(href);
					var title = jQuery(val).attr("title") || jQuery(val).find('img').attr('title');
					if(title!= "")
					{
						this.subText.html(title);
					}
					else
					{
						this.subText.html("Linked Image");
					}
				}	
				else
				{
					var title = jQuery(val).attr('title');
					var text = jQuery(val).text();

					this.subText.html(text);
					if(title !="" && title != text)
					{
						this.subText.html(this.subText.html()+" -- "+title);
					}
					this.subURL.html(jQuery(val).attr('href'));		
				}
			}
			else
			{
				var text = Glee.searchField.attr("value");
				//if it is a URL
				if(text.indexOf('.com') != -1)
				{
					Glee.selectedElement = null;
					this.subText.html("Go to "+text);
					this.subURL.html("http://"+text);
				}
				else
				{
					this.subText.html("Google "+text);
					this.subURL.html("http://www.google.com/search?q="+text);
				}
			}
		}
		else if(type == "msg")
		{
			this.subText.html(val);
			this.subURL.html('');
		}
		else
		{
			this.subText.html("Nothing selected");
			this.subURL.html('');
		}
	},
	scrollToElement: function(el){
		var target = el;
		if(target)
		{
			if(target.length)
			{
				// We keep the scroll such that the element stays a little away from
				// the top.
				var targetOffset = target.offset().top - 60;
				jQuery('html,body').animate({scrollTop:targetOffset},750);
				return false;
			}
		}
	},
	toggleActivity: function(toggle){
		if(toggle == 1)
		{
		//	jQuery("#gleeSubActivity").fadeIn('slow');
			jQuery("#gleeSubActivity").html("searching");
		}
		else
		{
			// jQuery("#gleeSubActivity").fadeOut('slow');
			jQuery("#gleeSubActivity").html("");			
		}
	},
	getBackInitialState: function(){
		jQuery('html,body').animate({scrollTop:Glee.userPosBeforeGlee},750);
	},
	simulateScroll: function(val){
		if(val == 1)
			window.scrollTo(window.pageXOffset,window.pageYOffset+15);
		else if(val == 0)
			window.scrollTo(window.pageXOffset,window.pageYOffset-15);	
		Glee.userPosBeforeGlee = window.pageYOffset;
	},
	resetTimer: function(){
		if(typeof(Glee.timer) != "undefined")
		{			
			clearTimeout(Glee.timer);					
		}
	},
	truncateURL:function(url){
		return url.substr(0,78)+"...";
	},
	isVisible:function(el){
		el = jQuery(el);
		if(el.css('display') == "none" || el.css('visibility') == "hidden")
		{
			return false;
		}
		return true;
	},
	reapImages: function(){
		//only returning linked images...
		LinkReaper.selectedLinks = jQuery("a:has(img)");
		LinkReaper.selectedLinks.each(function(){
			jQuery(this).addClass('GleeReaped');
		});
		LinkReaper.selectedLinks = jQuery.grep(LinkReaper.selectedLinks, Glee.isVisible);		
		this.traversePosition = 0;
		LinkReaper.searchTerm = "";	
	},
	sendRequest: function(url,method,callback){
		//dependent upon Greasemonkey to send this cross-domain XMLHTTPRequest :|
		//doing a setTimeout workaround (http://www.neaveru.com/wordpress/index.php/2008/05/09/greasemonkey-bug-domnodeinserted-event-doesnt-allow-gm_xmlhttprequest/)
		// yet to explore the problem fully
		setTimeout(function(){
		GM_xmlhttpRequest({
			method: "GET",
			url:"http://api.bit.ly/shorten?version=2.0.1&longUrl="+location.href+"&login=bitlyapidemo&apiKey=R_0da49e0a9118ff35f52f629d2d71bf07",
			headers:{
		    "User-Agent":"monkeyagent",
		    "Accept":"text/monkey,text/xml",
		    },
		onload:callback		
		});
		},0);
		
	},
	
	execCommand: function(value){
		//get the command
		var cmd = value.substr(1,value.length);
		//call the method
		//not sure if eval is the way to go here
		var method = Glee.commands[cmd]+"()";
		eval(method);
	},
	
	makeReadable: function(){
		Glee.setSubText("wait till Glee+Readability work up the magic","msg");		
		//code from the Readability bookmarklet (http://lab.arc90.com/experiments/readability/)
	 	location.href = "javascript:(function(){readStyle='style-newspaper';readSize='size-large';readMargin='margin-wide';_readability_script=document.createElement('SCRIPT');_readability_script.type='text/javascript';_readability_script.src='http://lab.arc90.com/experiments/readability/js/readability.js?x='+(Math.random());document.getElementsByTagName('head')[0].appendChild(_readability_script);_readability_css=document.createElement('LINK');_readability_css.rel='stylesheet';_readability_css.href='http://lab.arc90.com/experiments/readability/css/readability.css';_readability_css.type='text/css';_readability_css.media='screen';document.getElementsByTagName('head')[0].appendChild(_readability_css);_readability_print_css=document.createElement('LINK');_readability_print_css.rel='stylesheet';_readability_print_css.href='http://lab.arc90.com/experiments/readability/css/readability-print.css';_readability_print_css.media='print';_readability_print_css.type='text/css';document.getElementsByTagName('head')[0].appendChild(_readability_print_css);})();";
	},
	
	shortenURL: function(){
		Glee.setSubText("Shortening URL via bit.ly...","msg");
		//creating an XMLHTTPRequest to bit.ly using GM_xmlhttpRequest
		Glee.sendRequest("http://api.bit.ly/shorten?version=2.0.1&longUrl="+location.href+"&login=gleebox&apiKey=R_136db59d8b8541e2fd0bd9459c6fad82","GET",
		function(data){
			var json = JSON.parse("["+data.responseText+"]");
			var shortenedURL = json[0].results[location.href].shortUrl;
			Glee.searchField.attr("value",shortenedURL);
			Glee.setSubText("You can now copy the shortened URL to your clipboard!","msg");
		});
	},
	
	sendTweet: function(){
		//if the url is longer than 30 characters, send request to bitly to get the shortened URL
		var url = location.href;
		Glee.setSubText("Redirecting to twitter homepage...","msg");		
		if(url.length > 30)
		{
			Glee.sendRequest("http://api.bit.ly/shorten?version=2.0.1&longUrl="+location.href+"&login=bitlyapidemo&apiKey=R_0da49e0a9118ff35f52f629d2d71bf07","GET",
			function(data){
				var json = JSON.parse("["+data.responseText+"]");
				var shortenedURL = json[0].results[location.href].shortUrl;
				var encodedURL = escape(shortenedURL);
				//redirect to twitter homepage
				location.href = "http://twitter.com/?status="+encodedURL;
			});
		}
		else
		{
			//redirect to twitter without shortening the URL
			var encodedURL = escape(location.href);
			location.href =  "http://twitter.com/?status="+encodedURL;
		}
	},
	readLater:function(){
		//code via instapaper bookmarklet
		Glee.setSubText("Saving to Instapaper...","msg");
		location.href = "javascript:function%20iprl5(){var%20d=document,z=d.createElement('scr'+'ipt'),b=d.body;try{if(!b)throw(0);d.title='(Saving...)%20'+d.title;z.setAttribute('src','http://www.instapaper.com/j/3UK7xXDlnSJm?u='+encodeURIComponent(d.location.href)+'&t='+(new%20Date().getTime()));b.appendChild(z);}catch(e){alert('Please%20wait%20until%20the%20page%20has%20loaded.');}}iprl5();void(0)";
	}

}

var LinkReaper = {
	
	searchTerm: "",
	selectedLinks: [],
	traversePosition: 0,
	
	reapAllLinks:function(){
		this.selectedLinks = jQuery("a");
		//get rid of the hidden links
		this.selectedLinks = jQuery.grep(this.selectedLinks, Glee.isVisible);
		//get rid of the linked images. we only want textual links
		var hasImage = function(el){
			return (jQuery(el).find('img').length == 0);
		};
		this.selectedLinks = jQuery(jQuery.grep(this.selectedLinks,hasImage));
		this.selectedLinks.each(function(){
			jQuery(this).addClass('GleeReaped');
		});
		this.traversePosition = 0;
		//can't figure out what value to set of searchTerm here
		LinkReaper.searchTerm = "";
	},
	
	reapLinks: function(term) {
		if((term != "") && (LinkReaper.searchTerm != term))
		{
			// If this term is a specialization of the last term
			if((term.indexOf(LinkReaper.searchTerm) == 0) &&
			(LinkReaper.searchTerm != ""))
			{
				jQuery(LinkReaper.selectedLinks).each(function(){
					if(!LinkReaper.reapALink(jQuery(this), term))
					{
						LinkReaper.unreapLink(jQuery(this));						
					}
				});
			}
			// Else search the whole page
			else
			{
				newList = [];
				jQuery('a').each(function(){
					if(!LinkReaper.reapALink(jQuery(this), term))
					{
						LinkReaper.unreapLink(jQuery(this));
					}
					else
					{
						newList.push(jQuery(this));
					}
				});
				LinkReaper.selectedLinks = newList;
			}
			LinkReaper.searchTerm = term;
			this.traversePosition = 0;
			//Filtering links to get only the ones visible
			this.selectedLinks = jQuery.grep(this.selectedLinks, Glee.isVisible);
		}
	},
	
	reapALink: function(el, term) {
		var index = el.text().toLowerCase().indexOf(term.toLowerCase());
		if(index != -1) {
			el.addClass('GleeReaped');
			Glee.setSubText(el,"a");
			return true;
		}
		else {
			return false;
		}
	},
	
	unreapLink: function(el) {
		// TODO: What if there are multiple links with different names and same URL?
		var isNotEqual = function(element){
			element = jQuery(element);
			if(element.attr('href') == el.attr('href') )
			{
				return false;
			}
			else
			{
				return true;
			}
		};		
		this.selectedLinks = this.selectedLinks.filter(isNotEqual);
		el.removeClass('GleeReaped').removeClass('GleeHL');
	},
	
	unreapAllLinks: function() {
		jQuery(this.selectedLinks).each(function(){
			jQuery(this).removeClass('GleeReaped').removeClass('GleeHL');
		});
		this.selectedLinks.splice(0,LinkReaper.selectedLinks.length);
		this.searchTerm = "";
		this.traversePosition = 0;
	},
	
	getNext: function(){
		if(this.selectedLinks.length == 0)
		{
			return null;
		}
		else if(this.traversePosition < this.selectedLinks.length - 1)
		{
			this.unHighlight(jQuery(this.selectedLinks[this.traversePosition]));
			var hlItem = this.selectedLinks[++this.traversePosition];
			this.highlight(jQuery(hlItem));
			return jQuery(hlItem);
		}
		else
		{
			//Un-highlight the last item. This might be a loopback.
			this.unHighlight(jQuery(this.selectedLinks[this.selectedLinks.length - 1]));
			this.traversePosition = 0;
			this.highlight(jQuery(this.selectedLinks[0]));
			return jQuery(this.selectedLinks[0]);	
		}
		
	},
	
	getPrev: function(){
		if(this.selectedLinks.length == 0)
		{
			return null;
		}
		else if(this.traversePosition > 0)
		{
			this.unHighlight(jQuery(this.selectedLinks[this.traversePosition]));
			var hlItem = this.selectedLinks[--this.traversePosition];
			this.highlight(jQuery(hlItem));
			return jQuery(hlItem);
		}
		else
		{
			//Un-highlight the first item. This might be a reverse loopback.
			this.unHighlight(jQuery(this.selectedLinks[0]));
			this.traversePosition = this.selectedLinks.length - 1;
			this.highlight(jQuery(this.selectedLinks[this.selectedLinks.length - 1]));
			return jQuery(this.selectedLinks[this.selectedLinks.length - 1]);
		}
		
	},
	
	getFirst: function(){
		this.highlight(jQuery(this.selectedLinks[0]));
		this.traversePosition = 0;
		return this.selectedLinks[0];
	},
	
	highlight: function(el){
		el.removeClass("GleeReaped");
		el.addClass("GleeHL");
	},
	
	unHighlight: function(el){
		el.removeClass("GleeHL");
		el.addClass("GleeReaped");
	}
}



