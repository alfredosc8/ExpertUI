/**
 * @overview This is used to control the Z-Wave controller itself and ot manage the Z-Wave network.
 * @author Martin Vach
 */

/**
 * Control root ontroller
 * @class ControlController
 *
 */
appController.controller('ControlController', function ($scope, $interval, $timeout, $filter, cfg, dataService) {
    $scope.controlDh = {
        interval: null,
        show: false,
        controller: {},
        inclusion: {
            lastIncludedDevice: $scope.alert,
            lastExcludedDevice: $scope.alert,
            alert: $scope.alert,
            alertPrimary: $scope.alert
        },
        network: {
            include: false,
            inclusionProcess: false,
            alert: $scope.alert,
            modal: false
        },
        nodes: {
            all: [],
            failedNodes: [],
            failedBatteries: [],
            sucSis: []

        },
        input: {
            failedNodes: 0,
            replaceNodes: 0,
            failedBatteries: 0,
            sucSis: 0
        },
        removed:{
            failedNodes: [],
            replaceNodes: [],
            failedBatteries: []
        }
    };
    /**
     * Cancel interval on page destroy
     */
    $scope.$on('$destroy', function() {
        $interval.cancel($scope.controlDh.interval);
    });

    /**
     * Load zwave data
     */
    $scope.loadZwaveData = function () {
        dataService.loadZwaveApiData().then(function (ZWaveAPIData) {
            setControllerData(ZWaveAPIData);
            setDeviceData(ZWaveAPIData);
            $scope.controlDh.show = true;
            $scope.refreshZwaveData(ZWaveAPIData);
        }, function (error) {
            alertify.alertError($scope._t('error_load_data'));
        });
    };
    $scope.loadZwaveData();

    /**
     * Refresh zwave data
     * @param {object} ZWaveAPIData
     */
    $scope.refreshZwaveData = function (ZWaveAPIData) {
        var refresh = function () {
            dataService.loadJoinedZwaveData(ZWaveAPIData).then(function (response) {
                setControllerData(response.data.joined);
                setDeviceData(response.data.joined);
                setInclusionData(response.data.joined,response.data.update)
            }, function (error) {
            });
        };
        $scope.controlDh.interval = $interval(refresh, $scope.cfg.interval);
    };


    /// --- Private functions --- ///
    /**
     * Set controller data
     * @param {object} ZWaveAPIData
     */
    function setControllerData(ZWaveAPIData) {
        var controllerNodeId = ZWaveAPIData.controller.data.nodeId.value;
        var nodeId = ZWaveAPIData.controller.data.nodeId.value;
        var hasSUC = ZWaveAPIData.controller.data.SUCNodeId.value;
        var hasDevices = Object.keys(ZWaveAPIData.devices).length;
        var controllerState = ZWaveAPIData.controller.data.controllerState.value;



        // Customsettings
        $scope.controlDh.controller.hasDevices = hasDevices > 1;
        $scope.controlDh.controller.disableSUCRequest = true;
        if (hasSUC && hasSUC != controllerNodeId) {
            $scope.controlDh.controller.disableSUCRequest = false;
        }
        if ($scope.controlDh.nodes.sucSis.indexOf(nodeId) === -1) {
            $scope.controlDh.input.sucSis = $scope.controlDh.input.sucSis || ZWaveAPIData.controller.data.nodeId.value;
            $scope.controlDh.nodes.sucSis.push(nodeId);
        }

        // Default controller settings
        $scope.controlDh.controller.nodeId = nodeId;
        $scope.controlDh.controller.frequency = $filter('hasNode')(ZWaveAPIData, 'controller.data.frequency.value');
        $scope.controlDh.controller.controllerState = controllerState;
        $scope.controlDh.controller.secureInclusion = ZWaveAPIData.controller.data.secureInclusion.value;
        $scope.controlDh.controller.isPrimary = ZWaveAPIData.controller.data.isPrimary.value;
        $scope.controlDh.controller.isRealPrimary = ZWaveAPIData.controller.data.isRealPrimary.value;
        $scope.controlDh.controller.isSIS = ZWaveAPIData.controller.data.SISPresent.value;
        $scope.controlDh.controller.secureInclusion = ZWaveAPIData.controller.data.secureInclusion.value;
        $scope.controlDh.controller.homeName = ZWaveAPIData.controller.data.homeName.value || cfg.controller.homeName;
        $scope.controlDh.controller.SetPromiscuousMode = (ZWaveAPIData.controller.data.functionClassesNames.value.indexOf('SetPromiscuousMode') > -1 ? true: false);
        $scope.controlDh.controller.SUCNodeId = ZWaveAPIData.controller.data.SUCNodeId.value;

        $scope.controlDh.inclusion.alert = {
            message: $scope._t('nm_controller_state_' + controllerState),
            status: 'alert-warning',
            icon: 'fa-spinner fa-spin'
        };

        // Controller state switch
        switch(controllerState){
            case 0:
                // Device inclusion
                $scope.controlDh.inclusion.alert = {
                    message: $scope._t('nm_controller_state_' + controllerState),
                    status: 'alert-info',
                    icon: false
                };
                $scope.controlDh.inclusion.alertPrimary = $scope.alert;
                // Network inclusion
                if($scope.controlDh.network.inclusionProcess){
                    if($scope.controlDh.network.include){
                        $scope.controlDh.network.modal = true;
                        $scope.controlDh.network.alert = {message: $scope._t('success_controller_include'), status: 'alert-success', icon: 'fa-smile-o'};
                   }

                }else{
                    $scope.controlDh.network.alert = $scope.alert;

                }
                break;
            case 1:
                // Device inclusion
                if($scope.controlDh.controller.isSIS || $scope.controlDh.controller.isPrimary){
                    $scope.controlDh.inclusion.alertPrimary = {
                        message: $scope._t('nm_controller_sis_or_primary'),
                        status: 'alert-info',
                        icon: false
                    };
                }
                if(!$scope.controlDh.controller.isSIS && !$scope.controlDh.controller.isPrimary){
                    $scope.controlDh.inclusion.alertPrimary = {
                        message: $scope._t('nm_controller_not_sis_or_primary'),
                        status: 'alert-danger',
                        icon: false
                    };
                }

                break;
            case 9:
                // Network inclusion
                $scope.controlDh.network.alert = {message: $scope._t('nm_controller_state_11'), status: 'alert-warning', icon: 'fa-spinner fa-spin'};
                $scope.controlDh.network.inclusionProcess = 'processing';
                break;
            case 17:
                // Network inclusion
                $scope.controlDh.network.alert = {message: $scope._t('nm_controller_state_17'), status: 'alert-danger', icon: 'fa-exclamation-triangle'};
                $scope.controlDh.network.inclusionProcess = 'error';
                break;

            default:
               break;
        }
    }

    /**
     * Set device data
     * @param {object} ZWaveAPIData
     */
    function setDeviceData(ZWaveAPIData) {
        angular.forEach(ZWaveAPIData.devices, function (node, nodeId) {
            if (nodeId == 255 || nodeId == ZWaveAPIData.controller.data.nodeId.value || node.data.isVirtual.value) {
                return;
            }
            // SUC/SIS nodes
            if (node.data.basicType.value == 2) {
                if ($scope.controlDh.nodes.sucSis.indexOf(nodeId) === -1) {
                    $scope.controlDh.nodes.sucSis.push(nodeId);
                }
            }
            // Devices
            if (!$scope.controlDh.nodes.all[nodeId]) {
                $scope.controlDh.nodes.all[nodeId] = $filter('deviceName')(nodeId, node);
            }

            // Failed and Batteries nodes
            if (ZWaveAPIData.controller.data.isPrimary.value) {
                if (node.data.isFailed.value) {
                    if ($scope.controlDh.nodes.failedNodes.indexOf(nodeId) === -1) {
                        $scope.controlDh.nodes.failedNodes.push(nodeId);
                    }
                }
                if (!node.data.isListening.value && !node.data.isFailed.value) {
                    if ($scope.controlDh.nodes.failedBatteries.indexOf(nodeId) === -1) {
                        $scope.controlDh.nodes.failedBatteries.push(nodeId);
                    }
                }
            }
            ;

        });
    }

    /**
     * Set inclusion data
     * @param {object} data
     */
    function setInclusionData(data, update) {
        var deviceIncId,deviceExcId;
        // console.log('Learn mode 2: ' + $scope.learnMode);
        if ('controller.data.lastIncludedDevice' in update) {
            deviceIncId = update['controller.data.lastIncludedDevice'].value;
        }
        if ('controller.data.lastExcludedDevice' in update) {
            deviceExcId = update['controller.data.lastExcludedDevice'].value;
        }
        if(!deviceIncId && !deviceExcId){
            //console.log('Not Exclude/Include')
            return;
        }
        /**
         * Last icluded device
         */

        if (deviceIncId) {
            var givenName = 'Device_' + deviceIncId;
            var updateTime = $filter('isTodayFromUnix')(data.controller.data.lastIncludedDevice.updateTime);
            //Run CMD
            var cmd = 'devices[' + deviceIncId + '].data.givenName.value=\'' + givenName + '\'';
            dataService.runZwaveCmd(cfg.store_url + cmd);
            $scope.controlDh.inclusion.lastIncludedDevice = {
                message: $scope._t('nm_last_included_device') + '  (' + updateTime + ')  <a href="#configuration/interview/' + deviceIncId + '"><strong>' + givenName + '</strong></a>',
                status: 'alert-success',
                icon: 'fa-smile-o'
            };
        }

        /**
         * Last excluded device
         */
       if (deviceExcId) {
           var updateTime = $filter('isTodayFromUnix')(data.controller.data.lastExcludedDevice.updateTime);
            if (deviceExcId != 0) {
                var txt = $scope._t('txt_device') + ' # ' + deviceExcId + ' ' + $scope._t('nm_excluded_from_network');
            } else {
                var txt = $scope._t('nm_last_excluded_device_from_foreign_network');
            }

            //$scope.controlDh.inclusion.lastExcludedDevice = txt + ' (' + updateTime + ')';
           $scope.controlDh.inclusion.lastExcludedDevice = {
               message: txt + ' (' + updateTime + ')',
               status: 'alert-success',
               icon: 'fa-smile-o'
           };
        }
    };

});

