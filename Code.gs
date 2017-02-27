/**
* Gmail automation tools
*
* Automates reminders (AKA "any news?")
* Automates sending drafts after specific interval (AKA "write me in 2 weeks")
*
* @author Eugene Bond <eugene.bond@gmail.com>
* @copyright Eugene Bond <eugene.bond@gmail.com>
*/

// the label which is a trigger of sending autoreminders
var reminderTriggerLabel = "autoreminder";

// general query (matching pattern) for the autoreminders
// you can extend it with "has:star" or any other valid search parameters
// @see https://support.google.com/mail/answer/7190?hl=en
// @note has:purple-question and other fancy stars somewhy doesn't work
var generalRemindersSearchQuery = "label:" + reminderTriggerLabel;

// getting active user's email address and fetching his potential first name out of it
var activeUserName = Session.getActiveUser().getEmail().split('@')[0].split('.')[0];
activeUserName = activeUserName.charAt(0).toUpperCase() + activeUserName.slice(1); // Capitalizing

// email reminder templates
var emailTemplates = {
    "hello": ["Hey %s", "Hi %s", "Hello %s", "It's me again"],
    "text": ["Any news?", "Do you have any updates?", "Any progress?", "Do you have any updates for me?", "How it's going? Any updates yet?"],
    "goodbye": ["Cheers", "Thanks", "Best", "Have a nice day"],
    "name": [activeUserName]
}

/**
* Main executor
*
* Setup your time-based trigger in Resources -> Current project's triggers and point to this function
*/
function go() {
  processReminders();
  processPostponed();
}

/**
* Sends reminders if any
*
* Get all emails which qualify reminder criterias (label "autoreminder" by default)
* Then it skips any conversations with unread messages
* And checks if conversations are labelled with duration label
* If there is such label and it's time to remind - email with randomly generated text is sent
*/
function processReminders() {
   Logger.log("Processing auto-reminders..");
   var conversations = getConversations(generalRemindersSearchQuery);
   conversations = skipUnread(conversations);
   
   // going through the conversations
   for (var i in conversations) {
     Logger.log(conversations[i].getFirstMessageSubject() + " -> " + conversations[i].getLastMessageDate());
      
     if (checkForTimeLabels(conversations[i])) {
       sendReminder(conversations[i]);  
     }
  }
}

/**
* Sends email drafts which are labelled to be sent later
*
* Postpone label should be defined in ISO 8601 format
* When draft has been sent, the label is removed from the thread
*
* This function requires Advanced Google Services -> Gmail and Gmail API be enabled
*/
function processPostponed() {
  
  var drafts = Gmail.Users.Drafts.list("me");
  
  for (var i in drafts.drafts) {
    
    var draft = GmailApp.getMessageById(drafts.drafts[i].message.id);
    
    // skip drafts without recepients
    if (!draft.getTo()) {
      Logger.log("Ignoring " + (draft.getSubject() || "* no subject *"));
      continue;
    }
    
    var thread = GmailApp.getThreadById(drafts.drafts[i].message.threadId);
    
    // skip drafts with unread messages in the thread
    if (thread.isUnread()) {
      Logger.log(draft.getSubject() + " has unread replies. Skipping..");
      continue;
    }
    
    var label = checkForTimeLabels(thread);
    
    if (label) {
      Logger.log("Sending draft # " + drafts.drafts[i].id);
      
      var message = Gmail.Users.Drafts.send(drafts.drafts[i], "me");
      Logger.log(message);
      if (message.id) {
        Logger.log("Sent! Removing the label"); 
        thread.removeLabel(label);
        
        // Mark sent message as unread to make it more prominent
        var sent = GmailApp.getMessageById(message.id);
        sent.markUnread();
      }
    }
  }
}

/**
* Search mailbox for threads matching search criteria
*
* @param searchQuery string parameters for the search
* @return array GmailThread[]
*/
function getConversations(searchQuery) {
  var conversations = GmailApp.search(searchQuery);
  
  return conversations;
}

/**
* Goes though an array of GmailThread and removes any threads which has unread messages 
*
* @param threads array GmailThread[]
* @return array GmailThread[]
*/
function skipUnread(threads) {
  var result = [];
  
  for (var i in threads) {
    var thread = threads[i];
    if (thread.isUnread()) {
      Logger.log("Skipping unread '" + thread.getFirstMessageSubject() + "' on " + thread.getLastMessageDate()); 
    } else {
      result.push(thread); 
    }
  }
  return result;
}

/**
* Checks if the thread has duration labels and if time is come
*
* @param thread GmailThread
* @return GmailLabel|null The label which was found if thread is ready for action or null
*/
function checkForTimeLabels(thread) {
  var labels = thread.getLabels();
  var currentMoment = moment();
      
  // checking for "duration" labels
  // duration label should be in ISO 8601 format
  //
  // PnYnMnDTnHnMnS
  // PnW
  // P<date>T<time>
  //
  // @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
  for (var j in labels) {
    // skipping trigger label
    if (labels[j].getName() != reminderTriggerLabel) {
     
      var duration = moment.duration(labels[j].getName());
      
      if (duration && duration > 0) {
        Logger.log(labels[j].getName() + " => " + duration.humanize());
        var plannedTime = moment(thread.getLastMessageDate()).add(duration);
        Logger.log("The reminder is configured for " + currentMoment.to(plannedTime));
       
        // if it's time to remind some one
        if (plannedTime < currentMoment) {
          Logger.log("It's time to remind! :)");
          // send a reminder and switch to the next conversation on success
          return labels[j];
        } else {
          Logger.log("Ok, let's wait for " + plannedTime.fromNow(true)); 
        }
      }
    }
  }
  
  return null;
}
 
/**
* Sends an email with reminder
*
* @param thread GmailThread thread to send a message
* @return bool is email has been sent
*/
function sendReminder(thread) {
  var lastMessage = thread.getMessages()[thread.getMessageCount()-1];
  
  var allTo = [lastMessage.getTo(), lastMessage.getFrom(), lastMessage.getCc()].join(',').split(',');
  Logger.log("All recepients: " + allTo);
  var firstName = '';
  
  for (var i in allTo) {
    
    var firstSplit = allTo[i].split(" <");
    if (firstSplit.length > 1) {
      
      // skipping ourselves
      if (firstSplit[1] == Session.getActiveUser().getEmail() + ">") {
        Logger.log("Skipping " + firstSplit[1]);
        continue;
      }
      
      var fullName = firstSplit[0].replace('"', '');
      var splitName = fullName.split(" ");
      if (splitName.length > 1) {
        firstName = splitName[0];
        break;
      }
    }
    
  }
  
  Logger.log("Fetched name: " + firstName);
  
  var content = _getRandomFromArray(emailTemplates.hello) + "\n\n" + _getRandomFromArray(emailTemplates.text) + "\n\n\n" + _getRandomFromArray(emailTemplates.goodbye) + "\n" + _getRandomFromArray(emailTemplates.name);
                    
  content = content.replace('%s', firstName);
  Logger.log(content);
  
  // replying all with the content
  thread.replyAll(content);
  
  // marking thread as read to keep bombarding with reminders
  thread.markRead();
}

/**
* Returns random value from an array
*
* @param values array array of somethings
* @return something :)
*/
function _getRandomFromArray(values) {
  return values[Math.floor(Math.random() * values.length)];
}
