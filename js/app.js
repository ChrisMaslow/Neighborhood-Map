var initialPlaces = [
  {
    title: 'Musée du Louvre',
    lat: 48.860395,
    lng: 2.337599,
  },
  {
    title: 'Arc de Triomphe',
    lat: 48.873797,
    lng: 2.295011,
  },
  {
    title: 'Tour Eiffel',
    lat: 48.858222,
    lng: 2.2945,
  },
  {
    title: 'Notre-Dame de Paris',
    lat: 48.853,
    lng: 2.3498,
  },
  {
    title: 'Place de la Concorde',
    lat: 48.865556,
    lng: 2.321111,
  },
  {
    title: 'Palais Garnier',
    lat: 48.871944,
    lng: 2.331667,
  }
];

var map;
var clientID;
var clientSecret;

// formatPhone function referenced from
// http://snipplr.com/view/65672/10-digit-string-to-phone-format/

function formatPhone(phonenum) {
    var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(phonenum)) {
        var parts = phonenum.match(regexObj);
        var phone = "";
        if (parts[1]) { phone += "+1 (" + parts[1] + ") "; }
        phone += parts[2] + "-" + parts[3];
        return phone;
    }
    else {
        //invalid phone number
        return phonenum;
    }
};

var Place = function(data) {
  var self = this;
  this.title = data.title;
  this.lat = data.lat;
  this.lng = data.lng;
  this.URL = "";
	this.street = "";
	this.city = "";
	this.phone = "";

  this.visible = ko.observable(data.visible);

  var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.lng + '&client_id='
    + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

  $.getJSON(foursquareURL).done(function(data) {
  		var results = data.response.venues[0];
  		self.URL = results.url;
  		if (typeof self.URL === 'undefined'){
  			self.URL = "";
  		}
  		self.street = results.location.formattedAddress[0];
       	self.city = results.location.formattedAddress[1];
        	self.phone = results.contact.phone;
        	if (typeof self.phone === 'undefined'){
  			self.phone = "";
  		} else {
  			self.phone = formatPhone(self.phone);
  		}
  	}).fail(function() {
  		alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
  	});

    this.contentString = '<div class="info-window-content"><div class="title"><b>' + data.title + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content">' + self.phone + "</div></div>";

  this.infoWindow = new google.maps.InfoWindow({content: self.contentString});

  this.marker = new google.maps.Marker({
    position: new google.maps.LatLng(data.lat, data.lng),
    title: data.title
  });

  this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	 }, this);

  this.marker.addListener('click', function(){
    self.contentString = '<div class="info-window-content"><div class="title"><b>' + data.title + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content"><a href="tel:' + self.phone +'">' + self.phone +"</a></div></div>";

    self.infoWindow.setContent(self.contentString);

		self.infoWindow.open(map, this);

		self.marker.setAnimation(google.maps.Animation.BOUNCE);

    setTimeout(function() {
      		self.marker.setAnimation(null);
    }, 2100);
	});

  this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};
};

var ViewModel = function() {
  var self = this;

  this.filterText = ko.observable("");

  this.placeList = ko.observableArray([]);

  //设置Google Map。
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 48.853, lng: 2.3498},
    zoom: 13
  });

  // 设置 Foursquare API
	clientID = "V443OTCAQPJLCRY4QWBFYN3ZK5FDKGJOYDHLMI3O342IRVNN";
	clientSecret = "AK1JHLEG2D2KW14WF5HYVFNTUYFTBXYS4LDUUNRAHPR5URLB";

  initialPlaces.forEach(function(placeItem){
    self.placeList.push( new Place(placeItem) );
  });

  //通过filterText筛选marker。
  this.filteredList = ko.computed( function() {
		var filter = self.filterText().toLowerCase();
		if (!filter) {
			self.placeList().forEach(function(locationItem){
				locationItem.visible(true);
			});
			return self.placeList();
		} else {
			return ko.utils.arrayFilter(self.placeList(), function(locationItem) {
				var string = locationItem.title.toLowerCase();
				var result = (string.search(filter) >= 0);
				locationItem.visible(result);
				return result;
			});
		}
	}, self);
  this.mapElem = document.getElementById('map');
	this.mapElem.style.height = window.innerHeight - 50;
};

function runApp() {
  ko.applyBindings(new ViewModel());
};

function errorHandling() {
	alert("Google Maps has failed to load. Please check your internet connection and try again.");
}
