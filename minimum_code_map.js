//The minimum amount of code to make a choropleth(thematic) map
//20 lines

//set the height and width of your visualization
//*spaghetti code discussion
var width = window.innerWidth//d3.select("#map").attr("width")// could be also a integer ex: var width = 500
var height = window.innerHeight// could be also a integer  ex: var height = 800

//make a svg for which to draw on, set its width and height
var svg = d3.select("#map").append("svg")
			.attr("width",width)
			.attr("height",height)

//make some map properties: 
//1.projection - projections contain the properties of: type of projection, scale, center
//for more projections: https://github.com/d3/d3-geo/blob/master/README.md#projections

//2. indicate that the shape data will use projection we selected
var myPath = d3.geoPath()

//load the shape data
d3.queue()
    .defer(d3.json, "data/county_topo.json")
    .defer(d3.csv, "data/R11898216_SL050.csv")
    .await(ready);
	
//drawing
var colors = ["#70ab79",
"#ceca7b",
"#43b08b"]
    
function ready(error, geoData,censusData) {	
	if (error) throw error;
    
    var counties = topCounties(censusData).slice(0,10)
    var displayStr = "<strong>Top 10 Counties:</strong><br/>"
    for(var t in counties){
        displayStr+=counties[t][0]+": "+Math.round(counties[t][2]*10000)/100+"%<br/>"
    }
    d3.select("#top").html(displayStr)
    
    
    var formattedCensus = censusToJson(censusData)
    var colorScale = d3.scaleLinear().domain([0,10]).range(["white","red"])
	svg.append("g")
        .attr("class","counties")
        .selectAll("path")
        .data(topojson.feature(geoData,  geoData.objects.counties).features)
		.enter()
		.append("path")
		.attr("stroke", "none")
        .attr("fill", function(d){
            var countyData=formattedCensus["05000US"+d.id]
            var totalPopulation = countyData["SE_T015_001"]
            var puertoRicanPopulation =countyData["SE_T015_005"]
            var percentPuertoRican = Math.round(puertoRicanPopulation/totalPopulation*10000)/100
            return colorScale(percentPuertoRican)
        })
		.attr("d", myPath)
        .on("mouseover",function(d){
            var countyData=formattedCensus["05000US"+d.id]
            var countyName = countyData["Geo_NAME"]
            var totalPopulation = countyData["SE_T015_001"]
            var hispanicPopulation = countyData["SE_T015_003"]
            var puertoRicanPopulation =countyData["SE_T015_005"]
            var percentHispanic = Math.round(hispanicPopulation/totalPopulation*10000)/100
            var percentPuertoRican = Math.round(puertoRicanPopulation/totalPopulation*10000)/100
            
            d3.select("#infoPanel").html(countyName
                +"</br>Total Population: "+totalPopulation
                +"</br></br>Puerto Rican Population: "+puertoRicanPopulation+"("+percentPuertoRican+"%)"
                +"</br></br>Hispanic or Latino Population: "+hispanicPopulation+"("+percentHispanic+"%)")
            d3.select(this).style("stroke","red")
        })
        .on("mouseout",function(d){
            d3.select(this).style("stroke","none")
        })
}
function topCounties(censusData){
    var formatted = []
    for(var i in censusData){
        var entry = censusData[i]
        var countyName = entry["Geo_NAME"]
        if(countyName!=undefined &&countyName.split(", ")[1]!="Puerto Rico"){
        var geoid = entry["Geo_GEOID"]
            var value = parseFloat((parseFloat(entry["SE_T015_005"])/parseFloat(entry["SE_T015_001"])))
            formatted.push([countyName,geoid,value])
        }
        
    }
    return formatted.sort(function(a,b) {
        return b[2]-a[2]
    });
}
function censusToJson(censusData){
    var dictionary = {}
    for(var i in censusData){
        var entry = censusData[i]
        var geoid = entry["Geo_GEOID"]
        dictionary[geoid]=entry
    }
    return dictionary
}