/**
 * Shall inclusion be done using Security.
 * @class SetSecureInclusionController
 *
 */
appController.controller('SetSecureInclusionController', function ($scope) {
    /**
     * Set inclusion as Secure/Unsecure.
     * state=true Set as secure.
     * state=false Set as unsecure.
     * @param {string} cmd
     */
    $scope.setSecureInclusion = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };
});

/**
 * This turns the Z-wave controller into an inclusion/exclusion mode that allows including/excluding a device.
 * @class IncludeDeviceController
 *
 */
appController.controller('IncludeExcludeDeviceController', function ($scope,$route) {
    /**
     * Start Inclusion of a new node.
     * Turns the controller into an inclusion mode that allows including a device.
     * flag=1 for starting the inclusion mode
     * flag=0 for stopping the inclusion mode
     * @param {string} cmd
     */
    $scope.addNodeToNetwork = function (cmd) {
        //$scope.controlDh.inclusion.lastIncludedDevice = false;
        $scope.runZwaveCmd(cmd);
        $route.reload();
    };

    /**
     * Stop Exclusion of a node.
     * Turns the controller into an exclusion mode that allows excluding a device.
     * flag=1 for starting the exclusion mode
     * flag=0 for stopping the exclusion mode
     * @param {string} cmd
     */
    $scope.removeNodeToNetwork = function (cmd) {
        //$scope.controlDh.inclusion.lastExcludedDevice = false;
        $scope.runZwaveCmd(cmd);
        $route.reload();
    };
});

