 var arrayBufferToInt = function (ab) {
    var a = new Int16Array(ab);
    return a[0];
};

function timeValue2Str(timeValue) {
   var tDate = new Date();
   tDate.setTime(timeValue);
   var str = tDate.getFullYear();
   if (tDate.getMonth() < 9)
	str += "-0" + (tDate.getMonth() + 1);
   else
        str += "-" + (tDate.getMonth() + 1);
   if (tDate.getDate() < 10)
        str += "-0" + tDate.getDate();
   else
        str += "-" + tDate.getDate();
   return str;
}

var sendToServerBtnClicked = false;

var serveurAddr = "http://37.187.119.211:8042";
//var serveurAddr = "http://37.187.4.166";

var app = {
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
        
        // PageMenuPrincipal
        $(".closeToPageMenuPrincipal").touchend(app.returnToPageMenuPrincipal);
        $("#nouvelleMesureBtn").touchend(app.showPageScanDevice);
        $("#mesMesuresBtn").touchend(app.showPageMesMesures);
        $("#toutesLesMesuresBtn").touchend(app.showPageToutesLesMesures);
        $("#optionsBtn").touchend(app.showPageOptions);
        
        // PageMesMesures
        $("#closeToPageMesMesures").touchend(app.returnToPageMesMesures);
        $("#visualiserMesMesuresBtn").touchend(app.showPageVisualisationMesMesures);
        $("#effacerMesMesuresBtn").touchend(app.deleteSelectedMeasures);
        
        // PageOptions
        
        // PageScanDevice
        $("#closeToScan").touchend(app.disconnect);
        $("#refreshButton").touchend(app.refreshDevices);
        $("#deviceList").touchend(app.connect);
        
        // PageChoixTypeMesure
        $(".closeToPageChoixTypeMesure").touchend(app.returnToPageChoixTypeMesure);
        $("#envButton").touchend(app.showMeasurePage);
        $("#dosiButton").touchend(app.showMeasurePage);
        $("#testTubeButton").touchend(app.showPageTestTube);
        
        // PageMesureEnvironement
        $("#closeToPageMesure").touchend(app.returnToMeasurePage);
        $("#SBM20Btn").touchend(app.setSBM20);
        $("#resetBtn").touchend(app.resetCount);
        $("#sendToServerBtn").touchend(app.onSendToServer);
        $("#pwmSlider").change(app.onSendPWM);
        
        // PageTestTube
        $("#startStopTestTubeBtn").touchend(app.startStopTestTube);
    },
    
    refreshDevices: function() {
        $("#deviceList").html('');
        rfduino.discover(5, app.onDiscoverDevice, app.onRfError);
    },
    
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li');
        var html =  '<a><b>' + device.name + '</b><br/>' +
                    'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                    'Advertising: ' + device.advertising + '<br/>' +
                    device.uuid+'</a>';

        listItem.setAttribute('uuid', device.uuid);
        listItem.setAttribute('deviceName', device.name);
        listItem.setAttribute('tube', device.advertising);
        listItem.innerHTML = html;
        $("#deviceList").append(listItem);
    },
    
    computeEcartType: function() {
        var moyenne = 0;
        for (var i=0 ; i<app.mesures.length ; i++) {
            moyenne += app.mesures[i];
        }
        moyenne /= app.mesures.length;
        
        var sumEcarts = 0;
        for (var j=0 ; j<app.mesures.length ; j++) {
            sumEcarts += Math.pow(moyenne - app.mesures[j], 2);
        }
        sumEcarts = Math.sqrt(sumEcarts / app.mesures.length);
        
        $("#timeDisplay").html("Temps : "+app.mesures.length+" s");
        $("#moyDisplay").html("Moyenne : "+Number(moyenne).toFixed(4)+" &plusmn; "+Number(sumEcarts).toFixed(4)+" cp");
    },
    
    drawHistogramme: function() {
        if (!app.histo) {
            document.getElementById("histoCanvas").width = $(window).width()*2/3;
            document.getElementById("histoCanvas").height = $(window).width()/2;
            app.histo = document.getElementById("histoCanvas").getContext("2d");
        }
        
        var histo_interval = parseInt($("#intervalSliderRange").val(), 10);
        var time_interval = parseInt($("#intervalTimeSliderRange").val(), 10);
        
        if (app.mesures.length===0)
            return;
        
        var v;
        var cnt = {};
        var max = 0;
        var maxH = 1;
        var min = Math.floor(app.mesures[app.mesures.length-1]/histo_interval);
        for (var i=0 ; i<app.mesures.length ; i+=time_interval) {
            v = 0;
            for (var j=0 ; j<time_interval ; j++) {
                if (i+j >= app.mesures.length) break;
                v += app.mesures[i+j];
            }
            v = Math.floor(v/histo_interval);
            if (min>v) min = v;
            if (max<v) max = v;
            if (!cnt[v]) cnt[v] = 1;
            else cnt[v]++;
            if (maxH<cnt[v]) maxH = cnt[v];
        }
        
        var width = $("#histoCanvas").width()-40;
        var height = $("#histoCanvas").height()-40;
        var barWidth = width / (max-min+1);
        var stepHeight = height / maxH;
        
        app.histo.fillStyle="#fff";
        app.histo.fillRect(0, 0, $("#histoCanvas").width(), $("#histoCanvas").height());
        
        app.histo.fillStyle="#00f";
        var x;
        for (x=0 ; x<=width ; x+=barWidth) {
            v = cnt[Math.floor(x/barWidth+min)];
            if (v) {
                var h = v*stepHeight;
                app.histo.fillRect(x+20, 20+height-h, barWidth-2, h);
            }
        }
        
        app.histo.strokeStyle = "#000";
        app.histo.fillStyle = "#000";
        app.histo.font = "bold 8px Arial";
        app.histo.lineWidth = 2;
        
        app.histo.beginPath();
        app.histo.moveTo(20,0);
        app.histo.lineTo(20, height+20);
        app.histo.lineTo(width+20, height+20);
        app.histo.stroke();
        
        app.histo.fillText("P(N)", 0, 10);
        app.histo.fillText("N", width+30, height+30);
        
        app.histo.beginPath();
        var t = min;
        for (x=0 ; x<=width ; x+=barWidth) {
            app.histo.moveTo(20+x, height+15);
            app.histo.lineTo(20+x, height+25);
            app.histo.fillText(Number(t/time_interval).toFixed(1), 15+x, height+35);
            t += histo_interval;
            v = cnt[Math.floor(x/barWidth+min)];
            if (v) app.histo.fillText(v, 15+x+(barWidth/2), height);
            else app.histo.fillText(0, 15+x+(barWidth/2), height);
        }
        app.histo.stroke();
        app.computeEcartType();
    },
    
    drawTestTubePlot: function() {
        if (!app.testTubeCtx) {
            document.getElementById("testTubeCanvas").width = $(window).width()*2/3;
            document.getElementById("testTubeCanvas").height = $(window).width()/2;
            app.testTubeCtx = document.getElementById("testTubeCanvas").getContext("2d");
        }
        
        app.testTubeCtx.fillStyle="#fff";
        app.testTubeCtx.fillRect(0, 0, $("#testTubeCanvas").width(), $("#testTubeCanvas").height());
        
        var width = $("#testTubeCanvas").width()-40;
        var height = $("#testTubeCanvas").height()-40;
        
        app.testTubeCtx.strokeStyle = "#000";
        app.testTubeCtx.fillStyle = "#000";
        app.testTubeCtx.font = "bold 8px Arial";
        app.testTubeCtx.lineWidth = 2;
        
        app.testTubeCtx.beginPath();
        app.testTubeCtx.moveTo(20,0);
        app.testTubeCtx.lineTo(20, height+20);
        app.testTubeCtx.lineTo(width+20, height+20);
        app.testTubeCtx.stroke();
        
        app.testTubeCtx.beginPath();
        var t = 200;
        var xStep = width / (600 / 50);
        var x;
        for (x=0 ; x<=width ; x+=xStep) {
            app.testTubeCtx.moveTo(20+x, height+15);
            app.testTubeCtx.lineTo(20+x, height+25);
            app.testTubeCtx.fillText(t, 15+x, height+35);
            t += 50;
        }
        app.testTubeCtx.stroke();
        
        app.testTubeCtx.fillText("N", 0, 10);
        app.testTubeCtx.fillText("V", width+30, height+30);
        
        var sums = [];
        var maxH = 1;
        for (var i=0 ; i<app.mesures.length ; i+=60) {
            var sum = 0;
            for (var j=0 ; j<60 ; j++) {
                if ((i+j)>=app.mesures.length) break;
                sum += app.mesures[i+j];
            }
            if (sum>maxH) maxH = sum;
            sums.push(sum);
        }
        
        var prevV = sums[0];
        x = 20;
        app.testTubeCtx.strokeStyle = "#00f";
        app.testTubeCtx.beginPath();
        for (i=1 ; i<sums.length ; i++) {
            var v = sums[i];
            app.testTubeCtx.moveTo(x, height - (prevV*height/maxH));
            x += width / (600 / 25);
            app.testTubeCtx.lineTo(x, height - (v*height/maxH));
            prevV = v;
        }
        app.testTubeCtx.stroke();
    },
    
    onSendPWM: function(event) {
        rfduino.write(""+$("#pwmSliderRange").val(), app.onSuccess, app.onRfError);
    },
    
    resetCount: function(event) {
        app.count = 0;
        app.mesures = [];
        $("#valueDisplay").html(app.count+" cp");
    },
    
    initDistantMap: function() {
        setTimeout(function() {
            var onGPSSuccess = function(position) {
                var openradiation_map = L.map('openradiation_map').setView([position.coords.latitude, position.coords.longitude], 16);
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(openradiation_map);
                var markers = L.layerGroup().addTo(openradiation_map);
                openradiation_map.invalidateSize();
                
                var getMarkers = function(event) {
                    var bounds = openradiation_map.getBounds();
                    var data_url = serveurAddr+'/mesures/' + bounds._southWest.lat + '/' + bounds._southWest.lng + '/' + bounds._northEast.lat + '/' + bounds._northEast.lng;
                
                    $.ajax({
                        type: 'GET',
                        url: data_url,
                        cache: false,
                        timeout: 5000,
                        success: function(data) {
                            markers.clearLayers();
                            for (var i in data) {
                                var htmlPopup = "<div>";
                                htmlPopup += "hits number : <strong>" + data[i].nb_coups + "</strong><br>";
                                htmlPopup += timeValue2Str(data[i].timestamp) + "<br><br>";
                                           
                                if (data[i].login != null)
                                    htmlPopup += "by <strong>" + data[i].login + "</strong><br>";
                                if (data[i].img != null)
                                    htmlPopup = htmlPopup + "<div><img class=\"img-rounded\" src=\"" + data[i].img + "\"/></div><br>";       
                                if (data[i].altitude != null)
                                    htmlPopup += "altitude : " + data[i].altitude + " m<br>";
                                if (data[i].deltaT != null)
                                    htmlPopup += "Δt : " + data[i].deltaT + " s<br>";
                                if (data[i].model != null)
                                    htmlPopup += "model : " + data[i].model + "<br>";
                                htmlPopup += "</div>";
                                
                                var marker = L.marker([data[i].latitude, data[i].longitude]);
                                marker.addTo(markers);
                                marker.bindPopup(htmlPopup);
                            }
                        },
                        error: function() {
                            alert('Error during retrieving data'); 
                        }
                    });
                };
                
                openradiation_map.on('moveend', getMarkers);
                getMarkers();
            };
    
            var onGPSError = function(error) {
                alert("GPSError");
            };
        
            navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
        }, 1);
    },
    
    loadMesMesures: function() {
        app.db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM mesures", [], function(tx, res) {
                $("#mesMesuresListe").html('');
        
                for (var i=0 ; i<res.rows.length ; i++) {
                    var listItem = document.createElement('li');
                    
                    var html = '<a href="#" style="padding-top: 0px;padding-bottom: 0px;padding-right: 0px;padding-left: 0px;" >';
                    html += '<label style="border-top-width: 0px;margin-top: 0px;border-bottom-width: 0px;margin-bottom: 0px;border-left-width: 0px;border-right-width: 0px;" data-corners="false" >';
                    html += '<fieldset data-role="controlgroup" ><input type="checkbox" name="checkbox-2b" id="checkbox-2b" data-theme="c"/>';
                    html += '<label for="checkbox-2b" style="border-top-width: 0px;margin-top: 0px;border-bottom-width: 0px;margin-bottom: 0px;border-left-width: 0px;border-right-width: 0px;"><label  style="padding:10px 0px 0px 10px;">';
                    html += '<h3>'+res.rows.item(i).moy+' &plusmn; '+res.rows.item(i).ecart+' cps</h3><p>Mesure prise le ' + timeValue2Str(res.rows.item(i).time) + '</p>';
                    html += '</label></label></fieldset></label></a>';
            
                    listItem.setAttribute('id', i);
                    listItem.innerHTML = html;
                    $("#mesMesuresListe").append(listItem);
                }
                
                $("#mesMesuresListe").trigger("create");
                $("#mesMesuresListe").listview('refresh');
            });
        });
    },
    
    initLocalMap: function() {
        setTimeout(function() {
            var onGPSSuccess = function(position) {
                var openradiation_map = L.map('openradiation_map_perso').setView([position.coords.latitude, position.coords.longitude], 16);
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(openradiation_map);
                var markers = L.layerGroup().addTo(openradiation_map);
                openradiation_map.invalidateSize();
                
                // TODO : load markers
            };
    
            var onGPSError = function(error) {
                alert("GPSError");
            };
        
            navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
        }, 1);
    },
    
    deleteSelectedMeasures: function() {
        alert("Delete");
    },
    
    onSendToServer: function(event) {
        if (!sendToServerBtnClicked) {
            sendToServerBtnClicked = true;
            $("#sendToServerBtn").addClass('ui-disabled');
            
            var onGPSSuccess = function(position) {
                app.xmlHttp.onreadystatechange = function() {
                    if (app.xmlHttp.readyState === 4 && (app.xmlHttp.status === 200 || app.xmlHttp.status === 0)) {
                        if (app.xmlHttp.responseText === "ok") {
                            alert("Votre mesure a bien étée envoyée.");
                        } else {
                            alert(app.xmlHttp.responseText);
                        }
                        $("#sendToServerBtn").removeClass('ui-disabled');
                        sendToServerBtnClicked = false;
                    }
                };
                
                app.xmlHttp.ontimeout = setTimeout(function (e) {
                    //alert("Timed out!!!");
                    $("#sendToServerBtn").removeClass('ui-disabled');
                    sendToServerBtnClicked = false;
                }, 10000);
                
                app.xmlHttp.open('PUT', serveurAddr+"/add", true);  // true : asynchrone false: synchrone
                app.xmlHttp.setRequestHeader('Content-Type', "application/json");
                app.xmlHttp.send(JSON.stringify({
                    nb_coups: app.count,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    timestamp: position.timestamp})
                );
            };
    
            var onGPSError = function(error) {
                alert("GPSError");
            };
        
            navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
        }
    },
    
    setSBM20: function (event) {
        $("#pwmSliderRange").val(380);
        $("#pwmSliderRange").slider('refresh');
        rfduino.write(""+$("#pwmSliderRange").val(), app.onSuccess, app.onRfError);
    },
    
    connect: function(e) {
        var target = e.target;
        var uuid = e.target.getAttribute('uuid');
        if (uuid==null)
            uuid = e.target.parentNode.getAttribute('uuid');
        var onConnect = function() {
            app.deviceName = target.getAttribute("deviceName");
            app.deviceUUID = uuid;
            app.tubeType = target.getAttribute("tube");
            rfduino.onData(app.onData, app.onRfError);
            app.showPageChoixTypeMesure();
            app.count = 0;
        };

        rfduino.connect(uuid, onConnect, app.onRfError);
    },
    
    onData: function(data) {
        // DEBUG : affiche la trame "brute"
        var b = new Int8Array(data);
        var str = "";
        for (var i=0 ; i<b.length ; i++) {
            str += b[i].toString(16)+" ";
        }
        
        var buffer = new Int16Array(data);
        
        
        var pwm_duty_cycle = buffer[0];
        var tension = buffer[1];
        var count = buffer[2];
        var haute_tension = buffer[3];
        
    //  $(".infoDevice").html("Connecté à "+app.deviceName+" ("+app.deviceUUID+")<br/>Tube : "+app.tubeType+"<br/>Tension : "+(tension/100.0)+" V");
    //CS 10/11/2014
    
        
        $(".infoDevice").html("Connecté à "+app.deviceName+" ("+app.deviceUUID+")<br/>Tube : "+app.tubeType+"<br/>Tension : "+(tension/100.0)+" V"+"<br/>DutyCycle : "+(100*pwm_duty_cycle/255).toFixed(2)+" %"+"<br/>HT : "+(haute_tension)+" V");
    //    $(".infoDevice").html("Trame : "+ str); // DEBUG
        
        app.count += count;
        app.mesures.push(count);
        
        if (app.testTubeStarted) {
            app.drawTestTubePlot();
            if ((app.mesures.length % 60) === 0) {
                app.testTubeTension += 25;
            }
            if (app.testTubeTension >= 600) { // Fin du test
                $("#startStopTestTubeBtn").html("<span class=\"ui-btn-inner ui-btn-corner-all\"><span class=\"ui-btn-text\">Start</span></span>");
                app.testTubeStarted = false;
                app.testTubeTension = 0;
            }
            rfduino.write(""+app.testTubeTension, app.onSuccess, app.onRfError);
        } else {
            app.drawHistogramme();
            $("#valueDisplay").html(app.count+" cp");
        }
    },
    
    disconnect: function() {
        rfduino.disconnect(app.returnToPageScanDevice, app.onRfError);
    },
    
    startStopTestTube: function() {
        if ($("#startStopTestTubeBtn").html()==="<span class=\"ui-btn-inner ui-btn-corner-all\"><span class=\"ui-btn-text\">Start</span></span>") {
            $("#startStopTestTubeBtn").html("<span class=\"ui-btn-inner ui-btn-corner-all\"><span class=\"ui-btn-text\">Stop</span></span>");
            app.testTubeStarted = true;
            app.count = 0;
            app.mesures = [];
            app.testTubeTension = 200;
            rfduino.write(""+app.testTubeTension, app.onSuccess, app.onRfError);
        } else {
            $("#startStopTestTubeBtn").html("<span class=\"ui-btn-inner ui-btn-corner-all\"><span class=\"ui-btn-text\">Start</span></span>");
            app.testTubeStarted = false;
            app.testTubeTension = 0;
            rfduino.write(""+app.testTubeTension, app.onSuccess, app.onRfError);
        }
        app.drawTestTubePlot();
    },
    
    onDeviceReady: function() {
        app.refreshDevices();
        
        var onGPSSuccess = function(position) { };
        var onGPSError = function(error) { };
        
        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);

        app.xmlHttp = new XMLHttpRequest();

        // https://github.com/brodysoft/Cordova-SQLitePlugin
        app.db = window.sqlitePlugin.openDatabase({name: "opengeiger"});
        
        app.db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS mesures');
            tx.executeSql('CREATE TABLE IF NOT EXISTS mesures (id integer primary key, latitude real, longitude real, altitude real, moy real, ecart real, dt integer, time integer)');

            tx.executeSql("INSERT INTO mesures (latitude, longitude, altitude, moy, ecart, dt, time) VALUES (?,?,?, ?,?,?, ?)", [42.001, 42.000, 42.000, 10.0, 5.0, 100, 1404219369006], function(tx, res) {}, function(e) {
                alert("ERROR: " + e.message);
            });
            
            tx.executeSql("INSERT INTO mesures (latitude, longitude, altitude, moy, ecart, dt, time) VALUES (?,?,?, ?,?,?, ?)", [42.000, 42.001, 42.000, 10.0, 5.0, 100, 1404219369006], function(tx, res) {}, function(e) {
                alert("ERROR: " + e.message);
            });
            
            tx.executeSql("INSERT INTO mesures (latitude, longitude, altitude, moy, ecart, dt, time) VALUES (?,?,?, ?,?,?, ?)", [42.000, 42.000, 42.001, 10.0, 5.0, 100, 1404219369006], function(tx, res) {}, function(e) {
                alert("ERROR: " + e.message);
            });
            
            tx.executeSql("INSERT INTO mesures (latitude, longitude, altitude, moy, ecart, dt, time) VALUES (?,?,?, ?,?,?, ?)", [42.000, 42.010, 42.000, 10.0, 5.0, 100, 1404219369006], function(tx, res) {}, function(e) {
                alert("ERROR: " + e.message);
            });
            
            /*tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
                //alert("res.rows.length: " + res.rows.length + " -- should be 1");
                //alert("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
            });*/
        });
        
        L.Icon.Default.imagePath = "img/leaflet/";
    },
    
    onSuccess: function(reason) {
        console.log(reason);
    },
    
    onRfError: function(error) {
        if (error.toUpperCase() === "DISCONNECTED") {
            alert("La connexion au compteur est perdue.");
            app.disconnect();
        } else {
            alert(error.toUpperCase());
        }
    },
    
    /////////////////
    // Transitions //
    /////////////////
    
    returnToPageMenuPrincipal: function() {
        $.mobile.changePage("#PageMenuPrincipal", {
            transition: "slide",
            reverse: true
        }, true, true);
    },
    
    showPageScanDevice: function() {
        $.mobile.changePage("#ScanDevice", {
            transition: "slide",
            reverse: false
        }, true, true);
        app.refreshDevices();
    },
    
    returnToPageScanDevice: function() {
        $.mobile.changePage("#ScanDevice", {
            transition: "slide",
            reverse: true
        }, true, true);
        app.refreshDevices();
    },
    
    showPageChoixTypeMesure: function() {
        $.mobile.changePage("#PageChoixTypeMesure", {
            transition: "slide",
            reverse: false
        }, true, true);
    },
    
    returnToPageChoixTypeMesure: function() {
        $.mobile.changePage("#PageChoixTypeMesure", {
            transition: "slide",
            reverse: true
        }, true, true);
    },
    
    showMeasurePage: function() {
        $.mobile.changePage("#Measure", {
            transition: "slide",
            reverse: false
        }, true, true);
        app.resetCount();
        app.drawHistogramme();
    },
    
    returnToMeasurePage: function() {
        $.mobile.changePage("#Measure", {
            transition: "slide",
            reverse: true
        }, true, true);
    },
    
    showPageTestTube: function() {
        $.mobile.changePage("#PageTestTube", {
            transition: "slide",
            reverse: false
        }, true, true);
    },
    
    showPageMesMesures: function() {
        $.mobile.changePage("#PageMesMesures", {
            transition: "slide",
            reverse: false
        }, true, true);
        app.loadMesMesures();
    },
    
    returnToPageMesMesures: function() {
        $.mobile.changePage("#PageMesMesures", {
            transition: "slide",
            reverse: true
        }, true, true);
        app.loadMesMesures();
    },
    
    showPageVisualisationMesMesures: function() {
        $.mobile.changePage("#PageVisualisationMesures", {
            transition: "slide",
            reverse: false
        }, true, true);
        
        app.initLocalMap();
    },
    
    showPageToutesLesMesures: function() {
        $.mobile.changePage("#PageToutesLesMesures", {
            transition: "slide",
            reverse: false
        }, true, true);
        
        app.initDistantMap();
    },
    
    showPageOptions: function() {
        $.mobile.changePage("#PageOptions", {
            transition: "slide",
            reverse: false
        }, true, true);
    }
};
