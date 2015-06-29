    /*****************************  Variables declaration  ****************************************/

//Map object
var map;

//To translate String adresse in Google Format adress with position (ex : 61.1648, 4.58058)
var geocoder = new google.maps.Geocoder();

//To create itineraries
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();

// New errand containers array
var errandContainers = [];

// Markers array
var markers = new Array();

// All containers array
var containers = [];

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
var containers = [{
    'id': 1234,
    'address': 'Palais Royal Paris',
    'state': true,
    'isSelected': false
}, {
    'id': 1235,
    'address': 'Grenelle Paris',
    'state': true,
    'isSelected': false
}, {
    'id': 1236,
    'address': 'Le marais Paris',
    'state': false,
    'isSelected': false
}, {
    'id': 1237,
    'address': 'Val-de-grace Paris',
    'state': true,
    'isSelected': false
}];

/******************************  End of Mock datas  ******************************/

///////////////////////////////////////////////////////////////////////////////////////////////////////

/*****************************  Functions declaration *****************************/


/* 
 Function to create and initialize the map
 */
function initialize() {

    var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(48.858859, 2.3470599)
    };

    map = new google.maps.Map(document.getElementById('map_canvas'),
        mapOptions);

    map.setMapTypeId(google.maps.MapTypeId.HYBRID);

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

    if (container.state == false)
        image.url = 'full_container_marker.png'

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


            newMarker.info.content += "container n&deg;" + container.id + "<br>" + results[0].formatted_address;

            if (container.state == true)
                newMarker.info.content += "</br><span style=\" color : green\">Disponible</span>";
            else if (container.state == false)
                newMarker.info.content += "</br><span style=\" color : red\">Indisponible</span>";


            if (container.isSelected == false)
                newMarker.info.content += "</br> <button id=\"container" + container.id + "\" onclick=\"addToErrand(" + container.id + ")\">Ajouter a la course</button>"
            else
                newMarker.info.content += "</br> <button onclick=\"addToErrand(" + container.id + ")\" disabled>Ajout&eacute;</button>"


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
        if (containers[i].id == containerId) {
            errandContainers.push(containers[i]);
            containers[i].isSelected = true;
            i = containers.length;
        }
    }

    displayErrand();
    initialize();
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

    var containerId = errandContainers[index].id;

    errandContainers.splice(index, 1);

    for (var i = 0; i < containers.length; i++) {
        if (containers[i].id == containerId) {
            containers[i].isSelected = false;
        }
    }
    displayErrand();
    initialize();

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

    if(errandContainers.length>1){

        var startPlace = errandContainers[0].address;
        var endPlace = errandContainers[errandContainers.length-1].address;

        if(errandContainers.length > 2){
            for(var i = 1; i<errandContainers.length-1; i++)
            {   
                waypoints.push({location : errandContainers[i].address, stopover : true});
            }
        }




            // LOG !! 
            for(var i = 0; i<waypoints.length; i++)
                console.log(waypoints[i].location);



                var itinerary = {
                    origin: startPlace,
                    destination: endPlace,
                    travelMode: google.maps.TravelMode.DRIVING,
                    provideRouteAlternatives: true,
                    waypoints : waypoints,
                    optimizeWaypoints: false
                };


                if(isOptimized){
                    itinerary.optimizeWaypoints = true;
                }

                directionsService.route(itinerary, function (response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {


                        var array = response.routes[0].legs;
                        var totalDistance = 0;
                        var totalDuration = 0;

                        for(var i = 0; i<array.length; i++){
                            totalDistance += array[i].distance.value;
                            totalDuration += array[i].duration.value;
                            console.log( 'legs[', i, '] = ', array[i]);
                        }

                        console.log(totalDuration);
                        totalDistance/=1000;

                        totalDistance = Math.floor(totalDistance*10) / 10;
                        var hours = Math.floor(totalDuration/3600);
                        var minutes = Math.floor((totalDuration % 3600) /60);


                        document.getElementById('errandDistance').innerHTML = ""
                        document.getElementById('errandDistance').appendChild(document.createTextNode("Distance : " + totalDistance + " km"));

                        document.getElementById('errandHours').innerHTML = "";
                        document.getElementById('errandHours').appendChild(document.createTextNode("Duree : " + hours + " h "));

                        document.getElementById('errandMinutes').innerHTML = "";
                        document.getElementById('errandMinutes').appendChild(document.createTextNode(minutes));


                        if(!isOptimized){

                            document.getElementById('errandDistanceDifference').innerHTML="";
                            document.getElementById('errandHoursDifference').innerHTML="";
                            document.getElementById('errandMinutesDifference').innerHTML="";
                            totalDurationNoOptimized = totalDuration;
                            totalDistanceNoOptimized = totalDistance;
                        }

                        else{
                            var distanceDifference = Math.floor((totalDistanceNoOptimized-totalDistance)*10) / 10;
                            var hoursDifference = Math.floor((totalDurationNoOptimized-totalDuration)/3600);
                            var minutesDifference = Math.floor(((totalDurationNoOptimized-totalDuration) % 3600) /60);



                            if(distanceDifference > 0 || hoursDifference > 0 || minutesDifference > 0){

                                 document.getElementById('errandDistanceDifference').setAttribute('style', 'color:green');
                            document.getElementById('errandDistanceDifference').appendChild(document.createTextNode(" -" + distanceDifference + " km"));

                            document.getElementById('errandHoursDifference').setAttribute('style', 'color:green');
                            document.getElementById('errandHoursDifference').appendChild(document.createTextNode(" -")); 

                            if(hoursDifference > 0){
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


function optimizeItinerary(){

    var checkbox = document.getElementById('optimizeCheckbox');
    createItinerary(checkbox.checked);  
}

/*****************************  End of functions declaration *****************************/

///////////////////////////////////////////////////////////////////////////////////////////////////////

/*
    Map initilization 
*/
google.maps.event.addDomListener(window, 'load', initialize);
