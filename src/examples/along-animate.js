
var Tour = function() {
  mapboxgl.accessToken = 'pk.eyJ1IjoidHdlbGNoIiwiYSI6Il9pX3dtb3cifQ.YcYnsO0X2p3x0HpHPFfleg';
  this.videos = {};
};

Tour.prototype.start = function() {
  this.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/twelch/cihxvsxy000oeaikoz39jjthw',
    center: [-122.580067, 45.548602],
    zoom: 14,
    minzoom: 19
  });

  this.map.on('style.load', function () {
    this.startTour();
  }.bind(this));
};

Tour.prototype.startTour = function() {
  var time = 0;
  var timePerStep = 100;
  var interval = setInterval(function() {
    time += timePerStep;
    if (time === 4000) {this.easeIn();}
    if (time === 10500) {this.startPerson();}
    else if (time === 11000) {this.startVideo('front');}
    else if (time === 11500) {this.startVideo('back');}    
    //else if (time === 25000) {this.stopPerson();}
    else if (time === 22100) {this.pauseVideo('front');}
    else if (time === 22200) {this.pauseVideo('back');}    
    else if (time === 23300) {this.flyTo();}
  }.bind(this), timePerStep);
};

Tour.prototype.easeIn = function(text) {
  this.map.easeTo({
    zoom: 20,
    duration: 6000
  });
}

Tour.prototype.easeOut = function(text) {
  this.map.easeTo({
    zoom: 19,
    bearing: 180,
    pitch: 40,
    duration: 6000
  });
}

Tour.prototype.flyTo = function(text) {
  document.getElementById("event").innerHTML = "<p>Meanwhile over at the local shopping center two cars collide.</p>";
  this.map.flyTo({
    center: [-122.592520, 45.547482], 
    zoom: 18,
    bearing: 270,
    speed: 0.3,
    curve: 0.5
  });
}

Tour.prototype.startPerson = function() {
  var iPath = turf.linestring([
    [ -122.579915799999981, 45.5485545, 0.0 ], [ -122.57994530000002, 45.5485536, 0.0 ], [ -122.579944, 45.5485996, 0.0 ], [ -122.580011, 45.54860810000001, 0.0 ], [ -122.5799507, 45.5486043, 0.0 ], [ -122.579954700000016, 45.5485489, 0.0 ], [ -122.579903799999983, 45.5485489, 0.0 ]
  ]);

  var iPathLength = turf.lineDistance(iPath, 'miles');
  var iPoint = turf.along(iPath, 0, 'miles');
  var iPathSoFar = turf.linestring([]);

  this.map.addSource("pDot", {
    "type": "geojson",
    "data": iPoint,
    "maxzoom": 20
  });

  this.map.addLayer({
    "id": "pDot",
    "type": "symbol",
    "source": "pDot",
    "layout": {
      "icon-image": "person-gray",
      "icon-size": {
        "base": 0.5,
        "stops": [
          [0,0.01],
          [15,0.01],
          [20,0.5]]
      },
    },
    "paint": {},
    "interactive": true
  });

  var step = 0;
  var numSteps = 400; //Change this to set animation resolution
  var timePerStep = 25; //Change this to alter animation speed
  var pDotSource = this.map.getSource('pDot');
  this.personinterval = setInterval(function() {
    step += 1;
    if (step > numSteps) {
      clearInterval(this.personInterval);
    } else {
      var curDistance = step / numSteps * iPathLength;      
      
      var iPoint = turf.along(iPath, curDistance, 'miles');
      pDotSource.setData(iPoint);
      
      iPathSoFar.geometry.coordinates.push(iPoint.geometry.coordinates);
      if (iPathSoFar.geometry.coordinates.length === 2) {
        this.pLineSource = new mapboxgl.GeoJSONSource({
          "type": "geojson",
          "data": iPathSoFar,
          "maxzoom": 20
        });
        this.map.addSource("pLine", this.pLineSource);

        this.map.addLayer({
          "id": "pLine",
          "type": "line",
          "source": "pLine",          
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#4999D2",
            "line-opacity": "0.6",
            "line-width": 6,
            "line-dasharray": [0.25,2],
            "line-blur": 1
          }
        }, "pDot");
      }
      if (iPathSoFar.geometry.coordinates.length >= 2) {
        this.pLineSource.setData(iPathSoFar);
      }    
    }
  }.bind(this), timePerStep);
};

Tour.prototype.stopPerson = function() {
  this.map.removeLayer('pLine');
  this.map.removeLayer('pDot');
  this.map.removeSource('pLine');
  this.map.removeSource('pDot');
  clearInterval(this.personInterval);
};

Tour.prototype.startVideo = function(name) {
  var videos = {
    'front': {
      "urls": ["https://cldup.com/KpVLU35SZv.webm", "https://cldup.com/B-IRzEIuWZ.mp4"],
      "coordinates": [
        [-122.580085, 45.548739],
        [-122.579842, 45.548739],
        [-122.579842, 45.548654],
        [-122.580085, 45.548654]
      ]
    },
    'back': {
      "urls": ["https://cldup.com/3JLxT-6DlL.webm"],
      "coordinates": [
        [-122.580393, 45.548566],
        [-122.580200, 45.548566],
        [-122.580200, 45.548498],
        [-122.580393, 45.548498]
      ]
    }    
  };

  var videoParams = videos[name];
  var videoSrc = new mapboxgl.VideoSource(videoParams);

  videoSrc.on('change', function (e) {
    this.videos[name] = videoSrc.getVideo();
  }.bind(this));

  this.map.addSource(name, videoSrc);
  this.map.addLayer({
    "id": name,
    "type": "raster",
    "source": name
  });
};

Tour.prototype.stopVideo = function(name) {
  this.videos.pause();
  this.map.removeLayer(name);
  this.map.removeSource(name);
};

Tour.prototype.pauseVideo = function(name) {
  this.videos[name].pause();
};

var tour = new Tour();
tour.start();
