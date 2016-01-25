//*******************************************************************************************************
// app.js
//
// Neighbour Map Project
// Udacity Front End Nanodegree Project 5
// Erik Benediktson
//*******************************************************************************************************


//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
// MAP
// Some map functionality that needs to be global in order to be accessible as callbacks to the
// google maps API script loaded in index.html
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------

// global variable to store the map object (google.maps.Map)
var g_map = null;

//-------------------------------------------------------------------------------------------------------
// googleMapSuccess - google map script loaded, now create the map and kick off the viewModel
//-------------------------------------------------------------------------------------------------------

function googleMapSuccess() {
    g_map = new google.maps.Map(document.getElementById('map-container'),mapOptions);

    // now that we know we have a map to work with, create the viewModel
    ko.applyBindings(new viewModel() );
};

//-------------------------------------------------------------------------------------------------------
// googleMapError - called if google map api script fails to load (e.g. connection to google maps api fails)
//-------------------------------------------------------------------------------------------------------
function googleMapError() {
    console.log("Error creating map!");
    alert("Google Maps encountered an error while loading.");
}
// end MAP section
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
// model
//      the data that we want to show in our app, used by the viewModel to display in the view
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------

var mapOptions =
{
    center: {lat: 49.2707766, lng: -123.0915908},
    zoom: 13,
    disableDefaultUI: true
};

var locationData = [
    {
        name: 'Bomber Brewing',
        coords: {lat: 49.277537, lng: -123.074472}
    },
    {
        name: 'Main Street Brewing',
        coords: {lat: 49.264679, lng: -123.099172}
    },
];
// end model section
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------



//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
// viewModel
//      the "octopus" or "controller" object that coordinates between the view and the model
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------------
// viewModel constructor
//-------------------------------------------------------------------------------------------------------
function viewModel() {
  
    var self = this;

    // the filter string entered by the user
    self.inputFilter = ko.observable('');
    // the knockout observable list of locations
    self.locationsList = ko.observableArray([]);

    //Define initial infowindow and set content for currentLocation
    self.infoWindow = new google.maps.InfoWindow( {content: 'empty' });

    //-------------------------------------------------------------------------------------------------------
    // locationObj constructor
    //-------------------------------------------------------------------------------------------------------
    var locationObj = function(in_data) {
        this.name = in_data.name;
        this.coords = in_data.coords;
        this.marker = in_data.marker;
        this.infoHTML = in_data.infoHTML;
        this.visible = ko.observable(in_data.visible); //in_data.visible;
    }

    // create a locationObj for each entry in the location model, create markers and info content for each location, 
    // and add each to the KO observableArray, locationsList
    locationData.forEach(function(in_location) {

        //create a marker on the map for each location
        var l_markerOptions = {
            map: g_map,
            position: in_location.coords,
            animation: google.maps.Animation.DROP,
        };

        in_location.marker = new google.maps.Marker(l_markerOptions);
        in_location.visible = true;

        // set infoWindow data for each location
        var l_infoHTML= getInfoWindowData(in_location);
        in_location.infoHTML = l_infoHTML;

        //set click listener for each marker.
        in_location.marker.addListener('click', function() {
                        // set the infoWindow's content to the current location's infoHTML
                        self.infoWindow.setContent(in_location.infoHTML);
                        // show the infoWindow
                        self.infoWindow.open(g_map, in_location.marker);
        });

        self.locationsList.push(new locationObj(in_location) );
    });

    //-------------------------------------------------------------
    // viewModel::activateMarker - When a location in the list is clicked, activate the marker and open the infowindow
    //-------------------------------------------------------------
    self.activateMarker = function(in_location) {
        // animate the associated marker
        in_location.marker.setAnimation(google.maps.Animation.DROP);
        // simulate a click on the associated marker, to trigger the opening of the infoWindow for the location
        google.maps.event.trigger(in_location.marker, 'click');
    }

    //-------------------------------------------------------------
    // viewModel::doLocationFilter
    //-------------------------------------------------------------
    self.doLocationFilter = function()  {

        self.infoWindow.close();

        // use lowercase comparisons to make the filter case-insensitive
        var lowerFilter = self.inputFilter().toLowerCase();

        // run the matching logic to repopulate it with whatever matches
        self.locationsList().forEach(function(in_location) {
            var isVisible = in_location.name.toLowerCase().indexOf(lowerFilter) !== -1;
            in_location.visible(isVisible);
            in_location.marker.setVisible(isVisible);
        });
    };


    //-------------------------------------------------------------------------------------------------------
    // viewModel::getInfoWindowData
    //-------------------------------------------------------------------------------------------------------
    function getInfoWindowData(in_location) {

        var infoHTML = "<div><p>A result</p></div>";
        var clientID = 0;
        var clientSecret = 0;
        var foursquareURL = "https://api.foursquare.com/v2/venues/search?limit=1&ll=" + 
                            in_location.coords.lat + "," + 
                            in_location.coords.lng + 
                            "&client_id=" + clientID + 
                            "&client_secret="+ clientSecret + 
                            "&v=20140806";
                            
        $.getJSON(foursquareURL, 
            function(data){
                var result = data.response.venues[0];
                infoHTML = "<div><p>" + result.name + "</p></div>";
            }

        ).error(function(e){
            // TODO - improve error handling...
            infoHTML = "<div><p>Error loading foursquare data</p></div>";
        });


        return infoHTML;
    }


};




