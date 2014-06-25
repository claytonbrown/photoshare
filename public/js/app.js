'use strict';


// Declare app level module which depends on filters, and services
angular.module('photoshare', [
    'ngRoute',
    'ngResource',
    'photoshare.filters',
    'photoshare.services',
    'photoshare.directives',
    'photoshare.controllers'
]).
    constant('urls', {
        auth: '/api/auth/',
        photos: '/api/photos/:id',
        users: '/api/user/',
        tags: '/api/tags/'
    }).
    constant('authToken', 'X-Auth-Token').
    config(['$routeProvider',
            '$locationProvider',
            '$httpProvider',
            '$resourceProvider', function (
        $routeProvider,
        $locationProvider,
        $httpProvider,
        $resourceProvider
    ) {
        $routeProvider.

            when('/popular', {templateUrl: 'partials/list.html', controller: 'ListCtrl'}).

            when('/latest', {templateUrl: 'partials/list.html', controller: 'ListCtrl'}).

            when('/tags', {templateUrl: 'partials/tags.html', controller: 'TagsCtrl'}).

            when('/search/:q', {templateUrl: 'partials/list.html', controller: 'ListCtrl'}).

            when('/owner/:ownerID/:ownerName', {templateUrl: 'partials/list.html', controller: 'ListCtrl'}).

            when('/detail/:id', {templateUrl: 'partials/detail.html', controller: 'DetailCtrl'}).

            when('/upload', {templateUrl: 'partials/upload.html', controller: 'UploadCtrl'}).

            when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'}).

            when('/signup', {templateUrl: 'partials/signup.html', controller: 'SignupCtrl'}).

            otherwise({redirectTo: '/popular'});
        //$locationProvider.html5Mode(true);
        //
        $resourceProvider.defaults.stripTrailingSlashes = false;

        //$httpProvider.defaults.xsrfCookieName = "csrf_token";
        //$httpProvider.defaults.xsrfHeaderName = "X-CSRF-Token";

        // handle file uploads

        $httpProvider.defaults.transformRequest = function (data, headersGetter) {

            if (data === undefined) {
                return data;
            }

            var fd = new FormData(),
                isFileUpload = false,
                headers = headersGetter();

            angular.forEach(data, function (value, key) {
                if (value instanceof FileList) {
                    isFileUpload = true;
                    if (value.length === 1) {
                        fd.append(key, value[0]);
                    } else {
                        angular.forEach(value, function (file, index) {
                            fd.append(key + "_" + index, file);
                        });
                    }
                } else {
                    fd.append(key, value);
                }
            });
            if (isFileUpload) {
                headers["Content-Type"] = undefined;
                return fd;
            }

            return JSON.stringify(data);
        };

        var interceptors = ['AuthInterceptor', 'ErrorInterceptor'];

        angular.forEach(interceptors, function (interceptor) {
            $httpProvider.interceptors.push([
                '$injector', function ($injector) {
                    return $injector.get(interceptor);
                }
            ]);
        });

    }]).factory('AuthInterceptor', function ($window, authToken) {

        return {
            request: function (config) {
                config.headers = config.headers || {};
                var token = $window.localStorage.getItem("authToken");
                if (token) {
                    config.headers[authToken] = token;
                }
                return config;
            }
        };

    }).factory('ErrorInterceptor', function ($q, $location, Session, Alert) {
        return {

            response: function (response) {
                return response;
            },

            responseError: function (response) {
                var rejection = $q.reject(response),
                    status = response.status,
                    alert = "Sorry, an error has occurred";

                if (status == 401) {
                    Alert.danger("You must be logged in to continue");
                    Session.clear();
                    Session.setLastLoginUrl();
                    $location.path("/login");
                    return;
                }
                if (status == 403) {
                    alert = "Sorry, you're not allowed to do this";
                }
                if (status == 400 && response.data.errors) {
                    alert = "Sorry, your form contains errors, please try again";
                }
                if (status == 413) {
                    alert = "The file was too large!";
                }
                if (status == 500) {
                    alert = "Sorry, an error has occurred";
                }

                Alert.danger(alert);
                return rejection;
            }
        };
    });
