/**
 * Device configuration Association controller - new version
 * @author Martin Vach
 */
// Device configuration Association controller - new version
appController.controller('ConfigAssocController', function($scope, $filter, $routeParams, $location, $cookies, $timeout, $http, $element, dataService, deviceService, myCache, cfg) {
    $scope.devices = [];
    $scope.deviceId = 0;
    $scope.activeTab = 'association';
    $scope.activeUrl = 'configuration/assoc/';
    $cookies.tab_config = $scope.activeTab;

    // Assoc vars
    $scope.node = [];
    $scope.nodeCfg = {
        id: 0,
        name: null,
        hasMca: false
    };
    $scope.assocGroups = [];
    $scope.assocGroupsDevices = [];
    $scope.assocAddDevices = [];
    $scope.assocAddInstances = false;
    $scope.cfgXml = [];
    $scope.input = {
        nodeId: 0,
        //goupId: 0,
        toNode: false,
        toInstance: false
    };

    $scope.reset = function() {
        $scope.assocGroups = angular.copy([]);
    };



    // Redirect to detail page
    $scope.changeDevice = function(deviceId) {
        if (deviceId > 0) {
            $location.path($scope.activeUrl + deviceId);
        }
    };

    // Load data
    $scope.load = function(nodeId) {
        dataService.getZwaveData(function(ZWaveAPIData) {
            $scope.assocGroups = angular.copy([]);
            $scope.ZWaveAPIData = ZWaveAPIData;
            $scope.devices = deviceService.configGetNav(ZWaveAPIData);
            var node = ZWaveAPIData.devices[nodeId];
            if (!node) {
                return;
            }
            if (nodeId == 255 || node.data.isVirtual.value) {
                return;
            }
            $scope.node = node;
            $scope.nodeCfg = {
                id: nodeId,
                hasMca: 142 in node.instances[0].commandClasses,
                name: $filter('deviceName')(nodeId, node),
                hasBattery: 0x80 in node.instances[0].commandClasses
            };
            $scope.input.nodeId = nodeId;

            $cookies.configuration_id = nodeId;
            $cookies.config_url = $scope.activeUrl + nodeId;
            $scope.deviceId = nodeId;
            dataService.getCfgXml(function(cfgXml) {
                setData(node, ZWaveAPIData, nodeId, cfgXml);
            });


        });
    };
    $scope.load($routeParams.nodeId);

    // Update data from device
    $scope.updateFromDevice = function(elId) {
        var nodeId = $scope.deviceId;
        var node = $scope.node;

        angular.forEach(node.instances, function(instance, index) {
            if (!("commandClasses" in instance)) {
                return;
            }
            if (0x85 in instance.commandClasses) {
                for (var group = 0; group < instance.commandClasses[0x85].data.groups.value; group++) {
                    dataService.runCmd('devices[' + nodeId + '].instances[' + index + '].commandClasses[0x85].Get(' + (group + 1) + ')', false, $scope._t('error_handling_data'), true);
                }
            }
            if (0x8e in instance.commandClasses) {
                for (var group = 0; group < instance.commandClasses[0x8e].data.groups.value; group++) {
                    dataService.runCmd('devices[' + nodeId + '].instances[' + index + '].commandClasses[0x8e].Get(' + (group + 1) + ')', false, $scope._t('error_handling_data'), true);

                }
            }
            $timeout(function() {
                $(elId + ' .fa-spin').fadeOut(1000);
                $scope.load(nodeId);
            }, 7000);
            return;


        });
    };

    //Show list of the devices to assocciate
    $scope.modalAssocAdd = function(groupId) {
        $scope.input.groupId = groupId;
        // Prepare devices and nodes
        angular.forEach($scope.ZWaveAPIData.devices, function(node, nodeId) {
            if (nodeId == 255 || node.data.isVirtual.value || nodeId == $scope.deviceId) {
                return;
            }
            var obj = {};
            obj['id'] = nodeId;
            obj['name'] = $filter('deviceName')(nodeId, node);
            obj['hasMca'] = 142 in node.instances[0].commandClasses;
            obj['instances'] = getNodeInstances(node, nodeId);
            $scope.assocAddDevices.push(obj);
            //console.log(obj)

        });

    };
    //Hide  assoc  modal window
    $scope.modalAssocHide = function() {
        $scope.input.toNode = false;
        $scope.input.toInstance = false;
        $scope.input.groupId = 0;
        $scope.assocAddInstances = false;
        $scope.assocAddDevices = angular.copy([]);
        $timeout(function() {
            $scope.load($scope.nodeCfg.id);
        }, 5000);

    };
    //Show node instances (if any)
    $scope.showAssocNodeInstance = function(nodeId) {
        var instances = [];
        // Prepare devices and nodes
        angular.forEach($scope.assocAddDevices, function(v, k) {
            if (v.id == nodeId) {
                $scope.assocAddInstances = Object.keys(v.instances).length > 0 ? v.instances : false;

                return;
            }


        });
        console.log($scope.assocAddInstances)
        //console.log($scope.assocToInstance)


    };
    //Store assoc device from group
    $scope.storeAssoc = function(input) {
        var instances = '0';
        var commandClasses = '85';
        var commandClassesH = 0x85;
        var toInstance = '';
        if (input.toInstance) {
            commandClasses = '142';
            commandClassesH = 0x8e;
            toInstance = ',' + input.toInstance;
        }
        var cmd = 'devices[' + input.nodeId + '].instances[' + instances + '].commandClasses[' + commandClassesH + '].Set(' + input.groupId + ',' + input.toNode + toInstance + ')';
        var data = {
            'id': input.nodeId,
            'instance': instances,
            'commandclass': commandClasses,
            'command': 'Set',
            'parameter': '[' + input.groupId + ',' + input.toNode + toInstance + ']'

        };
        dataService.getCfgXml(function(cfgXml) {
            var xmlFile = deviceService.buildCfgXmlAssoc(data, cfgXml);
            dataService.putCfgXml(xmlFile);
            dataService.runCmd(cmd, false, $scope._t('error_handling_data'));
            $timeout(function() {
                $scope.load(input.nodeId);
            }, 5000);
        });
    };

    //Delete assoc device from group
    $scope.deleteAssoc = function(d) {
        var params =  d.groupId + ',' + d.id + (d.instance ? ',' + d.instance : '');
        var cmd = 'devices[' + d.node.id + '].instances[' + d.node.instance + '].commandClasses[0x' + d.node.cc + '].Remove(' + params + ')';
        
        var data = {
            'id': d.node.id,
            'instance': d.node.instance,
            'commandclass': d.node.cc,
            'command': 'Set',
            'parameter': '[' + params + ']'

        };;
        //dataService.runCmd(cmd);
        dataService.getCfgXml(function(cfgXml) {
            var xmlFile = deviceService.deleteCfgXmlAssoc(data, cfgXml);
            dataService.putCfgXml(xmlFile);
            dataService.runCmd(cmd, false, $scope._t('error_handling_data'));
        });
        $('#' + d.elId).fadeOut(1000);
        //$scope.load(d.node.id);
    };

    /// --- Private functions --- ///
    /**
     * Get node instances
     */
    function getNodeInstances(node, nodeId) {
        var instances = [];
        if (Object.keys(node.instances).length < 2) {
            return instances;
        }
        for (var instanceId in node.instances) {
            var obj = {};
            obj['key'] = instanceId,
                    obj['val'] = instanceId
            instances.push(obj);
        }
        return instances;

    }

    /**
     * Set zwave data
     */
    function setData(node, ZWaveAPIData, nodeId, cfgXml) {

        var zddXmlFile = $filter('hasNode')(node, 'data.ZDDXMLFile.value');
        //console.log('zddXmlFile: ' + zddXmlFile);
        // not available
        if (!zddXmlFile || zddXmlFile === 'undefined') {
            //$scope.assocGroups = getAssocDevices(node, ZWaveAPIData, null, controllerNodeId);
            $scope.assocGroups = getAssocGroups(node, null, nodeId, ZWaveAPIData, cfgXml);
            //console.log('assocGroups: ', $scope.assocGroups);
            return;
        }

        dataService.getZddXml(zddXmlFile, function(zddXmlData) {
            var zdd = $filter('hasNode')(zddXmlData, 'ZWaveDevice.assocGroups');
            //$scope.assocGroups = getAssocDevices(node, ZWaveAPIData, zdd, controllerNodeId);
            $scope.assocGroups = getAssocGroups(node, zdd, nodeId, ZWaveAPIData, cfgXml);
            //console.log('assocGroups: ', $scope.assocGroups);

        });

    }

    /**
     * Get assoc groups
     */
    function getAssocGroups(node, zdd, nodeId, ZWaveAPIData, cfgXml) {
        var assocGroups = [];
        var groupZdd = [];
        if (zdd) {
            angular.forEach(zdd, function(zddval, zddkey) {
                if (angular.isArray(zddval)) {
                    angular.forEach(zddval, function(val, key) {
                        groupZdd[val._number] = val;
                    });
                } else {
                    groupZdd[zddval._number] = zddval;
                }
            });
        }

        angular.forEach(node.instances, function(instance, index) {

            if (!("commandClasses" in instance)) {
                return;
            }
            if ((0x85 in instance.commandClasses) || (0x8e in instance.commandClasses)) {
                var groups = 0;
                if (0x85 in instance.commandClasses) {
                    groups = instance.commandClasses[0x85].data.groups.value;

                }

                if (0x8e in instance.commandClasses) {
                    if (instance.commandClasses[0x8e].data.groups.value > groups)
                        groups = instance.commandClasses[0x8e].data.groups.value;
                }
                for (var group = 0; group < groups; group++) {
                    var data;
                    var assocDevices = [];
                    var cfgArray;
                    var groupCfg = [];
                    var groupDevices = [];
                    var savedInDevice = [];
                    var nodeIds = [];
                    var instanceIds = [];
                    var persistent = [];
                    var updateTime;
                    var invalidateTime;
                    var groupId;
                    var label;
                    var max;
                    var obj = {};


                    groupId = (group + 1);
                    label = getGroupLabel(groupZdd[groupId], group, instance);
                    max = $filter('hasNode')(groupZdd[groupId], '_maxNodes');
                    cfgArray = deviceService.getCfgXmlAssoc(cfgXml, nodeId, '0', '85', 'Set', groupId);
                    console.log(cfgArray)

                    $scope.assocGroupsDevices[groupId] = {};
                    //console.log(cfgArray)
                    if ((0x85 in instance.commandClasses) && (group < instance.commandClasses[0x85].data.groups.value)) {
                        data = instance.commandClasses[0x85].data[group + 1];
                        groupDevices = data.nodes.value;
                        savedInDevice = data.nodes.value;
                        updateTime = data.updateTime;
                        invalidateTime = data.invalidateTime;
                        if (cfgArray.length > 0 && cfgArray[groupId].length > 0) {
                            groupCfg = cfgArray[groupId];
                            //groupDevices.concat(groupCfg);
                            $.merge(groupDevices, groupCfg);
                        }
                        //console.log(groupId + ' groupCfg', groupCfg)
                        //console.log(groupId + ' savedInDevice', savedInDevice)
                        for (var i = 0; i < groupDevices.length; i++) {
                            var targetNodeId = data.nodes.value[i];
                            nodeIds.push(targetNodeId);
                            var targetInstanceId = 0;
                            instanceIds.push(targetInstanceId);
                            
                            var objAssoc = {};
                            objAssoc['id'] = targetNodeId;
                            objAssoc['groupId'] = groupId;
                            objAssoc['elId'] = groupId + '_' + targetNodeId + '_' + targetInstanceId + '_' + i;
                            objAssoc['name'] = $filter('deviceName')(targetNodeId, ZWaveAPIData.devices[targetNodeId]);
                            objAssoc['instance'] = targetInstanceId;
                            objAssoc['cc'] = 85;
                            objAssoc['node'] = {
                                id: nodeId,
                                instance: index,
                                cc: 85
                            };
                            objAssoc['inDevice'] = savedInDevice.indexOf(targetNodeId) > -1 ? true : false;
                            objAssoc['inConfig'] = groupCfg.indexOf(targetNodeId) > -1 ? true : false;
                            objAssoc['status'] = (savedInDevice.indexOf(targetNodeId) > -1 ? true : false) + '-' + (groupCfg.indexOf(targetNodeId) > -1 ? true : false);
                            assocDevices.push(objAssoc);
                            $scope.assocGroupsDevices[groupId][targetNodeId] = objAssoc;
                        }
                    }
                    if ((0x8e in instance.commandClasses) && (group < instance.commandClasses[0x8e].data.groups.value)) {
                        //console.log('0x8e')
                        data = instance.commandClasses[0x8e].data[group + 1];
                        groupDevices = data.nodes.value;
                        savedInDevice = data.nodes.value;
                        updateTime = data.updateTime;
                        invalidateTime = data.invalidateTime;
                        if (cfgArray.length > 0 && cfgArray[groupId].length > 0) {
                            groupCfg = cfgArray[groupId];
                            $.merge(groupDevices, groupCfg);
                        }
                        for (var i = 0; i < Object.keys(data.nodesInstances.value).length; i += 2) {
                            //console.log(i)
                            var targetNodeId = data.nodesInstances.value[i];
                            nodeIds.push(targetNodeId);
                            var targetInstanceId = data.nodesInstances.value[i + 1];
                            instanceIds.push(targetInstanceId);
                            var objAssoc = {};
                            objAssoc['id'] = targetNodeId;
                            objAssoc['groupId'] = groupId;
                            objAssoc['elId'] = groupId + '_' + targetNodeId + '_' + targetInstanceId + '_' + i;
                            objAssoc['name'] = $filter('deviceName')(targetNodeId, ZWaveAPIData.devices[targetNodeId]);
                            objAssoc['instance'] = targetInstanceId;
                            objAssoc['cc'] = '8e';
                            objAssoc['node'] = {
                                id: nodeId,
                                instance: index,
                                cc: '8e'
                            };
                            objAssoc['inDevice'] = savedInDevice.indexOf(targetNodeId) > -1 ? true : false;
                            objAssoc['inConfig'] = groupCfg.indexOf(targetNodeId) > -1 ? true : false;
                            objAssoc['status'] = (savedInDevice.indexOf(targetNodeId) > -1 ? true : false) + '-' + (groupCfg.indexOf(targetNodeId) > -1 ? true : false);
                            assocDevices.push(objAssoc);
                            $scope.assocGroupsDevices[groupId][String(targetNodeId) + String(i)] = objAssoc;
                            //console.log(objAssoc)
                        }
                    }

                    obj = {
                        label: label,
                        devices: assocDevices,
                        devicesLength: assocDevices.length,
                        nodeId: nodeId,
                        node: node,
                        instance: index,
                        groupId: groupId,
                        nodeIds: $filter('unique')(nodeIds),
                        instanceIds: instanceIds,
                        persistent: persistent,
                        max: max || data.max.value,
                        updateTime: updateTime,
                        invalidateTime: invalidateTime,
                        remaining: (data.max.value - $filter('unique')(nodeIds).length)
                    };
                    assocGroups.push(obj);
                }
            }
        });
        //console.log($scope.assocGroupsDevices)
        return assocGroups;
    }

    /**
     * Get group name
     */
    function getGroupLabel(assocGroups, index, instance) {
        // Set default assoc group name
        var label = $scope._t('association_group') + " " + (index + 1);

        // Attempt to get assoc group name from the zdd file
        var langs = $filter('hasNode')(assocGroups, 'description.lang');
        if (langs) {
            if (angular.isArray(langs)) {
                for (var i = 0, len = langs.length; i < len; i++) {
                    if (("__text" in langs[i]) && (langs[i]["_xml:lang"] == $scope.lang)) {
                        label = langs[i].__text;
                        continue;
                        //return label;

                        //continue;
                    } else {
                        if (("__text" in langs[i]) && (langs[i]["_xml:lang"] == 'en')) {
                            label = langs[i].__text;
                            continue;
                            //return label;
                        }
                    }
                }
            } else {
                if (("__text" in langs)) {
                    label = langs.__text;
                }
            }
        } else {
            // Attempt to get assoc group name from the command class
            angular.forEach(instance.commandClasses, function(v, k) {
                if (v.name == 'AssociationGroupInformation') {
                    label = $filter('hasNode')(v, 'data.' + (index + 1) + '.groupName.value');
                }

            });
        }
        return label;
    }
    ;

});