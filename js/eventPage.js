var appId = "75837997391";

function resetAlarm(){
  // Reset it after it goes off
  chrome.storage.local.get(['alarmTime', 'alarmToggle'], function(results){
    alarmTime = results.alarmTime;
    alarmToggle = results.alarmToggle;
    
    var now = moment();

    
    if (!alarmToggle) {
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
  });
}

function handleButtonClick(notificationId, buttonIndex) {
  chrome.notifications.clear(notificationId);
  chrome.tabs.create({
    url : 'https://www.spoonrocket.com'
  });
}

function handleClick(id) {
  chrome.notifications.clear(id);
}

function sendNotification(options) {
  var buttons = [];

  if (options.buttons) {
    options.buttons = JSON.parse(options.buttons);
    options.buttons.forEach(function(button){
      buttons.push({
        title: button.title,
        iconUrl: button.iconUrl // Can be undefined
      });
    });

  }

  chrome.notifications.create('upstream', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'SpoonRocket',
    message: options.message,
    eventTime: options.datetime || Date.now(),
    isClickable: true,
    priority: 2,
    buttons: buttons
    }, function (id){
      // After notification created

    });

}
function handleMessage(message){
  chrome.notifications.clear('upstream', function(){
    sendNotification(message.data);
  });

}
function sendToFirebase(registrationId){
  chrome.cookies.get({url: 'http://spoonrocket.com', name: 'ajs_user_id'}, function(cookie){
    var userId = null;
    if (cookie) {
      userId = cookie.value;
    }
    var firebase = new Firebase("https://spoonrocket-ext.firebaseio.com/pushids/" + registrationId + '/');
    firebase.set({'user_id' : userId});

  });

}
function prepareForMessages(){
  // Handle registration

  chrome.storage.local.get("registrationId", function(result){
    if (result.registrationId) {
      sendToFirebase(result.registrationId);
    }

    else {
      // Registered now
      chrome.gcm.register([appId], function(registrationId){
        chrome.storage.local.set({registrationId: registrationId});
        sendToFirebase(registrationId);
      });

    }



  });
}
function handleAlarm(alarm){
  // Deal with alarm going off
  chrome.storage.local.get(['weekdays', 'weekends'], function(result){
    var now = moment();
    var diff = now.diff(alarm.scheduledTime);
    var weekdays = result.weekdays;
    var weekends = result.weekends;

    if (diff > 60 * 15 * 1000) {
      // If the alarm's more than 15 minutes old, forget it til tomorrow
      resetAlarm();
      return;
    }

    var isoWeekday = now.isoWeekday();
    // Monday is 1, Sunday is 7
    if ((isoWeekday >= 6 && !weekends) || (isoWeekday <=5 && ! weekdays)) {
      // Not set for today, come back later
      resetAlarm();
      return;
    }
    chrome.notifications.create(null, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'SpoonRocket',
      message: 'Reminder: it\'s ' + moment(alarm.scheduledTime).format("h:mm a") + '!',
      buttons: [{
        title: 'Visit SpoonRocket.com'

      }]

    });
    resetAlarm();
  });
  

}
function handleCookieChange(changeInfo) {
  var cookie = changeInfo.cookie;
  if (cookie.domain == '.spoonrocket.com' && cookie.name == 'ajs_user_id') {
    prepareForMessages();
  }
}
chrome.gcm.onMessage.addListener(handleMessage);
chrome.runtime.onStartup.addListener(prepareForMessages);
chrome.runtime.onInstalled.addListener(prepareForMessages);
chrome.alarms.onAlarm.addListener(handleAlarm);
chrome.notifications.onButtonClicked.addListener(handleButtonClick);
chrome.notifications.onClicked.addListener(handleClick);
chrome.cookies.onChanged.addListener(handleCookieChange);