/**
 * It will change Z-wave controller own Home ID to the Home ID of the new network
 * and it will learn all network information from the including controller of the new network.
 * All existing relationships to existing nodes will get lost
 * when the Z-Way controller joins a dierent network
 * @class IncludeDifferentNetworkController
 *
 */
appController.controller('IncludeDifferentNetworkController', function ($scope, $timeout, $window,cfg, dataService) {
    /**
     * Include to network
     * @param {string} cmd
     */
    $scope.includeToNetwork = function (cmd) {
        //$scope.runZwaveCmd(cmd);
        var timeout = 1000;
        $scope.toggleRowSpinner(cmd);
        if(cmd === 'controller.SetLearnMode(1)'){
            $scope.controlDh.network.include = true;

        }else{
            $scope.controlDh.network.include = false;
            $scope.controlDh.network.inclusionProcess = false;
        }
        dataService.runZwaveCmd(cfg.store_url + cmd).then(function (response) {
            $timeout($scope.toggleRowSpinner, timeout);
        }, function (error) {
            $scope.toggleRowSpinner();
            alertify.alertError($scope._t('error_load_data') + '\n' + cmd);
        });

    };

    /**
     * Exclude form network
     * @param {string} cmd
     */
    $scope.excludeFromNetwork = function (cmd, confirm) {
        console.log(cmd)
       // return;
        alertify.confirm(confirm, function () {
            $scope.controlDh.network.inclusionProcess = false;
            $scope.controlDh.network.include = false;
            $scope.runZwaveCmd(cmd);
            if(cmd === 'controller.SetLearnMode(1)') {
                $timeout(function () {
                    $window.location.reload();
                }, 5000);
            }

        });

    };

    /**
     * Close network modal
     * @param {string} modal
     * @param $event
     */
    $scope.closeNetworkModal = function (modal,$event) {
       $scope.controlDh.network.inclusionProcess = false;
        $scope.controlDh.network.modal = false;
        $window.location.reload();

    };

    /// --- Private functions --- ///
});

