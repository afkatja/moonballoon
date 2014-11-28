Coordinates = new Meteor.Collection("coordinates");

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.subscribe('json-coordinates');
    var query = Coordinates.find();
    var handle = query.observeChanges({
      added: function(id, fields) {
        console.log(id, fields);
        positionBallon(id);
      },
      changed: function (id, fields) {
        positionBallon(id);
      }
    });
    console.log(query, Coordinates.findOne());
  });

  function positionBallon(id){
    console.log('positioning balloon', id);
    var lastAlt = Coordinates.findOne(id).timestamp;
    $('input[type=range]').val(lastAlt/40000*100);
    $('.chosen-height span').text(lastAlt);
  }

  Template.location.helpers({
    coords: function(){
      return Coordinates.find();
    },
    stats: function(){
      var log = this;
      var result = moment(log.timestamp).fromNow() + ', ' + log.alt;
      return result;
    }
  });

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
    Log.remove();
    Coordinates.remove();
    if(Coordinates.find().count() === 0) {
      for (var i = 0; i < json.length; i++) {
        Log.insert({
          lat: json[i].Lat,
          lng: json[i].Lon,
          alt: json[i].Alt,
          pic: 'http://az695307.vo.msecnd.net/mycontainer/'+json[i].PhotoName,
          timestamp: json[i].When
        });
        Coordinates.insert({
          lat: json[i].Lat,
          lng: json[i].Lon,
          alt: json[i].Alt,
          pic: 'http://az695307.vo.msecnd.net/mycontainer/'+json[i].PhotoName,
          timestamp: json[i].When
        });
      }
    }
  });
}
