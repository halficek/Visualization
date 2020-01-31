default_year = 2018;

var sliderStep = d3
        .sliderBottom()
        .min("2015")
        .max("2019")
        .width($("#slider").width() - 120)
        .tickFormat(d3.format(''))
        .ticks(5)
        .step(1)
        .default("2019")
        .on('onchange', val => {
            d3.selectAll('.country')
                    .attr("fill", d => get_country_color(d.properties.geounit, val, rank));
        })
        .fill("#000066");

var gStep = d3
        .select('div#slider')
        .append('svg')
        .attr('width', $("#slider").width())
        .attr('height', $("#slider").height())
        .append('g')
        .attr('transform', 'translate(50, 30)');

gStep.call(sliderStep);

d3.selectAll('.tick').select("text")
        .attr("fill", "#000")
        .attr("font-size", 14);

d3.select(".parameter-value").select("text")
        .attr("font-size", 14)
        .attr("fill", "#eee");