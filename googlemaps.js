/*****************************  Variables declaration  ****************************************/

//Map object
var map;

//To translate String adresse in Google Format adress with position (ex : 61.1648, 4.58058)
var geocoder = new google.maps.Geocoder();

//Services to create itineraries
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();

// New errand containers array
var errandContainers = [];

// Markers object   
var markers ={};

// All containers array
var containers = [];

//All couriers array
var couriers = [];

//Errand optimized or not
var isOptimized = false;

// Save the total distance of no optimized errand to calculate the difference with the optimised one
var totalDistanceNoOptimized;

// Save the total distance of no optimized errand to calculate the difference with the optimised one
var totalDurationNoOptimized;


var pickerdate;
var pickertime;

var errandResult;

var optimizedErrandContainers = [];
var waypoint_order=[];

var wayppointsContainers = [];

var spinnerTarget;
var overlay = $('.overlay');
var spinnerOptions = {
  lines: 13 // The number of lines to draw
, length: 30 // The length of each line
, width: 6 // The line thickness
, radius: 20 // The radius of the inner circle
, scale: 1.5 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#000' // #rgb or #rrggbb or array of colors
, opacity: 0.25 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1.6 // Rounds per second
, trail: 49 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '51%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: 'absolute' // Element positioning
};
/******************************  End of variables declaration  ******************************/

///////////////////////////////////////////////////////////////////////////////////////////////////////

/******************************  Mock datas  ******************************/

/*
 Containers' mock datas
 */
/*
 containers = [{
 'idContainer': 1234,
 'name' : 'container 1',
 'address': 'Palais Royal Paris',
 'lat' : 48.858859,
 'lng' : 2.347000,
 'state': 1,
 'lastCollect' : '2015-06-30 10:30:00',
 'Errand_idErrand' : 1
 }, {
 'idContainer': 1235,
 'name' : 'container 2',
 'address': 'Grenelle Paris',
 'lat' : 48.858859,
 'lng' : 2.347000,
 'state': 1,
 'lastCollect' : '2015-06-29 09:30:00',
 'Errand_idErrand' : 1
 }, {
 'idContainer': 1236,
 'name' : 'container 3',
 'address': 'Le marais Paris',
 'lat' : 48.858859,
 'lng' : 2.347000,
 'state': 0,
 'lastCollect' : '2015-06-28 08:30:00',
 'Errand_idErrand' : 1
 }, {
 'idContainer': 1237,
 'name' : 'container 4',
 'address': 'Val-de-grace Paris',
 'lat' : 48.858859,
 'lng' : 2.347000,
 'state': 0,
 'lastCollect' : '2015-06-27 07:30:00',
 'Errand_idErrand' : 2
 }];
 */



/******************************  End of Mock datas  ******************************/

///////////////////////////////////////////////////////////////////////////////////////////////////////

/*****************************  Functions declaration *****************************/



/*
 Function to intialize couriers list with database datas
 */
function initializeCouriers() {
console.log('initializeCouriers called');

    var courierList = document.getElementById("courierList");

    function success_callback(data) {

        var result = JSON.parse(data.split("<!--")[0]);
        couriers = result['user'];
        console.log("couriers : ", JSON.stringify(couriers));

        for (var i = 0; i < couriers.length; i++) {
            var option = document.createElement('option');
            option.setAttribute("value", couriers[i].idCourier);
            option.appendChild(document.createTextNode(couriers[i].name.toUpperCase() + " " + couriers[i].firstname));
            courierList.appendChild(option);
        }


        initializeContainersSelection();
        initializeMap();

    }

    function error_callback() {
        alert('Impossible de recuperer la liste des coursiers.');
    }


    jQuery.ajax({
        type: "GET",
        url: "http://inovea.herobo.com/webhost/courier.php?tag=getAll",
        dataType: "text",
        success: success_callback,
        error: error_callback
    });

}


/*
 Function to initialize containers list with database datas
 */
function initializeContainers() {
console.log('initializeContainers called');

    // On success
    function success_callback(data) {

        var result = JSON.parse(data.split("<!--")[0]);
        containers = result['container'];
        console.log("containers : ", JSON.stringify(containers));

        initializeCouriers();

    }

    //On error
    function error_callback() {
        alert('Impossible de recuperer la liste des conteneurs.');
    }

    //Ajax request
    jQuery.ajax({
        type: "GET",
        url: "http://inovea.herobo.com/webhost/container.php?tag=getAll",
        dataType: "text",
        success: success_callback,
        error: error_callback
    });
}


/*
 Function to intialize container with state 'unselected'
 */

