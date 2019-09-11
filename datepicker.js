// pikaday must be included in the main source file (and loaded first)

var startDate,
    endDate,
    updateStartDate = function() {
        startPicker.setStartRange(startDate);
        endPicker.setStartRange(startDate);
        endPicker.setMinDate(startDate);
    },
    updateEndDate = function() {
        startPicker.setEndRange(endDate);
        startPicker.setMaxDate(endDate);
        endPicker.setEndRange(endDate);
    },
    startPicker = new Pikaday({
        field: document.getElementById('startpicker'),
        //minDate: new Date(),
        maxDate: new Date(2020, 12, 31),
        onSelect: function() {
            startDate = this.getDate();
            updateStartDate();
        }
    }),
    endPicker = new Pikaday({
        field: document.getElementById('endpicker'),
        //minDate: new Date(),
        maxDate: new Date(2020, 12, 31),
        onSelect: function() {
            endDate = this.getDate();
            updateEndDate();
        }
    }),
    _startDate = startPicker.getDate(),
    _endDate = endPicker.getDate();

    if (_startDate) {
        startDate = _startDate;
        updateStartDate();
    }

    if (_endDate) {
        endDate = _endDate;
        updateEndDate();
    }


    function sugarTransform(textDate, picker) {

    	var sugarDate = Sugar.Date.create(textDate);

    	if (Sugar.Date.isValid(sugarDate)) {
    		picker.setDate(sugarDate, true);
    	}

    	return sugarDate;
    }
     
    function set(el,text){
     while(el.firstChild)el.removeChild(el.firstChild);
     el.appendChild(document.createTextNode(text))}
     
    /* setupUpdater will be called once, on page load.
     */
     
    function setupUpdater(){
     var startTextInput=document.getElementById('startpicker')
       , endTextInput=document.getElementById('endpicker') 
       , transformed=document.getElementById('transformDestination')
       , transformed2=document.getElementById('transformDestination2')
       , timeout=null;
     
    /* handleChange is called 50ms after the user stops 
       typing. */
     function handleChange(){

      if (this == startTextInput) {
      	var newStartText = startTextInput.value;
      	set(transformed, sugarTransform(newStartText, startPicker));
      } else {
      	var newEndText   = endTextInput.value;
      	set(transformed2, sugarTransform(newEndText, endPicker));
      }

     }
     
    /* eventHandler is called on keyboard and mouse events.
       If there is a pending timeout, it cancels it.
       It sets a timeout to call handleChange in 50ms. */
     function eventHandler(){
      if(timeout) clearTimeout(timeout);
      timeout=setTimeout(handleChange, 50);
     }
     
     startTextInput.addEventListener("focusout", handleChange);
     endTextInput.addEventListener("focusout", handleChange);
    }
     
    setupUpdater();


