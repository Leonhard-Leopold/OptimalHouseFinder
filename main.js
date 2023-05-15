
function initMap() {
    directionsService = new google.maps.DirectionsService();

    const options = {zoom: 15, scaleControl: true, center: center};
    map = new google.maps.Map(
    document.getElementById('map'), options);

    var directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    center_marker = new google.maps.Marker({position: center, map: map, animation:google.maps.Animation.BOUNCE});

    google.maps.event.addListener(map, 'click', function(event) {
        if(setCenter==true){
            set_new_center(event.latLng.lat(), event.latLng.lng());
        }
        else{
            add_location(event.latLng.lat(), event.latLng.lng());
        }
    });
    displayTable();
}

function set_new_center(lat, lng){
    center_marker.setMap(null);

    center_marker = new google.maps.Marker({position: {lat:lat, lng: lng}, map: map, animation:google.maps.Animation.BOUNCE});
    center = {lat: lat, lng: lng}

    l = JSON.parse(JSON.stringify(locations));
    reset();
    for(let i = 0; i < l.length; i++){
        add_location(l[i].lat, l[i].lng, name=l[i].name, visits=l[i].visits);
    }

}


function add_location(lat, lng, name="Unnamed Location", visits=1){
       var mk_new = new google.maps.Marker({position: {lat:lat, lng: lng}, map: map, visible: false});
       calcDuration(center, {lat:lat, lng: lng}, name, visits, function(duration, distance, directionsRenderer, id){
              var infowindow = new google.maps.InfoWindow({content: 'Duration: ' + duration + '<br>Distance: ' + distance});
             infowindow.open(map,mk_new);

              markers.push(mk_new);
              routes.push(directionsRenderer);
              tooltips.push(infowindow);

              google.maps.event.addListener(infowindow,'closeclick',function(){
                delete_location(id);
                  mk_new.setMap(null);
                  directionsRenderer.setMap(null);
              });
       });
}



function calcDuration(origin, destination, name, visits, callback){
      const route = {
          origin: origin,
          destination: destination,
          travelMode: 'DRIVING'
      }
      directionsService.route(route,
        function(response, status) { // anonymous function to capture directions
          if (status !== 'OK') {
            window.alert('Directions request failed due to ' + status);
            return;
          }
          else {
            var directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setDirections(response);
            directionsRenderer.setMap(map);
//          var infowindow = new google.maps.InfoWindow({content: 'test'});
//          infowindow.open(map,response.geocoded_waypoints[0]);
            var directionsData = response.routes[0].legs[0];
            if (!directionsData) {
              window.alert('Directions request failed');
              return;
            }
            else {
              callback(directionsData.duration.text, directionsData.distance.text, directionsRenderer, counter);
              locations.push({id:counter, lat: destination.lat, lng: destination.lng, name: name, time: directionsData.duration.value, distance: directionsData.distance.value, visits: visits})
              counter ++;
              displayTable();
            }
          }
        });
}
