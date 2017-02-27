# Google Apps Scripts for Gmail automation

Got bored reminding someone about something critical for you? Forgot to follow up on something on time? Let the automation to do this job for you and you can focus on other important stuff!

Intro
-----
This is a set of [Google Apps Scripts](https://developers.google.com/apps-script/) which automates some Gmail operations.
At the moment the following functions are available:
- Autoreminder (AKA "do you have any updates for me?")
- Postponed sending (AKA "please contact me in 1 week")

Scripts need to be manually installed and are executed on behalf of the user who installed and granted all required permissions.

Installation
------
1. Go to your [Google Drive](https://drive.google.com/drive/) and create new Google Apps Script.
2. Replace default content of Code.gs with the content of Code.gs file from the repository.
3. Create a new script file (`File -> New -> script file`) named "Moment" and replace default content with the content of Moment.gs from the repository.

Configuration
------
**Enabling extended API functions**

Postponed sending uses extended Google API functionality to manage your drafts. Go to `Resources -> Advanced Google Services...` and turn _Gmail API_ ON. 
You will be advised to enable this service also in the Google API console. Just follow the link, click on Gmail API and then click on ENABLE button.

**Permissions**

Execute the script for the first time by selecting Run -> go in the main menu. You will be prompted to review and grant permissions required by the script. Allow script have access to your emails as prompted.

**Scheduling**

Go to `Resources -> Current project's triggers`. Click on the link to add new trigger. Select "go" in the Run dropdown to execute all functions in same time.
You can also setup separate triggers for each function (select _processReminders_ or _processPostponed_ to use corresponding function), for instance if you want each of them has different execution interval.
Use drop downs to configure timers (for example, select Minutes timer and every 15 minutes).

Usage
------
**Autoreminder**

To send auto-reminders you need to label the conversation with "autoreminder" label (label's name is configurable, see _reminderTriggerLabel_ variable definition) and add a time interval label in ISO 8601 duration format (see bellow).
When defined time comes, the script will generate randomized email and reply it back in the target conversation.
Sample content of such email:
```
Hey Marc

Do you have any updates?

Thanks
Eugene
```
If recipient's name can't be guessed, it will be omitted.
In case of multiple recipients (in To or in CC), the first one excluding an active user will be taken.
You can extend or modify templates by editing _emailTemplates_ variable.

Autoreminders will be sent every defined time interval until label "autoreminder" is not removed or you've got an answer. 
Autoreminder wouldn't be sent if there are any unread messages in the conversation.

**Postponed sending**

To postpone email sending you need to save the draft and add a time interval label in ISO 8601 duration format (see bellow).
Your draft should have recipients be set otherwise it wouldn't be sent.
After sending, the interval label will be removed and the email will be marked as unread to make it more prominent.

The draft wouldn't be sent if there are any unread messages in the conversation.

Real life use case:
Some one replied to your inquiry asking to write him/her back in one week. You are preparing your follow up email, saving it as a draft and attach *P1W* label (send in 1 week).  

Time interval labels
------
The [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Durations) for durations format is supported.
>Durations are represented by the format P[n]Y[n]M[n]DT[n]H[n]M[n]S or P[n]W as shown to the right. In these representations, the [n] is replaced by the value for each of the date and time elements that follow the [n]. Leading zeros are not required, but the maximum number of digits for each element should be agreed to by the communicating parties. The capital letters P, Y, M, W, D, T, H, M, and S are designators for each of the date and time elements and are not replaced.
```
P is the duration designator (for period) placed at the start of the duration representation.
Y is the year designator that follows the value for the number of years.
M is the month designator that follows the value for the number of months.
W is the week designator that follows the value for the number of weeks.
D is the day designator that follows the value for the number of days.
T is the time designator that precedes the time components of the representation.
H is the hour designator that follows the value for the number of hours.
M is the minute designator that follows the value for the number of minutes.
S is the second designator that follows the value for the number of seconds.
```

The most commonly used labels are:
- **P1D** - one day (remind/send in one day)
- **PT6H** - 6 hours (remind/send in 6 hours)
- **P1W** - one week (remind/send in one week)
- **PT10M** - 10 minutes (remind/send in 10 minutes) - for testing purpose only :)

Debugging
------
You can run functions manually via main menu in the script editor to test functionality. Select *processReminders* or *processPostponed* functions to test corresponding functionality. Or select *go* function to execute all.
Detailed logs and execution details could be found via `View -> Logs` and `View -> Execution` transcript menus.

Dependencies
------
The script depends on the [Moment.js](https://momentjs.com) library which is used to process time intervals.
