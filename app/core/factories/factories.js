/**
 * Application factories
 * @author Martin Vach
 */

/*** Factories ***/
var appFactory = angular.module('appFactory', ['ngResource']);

appFactory.config(function($httpProvider) {
    //$httpProvider.defaults.withCredentials = true;
// $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = 'accept, origin, content-type, cookie'; 
//    $httpProvider.defaults.headers.common['Access-Control-Allow-Credential'] = 'true'; 
//    $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = 'accept, origin, content-type, cookie'; 
    //$httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = 'accept, origin, content-type, cookie'; 
    //$httpProvider.defaults.headers.common['X-Requested-With'] = ''; 
    //$httpProvider.defaults.headers.common['Cookie'] = 'ZBW_IFLANG=eng; ZBW_SESSID=ced27083bfaff559438d79a72949c1064262d312'; 
    
    $httpProvider.responseInterceptors.push('myHttpInterceptor');
    
    var spinnerFunction = function spinnerFunction(data, headersGetter) {
        $(".main_spinner__").show();
        return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerFunction);
});
appFactory.factory('myHttpInterceptor', function($q, $window) {
    return function(promise) {
        return promise.then(function(response) {
            $('#respone_container').hide();
            return response;
        }, function(response) {
            $('#respone_container').html('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> <i class="icon-ban-circle"></i> <strong>ERROR!</strong> NO data loaded</div>').show();
            return $q.reject(response);
        });
    };
});

// Get a complete or updated JSON
appFactory.factory('DataFactory', function($resource, cfg) {
    return {
        all: function(param) {
            return $resource(cfg.server_url + cfg.update_url + param, {}, {query: {
                    method: 'POST', 
                    params: {user_field: cfg.user_field, pass_field: cfg.pass_field,ZBW_SESSID:  'ced27083bfaff559438d79a72949c1064262d312'},
                    isArray: false
                }});
        },
        store: function(param) {
            return $resource(cfg.server_url + cfg.store_url + param, {}, {query: {
                    method: 'POST', params: {}
                }});
        }
    };
});

// Get a complete JSON
appFactory.factory('DataTestFactory', function($resource, cfg) {
    return {
        all: function(param) {
            return $resource('storage/demo/' + param, {}, {query: {method: 'GET', params: {}, isArray: false}});
        }
    };
});

// Get a complete JSON
appFactory.factory('DataUpdateFactory', function($resource, cfg) {
    return {
        all: function(param) {
            return $resource(cfg.server_url + cfg.store_url + param, {}, {query: {method: 'POST', params: {}}});
        }
    };
});

// Get a devices JSON
appFactory.factory('FirmwareFactory', function($resource) {
    return {
        all: $resource('storage/demo/devices.json', {}, {
            query: {method: 'GET', params: {}, isArray: true}
        })
    };
});

// Get language dataas object
appFactory.factory('langFactory', function($resource, cfg) {
    return {
        get: function(lang) {
            return $resource(cfg.lang_dir + 'language.' + lang + '.json', {}, {query: {
                    method: 'GET',
                    params: {},
                    isArray: false
                }});
        }
    };
});

// Translation factory - get language line by key
appFactory.factory('langTransFactory', function() {
    return {
        get: function(key,languages) {
            if (angular.isObject(languages)) {
                if (angular.isDefined(languages[key])) {
                    return languages[key] !=='' ? languages[key] : key;
                }
            }
            return key;
        }
    };
});

