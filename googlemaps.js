  //Search input
  var search;

  //map declaration
  var map;

  //To translate String adresse in Google Format adress with position (ex : 61.1648, 4.58058)
  var geocoder = new google.maps.Geocoder();

  //To create itineraries
  var directionsService = new google.maps.DirectionsService();
  var directionsDisplay = new google.maps.DirectionsRenderer();


  // Containers tab
  var conteneurs = [{'id' : 1234, 'address': 'Palais Royal Paris', 'state' : true, 'isSelected' : false}, {'id' : 1235, 'address': 'Grenelle Paris', 'state' : true, 'isSelected' : false},{'id' : 1236, 'address': 'Le marais Paris', 'state' : false, 'isSelected' : false}, {'id' : 1237, 'address': 'Val-de-grace Paris', 'state' : true, 'isSelected' : false  }];

  //Containers of the new errand list
  var errandContainers = [];

  // Markers tab
  var markers = new Array();

  // Funciton to initialize the map
  function initialize() {

    var mapOptions = {
      zoom: 13,
      center: new google.maps.LatLng(48.858859,2.3470599)
    };

    map = new google.maps.Map(document.getElementById('map_canvas'),
        mapOptions);

     map.setMapTypeId(google.maps.MapTypeId.HYBRID);

    for (conteneur in conteneurs){
         placeMarker(conteneurs[conteneur]);
    }

  }




  // Function to add marker on map
   var placeMarker = function(container){

    var image = {
      url: 'empty_container_marker.png'  
    };

    if(container.state == false)
      image.url = 'full_container_marker.png'

        geocoder.geocode( { 'address': container.address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
              
             var newMarker = new google.maps.Marker({
                  map: map,
                  position: results[0].geometry.location,
                  clickable : true,
                  icon : image
              } );  
             newMarker.info = new google.maps.InfoWindow({
              content : ""
              });


              newMarker.info.content += "Conteneur n&deg;"+ container.id+ "<br>"+results[0].formatted_address;

             if(container.state == true)
                newMarker.info.content += "</br><span style=\" color : green\">Disponible</span>";
              else if(container.state == false)
                newMarker.info.content += "</br><span style=\" color : red\">Indisponible</span>";


              if(container.isSelected == false)
                newMarker.info.content += "</br> <button id=\"container"+container.id+"\" onclick=\"addToErrand("+container.id+")\">Ajouter a la course</button>"
              else
                newMarker.info.content += "</br> <button onclick=\"addToErrand("+container.id+")\" disabled>Ajout&eacute;</button>"



  google.maps.event.addListener(newMarker, 'click', function() {
    newMarker.info.open(map, newMarker);
  });
              markers.push(newMarker);
              
          } else {
              alert('Geocode was not successful for the following reason: ' + status);
           }
          });

        
    };  
        
  //Function to search something with the Search input
  function majSearch(){

  var address = document.getElementById('searchTxt').value;

  geocoder.geocode( { 'address': address}, function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                  map.setCenter(results[0].geometry.location);
              } else {
                  alert("L'adresse saisie est introuvable.");
               }
              });

   };


  var addToErrand = function(containerId){

  for (var i = 0; i < conteneurs.length; i++) {
      if(conteneurs[i].id == containerId)
      {
        console.log(JSON.stringify(conteneurs[i]));
        errandContainers.push(conteneurs[i]);
        conteneurs[i].isSelected = true;
        console.log('container at index '+i+ ' isSelected -> true');
        conteneurs[i].isSelected = true;
        i = conteneurs.length;
      }
  }
      
      displayErrand();
      initialize();
  };



  var displayErrand = function(){

      document.getElementById('table').innerHTML = "";


     var theTable = document.createElement('table');

      for (var i = 0, tr, td; i < errandContainers.length; i++) {
          tr = document.createElement('tr');
          td = document.createElement('td');
          img = document.createElement('img');
          img.setAttribute("src", "trash.png");
          img.setAttribute("class", "trash-icon");
          img.setAttribute("onclick", "removeContainerAtIndex("+i+")");
          td.appendChild(document.createTextNode(errandContainers[i].address));
          td.appendChild(img);
          tr.appendChild(td);
          theTable.appendChild(tr);
          console.log(JSON.stringify(errandContainers[i].address));
      }

      document.getElementById('table').appendChild(theTable);
      
  }


var removeContainerAtIndex = function(index){

  var containerId = errandContainers[index].id;
errandContainers.splice(index, 1);

  for (var i = 0; i < conteneurs.length; i++) {
      if(conteneurs[i].id == containerId){
        conteneurs[i].isSelected = false;
      }
  }
  displayErrand();
  initialize();

}




  //function to create an itinerary
  function createItinerary(targetPlace){

    geolocation();

  directionsDisplay.setMap(null);
  directionsDisplay.setMap(map);
  directionsDisplay.setOptions( { suppressMarkers: true } );


  var itineraire = {
    origin: myPosition,
    destination: targetPlace,
    travelMode: google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true
  };

   directionsService.route(itineraire, function(response, status) {
         if (status == google.maps.DirectionsStatus.OK) {
           directionsDisplay.setDirections(response);
         }
       });

  }

  //Initialize the map
  google.maps.event.addDomListener(window, 'load', initialize);