function initializeContainersSelection() {

console.log('initializeContainersSelection called');
    for (var i = 0; i < containers.length; i++) {
        containers[i].isSelected = false;
    }
}


/* 
 Function to create and initialize the map
 */
function initializeMap() {

    console.log('initializeMap called');
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(48.858859, 2.3470599),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map_canvas'),
        mapOptions);

    startSpinner();
    for (container in containers) {
            goPlaceMarker(container, containers[container]);   
            
    }

}
function goPlaceMarker(i, container) {
  setTimeout(function() {
    placeMarker(container);
    if(i == containers.length - 1){
      stopSpinner();
    }
                
  }, i * 400);
}


/* 
 Function to add a marker on map corresponding to the container send in parameters
 */
var placeMarker = function (container) {

console.log('placeMarker called');


    var image = {
        url: 'empty_container_marker.png'
    };

    if (container.state == true ) {
        if (container.Errand_idErrand != 1)
            image.url = 'busy_full_container_marker.png'
        else
            image.url = 'full_container_marker.png'
    }
    else if(container.Errand_idErrand != 1)
        image.url = 'busy_empty_container_marker.png'


    geocoder.geocode({'address': container.address}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {

            var newMarker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                clickable: true,
                icon: image
            });
            newMarker.info = new google.maps.InfoWindow({
                content: ""
            });


            newMarker.info.content += "Conteneur n&deg;" + container.idContainer + "<br>" + results[0].formatted_address;

            if (container.Errand_idErrand != 1)
                newMarker.info.content += "</br><span style=\" color : blue\">Appartient a la course n&deg;"+container.Errand_idErrand+"</span>";
            else if (container.state == true)
                newMarker.info.content += "</br><span style=\" color : green\">Vide</span>";
            else if (container.state == false) {
                newMarker.info.content += "</br><span style=\" color : red\">Plein</span>";
            }


            if (container.Errand_idErrand != 1)
                newMarker.info.content += "</br> <button disabled>Indisponible</button><br><br><div style='color:grey; font-size:10px; font-style:italic'>Derniere collecte : " + container.lastCollect + "</div>"
            else if (container.isSelected == false)
                newMarker.info.content += "</br> <button id=\"container" + container.idContainer + "\" onclick=\"addToErrand(" + container.idContainer + ")\">Ajouter a la course</button><br><br><div style='color:grey; font-size:10px; font-style:italic'>Derniere collecte : " + container.lastCollect + "</div>"
            else
                newMarker.info.content += "</br> <button disabled>Ajout&eacute;</button><br><br><div style='color:grey; font-size:10px; font-style:italic'>Derniere collecte : " + container.lastCollect + "</div>"


            google.maps.event.addListener(newMarker, 'click', function () {
                newMarker.info.open(map, newMarker);
            });
            markers[container.idContainer]=(newMarker);

        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
            
        })
};


/* 
 Function to search a place on the map
 */
function majSearch() {
console.log('majSearch called');

    var address = document.getElementById('searchTxt').value;

    geocoder.geocode({'address': address}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
        } else {
            alert("L'adresse saisie est introuvable.");
        }
    });

};


/*
 Function to add a container in new errand's list
 */
var addToErrand = function (containerId) {
console.log('addToErrand called');

    for (var i = 0; i < containers.length; i++) {
        if (containers[i].idContainer == containerId) {
            errandContainers.push(containers[i]);
            containers[i].isSelected = true;
            markers[containers[i].idContainer].info.close();
            markers[containers[i].idContainer].setMap(null);
            delete markers[containers[i].idContainer];
            placeMarker(containers[i]);
            i = containers.length;
        }
    }

 var checkbox = document.getElementById('optimizeCheckbox');
    checkbox.checked = false;
    isOptimized = false;

   

    createItinerary();
    //initializeMap();
   

};


/*
 Funciton to display new errand's list 
 */
var displayErrand = function () {

    var containers = errandContainers;

    if(isOptimized){
        containers = optimizedErrandContainers;
    }
    console.log("displayed containers are : " + JSON.stringify(errandContainers));

    document.getElementById('table').innerHTML = "";

    var theTable = document.createElement('table');

    for (var i = 0, tr, td; i < containers.length; i++) {
        tr = document.createElement('tr');
        td1 = document.createElement('td');
        td2 = document.createElement('td');

        img = document.createElement('img');
        img.setAttribute("src", "trash.png");
        img.setAttribute("class", "trash-icon");
        img.setAttribute("onclick", "removeContainerAtIndex(" + i + ")");
        td1.appendChild(document.createTextNode("Conteneur "+containers[i].idContainer));
        td1.setAttribute("style", "width:90%; color:white");
        td2.appendChild(img);
        tr.setAttribute("style", "width:100%");
        tr.appendChild(td1);
        tr.appendChild(td2);

        theTable.appendChild(tr);
    }
    document.getElementById('table').appendChild(theTable);
}


