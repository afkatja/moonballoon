Coordinates = new Meteor.Collection("coordinates");

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.subscribe('json-coordinates');
    /*var query = Coordinates.find();
    var handle = query.observeChanges({
      added: function(id, fields) {
        console.log(id, fields);
        positionBallon(id);
      },
      changed: function (id, fields) {
        positionBallon(id);
      }
    });*/

    Meteor.subscribe('logs');
    var handle = Log.find().observeChanges({
      added: function(id, fields) {
        placemarker(id);
      },
      changed: function (id, fields) {
        placemarker(id);
      }
    });
    //console.log(query, Coordinates.findOne());
    //positionBallon();
    //placemarker();
  });

  function positionBallon(id){
    console.log('positioning balloon', Log.findOne());
    var lastAlt = Coordinates.findOne(id).timestamp;
    $('input[type=range]').val(lastAlt/40000*100);
    $('.chosen-height span').text(lastAlt);
  }

  function center(lat, lng) {
    if (window.map) {
      console.log('centering', lat, lng);
      window.map.setCenter({lat: lat, lng: lng});
    }
  }

  function placemarker(id){
    if (!window.markers) {
      window.markers = [];
    }
    var lastLog = Log.findOne({_id: id, alt: {$gt: 0}});
    console.log('will place marker', id, lastLog);
    if(!lastLog || lastLog.alt <= 0) return;
    if (window.markers[id]) {
      var marker = window.markers[id];
      marker.setPosition({ lat: lastLog.lat, lng: lastLog.lng });
    } else {
      try {
        var marker = new google.maps.Marker({
            position: { lat: lastLog.lat, lng: lastLog.lng },
            map: window.map,
            title: id,
            zIndex: 1
        });
        window.markers[id] = marker;

        console.log('created marker', lastLog.lat, lastLog.lng);
      } catch(e) {
        console.log('error', e);
      }
    }
    center(lastLog.lat, lastLog.lng);
  }

  Template.location.helpers({
    coords: function(){
      return Coordinates.find({}, {alt: {$gt: 0}});
    },
    stats: function(){
      var log = this;
      var result = moment(log.timestamp).fromNow() + ', ' + log.alt + ', '+ log.pic;
      return Log.find({}, {alt: {$gt: 0}, sort: {timestamp: -1}});
    },
    maps: function(){
      return Coordinates.findOne({alt: {$gt: 0}});
    }
  });

  Template.pic.filterAlt = function(){
    return this.alt > 0;
  };

  Template.location.rendered = function(){
    GoogleMaps.init({},
      function(){
        var mapOptions = {
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          center: {lat: 52.071878, lng:4.345358},
          //zoomControl: false,
          streetViewControl: false,
          panControl: false,
          rotateControl: false,
          //scaleControl: false,
          scrollwheel: false
        };
        window.map = new google.maps.Map(document.getElementById("map"), mapOptions);
      });
  };

  Template.location.events({
    'change input[type=range]': function (e) {
      var val = e.currentTarget.value;
      $('.chosen-height').css({
        bottom: val + '%'
      }).find('span').text((val*40000/100) + 'm');
    }
  });
}

Log = new Meteor.Collection('log');

if (Meteor.isServer) {
  Meteor.publish('json-coordinates', function(id){
    return Coordinates.find({},{sort:{timestamp:-1},limit:1});
  });
  Meteor.publish('logs', function(){
    return Log.find();
  });

  Meteor.startup(function () {
    var json = HTTP.get('http://moonballoon.azurewebsites.net/get/position');
    //var data = JSON.parse(Assets.getText("m00nballoon.json"));
    Log.remove({});
    Coordinates.remove({});
    console.log(Coordinates.find().count(), json.length);
    if(Coordinates.find().count() === 0) {
      if(json.statusCode == 200) {
        var response = JSON.parse(json.content);
        for (var i = 0; i < response.length; i++) {
        console.log('json content', response[i].timestamp);
          Log.insert({
            lat: response[i].Lat,
            lng: response[i].Lon,
            alt: response[i].Alt,
            pic: 'http://az695307.vo.msecnd.net/mycontainer/'+response[i].PhotoName,
            timestamp: response[i].When
          });

          Coordinates.insert({
            lat: response[i].Lat,
            lng: response[i].Lon,
            alt: response[i].Alt,
            pic: 'http://az695307.vo.msecnd.net/mycontainer/'+response[i].PhotoName,
            timestamp: response[i].When
          });
        }
      }
    }
  });
}
