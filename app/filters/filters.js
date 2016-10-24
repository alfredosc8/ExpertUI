/**
 * App filters
 * @author Martin Vach
 * @author Martin Hartnagel
 */

/**
 * Check if JSON keys/nodes exist
 */
angApp.filter('hasNode', function () {
    return function (obj, path) {
        path = path.split('.');
        var p = obj || {};
        for (var i in path) {
            if (p === null || typeof p[path[i]] === 'undefined') {
                return null;
            }
            p = p[path[i]];
        }
        return p;
    };
});

/**
 * Convert text to slug
 */
angApp.filter('stringToSlug', function () {
    return function (str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to = "aaaaeeeeiiiioooouuuunc------";
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
                .replace(/\s+/g, '-') // collapse whitespace and replace by -
                .replace(/-+/g, '-'); // collapse dashes

        return str;
    };
});

/**
 * Cut text into x chars
 */
angApp.filter('cutText', function () {
    return function (value, wordwise, max, tail) {
         if ((!value && value !== 0) || value === undefined || value === null){
             return '';
        }
        if(!value.length){
            return value;
        }
           

        max = parseInt(max, 10);
        if (!max){
            return value;
        }
            
        if (value.length <= max){
            return value;
        }
            
           
        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});
/**
 * Get object length
 */
angApp.filter('getObjectLength', function () {
    return function (obj) {
        if (angular.isObject(obj)) {
            return Object.keys(obj).length;
        }
        return 0;

    };
});
/**
 * Has property
 */
angApp.filter('hasProp', function () {
    return function (obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);

    };
});
/**
 * Set a configuration value
 */
angApp.filter('setConfigValue', function () {
    return function (value) {
        if (isNaN(parseInt(value))) {
            return '\'' + value + '\'';
        } else {
            return value;
        }

    };
});

/**
 * Build an array from bits
 */
angApp.filter('getBitArray', function () {
    return function (value, length) {
        value = parseInt(value,10);
        length = length || 32;
        var base2_ = (value).toString(2).split("").reverse().join("");
        var baseL_ = new Array(length - base2_.length).join("0");
        var base2 = base2_ + baseL_;
        return base2.split('').map(Number);
        ;

    };
});

/**
 * Get object length
 */
angApp.filter('getFirstObjectKey', function () {
    return function (obj) {
        if (angular.isObject(obj)) {
            return Object.keys(obj)[0];
        }
        return {};

    };
});

/**
 * Get only unique values
 */
angApp.filter('unique', function () {
    return function (items, filterOn) {

        if (filterOn === false) {
            return items;
        }

        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
            var hashCheck = {}, newItems = [];

            var extractValueToCompare = function (item) {
                if (angular.isObject(item) && angular.isString(filterOn)) {
                    return item[filterOn];
                } else {
                    return item;
                }
            };

            angular.forEach(items, function (item) {
                var valueToCheck, isDuplicate = false;

                for (var i = 0; i < newItems.length; i++) {
                    if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    newItems.push(item);
                }

            });
            items = newItems;
        }
        return items;
    };
});
/**
 * Get time from the box and displays it in the hrs:min:sec format
 * @function getCurrentTime
 */
angApp.filter('setTimeFromBox', function () {
    return function (input) {
        if (input.localTimeUT) {
            var d = new Date(input.localTimeUT * 1000);
        } else {
            var d = new Date();
        }
        // Convert to ISO
        // 2016-06-07T11:49:51.000Z
        return d.toISOString().substring(11, d.toISOString().indexOf('.'));
    };
});
/**
 * Convert unix timastamp to date
 */
angApp.filter('getTimestamp', function () {
    return Math.round(+new Date() / 1000);
});

/**
 * Calculates difference between two dates in days
 */