/*
 Function to remove a container, whose index is send in parameters, from new errand's list
 */
var removeContainerAtIndex = function (index) {

    console.log('removeContainerAtIndex called');

    var containerId = errandContainers[index].idContainer;

    errandContainers.splice(index, 1);

    for (var i = 0; i < containers.length; i++) {
        if (containers[i].idContainer == containerId) {
            containers[i].isSelected = false;
            markers[containers[i].idContainer].info.close();
            markers[containers[i].idContainer].setMap(null);
            delete markers[containers[i].idContainer];
            placeMarker(containers[i]);
            i = containers.length;
        }                       
    }

    var checkbox = document.getElementById('optimizeCheckbox');
    checkbox.checked = false;
    isOptimized = false;


    
    createItinerary();
   // initializeMap();

}


/*
 Function to create an itinerary with multiple places
 */
function createItinerary() {
    
    console.log('createItinerary called');

    directionsDisplay.setMap(null);
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions({suppressMarkers: true});


    //Array of all waypoints of the itinerary, between the start place and the end place
    var waypoints = [];
    var wayppointsContainers = [];

    if (errandContainers.length > 1) {
        startSpinner();
        var startPlace = errandContainers[0].address;
        var endPlace = errandContainers[errandContainers.length - 1].address;



        if (errandContainers.length > 2) {
            for (var i = 1; i < errandContainers.length - 1; i++) {
                waypoints.push({location: errandContainers[i].address, stopover: true});
                if(!isOptimized)
                    old_waypoint_order = waypoints;
                wayppointsContainers.push(errandContainers[i]);
            }
        }

        var itinerary = {
            origin: startPlace,
            destination: endPlace,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            waypoints: waypoints,
            optimizeWaypoints: false
        };

        if (isOptimized) {
            itinerary.optimizeWaypoints = true;
        }

        var promise = new Promise(function(resolve, reject){


            directionsService.route(itinerary, function (response, status) {



            if (status == google.maps.DirectionsStatus.OK) {


                if(isOptimized && waypoint_order != response.routes[0].waypoint_order){
                    waypoint_order = response.routes[0].waypoint_order;
                    optimizedErrandContainers[0] = errandContainers[0];
                     for (var i = 1; i < errandContainers.length - 1; i++) {
                        optimizedErrandContainers[i]= wayppointsContainers[waypoint_order[i-1]];
                    }

                    optimizedErrandContainers[errandContainers.length-1] = errandContainers[errandContainers.length-1];

                    console.log("sorted containers : ", JSON.stringify(errandContainers));
                }
                   

                 stopSpinner();
                var array = response.routes[0].legs;
                var totalDistance = 0;
                var totalDuration = 0;

                for (var i = 0; i < array.length; i++) {
                    totalDistance += array[i].distance.value;
                    totalDuration += array[i].duration.value;
                    console.log('legs[', i, '] = ', array[i]);
                }

                console.log(totalDuration);
                totalDistance /= 1000;

                totalDistance = Math.floor(totalDistance * 10) / 10;
                var hours = Math.floor(totalDuration / 3600);
                var minutes = Math.floor((totalDuration % 3600) / 60);


                document.getElementById('errandDistance').innerHTML = ""
                document.getElementById('errandDistance').appendChild(document.createTextNode("Distance : " + totalDistance + " km"));

                document.getElementById('errandHours').innerHTML = "";
                document.getElementById('errandHours').appendChild(document.createTextNode("Duree : " + hours + " h "));

                document.getElementById('errandMinutes').innerHTML = "";
                document.getElementById('errandMinutes').appendChild(document.createTextNode(minutes));


                if (!isOptimized) {

                    document.getElementById('errandDistanceDifference').innerHTML = "";
                    document.getElementById('errandHoursDifference').innerHTML = "";
                    document.getElementById('errandMinutesDifference').innerHTML = "";
                    totalDurationNoOptimized = totalDuration;
                    totalDistanceNoOptimized = totalDistance;
                }

                else {
                    var distanceDifference = Math.floor((totalDistanceNoOptimized - totalDistance) * 10) / 10;
                    var hoursDifference = Math.floor((totalDurationNoOptimized - totalDuration) / 3600);
                    var minutesDifference = Math.floor(((totalDurationNoOptimized - totalDuration) % 3600) / 60);


                    if (distanceDifference > 0 || hoursDifference > 0 || minutesDifference > 0) {


                        document.getElementById('errandDistanceDifference').setAttribute('style', 'color:green');
                        document.getElementById('errandDistanceDifference').appendChild(document.createTextNode(" -" + distanceDifference + " km"));

                        document.getElementById('errandHoursDifference').setAttribute('style', 'color:green');
                        document.getElementById('errandHoursDifference').appendChild(document.createTextNode(" -"));

                        if (hoursDifference > 0) {
                            document.getElementById('errandHoursDifference').appendChild(document.createTextNode(hoursDifference + " h "));
                        }


                        document.getElementById('errandMinutesDifference').setAttribute('style', 'color:green');
                        document.getElementById('errandMinutesDifference').appendChild(document.createTextNode(minutesDifference + " min"));

                    }
                    else
                         alert('Le placement des points interm\351diaires est d\351ja optimis\351.');

                }

                directionsDisplay.setDirections(response);
                resolve();
            }

            console.log(JSON.stringify(response.routes[0].waypoint_order));
        });
    });

    promise.then(function(){
        displayErrand();
    })



    }

    else{
        directionsDisplay.setMap(null);
        console.log('no itinerary !');
    }
    
}


