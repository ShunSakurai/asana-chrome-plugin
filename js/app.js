var asanaServiceModule = angular.module("asanaService", []);

var asanaModule = angular.module("asana", ["ngRoute", "ngSanitize", "ui.select", 'ui.bootstrap', 'ui.bootstrap.datetimepicker', 'asanaService']);

// configure our routes
asanaModule.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            // route for the create task page
            templateUrl : 'pages/createTask.html',
            controller  : 'createTaskController'
        })
       .when('/createTask', {
            // route for the create task page
            templateUrl : 'pages/createTask.html',
            controller  : 'createTaskController'
        })
        .when('/tasks', {
            templateUrl : 'pages/tasks.html',
            controller  : 'tasksController'
        })
        .when('/tasks/:id', {
            templateUrl: 'pages/task.html',
            controller: 'taskController'
        })
        .when('/utility', {
            templateUrl : 'pages/utility.html',
            controller  : 'utilityController'
        });
});

asanaModule.config([
    '$compileProvider',
    function ($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|chrome-extension):/);
    }
]);

var asanaBackgroundModule = angular.module("asanaBackground", ['asanaService']);

asanaBackgroundModule.run(['AsanaAlarmService', 'AsanaGateway', function(AsanaAlarmService, AsanaGateway){
    AsanaGateway.getWorkspaces(function (response) {
        var userWorkspaces = response;
        chrome.alarms.onAlarm.addListener(function(everyOneMinute){
            chrome.storage.sync.get(null, function (value) {
                if(value.alarmEnabled || typeof value.alarmEnabled === 'undefined') {
                    AsanaAlarmService.checkTasksAndNotify(userWorkspaces);
                }
            });
        });
    });
}]);