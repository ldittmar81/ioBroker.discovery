var tools = require(__dirname + '/../tools.js');

function detect(comName, device, options, callback) {
    // options.newInstances
    // options.existingInstances
    // device - additional info about device
    // options.log - logger
    // options.enums - {
    //      enum.rooms: {
    //          enum.rooms.ROOM1: {
    //              common: name
    //          }
    //      },
    //      enum.functions: {}
    // }
    var baudRates = [
        110,
        150,
        300,
        600,
        1200,
        2400,
        4800,
        9600,
        19200,
        38400,
        57600,
        115200];

    tools.testSerialPort(comName, {log: options.log}, baudRates, function onOpen(port, _callback) {
        try {
            options.log.warn('0;0;3;0;6;get version\n');
            port.write('0;0;3;0;6;get version\n');
            port.drain();
        } catch (e) {
            options.log.warn('Cannot write to port: ' + e);
            return _callback(e);
        }
        _callback();
    }, function onAnswer(port, data, _callback) {
        options.log.warn('Received: ' + data);
        // expected 20;99;"mysensors Gateway software version";
        var text = data ? data.toString() : '';
        _callback(null, data.indexOf('0;255;3;0;2;') !== -1, true); // todo return here version of FW
    }, function (err, found, name, baudRate, version) {
        if (found) {
            var instance = tools.findInstance(options, 'mysensors', function (obj) {
                return obj.native.comName === name;
            });
            if (!instance) {
                instance = {
                    _id: tools.getNextInstanceID('mysensors', options),
                    common: {
                        name: 'mysensors',
                        title: 'mysensors (' + comName + (device._name && device._name !== comName ? (' - ' + device._name) : '') + ')'
                    },
                    native: {
                        comName:  name,
                        baudRate: baudRate,
                        type: 'serial'
                    },
                    comment: {
                        add: ['mysensors USB ' + (version ? version + ' ' + tools.translate(options.language, 'on %s', comName) : ' - ' + comName)]
                    }
                };
                options.newInstances.push(instance);
                callback(null, true, comName);
            } else {
                callback(null, false, comName);
            }
        } else {
            callback(null, false, comName);
        }

    });
}

exports.detect = detect;
exports.type = ['serial'];// make type=serial for USB sticks