/**
 * Restore Z-Wave controller from the backup
 * @class BackupRestoreController
 *
 */
appController.controller('BackupRestoreController', function ($scope, $upload, $window, deviceService, cfg, _) {
    $scope.restore = {
        allow: false,
        input: {
            restore_chip_info: '0'
        }
    };

    /**
     * Send request to restore from backup
     * todo: Replace $upload vith version from the SmartHome
     * @returns {void}
     */
    $scope.restoreFromBackup = function ($files) {
        $scope.loading = {status: 'loading-spin', icon: 'fa-spinner fa-spin', message: $scope._t('restore_wait')};
        var chip = $scope.restore.input.restore_chip_info;
        var url = cfg.server_url + cfg.restore_url + '?restore_chip_info=' + chip;
        //return;
        for (var i = 0; i < $files.length; i++) {
            var $file = $files[i];
            $upload.upload({
                url: url,
                fileFormDataName: 'config_backup',
                file: $file
            }).progress(function (evt) {
                //$scope.restoreBackupStatus = 1;
            }).success(function (data, status, headers, config) {
                //$scope.handleModal('restoreModal');
                $scope.handleModal();
                if (data && data.replace(/(<([^>]+)>)/ig, "") !== "null") {//Error
                    alertify.alertError($scope._t('restore_backup_failed'));
                    //$scope.restoreBackupStatus = 3;
                } else {// Success
                    deviceService.showNotifier({message: $scope._t('restore_done_reload_ui')});
                    $window.location.reload();
                    //$scope.restoreBackupStatus = 2;
                }
            }).error(function (data, status) {
                //$scope.handleModal('restoreModal');
                $scope.handleModal();
                alertify.alertError($scope._t('restore_backup_failed'));
                //$scope.restoreBackupStatus = 3;
            });

        }
    };
});

/**
 * This controller will perform a soft restart and a reset of the Z-Wave controller chip.
 * @class ZwaveChipRebootResetController
 *
 */
appController.controller('ZwaveChipRebootResetController', function ($scope,$window) {
    /**
     * This function will perform a soft restart of the  firmware of the Z-Wave controller chip
     * without deleting any network information or setting.
     * @param {string} cmd
     */
    $scope.serialAPISoftReset = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };

    /**
     * This function erases all values stored in the Z-Wave chip and sent the chip back to factory defaults.
     * This means that all network information will be lost without recovery option.
     *  @param {string} cmd
     */
    $scope.setDefault = function (cmd) {
        $scope.runZwaveCmd(cmd);
       // $scope.handleModal('restoreModal');
        $window.location.reload();
    };
});

/**
 * Change Z-Wave Z-Stick 4 frequency.
 * @class ChangeFrequencyController
 *
 */
appController.controller('ChangeFrequencyController', function ($scope) {
    /**
     * Send Configuration ZMEFreqChange
     * @param {string} cmd
     */
    $scope.zmeFreqChange = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };
});

/**
 * The controller will then mark the device as 'failed'
 * but will keep it in the current network con guration.
 * @class RemoveFailedNodeController
 *
 */
appController.controller('RemoveFailedNodeController', function ($scope, $timeout) {
    /**
     * Remove failed node from network.
     * nodeId=x Node id of the device to be removed
     * @param {string} cmd
     */
    $scope.removeFailedNode = function (cmd) {
        $scope.runZwaveCmd(cmd);
        $timeout(function () {
            $scope.controlDh.removed.failedNodes.push($scope.controlDh.input.failedNodes);
            $scope.controlDh.input.failedNodes = 0;
        }, 1000);
    };
});

/**
 * The controller replaces a failed node by a new node.
 * @class ReplaceFailedNodeController
 *
 */