function optimizeItinerary() {
    console.log('optimizeItinerary called');

    var checkbox = document.getElementById('optimizeCheckbox');
    isOptimized = checkbox.checked;
    createItinerary();
}


function createErrand() {
    console.log('createErrand called');

if(errandContainers.length == 0)
    alert("Veuillez selectionner au moins 1 conteneur.");

else if(pickertime && pickerdate && pickertime.component.item.select != null && pickerdate.component.item.select != null){
    var hours = pickertime.component.item.select.hour;
    var minutes = pickertime.component.item.select.mins;
    var date = pickerdate.component.item.select.date;
    var month = pickerdate.component.item.select.month;
    var year = pickerdate.component.item.select.year;

    console.log("heure : ",hours, "h", minutes);
    console.log("date : ", date, "-", month, "-", year);



    //   create the errand 
    // then setContainersErrandId();
}
    else
        alert('Veuillez selectionner une date et une heure.');

    
}


/*
    Function to associate all errand containers to the errand ID 
*/
function setContainersErrandId(){

    console.log("setContainersErrandId called");
var finalContainers = errandContainers;

    if(isOptimized)
        finalContainers = optimizedErrandContainers;


        // On success
    function success_callback(data) {

        var result = JSON.parse(data.split("<!--")[0]);
        containers = result['container'];
        console.log("container result : ", JSON.stringify(containers));

        initializeCouriers();
    }

    //On error
    function error_callback() {
        alert('MAJ impossible');
    }

    
    for (var i = 0; i < finalContainers.length; i++){

        var currentCont = finalContainers[i];
        //Ajax request
        jQuery.ajax({
            type: "GET",
            url: "http://inovea.herobo.com/webhost/container.php?tag=update&idContainer="+currentCont.idContainer+"&name="+ currentCont.name+"&lat="+currentCont.lat+"&lng="+currentCont.lng+"&state="+currentCont.state+"&lastCollect="+currentCont.lastCollect+"&address="+currentCont.address+"& idErrand=555"    ,
            dataType: "text",
            success: success_callback,
            error: error_callback
        });

    }
}



/*
    Function to open the datepicker
*/
function pickerDate(){

        console.log('pickerDate called');

    var $input = $('.datepicker').pickadate()
    pickerdate = $input.pickadate('picker');
    pickerdate.open();
}

/*
    Function to open the timepicker
*/
function pickerTime(){
            console.log('pickerTime called');

       var $input =  $('.timepicker').pickatime({
      // Escape any “rule” characters with an exclamation mark (!).
      format: 'H!hi',
      formatLabel: '<b>H</b>!h i',
      formatSubmit: 'H:i',
      hiddenPrefix: 'prefix__',
      hiddenSuffix: '__suffix'
    });

   pickertime = $input.pickatime('picker');
   pickertime.open();

}

function startSpinner(){
    console.log("startSpinner called");
    spinnerTarget = document.getElementById('foo');
    var spinner = new Spinner(spinnerOptions).spin(spinnerTarget);

    
overlay.css('visibility', 'visible');
        overlay.addClass('shown');


}

function stopSpinner(){
        console.log("stopSpinner called");
 spinnerTarget = document.getElementById('foo');
    spinnerTarget.innerHTML="";
    overlay.css('visibility', 'hidden');
    overlay.removeClass('shown');  
}

/*****************************  End of functions declaration *****************************/

///////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 Launch initilization 
 */

initializeContainers();

