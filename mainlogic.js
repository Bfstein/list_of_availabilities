// Client ID and API key from the Developer Console
var CLIENT_ID = '961975133184-327c95n5t8a8jc6finbnddtplj1u3m3c.apps.googleusercontent.com';
var API_KEY = 'AIzaSyC66zcZzqxtCzoRgyLDQfKFKFXCgp48PjQ';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    
    //listUpcomingEvents();

    createForm();

  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    appendPre('Not signed in.');
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/**
 * Global variables.
 */ 
 const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday",
                   "Thursday", "Friday", "Saturday"
 ];

 const monthNames = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"
 ];

 var masterCalendarList = null;

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
  gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 10,
    'orderBy': 'startTime'
  }).then(function(response) {
    var events = response.result.items;
    appendPre('Upcoming events: \n');

    if (events.length > 0) {
      for (i = 0; i < events.length; i++) {
        var event = events[i];
        var when     = event.start.dateTime;
        var when_end = event.end.dateTime;
        if (!when) {
          when = event.start.date;
        }
        if (!when_end) {
          when_end = event.end.date;
        }
        appendPre(event.summary + ' (' + when + ' | ' + when_end + ')')
      }
    } else {
      appendPre('No upcoming events found.');
    }
  });
}

/**
 * Lists the calendars a user has access to.
 */

function listCalendars(formInput, callback1, callback2) {

  var listOfCalendarIDs = [];

  for (var cal in formInput.calendarList) {

  	myID      = formInput.calendarList[cal].id;
  	isChecked = formInput.calendarList[cal].checked;

  	if (isChecked) {
  		listOfCalendarIDs.push({"id": myID});
  	}
  }

  callback1(formInput, listOfCalendarIDs, callback2);

}


/**
 * Calls freebusy to get list of busy times.
 */
