Coordinates = new Meteor.Collection("coordinates");

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.subscribe('json-coordinates');
    console.log(Coordinates.findOne().timestamp);
  });

  /*google.load("earth", "1");

  var ge = null;

  function gEarthInit() {
    google.earth.createInstance("map3d", initCallback, failureCallback);
  }

  function initCallback(object) {
    ge = object;
    ge.getWindow().setVisibility(true);
  }

  function failureCallback(object) {
    console.log('failureCallback');
  }

  Template.location.rendered = function(){
    //gEarthInit();
    Session.set('earth', true);
  };*/

  Template.location.helpers({
    coords: function(){
      return Coordinates.find();
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

if (Meteor.isServer) {
  Meteor.publish('json-coordinates', function(id){
    var self = this;
    var initializing = true;
    var handle = Coordinates.find().observeChanges({
      added: function(doc, idx){
        if(!initializing)
         self.changed('json-coordinates', id, {timestamp: when});
      },
      removed: function(doc, idx){
        self.changed('json-coordinates', id, {timestamp: when});
      }
    });
    initializing = false;
    self.added('json-coordinates', id, {timestamp: when});
    self.ready();
    self.onStop(function(){
      handle.stop();
    });
  });

  Meteor.startup(function () {
    var json = HTTP.get('http://moonballoon.azurewebsites.net/get/position');
    var data = JSON.parse(Assets.getText("m00nballoon.json"));
    //Coordinates.remove({});
    if(Coordinates.find().count() === 0) {
      for (var i = 0; i < json.length; i++) {
        Coordinates.insert({
          lat: data[i].Lat,
          lng: data[i].Lon,
          alt: data[i].Alt,
          pic: 'http://az695307.vo.msecnd.net/mycontainer/'+data[i].PhotoName,
          timestamp: data[i].When
        });
      }
    }
  });
}
