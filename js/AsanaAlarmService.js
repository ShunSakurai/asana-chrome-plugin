asanaServiceModule.service("AsanaAlarmService", function (AsanaGateway) {

    this.createNotification = function (message, taskId, title) {
        // only message is the required argument
        messageString = message.toString() || 'null';
        notifcationIdString = (typeof(taskId) === 'number')? taskId.toString(): messageString;
        titleString = title? title.toString(): 'AsanaNG';
        chrome.notifications.create(
            notifcationIdString, {type: "basic", iconUrl: "img/icon128.png", title: titleString, message: messageString}
        );
        var notificationSound = new Audio();
        // sound taken from http://gallery.mobile9.com/f/4709233/
        notificationSound.src = chrome.extension.getURL("sound/Cool Notification0.mp3");
        notificationSound.play();
        if ((typeof taskId === 'number') && (listenedTasks.indexOf(taskId) === -1)) {
            listenedTasks.push(taskId);
            chrome.notifications.onClicked.addListener(function (taskId){
                chrome.tabs.create({url: "https://app.asana.com/0/0/" + taskId}, function (tab) {});
            });
        }
    };

    var listenedTasks = [];
    this.reportedMin = -1;
    this.reportedDateTime = new Date();

    this.compareDateTime = function (response) {
        var dateNow = new Date();
        var stringNow = [dateNow.getFullYear(), ('0' + (dateNow.getMonth() + 1)).slice(-2), ('0' + dateNow.getDate()).slice(-2)].join('-');
        for (var i = 0; i < response.length; i ++) {
            if (response[i].due_at) {
                // Depending on the time zone, it happens that due_on is Dec. 1st (local) but due_at is Dec. 2nd 5 am (UTC).
                if (stringNow === response[i].due_on) {
                    var arrayDueAt = response[i].due_at.split('T');
                    var arrayDueTime = arrayDueAt[1].replace('Z', '').split(':');
                    var minuteRemaining = (Number(arrayDueTime[0]) - dateNow.getUTCHours()) * 60 + (Number(arrayDueTime[1]) - dateNow.getUTCMinutes());
                    if ([1, 5, 15, 60].indexOf(minuteRemaining) !== -1) {
                        this.createNotification(response[i].name, response[i].id, minuteRemaining.toString() + " min until");
                    }
                }
            }
        }
    };

    this.failureFunc = function (response) {
        this.createNotification("Error: " + JSON.stringify(response), 0);
    };

    this.checkTasksAndNotify = function (workspaces) {
        // Somehow the Chrome alarm fires 2-3 times a minute
        var dateNow = new Date();
        var reportingMin = dateNow.getUTCMinutes();
        if (reportingMin === this.reportedMin) {
            return;
        }
        else {
            this.reportedMin = reportingMin;
        }
        for (var i = 0; i < workspaces.length; i ++) {
            AsanaGateway.getWorkspaceTasks(
                this.compareDateTime.bind(this), this.failureFunc.bind(this),
                {workspace_id: workspaces[i].id}
            );
        }
    };
});