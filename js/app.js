//*******************************************************************************************************
// app.js
//
// Neighbourhood Map Project
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
// googleMapSuccess - the callback for when the google map script has loaded.
//      If this function is called, we will create the viewModel and kick off the app.
//-------------------------------------------------------------------------------------------------------

function googleMapSuccess() {

    // create the google map object
    g_map = new google.maps.Map(document.getElementById('map_container'),mapOptions);

    // now that we know we have a map to work with, create the viewModel
    ko.applyBindings(new viewModel() );
};

//-------------------------------------------------------------------------------------------------------
// googleMapError - the callback for when the google map script failed to load
//-------------------------------------------------------------------------------------------------------
function googleMapError() {
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

// I consider the map options to be part of the model because the rest of the model data is
// related to it by proximity
var mapOptions =
{
    center: {lat: 49.2707766, lng: -123.0815908},
    zoom: 13,
    disableDefaultUI: true
};

// hard-coded list of best breweries in Vancouver, and their coordinates
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
// menu view
//      some code for the functioning of the hamburger menu
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------


// hide the X and the menu initially - only the hamburger symbol will be visible to start
$( ".cross-button" ).hide();
$( ".menu" ).hide();

// set the click function on the hamburger
$( ".hamburger-button" ).click(function() {
    // reveal the menu using slideToggle
    $( ".menu" ).slideToggle( "slow", function() {
        // once the menu is fully visible, hide the hamburger symbol and show the X symbol
        // so that the user may close the menu if they wish
        $( ".hamburger-button" ).hide();
        $( ".cross-button" ).show();
    });
});

// set the click function on the X (cross)
$( ".cross-button" ).click(function() {
    // hide the menu using slideToggle
    $( ".menu" ).slideToggle( "slow", function() {
        // once the menu is fully offscreen, hide the X symbol and show the hamburger symbol
        // so that the user may open the menu again if they wish
        $( ".cross-button" ).hide();
        $( ".hamburger-button" ).show();
    });
});

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
        // copy all required fields from the model data
        this.name = in_data.name;
        this.coords = in_data.coords;
        this.marker = in_data.marker;
        this.infoHTML = in_data.infoHTML;
        // create a knockout observable that will allow knockout to control this location's visibility
        // in the list.  The visibility will be based on the current value of the locationObj's "visible" property
        this.visible = ko.observable(in_data.visible);
    }

    // create a locationObj for each entry in the location model, create markers and info content for
    // each location, and add each to the KO observableArray, locationsList
    locationData.forEach(function(in_location) {

        // set the markerOptions to pass into the Marker constructor for the locataion
        var l_markerOptions = {
            map: g_map,                     // the global map object
            position: in_location.coords,   // the latitude/longitude of the location
            animation: google.maps.Animation.DROP, // use DROP for the initial marker animation
        };

        // create a new marker for the location
        in_location.marker = new google.maps.Marker(l_markerOptions);
        // set the location to be visible to begin with.
        in_location.visible = true;

        // request Foursquare data for each location.  The result will be stored in in_location.infoHTML
        requestInfoWindowHTML(in_location);

        // add a click listener for each marker
        in_location.marker.addListener('click', function() {
            // set the infoWindow's content to the current location's infoHTML
            self.infoWindow.setContent(in_location.infoHTML);
            // show the infoWindow
            self.infoWindow.open(g_map, in_location.marker);
            // animate the associated marker with BOUNCE  
            in_location.marker.setAnimation(google.maps.Animation.BOUNCE);
            // set a timeout in milliseconds for when the bouncing should end
            window.setTimeout(function() {
                in_location.marker.setAnimation(null);
            }, 2000);
        });

        // create a new locationObj and add it to the knockout observable array
        self.locationsList.push(new locationObj(in_location) );
    });


    //-------------------------------------------------------------------------------------------
    // viewModel::selectLocation - When a location in the list is clicked, activate the marker 
    //      and open the infowindow
    //-------------------------------------------------------------------------------------------
    self.selectListLocation = function(in_location) {
        // simulate a click on the associated marker, to trigger the opening of the infoWindow for the location
        google.maps.event.trigger(in_location.marker, 'click');
        // when a location is selected from the list, also trigger the menu to be closed, 
        // to allow the map to be seen better
        $( ".cross-button" ).trigger('click');
    }

    //----------------------------------------------------------------------
    // viewModel::doLocationFilter - filter our list based on the user input
    //----------------------------------------------------------------------
    self.doLocationFilter = function()  {

        // when the user starts filtering, close the infoWindow to allow more visibility on the map
        self.infoWindow.close();

        // use lowercase comparisons to make the filter case-insensitive
        var lowerFilter = self.inputFilter().toLowerCase();

        // run the matching logic on the full location list
        self.locationsList().forEach(function(in_location) {

            // for each location, determine if the input filter matches the location's name
            var isVisible = in_location.name.toLowerCase().indexOf(lowerFilter) !== -1;

            // set the value for in_location.visible.  This is a knockout computed observable 
            // that will cause the element to be hidden or displayed in the list.
            in_location.visible(isVisible);

            // hide or show the location's marker on the map
            in_location.marker.setVisible(isVisible);
        });
    };


    //-------------------------------------------------------------------------------------------------------
    // viewModel::requestInfoWindowHTML - send an asynchronous ajax request to Foursquare for data about 
    //      a location in our model.  Set up the callback to handle the response appropriately - store some
    //      content in the location's infoHTML field, that will be displayed in the infoWindow when that 
    //      location is selected.
    //-------------------------------------------------------------------------------------------------------
    function requestInfoWindowHTML(in_location) {

        // set a temporary HTML string to be displayed in the InfoWindow until we get a response from Foursquare
        var infoHTML = "<div id='info_container'><p>Loading...</p></div>";
        // the Foursquare client ID for this app
        var clientID = "SHY4V10MBMNPBIFQPI4ZKWCQXD3QVNPYQ5SAFEDPPC5I4IE0";
        // the Foursquare client secret for this app
        var clientSecret = "PAUEFIUWGTXWKGPG42GIXMHJSXBZDLN1YKIKVTPIJYFUB55H";
        // the url to access Foursquare's API
        var foursquareURL = "https://api.foursquare.com/v2/venues/search?" +
                            "&ll=" + in_location.coords.lat + "," + in_location.coords.lng + // latitude, longitude
                            "&limit=1" + // only ask for one result because we have a very specific query
                            "&query=" + in_location.name + // search for the location by name
                            "&client_id=" + clientID +          // this app's Foursquare clientID     
                            "&client_secret="+ clientSecret +   // this app's Foursquare client secret
                            "&v=20130815";  // the version key to use (found in Foursquare's documentation)

        // make the call to the FourSquare api
        $.getJSON(foursquareURL, 
            function(data){
                // we only requested one location, so we know it will be the first venue returned.  Use the 
                // variable result as shorthand access to that data
                var result = data.response.venues[0];

                // compose an HTML string that will display the name, address, url, phone number, and twitter handle
                // for the venue.  The url and twitter will be links that take the user to the venue's URL and twitter
                // feed respectively
                infoHTML =  "<div id='info_container'>" +
                                "<div id='info_title'>" + result.name + "</div>" +
                                "<div id='info_address'>" + 
                                    result.location.formattedAddress[0] + "<br>" + 
                                    result.location.formattedAddress[1] + "<br>" + 
                                "</div>" +
                                "<div id='info_contact'>" + 
                                    "<br>" +
                                    "Website: <a href=" + result.url + ">" + result.url + "</a>" + "<br>" +
                                    "Phone: " + result.contact.formattedPhone + "<br>" +
                                    "Twitter: <a href=https://twitter.com/" + result.contact.twitter + ">" + result.contact.twitter + "</a>" + 
                                "</div>" +
                            "</div>";

                // set this location's infoWindow HTML, it will be displayed when the location is clicked
                in_location.infoHTML = infoHTML;
            }
        ).error(function(e){
            // Display a message in the infoWindow indicating that there was a problem loading the Foursquare API data
            in_location.infoHTML = "<div id='info_container'><p>Error loading foursquare data</p></div>";
        });
    }
};