angApp.filter('days_between', function () {
    return function (date1, date2) {
        return Math.round(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
    };
});

/**
 * Return string with date in smart format: "hh:mm:ss" if current day, "hh:mm dd" if this week, "hh:mm dd mmmm" if this year, else "hh:mm dd mmmm yyyy"
 */
angApp.filter('getTime', function ($filter) {
    return function (timestamp, invalidReturn) {
        var d = new Date(parseInt(timestamp, 10) * 1000);
        if (timestamp === 0 || isNaN(d.getTime()))
            return invalidReturn

        var day = d.getDate();
        var mon = d.getMonth() + 1; //Months are zero based
        var year = d.getFullYear();
        var hrs = d.getHours();
        var min = (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
        var sec = (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());

        var cd = new Date();

        var time;
        if ($filter('days_between')(cd, d) < 1 && cd.getDate() == d.getDate()) // this day
            time = hrs + ':' + min + ':' + sec;
        else if ($filter('days_between')(cd, d) < 7 && ((cd < d) ^ (cd.getDay() >= d.getDay()))) // this week
            time = day + '. ' + hrs + ':' + min;
        else if (cd.getFullYear() == d.getFullYear()) // this year
            time = day + '.' + mon + '. ' + hrs + ':' + min;
        else // one upon a time
            time = day + '.' + mon + '.' + year + ' ' + hrs + ':' + min;

        return time;
    };
});


/**
 * Return "red" if the data is outdated or "" if up to date
 */
angApp.filter('getUpdated', function () {
    return function (data) {
        if (data === undefined)
            return '';
        return ((data.updateTime > data.invalidateTime) ? '' : 'red');
    };
});

/**
 * Strip HTML tags
 */
angApp.filter('stripTags', function () {
    return function (input) {
        return String(input).replace(/<[^>]+>/gm, '');
        //return  input.replace(/<\/?[^>]+(>|$)/g, "");
    };
});
/**
 * Display HTML tags in scope
 */
angApp.filter('toTrusted', ['$sce', function ($sce) {

        return function (text) {
            if (text == null) {
                return '';
            }
            return $sce.trustAsHtml(text);
        };
    }]);

/**
 * Display device name
 */
angApp.filter('deviceName', function () {
    return function (deviceId, device) {
        var name = (deviceId == 1 ? 'Z-Way' : 'Device ' + '_' + deviceId);
        if (device === undefined) {
            return name;
        }
        if (device.data.givenName.value != '') {
            name = device.data.givenName.value;
        }
        return name;
    };
});

/**
 * Display device name
 */
angApp.filter('getDeviceName', function () {
    return function (deviceId, data) {
        var name = 'Device ' + deviceId;
        angular.forEach(data, function (v, k) {
            if (v.id == deviceId) {
                name = v.name;
                return;
            }

        });
        return name;
    };
});

angApp.filter('getByProperty', function () {
    return function (propertyName, propertyValue, collection) {
        var i = 0, len = collection.length;
        for (; i < len; i++) {
            if (collection[i][propertyName] == +propertyValue) {
                return collection[i];
            }
        }
        return null;
    };
});
// Convert unix timastamp to date
angApp.filter('dateFromUnix', function () {
    return function (input) {
        var d = new Date(input * 1000);
        var day = d.getDate();
        var mon = d.getMonth() + 1; //Months are zero based
        var year = d.getFullYear();
        var hrs = d.getHours();
        var min = (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
        var sec = (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());
        var time = day + '.' + mon + '.' + year + ' ' + hrs + ':' + min + ':' + sec;
        return time;
    };
});

//Get date time as object
angApp.filter('getDateTimeObj', function () {
    return function (timestamp) {
        var d = (timestamp ? new Date(timestamp * 1000): new Date());
         var obj = {
             day: d.getDate(),
             mon: d.getMonth() + 1,
             year: d.getFullYear(),
             hrs: d.getHours(),
             min: (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()),
             sec: (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds()),
             mis: d.getMilliseconds(),
             today: (d.toDateString() === (new Date()).toDateString()? true : false)
             
         };
        //var day = d.getDate();
        //var mon = d.getMonth() + 1; //Months are zero based
        //var year = d.getFullYear();
        //var hrs = d.getHours();
        //var min = (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
        //var sec = (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());
        //var time = day + '.' + mon + '.' + year + ' ' + hrs + ':' + min + ':' + sec;
        return obj;
    };

});

//Get current date time
angApp.filter('getCurrentDate', function () {

    var d = new Date();
    var day = d.getDate();
    var mon = d.getMonth() + 1; //Months are zero based
    var year = d.getFullYear();
    var hrs = d.getHours();
    var min = (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
    var sec = (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());
    var time = day + '.' + mon + '.' + year + ' ' + hrs + ':' + min + ':' + sec;
    return time;

});

//Get current time
angApp.filter('getCurrentTime', function () {
    return function () {
        var d = new Date();
        var hrs = (d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
        var min = (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
        var sec = (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());
        var time = hrs + ':' + min + ':' + sec;
        return time;
    };
});

//Check for today
angApp.filter('isTodayFromUnix', function () {
    return function (input) {
        if (!input || isNaN(input)) {
            return '-';
        }
        var d = new Date(input * 1000);
        var day = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
        var mon = d.getMonth() + 1; //Months are zero based
        mon = (mon < 10 ? '0' + mon : mon);
        var year = d.getFullYear();
        var hrs = (d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
        var min = (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
        var sec = (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds());

        if (d.toDateString() == (new Date()).toDateString()) {
            //return hrs + ':' + min + ':' + sec;
            return hrs + ':' + min;

        } else {
            //return day + '.' + mon + '.' + year + ' ' + hrs + ':' + min + ':' + sec;
            return day + '.' + mon + '.' + year;
        }
    };
});

//Get mysql datetime from now
angApp.filter('getMysqlFromNow', function () {
    return function () {
       var date = new Date();
        var year = date.getFullYear();
        var month = (date.getMonth() + 1 < 10) ? "0"+(date.getMonth() + 1) : date.getMonth() + 1;
        var day = (date.getDate() < 10) ? "0"+date.getDate() : date.getDate();
        var h = (date.getHours() < 10) ? "0"+date.getHours() : date.getHours();
        var m = (date.getMinutes() < 10) ? "0"+date.getMinutes() : date.getMinutes();
        var s = (date.getSeconds() < 10) ? "0"+date.getSeconds() : date.getSeconds();
        return year+"-"+month+"-"+day+" "+h+":"+m+":"+s;
    };
});
//Convert decimal to hex
angApp.filter('decToHex', function () {
    return function (decimal,chars,x) {
        var hex = (decimal + Math.pow(16, chars)).toString(16).slice(-chars).toUpperCase();
       return (x||'') + hex;
    };
});


/**
 * Replace Lock state with text
 */
angApp.filter('lockStatus', function () {
    return function (input) {
        var mode = input;
        var mode_lbl;

        if (mode === '' || mode === null) {
            mode_lbl = '?';
        } else {
            switch (mode) {
                case 0x00:
                    mode_lbl = 'Open';
                    break;
                case 0x10:
                    mode_lbl = 'Open from inside';
                    break;
                case 0x20:
                    mode_lbl = 'Open from outside';
                    break;
                case 0xff:
                    mode_lbl = 'Closed';
                    break;
            }
            ;
        }
        ;
        return  mode_lbl;
    };
});

/**
 * Replace Lock state with text
 */
angApp.filter('lockIsOpen', function () {
    return function (input) {
        var mode = input;
        var status = true;

        if (mode === '' || mode === null) {
            status = false;
        } else {
            switch (mode) {
                case 0x00:
                    status = true;
                    break;
                case 0x10:
                    status = true;
                    break;
                case 0x20:
                    status = true;
                    break;
                case 0xff:
                    status = false;
                    break;
            }
            ;
        }
        ;
        return  status;
    };
});

/**
 * Get battery icon
 */
angApp.filter('getBatteryIcon', function () {
    return function (input) {
        var icon = 'fa-battery-full';
        if (isNaN(input)) {
            return icon;
        }
        var level = parseInt(input);
        if (level >= 95) {
            icon = 'fa-battery-full text-success';
        } else if (level >= 70 && level < 95) {
            icon = 'fa-battery-3 text-primary';
        } else if (level > 30 && level <= 50) {
            icon = 'fa-battery-2 text-info';
        } else if (level >= 1 && level <= 30) {
            icon = 'fa-battery-1 text-danger';
        } else {
            icon = 'fa-battery-0 text-danger';
        }
        return icon;
    };
});
/**
 * Get device type icon
 */
angApp.filter('getDeviceTypeIcon', function () {
    return function (input) {
        var icon;
        switch(input){
            case 'static':
                icon = 'fa-cog';
                break;
            case 'flirs':
                icon = 'fa-fire text-info';
                break;
            case 'mains':
                icon = 'fa-bolt text-warning';
                break;
            case 'sleep':
                icon = 'fa-battery-full text-danger';
                break;
            case 'battery':
                icon = 'fa-battery-full text-success';
                break;
            case 'portable':
                icon = 'fa-feed text-primary';
                break;
            default:
                icon = '';
                break;
        }
        return icon;
    };
});

/**
 * todo: deprecated
 * Get battery image
 */
angApp.filter('getBatteryImg', function () {
    return function (input) {
        var img = 'battery.png';
        if (isNaN(input)) {
            return img;
        }
        var level = parseInt(input);
        if (level > 95) {
            img = 'battery-100.png';
        } else if (level >= 70 && level <= 95) {
            img = 'battery-80.png';
        } else if (level >= 50 && level < 70) {
            img = 'battery-50.png';
        } else if (level > 20 && level < 50) {
            img = 'battery-30.png';
        } else if (level >= 5 && level <= 20) {
            img = 'battery-20.png';
        } else {
            img = 'battery-0.png';
        }
        return img;
    };
});

/**
 * Returns <code>true</code> if an association (in Association or Multichannel Association
 class) form fromNode is set to toNodeId, <code>false</code> elsewise.
 * @param fromNode node to check if an association is set to toNodeId.
 * @param toNodeId node to check if an association from fromNode exists.
 */
angApp.filter('associationExists', function () {
    return function (fromNode, toNodeId) {
        var exists = false;
        $.each(fromNode.instances, function (index, instance) {
            if (!("commandClasses" in instance)) {
                return;
            }

            if (0x85 in instance.commandClasses) {
                for (var group = 0; group < instance.commandClasses[0x85].data.groups.value; group++) {
                    var associations = instance.commandClasses[0x85].data[group + 1].nodes.value;
                    if ($.inArray(parseInt(toNodeId), associations) != -1) {
                        exists = true;
                        return false;
                    }
                }
            }
            if (0x8e in instance.commandClasses) {
                for (var group = 0; group < instance.commandClasses[0x8e].data.groups.value; group++) {
                    var associations = instance.commandClasses[0x8e].data[group + 1].nodesInstances.value;
                    for (var i = 0; i < associations.length; i += 2) {
                        if (parseInt(toNodeId) == associations[i]) {
                            exists = true;
                            return false;
                        }
                    }
                }
            }
        });
        return exists;
    };
});

/**
 * Filter nodes which are updateable concerning routes.
 * @param batteryOnly if undefined includes all devices, if true includes only battery devices, if false includes only non-battery devices
 */
angApp.filter('updateable', function () {
    return function (node, nodeId, batteryOnly) {
        var nodeIsVirtual = node.data.isVirtual;
        var nodeBasicType = node.data.basicType;
        if (nodeId == 255 || nodeIsVirtual == null || nodeIsVirtual.value == true || nodeBasicType == null || nodeBasicType.value == 1) {
            return false;
        }
        if (batteryOnly != undefined) {
            var hasBattery = 0x80 in node.instances[0].commandClasses;
            return batteryOnly == hasBattery;
        }
        return true;
    };
});

/**
 * Count Routes
 */
angApp.filter('getRoutesCount', function ($filter) {
    return function (ZWaveAPIData, nodeId) {
        var in_array = function (v, arr, return_index) {
            for (var i = 0; i < arr.length; i++)
                if (arr[i] == v)
                    return return_index ? i : true;
            return false;
        };
        var getFarNeighbours = function (nodeId, exludeNodeIds, hops) {
            if (hops === undefined) {
                var hops = 0;
                var exludeNodeIds = [nodeId];
            }
            ;

            if (hops > 2) // Z-Wave allows only 4 routers, but we are interested in only 2, since network becomes unstable if more that 2 routers are used in communications
                return [];

            var nodesList = [];
            angular.forEach(ZWaveAPIData.devices[nodeId].data.neighbours.value, function (nnodeId, index) {
                if (!(nnodeId in ZWaveAPIData.devices))
                    return; // skip deviced reported in routing table but absent in reality. This may happen after restore of routing table.
                if (!in_array(nnodeId, exludeNodeIds)) {
                    nodesList.push({nodeId: nnodeId, hops: hops});
                    if (ZWaveAPIData.devices[nnodeId].data.isListening.value && ZWaveAPIData.devices[nnodeId].data.isRouting.value)
                        $.merge(nodesList, getFarNeighbours(nnodeId, $.merge([nnodeId], exludeNodeIds) /* this will not alter exludeNodeIds */, hops + 1));
                }
            });
            return nodesList;
        };

        var routesCount = {};
        angular.forEach(getFarNeighbours(nodeId), function (nnode, index) {
            if (nnode.nodeId in routesCount) {
                if (nnode.hops in routesCount[nnode.nodeId])
                    routesCount[nnode.nodeId][nnode.hops]++;
                else
                    routesCount[nnode.nodeId][nnode.hops] = 1;
            } else {
                routesCount[nnode.nodeId] = new Array();
                routesCount[nnode.nodeId][nnode.hops] = 1;
            }
        });
        return routesCount;
    };
});

/*
 * Set security icon
 */
angApp.filter('securityIcon', function () {
    return function (input) {
        var icon = 'fa fa-unlock-alt fa-lg text-danger';
        if (input) {
            icon = 'fa fa-lock fa-lg text-success';
        }
        return  icon;
    };
});

/*
 * Set mwief icon
 */
angApp.filter('mwiefIcon', function () {
    return function (input) {
        //var icon = 'fa fa-minus';
        var icon = '&nbsp';
//        if(input === false){
//            icon = 'fa fa-check fa-lg text-danger';
//        }
        if (input) {
            icon = 'fa fa-check fa-lg text-success';
        }
        return  icon;
    };
});

/*
 * Set mwief icon
 */
angApp.filter('checkedIcon', function () {
    return function (input) {
        //var icon = 'fa fa-minus';
        var icon = '&nbsp';
//        if(input === false){
//            icon = 'fa fa-check fa-lg text-danger';
//        }
        if (input) {
            icon = 'fa fa-check fa-lg text-success';
        } else {
            icon = 'fa fa-ban fa-lg text-danger';
        }
        return  icon;
    };
});

/**
 * Set zWavePlus icon
 */
angApp.filter('zWavePlusIcon', function () {
    return function (input) {
        //var icon = 'fa fa-minus';
        var icon = '&nbsp';
        if (input === true) {
            icon = 'fa fa-plus fa-lg text-success';
        }
        return  icon;
    };
});
