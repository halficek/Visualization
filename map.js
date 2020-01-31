// DEFINE VARIABLES
// Define size of map group
// Full world map is 2:1 ratio
// Using 12:5 because we will crop top and bottom of map
const w = window.innerWidth;
const h = window.innerHeight;


// variables for catching min and max zoom factors
var minZoom;
var maxZoom;

var default_year = 2019;
var rank = "Overall rank";
var percent = 5;


var dropdown = d3.select("#vis-container")
        .insert("select", "svg")

var projection = d3
        .geoEquirectangular()
        .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
        .scale([w / (2 * Math.PI)]) // scale to fit group width
        .translate([w / 2, h / 2]) // ensure centred in group
;

// Define map path
var path = d3
        .geoPath()
        .projection(projection)
;

// Create function to apply zoom to countriesGroup
function zoomed() {
    t = d3
            .event
            .transform
    ;
    countriesGroup
            .attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")")
    ;
}

// Define map zoom behaviour
var zoom = d3
        .zoom()
        .on("zoom", zoomed)
;

function getTextBox(selection) {
    selection
            .each(function (d) {
                d.bbox = this
                        .getBBox();
            })
    ;
}

// Function that calculates zoom/pan limits and sets zoom to default value
function initiateZoom() {
    // Define a "minzoom" whereby the "Countries" is as small possible without leaving white space at top/bottom or sides
    minZoom = Math.max($("#map-holder").width() / w, $("#map-holder").height() / h);
    // set max zoom to a suitable factor of this value
    maxZoom = 20 * minZoom;
    // set extent of zoom to chosen values
    // set translate extent so that panning can't cause map to move out of viewport
    zoom
            .scaleExtent([minZoom, maxZoom])
            .translateExtent([[0, 0], [w, h]])
    ;
    // define X and Y offset for centre of map to be shown in centre of holder
    midX = ($("#map-holder").width() - minZoom * w) / 2;
    midY = ($("#map-holder").height() - minZoom * h) / 2;
    // change zoom transform to min zoom and centre offsets
    svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
}

// zoom to show a bounding box, with optional additional padding as percentage of box size
function boxZoom(box, centroid, paddingPerc) {
    minXY = box[0];
    maxXY = box[1];
    // find size of map area defined
    zoomWidth = Math.abs(minXY[0] - maxXY[0]);
    zoomHeight = Math.abs(minXY[1] - maxXY[1]);
    // find midpoint of map area defined
    zoomMidX = centroid[0];
    zoomMidY = centroid[1];
    // increase map area to include padding
    zoomWidth = zoomWidth * (1 + paddingPerc / 100);
    zoomHeight = zoomHeight * (1 + paddingPerc / 100);
    // find scale required for area to fill svg
    maxXscale = $("svg").width() / zoomWidth;
    maxYscale = $("svg").height() / zoomHeight;
    zoomScale = Math.min(maxXscale, maxYscale);
    // handle some edge cases
    // limit to max zoom (handles tiny countries)
    zoomScale = Math.min(zoomScale, maxZoom);
    // limit to min zoom (handles large countries and countries that span the date line)
    zoomScale = Math.max(zoomScale, minZoom);
    // Find screen pixel equivalent once scaled
    offsetX = zoomScale * zoomMidX;
    offsetY = zoomScale * zoomMidY;
    // Find offset to centre, making sure no gap at left or top of holder
    dleft = Math.min(0, $("svg").width() / 2 - offsetX);
    dtop = Math.min(0, $("svg").height() / 2 - offsetY);
    // Make sure no gap at bottom or right of holder
    dleft = Math.max($("svg").width() - w * zoomScale, dleft);
    dtop = Math.max($("svg").height() - h * zoomScale, dtop);
    // set zoom
    svg
            .transition()
            .duration(500)
            .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
            );
}
function get_country_color(country_var, year, category) {
    if (data[country_var] && data[country_var][year] && data[country_var][year - 1]) {
        actual = data[country_var][year][category];
        epsilon = actual - data[country_var][year - 1][category];
        percentage = actual / 100 * percent;

        if (epsilon - percentage > 0) {
            return d3.rgb("#003300");
        } else if (epsilon < 0 && epsilon + percentage < 0) {
            return d3.rgb("#D00000");
        } else {
            return d3.rgb("#ffad33");
        }

    } else {
        console.log(country_var)
        if (year == "2015") {
            return d3.rgb("#ffad33");
        } else {
            return d3.rgb("#B0ABAA")
        }
    }
}

