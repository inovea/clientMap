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

// Markers array
var markers = new Array();

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
        alert('Impossible de récupérer la liste des coursiers.');
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

    // On success
    function success_callback(data) {

        var result = JSON.parse(data.split("<!--")[0]);
        containers = result['container'];
        console.log("containers : ", JSON.stringify(containers));

        initializeCouriers();

    }

    //On error
    function error_callback() {
        alert('Impossible de récupérer la liste des conteneurs.');
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

    for (var i = 0; i < containers.length; i++) {
        containers[i].isSelected = false;
    }
}


/* 
 Function to create and initialize the map
 */
function initializeMap() {

    var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(48.858859, 2.3470599),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map_canvas'),
        mapOptions);

    for (container in containers) {
        placeMarker(containers[container]);
    }

    createItinerary();
}


/* 
 Function to add a marker on map corresponding to the container send in parameters
 */
var placeMarker = function (container) {

    var image = {
        url: 'empty_container_marker.png'
    };

    if (container.state == false) {
        if (container.Errand_idErrand != 1)
            image.url = 'busy_full_container_marker2.png'
        else
            image.url = 'full_container_marker.png'
    }


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


            newMarker.info.content += "container n&deg;" + container.idContainer + "<br>" + results[0].formatted_address;

            if (container.Errand_idErrand != 1)
                newMarker.info.content += "</br><span style=\" color : blue\">Appartient a une course</span>";
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
            markers.push(newMarker);

        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });


};


/* 
 Function to search a place on the map
 */
function majSearch() {

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

    for (var i = 0; i < containers.length; i++) {
        if (containers[i].idContainer == containerId) {
            errandContainers.push(containers[i]);
            containers[i].isSelected = true;
            i = containers.length;
        }
    }

    displayErrand();
    initializeMap();
};


/*
 Funciton to display new errand's list 
 */
var displayErrand = function () {

    document.getElementById('table').innerHTML = "";

    var theTable = document.createElement('table');

    for (var i = 0, tr, td; i < errandContainers.length; i++) {
        tr = document.createElement('tr');
        td1 = document.createElement('td');
        td2 = document.createElement('td');

        img = document.createElement('img');
        img.setAttribute("src", "trash.png");
        img.setAttribute("class", "trash-icon");
        img.setAttribute("onclick", "removeContainerAtIndex(" + i + ")");
        td1.appendChild(document.createTextNode(errandContainers[i].address));
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

    var containerId = errandContainers[index].idContainer;

    errandContainers.splice(index, 1);

    for (var i = 0; i < containers.length; i++) {
        if (containers[i].idContainer == containerId) {
            containers[i].isSelected = false;
        }
    }
    displayErrand();
    initializeMap();

}


/*
 Function to create an itinerary with multiple places
 */
function createItinerary(isOptimized) {

    directionsDisplay.setMap(null);
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions({suppressMarkers: true});


    //Array of all waypoints of the itinerary, between the start place and the end place
    var waypoints = [];

    if (errandContainers.length > 1) {

        var startPlace = errandContainers[0].address;
        var endPlace = errandContainers[errandContainers.length - 1].address;

        if (errandContainers.length > 2) {
            for (var i = 1; i < errandContainers.length - 1; i++) {
                waypoints.push({location: errandContainers[i].address, stopover: true});
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

        directionsService.route(itinerary, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {


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

                }

                directionsDisplay.setDirections(response);
            }
        });
    }

    else
        console.log('no itinerary !');

}


function optimizeItinerary() {

    var checkbox = document.getElementById('optimizeCheckbox');
    createItinerary(checkbox.checked);
}


function createErrand() {
    console.log('createErrand called');
}

/*****************************  End of functions declaration *****************************/

///////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 Launch initilization 
 */

initializeContainers();