appController.controller('ReplaceFailedNodeController', function ($scope, $timeout) {
    /**
     * Replace failed node with a new one.
     * nodeId=x Node Id to be replaced by new one
     * @param {string} cmd
     */
    $scope.replaceFailedNode = function (cmd) {
        $scope.runZwaveCmd(cmd);
        $timeout(function () {
            $scope.controlDh.removed.replaceNodes.push($scope.controlDh.input.replaceNodes);
            $scope.controlDh.input.replaceNodes = 0;
        }, 1000);
    };
});

/**
 * Allows marking battery-powered devices as failed.
 * @class BatteryDeviceFailedController
 *
 */
appController.controller('BatteryDeviceFailedController', function ($scope, $timeout) {
    /**
     * Sets the internal 'failed' variable of the device object.
     * nodeId=x Node Id to be marked as failed.
     * @param {array} cmdArr
     */
    $scope.markFailedNode = function (cmdArr) {
        angular.forEach(cmdArr, function (v, k) {
            $scope.runZwaveCmd(v);

        });
        //$scope.controlDh.input.failedBatteries = 0;
        $timeout(function () {
            $scope.controlDh.removed.failedBatteries.push($scope.controlDh.input.failedBatteries);
            $scope.controlDh.input.failedBatteries = 0;
        }, 1000);

    };
});

/**
 * The controller change function allows to handover the primary function to a different controller in
 * the network. The function works like a normal inclusion function but will hand over the primary
 * privilege to the new controller after inclusion. Z-Way will become a secondary controller of the network.
 * @class ControllerChangeController
 *
 */
appController.controller('ControllerChangeController', function ($scope) {
    /**
     * Set new primary controller
     * Start controller shift mode if 1 (True), stop if 0 (False)
     *  @param {string} cmd
     */
    $scope.controllerChange = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };
});

/**
 * This will call the Node Information Frame (NIF) from all devices in the network.
 * @class RequestNifAllController
 *
 */
appController.controller('RequestNifAllController', function ($scope, $timeout, cfg, dataService) {
    /**
     * Request NIF from all devices
     */
    $scope.requestNifAll = function (spin) {
        $scope.toggleRowSpinner(spin);
        var cmd = 'devices[2].RequestNodeInformation()';
        var timeout = 1000;
        dataService.runZwaveCmd(cfg.call_all_nif).then(function (response) {
            timeout *= response.data.runtime;
            alertify.alertWarning($scope._t('proccess_take', {
                __val__: response.data.runtime,
                __level__: $scope._t('seconds')
            }));
            $timeout($scope.toggleRowSpinner, timeout);
        }, function (error) {
            $scope.toggleRowSpinner();
            alertify.alertError($scope._t('error_nif_request'));
        });
    };
});

/**
 * This will call the Node Information Frame (NIF) from the controller.
 * @class SendNodeInformationController
 *
 */
appController.controller('SendNodeInformationController', function ($scope) {
    /**
     * Send NIF of the stick
     * Parameter nodeId: Destination Node Id (NODE BROADCAST to send non-routed broadcast packet)
     * @param {string} cmd
     */
    $scope.sendNodeInformation = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };
});

/**
 * This controller allows controlling the SUC/SIS function for the Z-Wave network.
 * @class SucSisController
 *
 */
appController.controller('SucSisController', function ($scope) {
    /**
     * Get the SUC Node ID from the network.
     *  @param {string} cmd
     */
    $scope.getSUCNodeId = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };

    /**
     * Request network topology update from SUC/SIS.
     *  @param {string} cmd
     */
    $scope.requestNetworkUpdate = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };

    /**
     * Assign SUC function to a node in the network that is capable of running there SUC function
     * nodeId=x Node id to be assigned as SUC
     *  @param {string} cmd
     */
    $scope.setSUCNodeId = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };

    /**
     * Assign SIS role to a device
     * nodeId=x Node id to be assigned as SIS
     * @param {string} cmd
     */
    $scope.setSISNodeId = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };

    /**
     * Revoke SUC/SIS role from a device
     * nodeId=x Node id to be disabled as SUC
     *  @param {string} cmd
     */
    $scope.disableSUCNodeId = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };


});

/**
 * This sets Promiscuous mode to true/false.
 * @class SetPromiscuousModeController
 *
 */
appController.controller('SetPromiscuousModeController', function ($scope) {
    /**
     * Sets promiscuous mode
     * @param {string} cmd
     */
    $scope.setPromiscuousMode = function (cmd) {
        $scope.runZwaveCmd(cmd);
    };
});