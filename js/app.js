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
    center: {lat: 49.2707766, lng: -123.0815908},
    zoom: 14,
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
    {
        name: 'Brassneck Brewing',
        coords: {lat: 49.265804, lng: -123.100576}
    },
    {
        name: '33 Acres Brewing',
        coords: {lat: 49.263887, lng: -123.105323}
    },
    {
        name: 'Strange Fellows Brewing',
        coords: {lat: 49.272531, lng: -123.077433}
    },
    {
        name: 'Parallel 49 Brewing',
        coords: {lat: 49.283852, lng: -123.064364}
    }
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
        var l_infoHTML= getInfoWindowHTML(in_location);
        in_location.infoHTML = l_infoHTML;

        //set click listener for each marker.
        in_location.marker.addListener('click', function() {
            // set the infoWindow's content to the current location's infoHTML
            self.infoWindow.setContent(in_location.infoHTML);
            // show the infoWindow
            self.infoWindow.open(g_map, in_location.marker);
            // animate the associated marker
            in_location.marker.setAnimation(google.maps.Animation.BOUNCE);
            window.setTimeout(function() {
                in_location.marker.setAnimation(null);
            }, 2000);
        });

        self.locationsList.push(new locationObj(in_location) );
    });


    //-------------------------------------------------------------
    // viewModel::selectLocation - When a location in the list is clicked, activate the marker and open the infowindow
    //-------------------------------------------------------------
    self.selectLocation = function(in_location) {
        // simulate a click on the associated marker, to trigger the opening of the infoWindow for the location
        google.maps.event.trigger(in_location.marker, 'click');
    }

    //-------------------------------------------------------------
    // viewModel::activateMarker - When a location in the list is clicked, activate the marker and open the infowindow
    //-------------------------------------------------------------
    // self.activateMarker = function(in_location) {

    //     // simulate a click on the associated marker, to trigger the opening of the infoWindow for the location
    //     google.maps.event.trigger(in_location.marker, 'click');
    // }

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
    // viewModel::getInfoWindowHTML
    //-------------------------------------------------------------------------------------------------------
    function getInfoWindowHTML(in_location) {

        var infoHTML = "<div id='info_container'><p>A result</p></div>";
        var clientID = "SHY4V10MBMNPBIFQPI4ZKWCQXD3QVNPYQ5SAFEDPPC5I4IE0";
        var clientSecret = "PAUEFIUWGTXWKGPG42GIXMHJSXBZDLN1YKIKVTPIJYFUB55H";
        var foursquareURL = "https://api.foursquare.com/v2/venues/search?limit=1&ll=" + 
                            in_location.coords.lat + "," + 
                            in_location.coords.lng + 
                            //"&intent=match" + // this returned no results....
                            "&limit=1" +
                            "&query=" + in_location.name +
                            "&client_id=" + clientID + 
                            "&client_secret="+ clientSecret + 
                            "&v=20130815";

        $.getJSON(foursquareURL, 
            function(data){
                console.log("Succesful json retrieved from foursquare");
                console.log(data);
                var result = data.response.venues[0];
                infoHTML =  "<div id='info_container'>" +
                                "<div id='info_title'>" + result.name + "</div>" +
                                "<div id='info_address'>" + 
                                    "<p>" +
                                        result.location.formattedAddress[0] + "<br>" + 
                                        result.location.formattedAddress[1] + 
                                    "</p" +
                                "</div>" +
                                "<div id='info_contact'>" + 
                                    "<p>" + 
                                        "Website: <a href=" + result.url + ">" + result.url + "</a>" + "<br>" +
                                        "Phone: " + result.contact.formattedPhone + "<br>" +
                                        "Twitter: <a href=https://twitter.com/" + result.contact.twitter + ">" + result.contact.twitter + "</a>" + 
                                    "</p" +
                                "</div>" +
                            "</div>";
                console.log(infoHTML);

                in_location.infoHTML = infoHTML;
            }
        ).error(function(e){
            // TODO - improve error handling?...
            in_location.infoHTML = "<div id='info_container'><p>Error loading foursquare data</p></div>";
        });

        return infoHTML;
    }


};




