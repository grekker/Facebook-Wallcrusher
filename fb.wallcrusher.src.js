/**
 * This javascript code iterates through Facebook's wall posts and deletes
 * every wall post it comes across. Good for those of us that have accounts
 * dating back many years that we'd like to clean up, but don't necessarily
 * want to delete our accounts.
 * 
 * I wrote this in an afternoon because I wanted to delete my wall posts. Facebook
 * changes their stuff so often odds are this won't work in a few weeks, but it's
 * working right now if you want to take advantage (2012-01-26).
 * 
 * USE AT YOUR OWN RISK.
 * 
 * @author Chuck Liddell
 * 
 * Two of the functions (parseParams and fakeClick) are based on StackOverflow answers:
 * @see http://stackoverflow.com/questions/1421584/how-can-i-simulate-a-click-to-an-anchor-tag
 * @see http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
 * 
 * Code from around line 140 and onward is adapted from a jQuery loading bookmarklet by Karl Swedberg.
 * @see http://www.learningjquery.com/2009/04/better-stronger-safer-jquerify-bookmarklet
 */

(function() {
// use regex to parse a string into an associative array
function parseParams(input) {
	var e, 
		a = /\+/g, // Regex for replacing addition symbol with a space
		b = /^.*\?/, 
		r = /([^&=]+)=?([^&]*)/g, 
		d = function(s) {
			return decodeURIComponent(s.replace(a, " ").replace(b, ""));
		}, 
		q = input, x = {};

	while (e = r.exec(q))
		x[d(e[1]).replace("amp;", "")] = d(e[2]);

	return x;
};

// create facebook-friendy "ajaxify" string from an associative array
function generateAjaxify(urlParams) {
	var deleteParams = {
		"action_key" : "remove_content",
		"dialog" : "1",
		"confirmed" : "1",
		"feedback" : "1",
		"story_fbids[0]" : urlParams["story_fbids[0]"],
		"ministory_key" : urlParams["ministory_key"],
		"profile_fbid" : urlParams["profile_fbid"],
		"story_id" : urlParams["story_id"],
		"story_type" : urlParams["story_type"]
	};
	return "/ajax/minifeed.php?" + $jq.param(deleteParams);
};

// add a secret link that we will trigger programatically as if it were the delete button of an individual wall post
function createDeleteAnchor( ajaxify ) {
	if( !$jq("#auto-delete-anchor").length )
		$jq('body').prepend('<a id="auto-delete-anchor" style="display:none;" href="#" ajaxify="" rel="async-post" tabindex="-1" role="menuitem" class="itemAnchor"><span class="itemLabel fsm">Auto-Delete Post...</span></a>');
	return $jq("#auto-delete-anchor").attr("ajaxify", ajaxify);
};

// fire a click event on the passed parameter
function fakeClick(anchorObj) {
  if (anchorObj.click) {
  	anchorObj.click()
  } else if(document.createEvent) {
      var evt = document.createEvent("MouseEvents"); 
	  evt.initMouseEvent("click", true, true, window, 
	      0, 0, 0, 0, 0, false, false, false, false, 0, null); 
	  var allowDefault = anchorObj.dispatchEvent(evt);
	  // you can check allowDefault for false to see if
	  // any handler called evt.preventDefault().
	  // Firefox will *not* redirect to anchorObj.href
	  // for you. However every other browser will.

  }
}

// take ajaxify string, break it down, build our 'delete' ajaxify string, then fire the click event
function deleteStory(index, source) {
	var urlParams = parseParams(source);
	var ajaxify = generateAjaxify(urlParams);
	var button = createDeleteAnchor(ajaxify);
	fakeClick( button[0] );
}

// retrieve a set of all currently visible wall posts
function getActiveStories() {
	return $jq('a[ajaxify^="/ajax/feed/feed_menu_personal.php?"],a[class*="uiStreamHide uiCloseButton"]');
}

// delete each story, spacing deletes out by 1 second so that ajax has time to recover
// sometimes a delete will fire too early and that wall post is missed...have no fear;
// it will be deleted on the next pass (or the pass after, etc...).
function iterateAndDeleteStories(stories, callback) {
	var index = 0;
	if( stories.size() == 0 )
	{
		callback();
		return;
	}
	var timer = setInterval( function(){
		console.log("Ran anon function ["+(index+1)+"/"+stories.size()+"].");
		var source = stories.eq(index).attr("ajaxify");
		deleteStory(index, source);
		index++;
		if(index>=stories.size())
		{
			clearInterval(timer);
			callback();
		}
	}, 1000 );	
}

// fire a click event on Facebook's 'Older Posts' button that will retrieve additional wall posts
function getMoreStories() {
	var moreStoriesButton = $jq('a[class*="uiMorePagerPrimary"][rel!="async"][onclick]');
	if( moreStoriesButton.length )
	{
		fakeClick( moreStoriesButton[0] );
		return true;
	}
	else
	{
		console.log("Finished deleting wall posts.");
		return false;
	}
}

// get visible wall posts and call the mass delete function for them
function retrieveAndDeleteAllStories(callback) {
	var activeStories = getActiveStories();
	console.log("# of visible stories: " + activeStories.size() );
	iterateAndDeleteStories(activeStories, callback);
}

// grab more stories, then delete them
function resetAndContinue() {
	var moreStoriesExist = getMoreStories();
	if(moreStoriesExist)
		setTimeout( function(){retrieveAndDeleteAllStories(resetAndContinue)}, 5000 );
}

	var el = document.createElement('div'), b = document
			.getElementsByTagName('body')[0], msg = '';
	el.style.position = 'fixed';
	el.style.height = '32px';
	el.style.width = '220px';
	el.style.marginLeft = '-110px';
	el.style.top = '0';
	el.style.left = '50%';
	el.style.padding = '5px 10px';
	el.style.zIndex = 1001;
	el.style.fontSize = '12px';
	el.style.color = '#222';
	el.style.backgroundColor = '#f99';
	if (typeof jQuery != 'undefined') {
		msg = 'Starting script to delete all wall posts...';
		return showMsg();
	}
	
	// more or less stolen from jquery core and adapted by paul irish
	function getScript(url, success) {
		var script = document.createElement('script');
		script.src = url;
		var head = document.getElementsByTagName('head')[0], done = false;
		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function() {
			if (!done
					&& (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
				done = true;
				success();
				script.onload = script.onreadystatechange = null;
				head.removeChild(script);
			}
		};
		head.appendChild(script);
	}
	getScript('http://code.jquery.com/jquery-latest.min.js', function() {
				if (typeof jQuery == 'undefined') {
					msg = 'Sorry, but jQuery wasn\'t able to load';
				} else {
					msg = 'Starting script to delete all wall posts...';
				}
				return showMsg();
			});
	function showMsg() {
		el.innerHTML = msg;
		b.appendChild(el);
		window.setTimeout(function() {
					if (typeof jQuery == 'undefined') {
						b.removeChild(el);
					} else {
						jQuery(el).fadeOut('slow', function() {
									jQuery(this).remove();
								});
						$jq = jQuery.noConflict();
						// Main execution
						retrieveAndDeleteAllStories( resetAndContinue );

					}
				}, 2500);
	}

})();