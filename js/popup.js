chrome.storage.local.get("registrationId", function(result){
  // Record the registration ID on the page
    document.getElementById("registrationId").innerHTML = result.registrationId;
  });



function setAlarm(){
  // Set the alarm when the toggle or clock is changed

  var alarmTime = rome(document.getElementById("time")).getDateString();
  var isChecked = document.getElementById("cmn-toggle-9").checked;
  var weekdays = document.getElementById("weekdays").checked;
  var weekends = document.getElementById("weekends").checked;

  var now = moment();

  chrome.storage.local.set({
    // Remember the settings
    alarmTime: alarmTime,
    alarmToggle: isChecked,
    weekdays: weekdays,
    weekends: weekends
  });
  
  if (!isChecked) {
    // Clear any pending alarm
    chrome.alarms.clear("remindme");
    return;
  }

  var alarmDateTime = moment(now.format("YYYY-MM-DD") + " " + alarmTime);

  if (alarmDateTime.isBefore(now)) {
    // We need to set the alarm for tomorrow, not today
    alarmDateTime = alarmDateTime.add(1, 'days');
  }

  chrome.alarms.create("remindme", {
    // Note that we don't want to set it as a 24 hour periodic alarm
    // because that will break for daylight savings or time zone changes
    when: alarmDateTime.valueOf()
  });
}
chrome.storage.local.get(["alarmTime","alarmToggle", "weekdays", "weekends"] , function(result){
  // Set the time based on storage
  rome(document.getElementById("time"), {
    date: false,
    min: "8:00 am",
    max: "23:30",
    timeFormat: 'hh:mm a',
    timeInterval: 30 * 60,
   
    initialValue: result.alarmTime || "11:00 am",
    styles: {
      container: 'timeContainer',
      selectedTime: 'time',
      timeList: 'timeList',
      timeOption: 'timeOption'

    },
    time: true

  }).on('data', setAlarm);
  var checkbox = document.getElementById('cmn-toggle-9');
  var weekends = document.getElementById('weekends');
  var weekdays = document.getElementById('weekdays');
  if (result.alarmToggle) {
    checkbox.checked = true;
  }
  if (result.weekends) {
    weekends.checked = true;
  }
  if (result.weekdays || typeof result.weekdays == "undefined") {
    // We want to have it set the first time
    weekdays.checked = true;
  }
  
  checkbox.onclick = setAlarm;
  weekdays.onclick = setAlarm;
  weekends.onclick = setAlarm;

});


$('body').on('click', "#cmn-toggle-9", function() {
  var $reminder;
  if ($('#cmn-toggle-9').prop('checked')) {
    $reminder = $('#reminderSet');
  }
  else {
    $reminder = $('#reminderNotSet');
  }
    $reminder.show({
      complete: function(){
        setTimeout(function(){
        
            $reminder.hide({
              duration: 500
            });
        }, 500);
      }
    
    });
});