var svg = d3
                .select("#map-holder")
                .append("svg")
                // set to the same size as the "map-holder" div
                .attr("width", $("#map-holder").width())
                .attr("height", $("#map-holder").height())

var data;
d3.json(
        "https://raw.githubusercontent.com/halficek/Visualization/master/final.json",
        function (error, json) {
            if (error) {
                throw error;
            }
            data = json
        }
);


// get map data
d3.json(
        "https://raw.githubusercontent.com/halficek/Visualization/master/custom.geo.json",
        function (error, json) {
            if (error) {
                throw error;
            }
            //Bind data and create one path per GeoJSON feature
            countriesGroup = svg.append("g").attr("id", "map");

            countries = countriesGroup
                    .selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("id", function (d, i) {
                        return "country" + d.properties.iso_a3;
                    })
                    .attr("class", "country")
                    .attr("fill", d => get_country_color(d.properties.geounit, default_year, rank))
                    .attr("active", false)

            countryLabels = countriesGroup
                    .selectAll("g")
                    .data(json.features)
                    .enter()
                    .append("g")
                    .attr("class", "countryLabel")
                    .attr("id", function (d) {
                        return "countryLabel" + d.properties.iso_a3;
                    })
                    .attr("transform", function (d) {
                        return (
                                "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")"
                        );
                    })

            countryLabels
                    .append("text")
                    .attr("class", "countryName")
                    .style("text-anchor", "middle")
                    .attr("dx", 0)
                    .attr("dy", 0)
                    .text(function (d) {
                        return d.properties.name;
                    })
                    .call(getTextBox);
            // add a background rectangle the same size as the text
            countryLabels
                    .insert("rect", "text")
                    .attr("class", "countryLabelBg")
                    .attr("transform", function (d) {
                        return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
                    })
                    .attr("width", function (d) {
                        return d.bbox.width + 4;
                    })
                    .attr("height", function (d) {
                        return d.bbox.height;
                    });
            //legend
            legend_data = d3.range(1, 5).map(function (d) {
                return d;
            });

            var myColor = d3.scaleOrdinal().domain([1, 4])
                    .range(["#ffad33", "#003300", "#D00000", "#B0ABAA"]);

            var myText = d3.scaleOrdinal().domain([1, 4])
                    .range(["No significant change", "Positive change", "Negative change", "Missing data"]);

            svg.append('g')
                    .attr("id", "legend")
                    .selectAll("rect")
                    .data(legend_data)
                    .enter()
                    .append("rect")
                    .attr('height', 30)
                    .attr('width', 30)
                    .attr('transform', function (_, i) {
                        return "translate(" + ($("#map").width() / 23) + "," + ($("#map").height() / 1.75 - i * $("#map").height() / 14) + ")";
                    })
                    .attr("fill", function (d) {
                        return myColor(d);
                    });

            d3.select("#legend")
                    .selectAll("text")
                    .data(legend_data)
                    .enter()
                    .append("text")
                    .attr("class", "countryName")
                    .style("text-anchor", "start")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text(function (d) {
                        return myText(d);
                    })
                    .attr('transform', function (_, i) {
                        return "translate(" + ($("#map").width() / 14) + "," + ($("#map").height() / 1.64 - i * $("#map").height() / 14) + ")";
                    });

            svg.append("text")
                    .attr("class", "countryName")
                    .style("font-size", "25px")
                    .attr("font-weight", "bold")
                    .text("World happiness:")
                    .attr('transform', "translate(" + ($("#map").width() / 25) + "," + ($("#map").height() / 3) + ")");

            //category
            var whiteColour = "#ffffff";
            var selectedColour = "#a5ab32";

            svg.append("rect")
                    .attr("id", "freedom")
                    .attr("x", $("#map").width() / 25)
                    .attr("y", $("#map").height() - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        rank = "Freedom to make life choices";
                        d3.select("#freedom").style("fill", selectedColour);
                        d3.select("#GDP").style("fill", whiteColour);
                        d3.select("#generosity").style("fill", whiteColour);
                        d3.select("#healthy").style("fill", whiteColour);
                        d3.select("#overall").style("fill", whiteColour);
                        d3.select("#corruption").style("fill", whiteColour);
                        d3.select("#social").style("fill", whiteColour);
                        d3.event.stopPropagation();
                    });

            svg.append("rect")
                    .attr("id", "GDP")
                    .attr("x", $("#map").width() / 5.2)
                    .attr("y", $("#map").height() / 1.22 - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        rank = "GDP per capita";
                        d3.select("#freedom").style("fill", whiteColour);
                        d3.select("#GDP").style("fill", selectedColour);
                        d3.select("#generosity").style("fill", whiteColour);
                        d3.select("#healthy").style("fill", whiteColour);
                        d3.select("#overall").style("fill", whiteColour);
                        d3.select("#corruption").style("fill", whiteColour);
                        d3.select("#social").style("fill", whiteColour);
                        ;
                        d3.event.stopPropagation();
                    });

            svg.append("rect")
                    .attr("id", "generosity")
                    .attr("x", $("#map").width() / 25)
                    .attr("y", $("#map").height() / 1.22 - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        rank = "Generosity";
                        d3.select("#freedom").style("fill", whiteColour);
                        d3.select("#GDP").style("fill", whiteColour);
                        d3.select("#generosity").style("fill", selectedColour);
                        d3.select("#healthy").style("fill", whiteColour);
                        d3.select("#overall").style("fill", whiteColour);
                        d3.select("#corruption").style("fill", whiteColour);
                        d3.select("#social").style("fill", whiteColour);
                        ;
                        d3.event.stopPropagation();
                    });

            svg.append("rect")
                    .attr("id", "healthy")
                    .attr("x", $("#map").width() / 25)
                    .attr("y", $("#map").height() / 1.355 - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)
                    .on("click", function () {
                        rank = "Healthy life expectancy";
                        d3.select("#freedom").style("fill", whiteColour);
                        d3.select("#GDP").style("fill", whiteColour);
                        d3.select("#generosity").style("fill", whiteColour);
                        d3.select("#healthy").style("fill", selectedColour);
                        d3.select("#overall").style("fill", whiteColour);
                        d3.select("#corruption").style("fill", whiteColour);
                        d3.select("#social").style("fill", whiteColour);
                        d3.event.stopPropagation();
                    });

            svg.append("rect")
                    .attr("id", "overall")
                    .attr("x", $("#map").width() / 5.2)
                    .attr("y", $("#map").height() - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", selectedColour)

                    .on("click", function () {
                        rank = "Overall rank";
                        d3.select("#freedom").style("fill", whiteColour);
                        d3.select("#GDP").style("fill", whiteColour);
                        d3.select("#generosity").style("fill", whiteColour);
                        d3.select("#healthy").style("fill", whiteColour);
                        d3.select("#overall").style("fill", selectedColour);
                        d3.select("#corruption").style("fill", whiteColour);
                        d3.select("#social").style("fill", whiteColour);
                        d3.event.stopPropagation();
                    });

            svg.append("rect")
                    .attr("id", "corruption")
                    .attr("x", $("#map").width() / 5.2)
                    .attr("y", $("#map").height() / 1.1 - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        rank = "Perceptions of corruption";
                        d3.select("#freedom").style("fill", whiteColour);
                        d3.select("#GDP").style("fill", whiteColour);
                        d3.select("#generosity").style("fill", whiteColour);
                        d3.select("#healthy").style("fill", whiteColour);
                        d3.select("#overall").style("fill", whiteColour);
                        d3.select("#corruption").style("fill", selectedColour);
                        d3.select("#social").style("fill", whiteColour);
                        d3.event.stopPropagation();
                    });

            svg.append("rect")
                    .attr("id", "social")
                    .attr("x", $("#map").width() / 25)
                    .attr("y", $("#map").height() / 1.1 - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        rank = "Social support";
                        d3.select("#freedom").style("fill", whiteColour);
                        d3.select("#GDP").style("fill", whiteColour);
                        d3.select("#generosity").style("fill", whiteColour);
                        d3.select("#healthy").style("fill", whiteColour);
                        d3.select("#overall").style("fill", whiteColour);
                        d3.select("#corruption").style("fill", whiteColour);
                        d3.select("#social").style("fill", selectedColour);
                        d3.event.stopPropagation();
                    });

            svg.append("text")
                    .attr("id", "freedom-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("Freedom to make life choices")
                    .attr('transform', "translate(" + ($("#map").width() / 14) + "," + ($("#map").height()) + ")");

            svg.append("text")
                    .attr("id", "generosity-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("Generosity")
                    .attr('transform', "translate(" + ($("#map").width() / 14) + "," + ($("#map").height()) / 1.22 + ")");

            svg.append("text")
                    .attr("id", "GDP-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("GDP")
                    .attr('transform', "translate(" + ($("#map").width() / 4.5) + "," + ($("#map").height()) / 1.22 + ")");

            svg.append("text")
                    .attr("id", "social-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("Social status")
                    .attr('transform', "translate(" + ($("#map").width() / 14) + "," + ($("#map").height()) / 1.1 + ")");

            svg.append("text")
                    .attr("id", "corruption-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("Corruption")
                    .attr('transform', "translate(" + ($("#map").width() / 4.5) + "," + ($("#map").height()) / 1.1 + ")");

            svg.append("text")
                    .attr("id", "overall-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("Overall")
                    .attr('transform', "translate(" + ($("#map").width() / 4.5) + "," + ($("#map").height()) + ")");

            svg.append("text")
                    .attr("id", "healthy-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("Healthy")
                    .attr('transform', "translate(" + ($("#map").width() / 14) + "," + ($("#map").height()) / 1.355 + ")");


            //percent
            svg.append("rect")
                    .attr("id", "ten")
                    .attr("x", $("#map").width() / 1.65)
                    .attr("y", $("#map").height() - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        d3.select("#ten").style("fill", selectedColour);
                        d3.select("#five").style("fill", whiteColour);
                        d3.select("#two").style("fill", whiteColour);
                        percent = 10;
                        d3.event.stopPropagation();
                    });

            svg.append("text")
                    .attr("id", "ten-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("10%")
                    .attr('transform', "translate(" + ($("#map").width() / 1.56) + "," + ($("#map").height()) + ")");

            svg.append("rect")
                    .attr("id", "five")
                    .attr("x", $("#map").width() / 2)
                    .attr("y", $("#map").height() - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", selectedColour)

                    .on("click", function () {
                        d3.select("#ten").style("fill", whiteColour);
                        d3.select("#five").style("fill", selectedColour);
                        d3.select("#two").style("fill", whiteColour);
                        percent = 5;
                        d3.event.stopPropagation();
                    });

            svg.append("text")
                    .attr("id", "five-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("5%")
                    .attr('transform', "translate(" + ($("#map").width() / 1.87) + "," + ($("#map").height()) + ")");

            svg.append("rect")
                    .attr("id", "two")
                    .attr("x", $("#map").width() / 2.5)
                    .attr("y", $("#map").height() - 20)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", whiteColour)

                    .on("click", function () {
                        percent = 2;
                        d3.select("#ten").style("fill", whiteColour);
                        d3.select("#five").style("fill", whiteColour);
                        d3.select("#two").style("fill", selectedColour);
                        d3.event.stopPropagation();
                    });

            svg.append("text")
                    .attr("id", "two-text")
                    .attr("class", "countryName")
                    .style("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text("2%")
                    .attr('transform', "translate(" + ($("#map").width() / 2.3) + "," + ($("#map").height()) + ")");



            initiateZoom();
        }
);

