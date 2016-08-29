/**
 * Application base controller
 * @author Martin Vach
 */

/*** Controllers ***/
var appController = angular.module('appController', []);
// Base controller
appController.controller('BaseController', function ($scope, $cookies, $filter, $location, $anchorScroll, $window, $route, cfg, dataService, deviceService, myCache) {
    $scope.loading = false;
    /**
     * Load zwave dongles
     */
    $scope.setDongle = function () {
        dataService.getZwaveList().then(function (response) {
            if (response.length === 1) {
                angular.extend(cfg, {dongle: response[0]});
                $cookies.dongle = response[0];
                angular.extend(cfg, {
                    update_url: '/ZWave.' + cfg.dongle + '/Data/',
                    store_url: '/ZWave.' + cfg.dongle + '/Run/',
                    restore_url: '/ZWave.' + cfg.dongle + '/Restore',
                    queue_url: '/ZWave.' + cfg.dongle + '/InspectQueue',
                    fw_update_url: '/ZWave.' + cfg.dongle + '/FirmwareUpdate',
                    license_load_url: '/ZWave.' + cfg.dongle + '/ZMELicense',
                    zddx_create_url: '/ZWave.' + cfg.dongle + '/CreateZDDX/',
                    'stat_url': '/ZWave.' + cfg.dongle + '/CommunicationStatistics',
                    'postfixget_url': '/ZWave.' + cfg.dongle + '/PostfixGet',
                    'postfixadd_url': '/ZWave.' + cfg.dongle + '/PostfixAdd',
                    'postfixremove_url': '/ZWave.' + cfg.dongle + '/PostfixRemove',
                    //'communication_history_url': '/ZWave.' + cfg.dongle + '/CommunicationHistory',
                    'configget_url': '/ZWave.' + cfg.dongle + '/ExpertConfigGet',
                    'configupdate_url': '/ZWave.' + cfg.dongle + '/ExpertConfigUpdate'

                });
            }
        }, function (error) {
            if (error.status === 401) {
                //var redirectTo = $location.$$protocol+'://' + $location.$$host + ':' + $location.$$port + cfg.smarthome_login
                window.location.href = cfg.smarthome_login;
            }
            ;
        });
    };
    $scope.setDongle();
    // Custom IP
    $scope.customIP = {
        'url': cfg.server_url,
        'message': false,
        'connected': false
    };
    $scope.showHome = true;
    if (cfg.custom_ip === true) {
        $scope.showHome = false;
    }
    // Is mobile
    $scope.isMobile = false;

    // Url array
    $scope.urlArray = [];


    // Show page content
    $scope.showContent = false;
    // Global config
    $scope.cfg = cfg;
    // Load zwave config
    $scope.loadZwaveConfig = function (nocache) {
        dataService.getApi('configget_url', null, nocache).then(function (response) {
            angular.extend(cfg.zwavecfg, response.data);
        }, function (error) {});
    };
    $scope.loadZwaveConfig();

    // Lang settings
    $scope.lang_list = cfg.lang_list;
    // Set language
    $scope.lang = (angular.isDefined($cookies.lang) ? $cookies.lang : cfg.lang);
    $('.current-lang').html($scope.lang);
    $scope.changeLang = function (lang) {
        $window.alert($scope._t('language_select_reload_interface'));
        $cookies.lang = lang;
        $scope.lang = lang;
    };
    // Load language files
    $scope.loadLang = function (lang) {
        // Is lang in language list?
        var lang = (cfg.lang_list.indexOf(lang) > -1 ? lang : cfg.lang);
        dataService.getLanguageFile(function (data) {
            $cookies.langFile = {'ab': 25};
            $scope.languages = data;
        }, lang);


    };
    // Get language lines
    $scope._t = function (key) {
        return deviceService.getLangLine(key, $scope.languages);
    };

    // Watch for lang change
    $scope.$watch('lang', function () {
        $('.current-lang').html($scope.lang);
        $scope.loadLang($scope.lang);
    });
    // Navi time
    $scope.navTime = $filter('getCurrentTime');
    // Order by
    $scope.orderBy = function (field) {
        $scope.predicate = field;
        $scope.reverse = !$scope.reverse;
    };
    // Get body ID
    $scope.getBodyId = function () {
        var path = $location.path();
        var lastSegment = path.split('/').pop();
        $scope.urlArray = path.split('/');
        return lastSegment;
    };
    /*
     * Menu active class
     */
    $scope.isActive = function (route, segment) {
        var path = $location.path().split('/');
        return (route === path[segment] ? 'active' : '');
    };

    /**
     *
     * Mobile detect
     */
    $scope.isMobile = deviceService.isMobile(navigator.userAgent || navigator.vendor || window.opera);

    $scope.scrollTo = function (id) {
        $location.hash(id);
        $anchorScroll();
    };

    /**
     *Reload data
     */
    $scope.reloadData = function () {
        myCache.removeAll();
        $route.reload();
    };

    $scope.naviExpanded = {};
    /**
     * Expand/collapse navigation
     * @param {string} key
     * @param {object} $event
     * @param {boolean} status
     * @returns {undefined}
     */
    $scope.expandNavi = function (key, $event, status) {
        if ($scope.naviExpanded[key]) {
            $scope.naviExpanded = {};
            $event.stopPropagation();
            return;
        }
        $scope.naviExpanded = {};
        if (typeof status === 'boolean') {
            $scope.naviExpanded[key] = status;
        } else {
            $scope.naviExpanded[key] = !$scope.naviExpanded[key];
        }
        $event.stopPropagation();
    };
    // Collapse element/menu when clicking outside
    window.onclick = function () {
        if ($scope.naviExpanded) {
            angular.copy({}, $scope.naviExpanded);
            $scope.$apply();
        }
    };

    $scope.modalArr = {};
    /**
     * Open/close a modal window
     * @param {string} key
     * @param {object} $event
     * @param {boolean} status
     * @returns {undefined}
     */
    $scope.handleModal = function (key, $event, status) {
        if (typeof status === 'boolean') {
            $scope.modalArr[key] = status;
        } else {
            $scope.modalArr[key] = !($scope.modalArr[key]);
        }
        $event.stopPropagation();
    };
    // Collapse element/menu when clicking outside
    window.onclick = function () {
        if ($scope.naviExpanded) {
            angular.copy({}, $scope.naviExpanded);
            $scope.$apply();
        }
    };

    $scope.filterExpanded = {};
    /**
     * Expand/collapse filter
     * @param {string} key
     * @param {object} $event
     * @param {boolean} status
     * @returns {undefined}
     */
    $scope.expandFilter = function (key, $event, status) {
        if ($scope.filterExpanded[key]) {
            $scope.filterExpanded = {};
            $event.stopPropagation();
            return;
        }
        $scope.filterExpanded = {};
        if (typeof status === 'boolean') {
            $scope.filterExpanded[key] = status;
        } else {
            $scope.filterExpanded[key] = !$scope.filterExpanded[key];
        }
        $event.stopPropagation();
    };

    /**
     * Get array from custom config
     * @param {string} key
     * @returns {Array}
     */
    $scope.getCustomCfgArr = function (key) {
        if (cfg.custom_cfg[cfg.app_type]) {
            return cfg.custom_cfg[cfg.app_type][key] || [];
        }
        return [];
    };

    // Alertify defaults
    alertify.defaults.glossary.title = cfg.app_name;
    alertify.defaults.glossary.ok = 'OK';
    alertify.defaults.glossary.cancel = 'CANCEL';

    // Extend existing alert (ERROR) dialog
    if (!alertify.alertError) {
        //define a new errorAlert base on alert
        alertify.dialog('alertError', function factory() {
            return{
                build: function () {
                    var errorHeader = '<span class="fa fa-exclamation-triangle fa-lg text-danger" '
                            + 'style="vertical-align:middle;">'
                            + '</span> ' + cfg.app_name + ' - ERROR';
                    this.setHeader(errorHeader);
                }
            };
        }, true, 'alert');
    }

    // Extend existing alert (WARNING) dialog
    if (!alertify.alertWarning) {
        alertify.dialog('alertWarning', function factory() {
            return{
                build: function () {
                    var errorHeader = '<span class="fa fa-exclamation-circle fa-lg text-warning" '
                            + 'style="vertical-align:middle;">'
                            + '</span> ' + cfg.app_name + ' - WARNING';
                    this.setHeader(errorHeader);
                }
            };
        }, true, 'alert');
    }
    
    /**
     * Load Box API data
     */
    $scope.loadBoxApiData = function () {
        $scope.boxData = {};
        dataService.loadZwaveApiData().then(function (ZWaveAPIData) {
            $scope.boxData.controller = ZWaveAPIData.controller.data;
        }, function (error) {
            alertify.alertError($scope._t('error_load_data'));
            return;
        });
    };
    if(cfg.app_type === 'installer'){
         //$scope.loadBoxApiData();
     }
   

});
