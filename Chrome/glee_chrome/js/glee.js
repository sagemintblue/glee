/**
 * gleeBox: Keyboard glee for your web
 * 
 * Licensed under the GPL license (http://www.gnu.org/licenses/gpl.html)
 * Copyright (c) 2010 Ankit Ahuja
 * Copyright (c) 2010 Sameer Ahuja
 *
 **/

jQuery(document).ready(function(){
	// activating the no conflict mode of jQuery
	jQuery.noConflict();
	
    // create gleebox DOM elements
	Glee.initBox();
	
	// Crash and burn. This won't work because the loading has probably not finished yet.
	if(Glee.options.status == 0)
		return;
	
	// Setup cache for global jQuery objects
	Glee.cache.jBody = jQuery('html,body');
	
	// Key bindings
	jQuery(window).bind('keydown',function(e){
	    
		var target = e.target || e.srcElement;
		if(Glee.options.status != 0)
		{
			if((target.nodeName.toLowerCase() != 'input' && target.nodeName.toLowerCase() != 'textarea' && target.nodeName.toLowerCase() != 'div' && target.nodeName.toLowerCase() != 'object') || e.altKey)
			{
			    if(target.id == "gleeSearchField")
			        return true;
				
				if(e.keyCode == Glee.options.shortcutKey || (e.keyCode == Glee.options.tabShortcutKey && Glee.options.tabShortcutStatus))
				{
				    if(e.metaKey || e.ctrlKey || e.shiftKey)
						return true;
					e.preventDefault();
				    Glee.userPosBeforeGlee = window.pageYOffset;
                    // set default subtext
            		Glee.subText.html(Glee.defaults.nullStateMessage);

					if(e.keyCode == Glee.options.shortcutKey)
					    Glee.open();
					else
                        Glee.openTabManager();
				}
			}
		}
	});
	Glee.searchField.bind('keydown',function(e){
	    
        // Escape: Hides gleeBox
		if(e.keyCode == 27)
		{
			e.preventDefault();
			Glee.closeBox();
		}
		// TAB: Scroll between elements/bookmarks
		else if(e.keyCode == 9)
		{
			e.stopPropagation();
			e.preventDefault();
			
			if(Glee.selectedElement)
			{
			    // If Shift is pressed, scroll to previous element
				if(e.shiftKey)
					Glee.selectedElement = LinkReaper.getPrev();
				else
					Glee.selectedElement = LinkReaper.getNext();
				Glee.scrollToElement(Glee.selectedElement);

				// do not update subtext in case of inspect command
				if(Glee.commandMode && Glee.inspectMode)
					return;
				Glee.setSubText(Glee.selectedElement,"el");
			}
			else if(Glee.bookmarks.length != 0)
			{
				if(e.shiftKey)
					Glee.getPrevBookmark();
				else
					Glee.getNextBookmark();
			}
		}
		// Up/Down Arrow keys: Page scrolling
		else if(e.keyCode == 40 || e.keyCode == 38) 
		{
			Glee.Utils.simulateScroll((e.keyCode == 38 ? 1 : -1));
		}
		// Open Tab Manager when shortcut key is pressed in gleebox or outside gleebox
		else if(e.keyCode == Glee.options.tabShortcutKey && Glee.searchField.attr("value").length == 0)
		{
		    if(e.metaKey || e.ctrlKey || e.shiftKey)
		        break;
			Glee.openTabManager();
			return;
		}
	});
	Glee.searchField.bind('keyup',function(e){
		var value = Glee.searchField.attr('value');

		// Check if content of gleeBox has changed
		if(Glee.lastQuery != value)
		{
			e.preventDefault();

			if(value.indexOf(Glee.lastQuery) != -1 && Glee.lastQuery && !Glee.selectedElement && !Glee.isSearching)
				Glee.isDOMSearchRequired = false;
			else
				Glee.isDOMSearchRequired = true;

			if(value != "")
			{
			    
				Glee.toggleActivity(1);
				
				// Check if the query is not a command
				if(value[0] != "?"
					&& value[0] != "!"
					&& value[0] != ":"
					&& value[0] != '*')
				{
					if(Glee.commandMode)
						LinkReaper.unreapAllLinks();
                    
					Glee.commandMode = false;

					// if a previous query's timer exists, reset it
					Glee.resetTimer();

					if(Glee.isDOMSearchRequired)
					{
					    // Set timer to search for links
						Glee.timer = setTimeout(function(){
							LinkReaper.reapLinks(Glee.searchField.attr('value'));
							Glee.selectedElement = LinkReaper.getFirst();
							Glee.setSubText(Glee.selectedElement,"el");
							Glee.scrollToElement(Glee.selectedElement);
							Glee.toggleActivity(0);
						},300);
					}
					else
					{
						Glee.setSubText(null,"el");
						Glee.toggleActivity(0);
					}
				}
                // Command Mode
				else {
					// Flush any previously selected links
					LinkReaper.unreapAllLinks();
					
					Glee.commandMode = true;
					Glee.inspectMode = false;
					Glee.selectedElement = null; // reset selected element
					
					if(Glee.options.bookmarkSearchStatus)
						Glee.bookmarks = []; // empty the bookmarks array
					Glee.resetTimer();
					Glee.toggleActivity(0);
					var foundScraper = false;
					
					// Scraper commands
					if(value[0] == '?' && value.length > 1)
					{
						trimVal = value.substr(1);
						for(var i=0; i<Glee.scrapers.length; i++)
						{
							if(Glee.scrapers[i].command == trimVal)
							{
								Glee.initScraper(Glee.scrapers[i]);
								foundScraper = true;
								break;
							}
						}
						if(!foundScraper)
							Glee.setSubText(null);
					}
					
					// Yubnub commands
					else if(value[0] == ':') 
					{
						c = value.substring(1);
						c = c.replace("$", location.href);
						Glee.subText.html(Glee.Utils.filter("Run yubnub command (press enter to execute): " + c));
						Glee.URL = "http://yubnub.org/parser/parse?command=" + encodeURIComponent(c);
						Glee.subURL.html(Glee.Utils.filter(Glee.URL));
					}
					
					// Any jQuery selector
					else if(value[0] == '*') 
					{
						Glee.nullMessage = "Nothing found for your selector.";
						Glee.setSubText("Enter jQuery selector and press enter, at your own risk.", "msg");
					}
					
					// Page commands
					else if(value[0] == "!" && value.length > 1)
					{
						trimVal = value.split(" ")[0].substr(1);
						Glee.URL = null;
						for(var i=0; i<Glee.commands.length; i++)
						{
							if(trimVal == Glee.commands[i].name)
							{
								Glee.setSubText(Glee.commands[i].description,"msg");
								Glee.URL = Glee.commands[i];
								break;
							}
						}
                        // If it is not a valid page command, execute closest matching bookmarklet
						if(!Glee.URL)
						{
							Glee.Chrome.getBookmarklet(trimVal);
						}
					}
					// No valid command. Notify user
					else
					{
						Glee.setSubText("Command not found", "msg");
					}
				}
			}
			// gleeBox is empty
			else
			{
			    // reset everything
				Glee.resetTimer();
				LinkReaper.unreapAllLinks();
				Glee.setSubText(null);
				Glee.selectedElement = null;
				Glee.commandMode = false;
				Glee.toggleActivity(0);
				
				// If an ESP vision exists, execute it
				if(Glee.options.espStatus)
					Glee.fireEsp();
			}
			Glee.lastQuery = value;
			Glee.lastjQuery = null;
		}
        
        // ENTER: Execute query
		else if(e.keyCode == 13)
		{
			e.preventDefault();
			
			// jQuery Selector
			if(value[0] == "*" && value != Glee.lastjQuery)
			{
				if(Glee.selectedElement)
					Glee.selectedElement.removeClass('GleeHL');
				LinkReaper.reapWhatever(value.substring(1));
				Glee.selectedElement = LinkReaper.getFirst();
				Glee.setSubText(Glee.selectedElement,"el");
				Glee.scrollToElement(Glee.selectedElement);
				Glee.lastjQuery = value;
				Glee.addCommandToCache(value);
			}
			// Page command / Bookmarklet
			else if(value[0] == "!" && value.length > 1)
			{
			    // !inspect command: Return 
				if(Glee.inspectMode)
				{
					Glee.inspectMode = false;
					result = Glee.inspectElement(Glee.selectedElement, 0);
					Glee.searchField.attr("value", result);
					Glee.setSubText("Now you can execute selector by adding * at the beginning or use !set vision=selector to add an esp vision for this page.", "msg");
					return;
				}
                
                Glee.addCommandToCache(value);
				
				// TODO:Glee.URL is misleading here when it actually contains the command or bookmarklet. Fix this
				// If it a valid page command, execute it
				if(typeof(Glee.URL.name) != "undefined")
				{
				    if(e.shiftKey)
				        Glee.execCommand(Glee.URL, true);
					else
					    Glee.execCommand(Glee.URL, false);
					return;
				}
				else
				{
					url = Glee.URL.url;
					var len = url.length;
					// Replace occurences of window.open in bookmarklet JS so that Chrome does not block it as a popup
					url = url.replace('window.open', 'Glee.Chrome.openPageInNewTab');

					// location.href = url doesn't work properly for all bookmarklets in Chrome
					// Hence, this hack.
					
					if(url.substring(len - 3, len) == "();")
						location.href = url;
					else 
						eval(unescape(url.substring(11)));

					Glee.setSubText("Executing bookmarklet '" + Glee.URL.title + "'...","msg");

					setTimeout(function(){
						Glee.closeBox();
					},0);
				}
			}
			else
			{
				var anythingOnClick = true;
				// if is a yubnub command, add it to cache
				if(value[0] == ":")
				    Glee.addCommandToCache(value.split(" ")[0]);
                
				// If an element is selected
				if(Glee.selectedElement)
				{
					// Check to see if an anchor element is associated with the selected element
					var a_el = null;
					if (Glee.selectedElement[0].tagName == "A")
						a_el = Glee.selectedElement;
					else if (Glee.selectedElement[0].tagName == "IMG")
						a_el = Glee.selectedElement.parents('a');
					else
						a_el = Glee.selectedElement.find('a');

                    // If an anchor is found, execute it
					if(a_el)
					{
						if(a_el.length != 0)
						{
							// If Shift is pressed, open in new tab
							if(e.shiftKey)
								target = true;
							else
								target = false;
								
							// Resetting target attribute of link so that it does not interfere with Shift
							a_el.attr("target","_self");
							
							// Simulating a click on the link
							anythingOnClick = Glee.Utils.simulateClick(a_el,target);
							
							// If opening link on the same page, close gleeBox
							if(!target)
							{
								setTimeout(function(){
									Glee.searchField.blur();
								},0);
								Glee.closeBoxWithoutBlur();
							}

							// If link is to be opened in a new tab & it isn't a scraper command, clear gleebox
							else if(Glee.searchField.attr('value').indexOf("?") == -1)
								Glee.searchField.attr('value','');
							return false;
						}
					}
				}
				// If URL is empty or #, set it to null
				if(Glee.URL == "#" || Glee.URL == "")
					Glee.URL = null;

				if(Glee.URL)
				{
					// If the URL is relative, make it absolute
					Glee.URL = Glee.Utils.makeURLAbsolute(Glee.URL, location.href);
					
					// Open in new tab
					if(e.shiftKey)
					{
						Glee.Chrome.openNewTab(Glee.URL,false);
						// If it is not a scraper command, clear gleebox
						if(Glee.searchField.attr('value').indexOf("?") == -1)
							Glee.searchField.attr('value','');
						return false;
					}
					else
					{
						url = Glee.URL;
						Glee.closeBoxWithoutBlur();
						window.location = url;
					}
				}
				else // If it is an input / textarea / button, set focus/click it, else bring back focus to document
				{
					if(Glee.selectedElement)
					{
						var el = Glee.selectedElement[0];
						if(el.tagName == "INPUT" && (el.type == "button" || el.type == "submit" || el.type == "image"))
						{
							setTimeout(function(){
								Glee.Utils.simulateClick(Glee.selectedElement,false);
							},0);
						}
						else if(el.tagName == "BUTTON")
						{
							setTimeout(function(){
								Glee.Utils.simulateClick(Glee.selectedElement,false);
								Glee.searchField.blur();
							},0);
						}
						else if(el.tagName == "INPUT" || el.tagName == "TEXTAREA")
						{
							setTimeout(function(){
								Glee.selectedElement[0].focus();
							},0);
						}
						else
						{
							setTimeout(function(){
								Glee.searchField.blur();
							},0);
						}
					}
					else
					{
						setTimeout(function(){
							Glee.searchField.blur();
						},0)
					}
				}
				setTimeout(function(){
					Glee.closeBoxWithoutBlur();
				},0);
			}
		}
		// Up/Down arrow keys
		else if(e.keyCode == 40 || e.keyCode == 38)
		{
		    // stop scrolling
			Glee.Utils.simulateScroll(0);
		}
	});
});