function getBusyTimes(formInput, listOfCalendarIDs, callback) {

  var today = new Date(formInput.startDate);
  var tomorrow = new Date(formInput.endDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  var queryParameters = 
  {
    'timeMin': today.toISOString(),
    'timeMax': tomorrow.toISOString(),
    'timeZone': 'UTC',
    'groupExpansionMax': 100,
    'calendarExpansionMax': 50,
    'items': listOfCalendarIDs
  };

  var listOfBusyTimes = [];

  gapi.client.calendar.freebusy.query(queryParameters).then(function(response) {

    var calendars = response.result.calendars;

    for (var cal in calendars) {

      var temp = calendars[cal].busy;
      listOfBusyTimes = listOfBusyTimes.concat(temp);
    }

    //appendPre(JSON.stringify(listOfBusyTimes));

    callback(formInput, listOfBusyTimes);
  });
}

/**
 * Gets list of available times
 * from list of busy times.
 */
function getAvailableTimes(formInput, listOfBusyTimes) {

  console.log(listOfBusyTimes);

  var today = new Date(formInput.startDate);
  var tomorrow = new Date(formInput.endDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  var timeslots = createIntervals(today, tomorrow, formInput.length);

  //for each element in the list of busy times
  for (var i = 0; i < listOfBusyTimes.length; i++) {

    var startDate = new Date(listOfBusyTimes[i].start);
    var endDate   = new Date(listOfBusyTimes[i].end);

    //for each timeslot, see if it conflicts with the busy time
    //NOTE: DOES THIS FUCK UP SCHEDULING AT THE LAST AVAILABLE TIME?

    // what about 15 minute intervals

    for (var x = 0; x < timeslots.length-1; x++) {

      //calendar event starts in this timeslot
      if (startDate >= timeslots[x].time && startDate < timeslots[x+1].time ) {
        timeslots[x].free = false;
      }

      //calendar event bleeds into this timeslot from a previous start
      if (startDate <= timeslots[x].time && endDate > timeslots[x].time) {
        timeslots[x].free = false;
      }
    }
  }

  console.log(timeslots);

  spaceLines();

  appendPre('Available Times: \n');

  var availabilityBlocks = [];

  for (var i = 0; i < timeslots.length; i++) {
    if (timeslots[i].free) {

    	var availBlock = {
    	  'first': timeslots[i].time,
    	  'last': timeslots[i].time
    	};

      var ogDate = timeslots[i].time.getDate();

      while (i < timeslots.length) {

        if(timeslots[i].free) {

          if (i == timeslots.length-1) { break; }

          //if the timeslot is a different day, wind back a slot and break
          if (timeslots[i].time.getDate() != ogDate) { i--; break; }

          i++;

        } else {
          break;
        }
      }

      availBlock.last = timeslots[i].time;
      availabilityBlocks.push(availBlock);

    }
  }

  console.log(availabilityBlocks);

  appendPre("Times in " + Intl.DateTimeFormat().resolvedOptions().timeZone.toString() + " time. \n");

  var lastDateString = "";

  for (block in availabilityBlocks) {

  	var firstTime  = availabilityBlocks[block].first;
  	var lastTime   = availabilityBlocks[block].last;

  	//print the date – "Sat Jun 29, 2019"

  	var dateString = dayNames[firstTime.getDay()] + " " + monthNames[firstTime.getMonth()] + " " +
  	                 firstTime.getDate() + ", " + firstTime.getFullYear();

  	if (dateString != lastDateString) {
  		appendPre("\n" + dateString);
  		lastDateString = dateString;
  	}

  	var firstTimeString = addZeroBefore(firstTime.getHours()) + ":" + 
  						  addZeroBefore(firstTime.getMinutes());
  	var lastTimeString  = addZeroBefore(lastTime.getHours()) + ":" + 
  						  addZeroBefore(lastTime.getMinutes());

  	appendPre(" * " + firstTimeString + " - " + lastTimeString);


  }

  spaceLines();

}


/**
 * Util.
 */
function spaceLines() {
  appendPre("\n");
  appendPre("----------------------");
  appendPre("\n");
}

/**
 *  timestameformatting.
 */
function addZeroBefore(n) {
  return (n < 10 ? '0' : '') + n;
}


/**
 * Creates intervals of length intervalMins
 */

function createIntervals(from, until, intervalMins) {

  var time      = new Date(from);
  var time2     = new Date(until);
  var intervals = [];

  while (time < time2) {

    var deepCopy = new Date(time);

    var temp = {
      'time': deepCopy,
      'free': true
    };

    intervals.push(temp);
    time.setMinutes(time.getMinutes() + parseInt(intervalMins));
  }

  return intervals;

}

/**
 * accepts the form and displays an alert
 */
function acceptInput() {

  var startDate     = startpicker.value;
  var endDate       = endpicker.value;
  var meetingLength = document.forms["myForm"]["length"].value;

  //current
  //startDate = startpicker.value;
  //endDate = endpicker.value;

  output = "Hello! I'll find you a time to meet for " + meetingLength +
            " mins between " + startDate + " and " + endDate;

  if (masterCalendarList) {
  	for (var cal in masterCalendarList) {

  		myID      = masterCalendarList[cal].id;
  		mySummary = masterCalendarList[cal].summary;

  		masterCalendarList[cal].checked = document.forms["myForm"][myID].checked;

  	}
  }

  var myInput = {
    'startDate'    : startDate,
    'endDate'      : endDate,
    'length'       : meetingLength,
    'calendarList' : masterCalendarList
  };

  alert(output);

  listCalendars(myInput, getBusyTimes, getAvailableTimes);

}


/**
 * creates the form with options to choose which calendars you want to include
 */
function createForm() {

	var oldForm = document.getElementById('myForm');

	var request = gapi.client.calendar.calendarList.list();

	request.execute(function(resp){
	      var calendars = resp.items;

	      masterCalendarList = calendars;

	      for (var cal in calendars) {

	        myID      = calendars[cal].id;
	        mySummary = calendars[cal].summary;


	        //add a new input with the ID + a label of the id
	        var newFormInput = document.createElement("input");
	        newFormInput.setAttribute('type',"checkbox");
	        newFormInput.setAttribute('name',myID);
	        newFormInput.setAttribute('value',myID);
	        newFormInput.setAttribute('checked', 'checked');

	        var newFormInputLabel = document.createTextNode(mySummary);

	        oldForm.appendChild(newFormInput);
	        oldForm.appendChild(newFormInputLabel);
	        oldForm.appendChild(document.createElement("br"));

	      }

	      oldForm.appendChild(document.createElement("br"));
	      var newFormSubmit = document.createElement("input"); //input element, Submit button
	      newFormSubmit.setAttribute('type',"submit");
	      newFormSubmit.setAttribute('value',"Submit");
	      oldForm.appendChild(newFormSubmit);
	});
}