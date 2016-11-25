// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require react
//= require react_ujs
//= require components
// //= require_tree .
//

function initMap(){
   map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7371057,lng:-74.004663},
    zoom: 4
  });
  return map
}

function initStations(args){
  var bounds = new google.maps.LatLngBounds();
  stations = []
  args.forEach(function(station){
    var stationPos = station.stationPos
    var marker = new google.maps.Marker({
      position: stationPos,
      map: map,
      title: String(station.name),
      label: String(station.stop_id),
      trainLines: String(station.train_lines)
    });
    bounds.extend(marker.position);
    marker.addListener('click', function() {
      $.ajax({
        url: "http://apps.mta.info/trainTime/getTimesByStation.aspx?stationID="+station.stop_id+"&time="+ (new Date).getTime(),
        method: 'get'
      }).done(function(responseJSON){
          var data = responseJSON.replace('loadNewData()', '')
          var direction1 = [];
          var direction2 = [];
          eval(data);
          //AT THIS POINT WE ARE GETTING THE INFORMATION FROM MTA ABOUT THE TRAIN LOCATIONS AND STATION ARRIVALS
        // var infowindow = new google.maps.InfoWindow({
        //   content: contentString
        //   infowindow.open(map, marker);
      // });
      });
    })
    stations.push(marker)
  })
  map.fitBounds(bounds);
  return stations
}

function initRoutes(args)
{
  linePaths = []
  args.forEach(function(route){
    var coordinates = [];
      route.forEach(function(station){
        coordinates.push(station.stationPos);
      })
    var linePath = new google.maps.Polyline({
      path: coordinates,
      geodesic: true,
      strokeColor: 'Green',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      title: route[0].stop_id[0]
    });
    linePaths.push(linePath)
    coordinates = [];
    linePath.setMap(map);
  })

  return linePaths
}

function handleClick(vara){
  var checked = [];
  $(':checkbox:checked').each(function(i){
    checked[i] = $(this).val();
  });
  updateStations(checked);
  updateRoutes(checked);

}
function intersection(a, b) {
  var ai=0, bi=0;
  var result = [];

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}

function updateStations(options)
{
  stations.forEach(function(marker){
    if (intersection(options, marker.trainLines.split('').sort()).length)
    {
      marker.setVisible(true);
    }
    else{
      marker.setVisible(false);
    }
  })
}
function updateRoutes(options)
{
  linePaths.forEach(function(line){

    if (options.indexOf(line.title[0])==-1)
    {
      line.setVisible(false);
    }
    else{
      line.setVisible(true);
    }
  })
}

function updateTrainPosition(responseJSON,currentTime){
  var realData = []
  trains.forEach(function(train){
    train.setMap(null);
  })
  trains = []
  var keys = Object.keys(responseJSON)
  keys.forEach(function(key){
    var train = responseJSON[key]
    var routeId = train.route_id;
    var stopTimes = train.stop_time;
    if (stopTimes[0].arrival && stopTimes[0].departure){
      //Assume in this case, they are in the station at stopTimes[0]
      if (Date.parse(stopTimes[0].departure) != Date.parse(stopTimes[0].arrival)){
        realData.push(train)
        debugger
        var stopId = stopTimes[0].stop_id.substr(0,3);
        var direction =stopTimes[0].stop_id.substr(3);

        var currentStation = stations.filter(function(station){
          return (station.label === stopId)
        })
        var trainMarker = new google.maps.Marker({
          position: {lat:currentStation[0].getPosition().lat(), lng:currentStation[0].getPosition().lng()},
          map: map,
          label: routeId
        });
        trains.push(trainMarker);

      }
      else{
        //HERE WE ASSUME TRAIN IS MOVING

      }
    }
  })



}

$('document').ready(function() {
  //SCOTTS BUTTON
  $('form').submit(function(event) {
    event.preventDefault();
    var $form = $(this);
    var url = $form.attr('action');
    $.ajax({
      url: url,
      method: 'get'
    }).done(function(responseJSON){
      updateTrainPosition(responseJSON)
      // var stationPos = {lat:-40, lng:40}
      //
      // var marker = new google.maps.Marker({
      //   position: stationPos,
      //   map: map,
      //   title: 'STATION'
      // });
      // debugger;
      // for(var i = 0; i < Object.keys(responseJSON).length; i++) {
      //   var route_id = responseJSON[i]['route_id'];
      //   var trip_id = responseJSON[i]['trip_id'];
      //   var numStops = Object.keys(responseJSON[i]['stop_time']).length
      //   var lastStop = responseJSON[i]['stop_time'][0].stop_id
      //   var time = responseJSON[i]['stop_time'][0].arrival
      //   // $('.train-locations').append(responseJSON);
      //   $('.train-locations').append(
      //
      //     '<p>Number ' + i +  ':<p></p> route_id: ' + route_id + '</p><p>trip_id: ' + trip_id + '<p>latest stop: ' + lastStop + '</p><br />'
      //   )
      // };
    });
  })
});