var Glee = {
    
    defaults: {
	    nullStateMessage:"Nothing selected",
	    
    	// Page scroll speed. This is used for arrow keys scrolling - value is 1 to 10
    	pageScrollSpeed: 4,
    	
    	// autocomplete cache size
    	cacheSize: 20
    },

	options: {
	    // gleeBox status (1 = enabled, 0 = disabled)
    	status: 1,

        // Keydown code of shortcut key to launch gleeBox
    	shortcutKey: 71,
    	
    	// Keydown code of shortcut key to launch tab manager
    	tabShortcutKey: 190,
    	
    	// Size of gleeBox (small, medium, large)
    	size: "medium",
    	
    	// Position of gleeBox (top, middle, bottom)
    	position: "bottom",
    	
    	// Scrolling Animation speed
    	scrollingSpeed: 500,
        
        hyperMode: false,
        
    	// Enable/disable global shortcut for tab manager
    	tabShortcutStatus: true,
    	
    	// Enable/disable ESP (default scrapers)
    	espStatus: true,
    	
    	// Enable/disable bookmark search
    	bookmarkSearchStatus: false,
    	
    	// Search Engine URL
    	searchEngineUrl: "http://www.google.com/search?q="
	},
	
	// State of scrolling. 0=None, 1=Up, -1=Down.
	scrollState: 0,
	
	// last query executed in gleeBox
	lastQuery: null,
	
	// last query executed in jQuery mode
	lastjQuery: null,
	
	isSearching: false,
	
	isDOMSearchRequired: true,
	
	commandMode: false,
	
    inspectMode: false,

	// Currently selected element
	selectedElement: null,
	
	// Current URL where gleeBox should go
	URL: null,
	
	// Bookmarks returned for a search
	bookmarks: [],
	
	// URL blacklist
	domainsToBlock: [
		"mail.google.com",
		"wave.google.com",
		"mail.yahoo.com"
	],
	
	// (!) Page commands
	commands: [
		{
			name: "tweet",
			method: "sendTweet",
			description: "Tweet this page",
			statusText: "Redirecting to twitter homepage..."
		},
		{
			name: "shorten",
			method: "shortenURL",
			description: "Shorten the URL of this page using bit.ly",
			statusText: "Shortening URL via bit.ly..."
		},
		{
			name: "read",
			method: "makeReadable",
			description: "Make your page readable using Readability",
			statusText: "Please wait while Glee+Readability work up the magic..."
		},
		{
			name: "rss",
			method: "getRSSLink",
			description: "Open the RSS feed of this page in GReader",
			statusText: "Opening feed in Google Reader..."
		},
		{
			name: "help",
			method: "help",
			description: "View user manual",
			statusText: "Loading help page..."
		},
		{
			name: "tipjar",
			method: "tipjar",
			description: "Go to the gleeBox TipJar",
			statusText: "Opening TipJar..."
		},
		{
			name: "options",
			method: "displayOptionsPage",
			description: "View gleeBox options",
			statusText: "Opening options page..."
		},
		{
			name: "set",
			method: "Chrome.setOptionValue",
			description: "Set an option. For eg.: !set size=small will change the size of gleeBox to small. For more, execute !help",
			statusText: "Setting option..."
		},
		{
			name: "share",
			method: "sharePage",
			description: "Share this page. Enter service name as param, eg.: !share facebook. Several services are supported, run !help to see a listing"
		},
		{
			name: "inspect",
			method: "inspectPage",
			description: "Inspect an element on the page. Enter text and press enter to search for elements and return their jQuery selector."
		},
		{
			name: "v",
			method: "controlVideo",
			description: "Play/Pause video (currently only supports videos on YouTube)"
		},
		{
		    name: "ext",
		    method: "viewExtensions",
		    description: "View the Extensions page"
		},
		{
		    name: "down",
		    method: "viewDownloads",
		    description: "View the Downloads page"
		}
	],
	
	// (?) Scraper Commands

	scrapers : [
		{
			command: "?",
			nullMessage: "Could not find any input elements on the page.",
			selector: "input:enabled:not(#gleeSearchField),textarea",
			cssStyle: "GleeReaped"
		},
		{
			command: "img",
			nullMessage: "Could not find any linked images on the page.",
			selector: "a > img",
			cssStyle: "GleeReaped"
		},
		{
			command: "h",
			nullMessage: "Could not find any headings on the page.",
			selector: "h1,h2,h3",
			cssStyle: "GleeReaped"
		},
		{
			command: "a",
			nullMessage: "No links found on the page",
			selector: "a",
			cssStyle: "GleeReaped"
		}
		],
	
	// ESP Visions
	espModifiers: [
		{
			url: "google.com/search",
			selector: "h3:not(ol.nobr>li>h3),a:contains(Next)"
		},
		{
			url: "bing.com/search",
			selector: "div.sb_tlst"
		}
	],
	
	// Cache for jQuery objects, commands and other objects
	cache: {
		jBody: null,
		commands: [] // recently executed commands
	},
	
	initBox: function(){
	    
		// Creating DOM elements for gleeBox
		this.searchField = jQuery("<input type=\"text\" id=\"gleeSearchField\" value=\"\" />");
		this.subText = jQuery("<div id=\"gleeSubText\">" + Glee.defaults.nullStateMessage + "</div>");
		this.subURL = jQuery("<div id=\"gleeSubURL\"></div>")
		this.searchBox = jQuery("<div id=\"gleeBox\" style='display:none'></div>");
		var subActivity	= jQuery("<div id=\"gleeSubActivity\"></div>")
		this.sub = jQuery("<div id=\"gleeSub\"></div>");
		this.sub.append(this.subText).append(subActivity).append(this.subURL);
		this.searchBox.append(this.searchField).append(this.sub);
		jQuery(document.body).append(this.searchBox);
		
		// add autocomplete
		this.searchField.autocomplete(Glee.cache.commands, {
		    autoFill: true,
		    selectFirst: false
		});
		
		Glee.userPosBeforeGlee = window.pageYOffset;
		this.Chrome.getOptions();
	},
	
	open: function(){
		if(Glee.searchBox.css('display') == "none")
		{
			// Reset searchField content
			Glee.searchField.attr('value', '');
			Glee.searchBox.fadeIn(150);
			Glee.searchField[0].focus();
			
			// If ESP vision exists, execute it
			if(Glee.options.espStatus)
				Glee.fireEsp();
		}
		else
		{
			// If gleeBox is already visible, return focus
			Glee.searchField[0].focus();
		}
	},
	
	initOptions:function(){
		// Setup the theme
		Glee.searchBox.addClass(Glee.ThemeOption);
		Glee.searchField.addClass(Glee.ThemeOption);
		if(Glee.ListManager.box)
			Glee.ListManager.box.addClass(Glee.ThemeOption);
		
		// Setting gleeBox position
		if(Glee.options.position == "top")
			topSpace = 0;
		else if(Glee.options.position == "middle")
			topSpace = 35;
		else
			topSpace = 78;
		Glee.searchBox.css("top", topSpace + "%");
		
		// Setting gleeBox size
		if(Glee.options.size == "small")
			fontsize = "30px"
		else if(Glee.options.size == "medium")
			fontsize = "50px"
		else
			fontsize = "100px"
		Glee.searchField.css("font-size", fontsize);
		
		// Load HyperGlee if needed
		if(Glee.options.status != 0 && Glee.options.hyperMode == true) {
			Glee.getHyperized();
		}
		
		// init command cache
        Glee.Chrome.initCommandCache();
	},
	
	getHyperized: function(){
	    if(Glee.getEspSelector())
	    {
	        Glee.open();
            Glee.lastQuery = "";
	    }
	},
	
	closeBox: function(){
	    this.resetTimer();
		LinkReaper.unreapAllLinks();
		this.getBackInitialState();
		this.searchBox.fadeOut(150, function(){
			Glee.searchField.attr('value', '');
			Glee.setSubText(null);
		});
		this.lastQuery = null;
		this.selectedElement = null;
		this.inspectMode = false;
	},
	
	closeBoxWithoutBlur: function(){
	    this.resetTimer();
		this.searchBox.fadeOut(150, function(){
			Glee.searchField.attr('value', '');
			Glee.setSubText(null);
		});
		LinkReaper.unreapAllLinks();
		this.lastQuery = null;
		this.selectedElement = null;
		this.inspectMode = false;
	},
	
	initScraper: function(scraper){
		this.nullMessage = scraper.nullMessage;
		LinkReaper.selectedLinks = jQuery(scraper.selector);
		LinkReaper.selectedLinks = jQuery.grep(LinkReaper.selectedLinks, Glee.Utils.isVisible);
		LinkReaper.selectedLinks = Glee.sortElementsByPosition(LinkReaper.selectedLinks);
		this.selectedElement = LinkReaper.getFirst();
		this.setSubText(Glee.selectedElement, "el");
		this.scrollToElement(Glee.selectedElement);
		jQuery(LinkReaper.selectedLinks).each(function(){
			jQuery(this).addClass(scraper.cssStyle);
		});
		LinkReaper.traversePosition = 0;
		LinkReaper.searchTerm = "";
	},
	
	sortElementsByPosition: function(elements){
		// Sort elements
		var sorted_els = Glee.Utils.mergeSort(elements);
		
		// Begin the array from the element closest to the current position
		var len = sorted_els.length;
		var pos = 0;
		var diff = null;
		for(var i=0; i<len; i++)
		{
			var new_diff = jQuery(sorted_els[i]).offset().top - window.pageYOffset;
			if((new_diff < diff || diff == null) && new_diff >= 0)
			{
				diff = new_diff;
				pos = i;
			}
		}
		if(pos!=0)
		{
			var newly_sorted_els = sorted_els.splice(pos,len-pos);
			jQuery.merge(newly_sorted_els, sorted_els);
			return newly_sorted_els;
		}
		else
			return sorted_els;
	},
	
	setSubText: function(val, type){

		this.URL = null;
		
		if(type == "el") // here val is the element or null if no element is found for a search
		{
			if(val && typeof val != "undefined")
			{
				jQueryVal = jQuery(val);
				
				// if the selected element is not a link
				if(jQueryVal[0].tagName != "A") 
				{
					var a_el = null;
					this.subText.html(Glee.Utils.filter(jQueryVal.text()));
					if(jQueryVal[0].tagName == "IMG") //if it is an image
					{
						a_el = jQuery(jQueryVal.parents('a'));
						var value = jQueryVal.attr('alt');
						if(value)
							this.subText.html(Glee.Utils.filter(value));
						else if(value = jQueryVal.parent('a').attr('title'))
							this.subText.html(Glee.Utils.filter(value));
						else
							this.subText.html("Linked Image");
					}
					// if it is an input field
					else if(jQueryVal[0].tagName == "INPUT") 
					{
						var value = jQueryVal.attr("value");
						if(value)
							this.subText.html(Glee.Utils.filter(value));
						else
							this.subText.html("Input " + jQueryVal.attr("type"));
					}
					// if it is a text area
					else if(jQueryVal[0].tagName == "TEXTAREA") 
					{
						var value = jQueryVal.attr("name");
						if(value)
							this.subText.html(Glee.Utils.filter(value));
						else
							this.subText.html("Textarea");
					}
					else
						a_el = jQuery(jQueryVal.find('a'));
					
					if(a_el)
					{
						if(a_el.length != 0)
						{
							this.URL = a_el.attr("href");
							this.subURL.html(Glee.Utils.filter(this.URL));
						}
					}
					else
						this.subURL.html("");
				}
				// if it is a link containing an image
				else if(jQueryVal.find("img").length != 0) 
				{
					this.URL = jQueryVal.attr("href");
					this.subURL.html(Glee.Utils.filter(this.URL));
					var title = jQueryVal.attr("title") || jQueryVal.find('img').attr('title');
					if(title != "")
						this.subText.html(Glee.Utils.filter(title));
					else
						this.subText.html("Linked Image");
				}
				// it is simply a link
				else 
				{
					var title = jQueryVal.attr('title');
					var text = jQueryVal.text();

					this.subText.html(Glee.Utils.filter(text));
					if(title !="" && title != text)
						this.subText.html(Glee.Utils.filter(this.subText.html() + " -- " + title));
					this.URL = jQueryVal.attr('href');
					this.subURL.html(Glee.Utils.filter(this.URL));
				}
			}
			else if(Glee.commandMode == true)
			{
				this.subText.html(Glee.nullMessage);
			}
			else //go to URL, search for bookmarks or search the web
			{
				var text = this.searchField.attr("value");
				this.selectedElement = null;
				//if it is a URL
				if(this.Utils.isURL(text))
				{
					this.subText.html(Glee.Utils.filter("Go to " + text));
					var regex = new RegExp("((https?|ftp|file):((//)|(\\\\))+)");
					if(!text.match(regex))
						text = "http://" + text;
					this.URL = text;
					this.subURL.html(Glee.Utils.filter(text));
				}
				else if(this.options.bookmarkSearchStatus) // is bookmark search enabled?
				{
					// emptying the bookmarks array
					this.bookmarks.splice(0, Glee.bookmarks.length);
					this.Chrome.isBookmark(text); // check if the text matches a bookmark
				}
				else //search
					this.setSubText(text, "search");
			}
		}
		else if(type == "bookmark") // here val is the bookmark no. in Glee.bookmarks
		{
			this.subText.html(Glee.Utils.filter("Open bookmark (" + ( val + 1 ) + " of "+(this.bookmarks.length - 1)+"): "+this.bookmarks[val].title));
			this.URL = this.bookmarks[val].url;
			this.subURL.html(Glee.Utils.filter(this.URL));
		}
		else if(type == "bookmarklet") // here val is the bookmarklet returned
		{
			this.subText.html("Closest matching bookmarklet: " + val.title + " (press enter to execute)");
			this.URL = val;
			this.subURL.html('');
		}
		else if(type == "search") // here val is the text query
		{
			this.subText.html(Glee.Utils.filter("Search for " + val));
			this.URL = Glee.options.searchEngineUrl + val;
			this.subURL.html(Glee.Utils.filter(this.URL));
		}
		else if(type == "msg") // here val is the message to be displayed
		{
			this.subText.html(val);
			this.subURL.html('');
		}
		else
		{
			this.subText.html(Glee.defaults.nullStateMessage);
			this.subURL.html('');
		}
	},
	
	getNextBookmark:function(){
		if(this.bookmarks.length > 1)
		{
			if(this.currentResultIndex == this.bookmarks.length-1)
				this.currentResultIndex = 0;
			else
				this.currentResultIndex++;

			// if it is the last bookmark, allow user to execute a search
			if(this.currentResultIndex == this.bookmarks.length - 1)
				this.setSubText(this.bookmarks[this.currentResultIndex], "search");
			else
				this.setSubText(this.currentResultIndex, "bookmark");
		}
		else
			return null;
	},
	
	getPrevBookmark:function(){
		if(this.bookmarks.length > 1)
		{
			if(this.currentResultIndex == 0)
				this.currentResultIndex = this.bookmarks.length-1;
			else
				this.currentResultIndex --;

			// if it is the last bookmark, allow user to execute a search
			if(this.currentResultIndex == this.bookmarks.length - 1)
				this.setSubText(this.bookmarks[this.currentResultIndex], "search");
			else
				this.setSubText(this.currentResultIndex, "bookmark");
		}
		else
			return null;
	},
	
    getEspSelector: function(){
        var url = document.location.href;
        var len = Glee.espModifiers.length;
		var sel = [];
		for(var i=0; i<len; i++)
		{
			if(url.indexOf(Glee.espModifiers[i].url) != -1)
				sel[sel.length] = Glee.espModifiers[i].selector;
		}
        if(sel.length != 0)
            return sel.join(',');
        else // search for any default selector defined by meta tag in current page
            return jQuery('meta[name="gleebox-default-selector"]').attr("content");
	},
	
	fireEsp: function(){
        var selStr = Glee.getEspSelector();
		if(selStr)
		{
			// Temporary scraper object
			var tempScraper = {
				nullMessage : "Could not find any elements on the page",
				selector : selStr,
				cssStyle : "GleeReaped"
			};
			Glee.commandMode = true;
			Glee.initScraper(tempScraper);
		}
		return ;
	},
	
	scrollToElement: function(el){
		var target = jQuery(el);
		var scroll = false;
		if(target.length != 0)
		{
			var targetOffsetTop = target.offset().top;
			if((targetOffsetTop - window.pageYOffset > Glee.getOffsetFromTop()) ||
				(window.innerHeight + window.pageYOffset < targetOffsetTop) || 
				(window.pageYOffset > targetOffsetTop))
			{
				scroll = true;
			}
			//TODO: Set scroll to true if the element is overlapping with gleeBox

			if(scroll)
			{
				// We keep the scroll such that the element stays a little away from
				// the top.
				var targetOffset = targetOffsetTop - Glee.getOffsetFromTop();

				// Stop any previous scrolling to prevent queueing
				Glee.cache.jBody.stop(true);
				Glee.cache.jBody.animate(
					{scrollTop:targetOffset},
					Glee.options.scrollingSpeed + 
					Glee.getBufferDuration(window.pageYOffset - targetOffset),
					"swing",
					Glee.updateUserPosition);
				return false;
			}
		} 
	},
	
	getOffsetFromTop: function(){
		if(Glee.options.position == "top")
			return 180;
		else if(Glee.options.position == "middle")
			return 70;
		else
			return 120;
	},
	
	getBufferDuration: function(distance){
		if(distance < 0)
			distance *= -1;
		return (Glee.options.scrollingSpeed == 0 ? 0 : distance*0.4);
	},
	
	updateUserPosition:function(){
		var value = Glee.searchField.attr("value");
		// Only update the user position if it is a scraping command or tabbing in ESP mode
		if( (value[0] == "?" && value.length > 1) || (value == "" && Glee.options.espStatus) )
			Glee.userPosBeforeGlee = window.pageYOffset;
	},
	
	toggleActivity: function(toggle){
		if(toggle == 1)
		{
			Glee.isSearching = true;
			jQuery("#gleeSubActivity").html("searching");
		}
		else
		{
			Glee.isSearching = false;
			jQuery("#gleeSubActivity").html("");
		}
	},
	
	getBackInitialState: function(){
		Glee.cache.jBody.stop(true);
		// Wait till the thread is free
		setTimeout(function(){
			Glee.searchField.blur();
		},0);
	},
	
	resetTimer: function(){
		if(typeof(this.timer) != "undefined")
			clearTimeout(this.timer);
	},
	
	execCommand: function(command, openInNewTab){
		// call the method
		var method = command.method;
        // Set subtext
		this.setSubText(command.statusText,"msg");
		
		if(method.indexOf("Chrome.") == 0)
		{
			method = method.slice(7);
			Glee.Chrome[method](openInNewTab);
		}
		else
			Glee[method](openInNewTab);
	},
	
	openTabManager: function(){
		var onGetTabs = function(response){
			Glee.closeBoxWithoutBlur();
			Glee.ListManager.openBox(response.tabs, function(action, item){
				if(action == "open")
					Glee.Chrome.moveToTab(item);
				else if(action == "remove")
					Glee.Chrome.removeTab(item);
			});
		};
		Glee.setSubText("Displays a vertical list of currently open tabs.", "msg");
		Glee.Chrome.getTabs(onGetTabs);
	},
	
	// add command to recently executed commands cache
	addCommandToCache: function(value){
        var len = this.cache.commands.length;
        // is command already present? if yes, then move it to beginning of cache
        var index = jQuery.inArray(value, Glee.cache.commands);
        if(index != -1)
        {
            // remove command
            Glee.cache.commands.splice(index, 1);
            // add command to beginning
            Glee.cache.commands.unshift(value);
        }
        else
        {
            if(len == Glee.defaults.cacheSize)
                this.cache.commands.pop();
            this.cache.commands.unshift(value);
        }
        this.searchField.setOptions({
            data: Glee.cache.commands
        });
        this.Chrome.updateBackgroundCommandCache();
	},
	
	updateCommandCache: function(commands){
	    this.cache.commands = commands;
	    
        this.searchField.setOptions({
            data: Glee.cache.commands
        });
	}
}