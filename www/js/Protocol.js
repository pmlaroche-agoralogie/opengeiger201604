var scannedDevices = {};

var elapsedTimeSinceCommandsSend = 0;
var lastTrustRef = -1;
var lastYawRef = 0;
var lastPitchRef = 0;
var lastRollRef = 0;

function onData(data) {
    var offset = 0;
    var buff = new Uint8Array(data);
    var dataView = new DataView(data);
    
    while (offset < buff.length) {
        var logMsg = "> ";
        var hex = [];
        
        var type = dataView.getUint8(offset);
        hex.push((buff[offset]>>>4).toString(16)+(buff[offset]&0xF).toString(16));
        offset++;
        
        switch (type) {
            case 0x01: // Yaw
                compass.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x02: // Pitch
                horizon.pitch = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x03: // Roll
                horizon.roll = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x04: // Trust
                powerGauge.value = Math.round(dataView.getFloat32(offset, true));
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x05: // M1
                m1Gauge.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x06: // M2
                m2Gauge.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x07: // M3
                m3Gauge.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x08: // M4
                m4Gauge.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x09: // Battery Voltage
                batteryVoltageValue = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x0A: // Temperature
                temperatureValue = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x0B: // Altitude
                altitudeValue = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0x0C: // Mode
                modeMenu.setMode(dataView.getUint8(offset));
                hex.push((buff[offset]>>>4).toString(16)+(buff[offset]&0xF).toString(16));
                offset++;
                break;
            
            /*******************/
            /* Paquets mémoire */
            /*******************/
            
            case 0xFF: // Yaw kP
                kPYawSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xFE: // Yaw kI
                kIYawSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xFD: // Yaw kD
                kDYawSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xFC: // Pitch kP
                kPPitchSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xFB: // Pitch kI
                kIPitchSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xFA: // Pitch kD
                kDPitchSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xF9: // Roll kP
                kPRollSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xF8: // Roll kI
                kIRollSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xF7: // Roll kD
                kDRollSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xF6: // Trust kP
                kPTrustSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xF5: // Trust kI
                kITrustSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            case 0xF4: // Trust kD
                kDTrustSlider.value = dataView.getFloat32(offset, true);
                for (var i=offset ; i<offset+4 ; i++) {
                    hex.push((buff[i]>>>4).toString(16)+(buff[i]&0xF).toString(16));
                }
                offset += 4;
                break;
            default: break;
        }
        
        // Log data
        logMsg += hex.join(" ").toUpperCase();
        logger.log(logMsg);
    }
}

function onDeviceDiscovered(device) {
    // TODO: handle multiple devices
    if (!scannedDevices[device.uuid]) {
        var deviceBtn = new DeviceButton(512, 300, device.name, device.advertisement, device.rssi, device.uuid, function() {
            BlueJS.connect(device.uuid, function() {
                connected = true;
                pageMenu.page = 0;
                lastTrustRef = -1;
                trustYaw.yValue = -100;
            }, function(error) {
                connected = false;
                BlueJS.startScan(onDeviceDiscovered, function(error){});
            });
        });
        device.widget = deviceBtn;
        devices.push(deviceBtn);
        scannedDevices[device.uuid] = device;
    } else {
        scannedDevices[device.uuid].widget.updateRssi(device.rssi);
    }
}

function initProtocol() {
    BlueJS.listenToData(onData, function(error){});
    BlueJS.startScan(onDeviceDiscovered, function(error){});
}

function getFloat32Packet(type, value) {
    var packet = new ArrayBuffer(5);
    var dataView = new DataView(packet);
    dataView.setInt8(0, type);
    dataView.setFloat32(1, value, true);
    return packet;
}

function getInt8Packet(type, value) {
    var packet = new ArrayBuffer(2);
    var dataView = new DataView(packet);
    dataView.setInt8(0, type);
    dataView.setInt8(1, value);
    return packet;
}

function getCommandPacket(type) {
    var packet = new ArrayBuffer(1);
    var dataView = new DataView(packet);
    dataView.setInt8(0, type);
    return packet;
}

function sendCommands(dt) {
    if (connected) {
        elapsedTimeSinceCommandsSend += dt;
        if (elapsedTimeSinceCommandsSend > 0.1) {
            
            var yawRef = Math.round(trustYaw.xValue);
            if (yawRef !== lastYawRef) { // YawRef
                BlueJS.write(getFloat32Packet(0x01, yawRef), function(){}, function(error){});
                lastYawRef = yawRef;
            }
            
            var pitchRef = (Math.round(pitchRoll.yValue) / 70.0) * 20.0 * Math.PI / 180.0;
            if (pitchRef !== lastPitchRef) { // PitchRef
                BlueJS.write(getFloat32Packet(0x02, pitchRef), function(){}, function(error){});
                lastPitchRef = pitchRef;
            }
            
            var rollRef = (Math.round(pitchRoll.xValue) / 70.0) * 20.0 * Math.PI / 180.0;
            if (rollRef !== lastRollRef) { // RollRef
                BlueJS.write(getFloat32Packet(0x03, rollRef), function(){}, function(error){});
                lastRollRef = rollRef;
            }
            
            var trustRef = (Math.round(trustYaw.yValue) + 100.0) / 2.0;
            if (trustRef !== lastTrustRef) { // TrustRef
                BlueJS.write(getFloat32Packet(0x04, trustRef), function(){}, function(error){});
                lastTrustRef = trustRef;
            }
            
            BlueJS.readRSSI(function(rssi) {
                if (rssi > -75) rssi = -75;
                if (rssi < -103) rssi = -103;
                rssi += 103;
                if (!rssiGauge.samples) {
                    rssiGauge.ratio = rssi / (103-75);
                    rssiGauge.samples = 20;
                    rssiGauge.value = Math.round(rssiGauge.ratio * 100);
                } else {
                    var ratio = rssi / (103-75);
                    rssiGauge.ratio = (ratio * 1.0/rssiGauge.samples) + (rssiGauge.ratio * (rssiGauge.samples - 1.0)/rssiGauge.samples);
                    rssiGauge.value = Math.round(rssiGauge.ratio * 100);
                }
            }, function(error){});
            
            elapsedTimeSinceCommandsSend = 0;
        }
    }
}