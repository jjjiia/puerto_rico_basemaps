var width = 1500//window.innerWidth// could be also a integer ex: var width = 500
var height = 600//window.innerHeight// could be also a integer  ex: var height = 800
var selectedColumn ="PCT_SE_T096_002"
var colorStart = "white"
var colorEnd = "red"
var colorHighlight = "black"
var svg = d3.select("#map").append("svg")
			.attr("width",width)
			.attr("height",height)
var pubProjection = null
d3.queue()
    .defer(d3.json, "data/newYorkCity_noWater.geojson")
	.defer(d3.json,"data/newYorkCity_centroids.geojson")
	.defer(d3.csv, "data/R11821648_SL150.csv")
	.defer(d3.json, "data/dataDictionary.json")
    .await(ready);
	
function ready(error, nyc, centroids, data, dataDictionary){
	if (error) throw error;
	var dataFormatted =csvToDict(data,"Geo_GEOID")
	
	drawGeo(nyc,dataFormatted,dataDictionary,"map")
	drawGeo(nyc,dataFormatted,dataDictionary,"chart")
	
	d3.select("#dataColumn")
	.html("Current Shown Data Column: <span style=\"color:"
		+colorEnd
		+"\" ><strong>"
		+dataDictionary[selectedColumn.replace("SE_","")]
		+"<strong></span>")
	
	var centroidsFormatted = centroidsDict(centroids)
	//continuousColor(dataFormatted,selectedColumn,centroidsFormatted)
		fixedInterval(dataFormatted,selectedColumn,centroidsFormatted)
        
    //quantiles(dataFormatted,selectedColumn,centroidsFormatted,4)
	d3.select("#continuous")
	.on("click",function(){
		continuousColor(dataFormatted,selectedColumn,centroidsFormatted)
	})
	d3.select("#fixedInterval")
	.on("click",function(){
		fixedInterval(dataFormatted,selectedColumn,centroidsFormatted)
	})
}

function drawGeo(geoData,data,dataDictionary,className){
	var svg = d3.select("#map svg")

	var myProjection = d3.geoAlbers().fitExtent([[10, 10], [height,height]], geoData);
	pubProjection = myProjection
	var myPath = d3.geoPath().projection(myProjection)
		
	svg.selectAll("."+className)
		.data(geoData.features)
		.enter()
		.append("path")
		.attr("class",function(d){
			var geoid = d.properties.GEOID
			return "bg "+className+"_"+geoid
		})
		.attr("d", myPath)
		.on("mouseover", function(d) { 
		//	d3.select(this).style("stroke",colorHighlight).
			var geoid = "15000US"+d.properties.GEOID
			d3.select("#info").html(formatInfoDisplay(geoid,data[geoid],dataDictionary))
		})
		.on("mouseout",function(){
			//d3.select(this).style("stroke","none")
		})
}
function formatInfoDisplay(geoid,geoidData,dataDictionary){
	//var geoidData = data
	var formattedString = ""
	for(var i in geoidData){
		var code = i
		var codeFormatted = i.replace("SE_","")
		var subject = dataDictionary[codeFormatted]
		var value = geoidData[i]
		var column = subject+": <strong>"+value+"</strong></br>"
		//console.log(column)
		if(code==selectedColumn){
			formattedString="<span style=\"font-size:24px; color:"+colorEnd+"\"><strong>"+column+"</strong></span>"+formattedString
		}else{
			formattedString+=column
		}
	}
	return formattedString
}
function csvToDict(data,keyCode){
	var dictionary ={}
	for(var i in data){
		var key = data[i][keyCode]
		dictionary[key]=data[i]
	}
	return dictionary
}
function centroidsDict(data){
	var features = data["features"]
	var formatted = {}
	for(var i in features){
		var geoid = "_"+features[i].properties.GEOID
		var coords = features[i].geometry.coordinates
		formatted[geoid]=coords
	}
	return formatted
}
function sortDataQuantiles(data,column,centroids,intervals){
    var sortedList = []
	for(var i in data){
		var value = parseFloat(data[i][selectedColumn])
        if(isNaN(value)==true){
                value = 0
        }
        sortedList.push([i,value])
	}
	sortedList.sort(function(a,b){
    	return a[1] - b[1];
	});
    var segmentLength = Math.round(sortedList.length/intervals)
    var dictionary = {}
    var idsOnly = []
    for(var k in sortedList){
        idsOnly.push(sortedList[k][0])
    }
    for(j=0;j<intervals;j++){
        dictionary["_"+j]=idsOnly.slice(segmentLength*j,segmentLength*(j+1))
    }
    return dictionary
}
function quantiles(data,column,centroids,intervals){
    
	var colors = ["#ffffff","#ffbfbf","#ffaaaa","#ff5555","#ff0000"]
    d3.select("#map svg").selectAll(".bg")
    	.transition()
    	.duration(1000)
        .style("fill",function(d){
    		var geoid = "15000US"+d.properties.GEOID
    		var value = parseFloat(data[geoid][column])
            var group = null
    		if(value==100){
    			group=intervals
    		}else if(value==0 || isNaN(value)==true){
    			return "#ffffff"
    		}else{
    		    group = Math.floor(value/(100/intervals))
    		}
    		return colors[group]
    	})
    var formattedBins = sortDataQuantiles(data,column,centroids,intervals)
        
        for(var i in formattedBins){
            var bin = formattedBins[i]
            for(var b in bin){
                var geoid = bin[b].split("US")[1]
                d3.select(".map_"+geoid)
                    .transition()
                    .duration(1000)
                    .style("fill",function(){
						//return "red"
						console.log
                        return colors[i.replace("_","")]
                    })
                d3.select(".chart_"+geoid)
                    .transition()
                    .duration(1000)
                    .style("fill",function(){
                        return colors[i.replace("_","")]
                    })
            }
        }
    sortShapes(centroids,data,intervals,formattedBins,3,100,20)
}
function fixedInterval(data,column,centroids){
	d3.selectAll(".button").style("color","#000")
	d3.select("#fixedInterval").style("color","red")
	var colors = ["#ffffff","#ffbfbf","#ffaaaa","#ff5555","#ff0000"]
	
	var intervals = 4
	
	d3.select("#map svg").selectAll(".bg")
		.transition()
		.duration(1000)
	    .style("fill",function(d){
			var geoid = "15000US"+d.properties.GEOID
			var value = parseFloat(data[geoid][column])
            var group = null
			if(value==100){
				group=intervals
			}else if(value==0 || isNaN(value)==true){
				return "#ffffff"
			}else{
			    group = Math.floor(value/(100/intervals))
			}
			return colors[group]
		})
		sortDataFixedInterval(centroids,data,intervals)
		var formattedBins = sortDataFixedInterval(centroids,data,intervals)
        
		sortShapes(centroids,data,intervals,formattedBins,3,110,25)
}
function sortShapes(centroids,data,intervals,formattedBins,gridSize,barSize,columnsPerBar){
		//var formattedBins = sortDataFixedInterval(centroids,data,intervals)
       // var gridSize =3
    	for(var i in formattedBins){
    		//console.log(sorted[i])
    		var bin = i
    		var binContents = formattedBins[bin]
    		d3.selectAll(".bg").style("stroke","none")

    		for(var bg in binContents){
    			var geoid = binContents[bg].split("US")[1]
    			d3.select(".chart_"+geoid)
    			.transition()
    			.duration(1000)
    			.style("stroke","#aaa")
    			.style("stroke-width", .5)
    			.transition()
    			.delay(bg*2+1000+bin.replace("_","")*100)
    			.duration(500)
    			.attr("transform",function(){
    				var centroid = centroids["_"+geoid]
    				var lat = centroid[1]
    				var lng = centroid[0]
    	            var plng = pubProjection([lng,lat])[0]
    	            var plat = pubProjection([lng,lat])[1]
    				var y = Math.round(bg/columnsPerBar)*gridSize+20
    				var x = bg%columnsPerBar*gridSize+20+bin.replace("_","")*barSize
    				//console.log([x,y])
    				//return "translate(450,0)"
    				return "translate("+(-plng+x+height)+","+(-plat+height-y)+")"
    			})
    		}
    	}
}
function sortDataFixedInterval(centroids,data,intervals){
	var fixed = {}
	for(var i in data){
		var value = data[i][selectedColumn]
		if(value!=""){
		//	list.push([i,parseFloat(value)])
			var key = "_"+Math.floor(value/(100/intervals))
			if(Object.keys(fixed).indexOf(key)==-1){
				fixed[key]=[]
				fixed[key].push(i)
			}else{
				fixed[key].push(i)
			}
		}
	}
    console.log(fixed)
		return fixed
}
function continuousColor(data,column,centroids){
	d3.selectAll(".button").style("color","#000")
	d3.select("#continuous").style("color",colorEnd)
	var colorScale = d3.scaleLinear().domain([0,100]).range(["white",colorEnd])
	continuousKey(colorScale)
	d3.selectAll(".bg")
		.transition()
		.duration(1000)
		.style("fill",function(d){
			var geoid = "15000US"+d.properties.GEOID
			return colorScale(data[geoid][column])
		})
	
	
//	sortContinuous(centroids,data)
	var formattedBins = sortDataContinuous(data)
        
	sortShapes(centroids,data,100,formattedBins,2,8,5)
        
}
function sortDataContinuous(data){
	var continuous = {}
	//console.log(data)
	for(var i in data){
		var value = data[i][selectedColumn]
		if(value!=""){
		//	list.push([i,parseFloat(value)])
			var key = "_"+Math.round(value)
			if(Object.keys(continuous).indexOf(key)==-1){
				continuous[key]=[]
				continuous[key].push(i)
			}else{
				continuous[key].push(i)
			}
		}
	}
	//list.sort(function(a,b){
    //	return a[1] - b[1];
	//});
	return continuous
}
function continuousKey(scale){
	var keyWidth = 100
	var keyHeight = 20
	var margin = 30
	
	var key = d3.select("#map svg")
	var legend = key.append("defs").append("svg:linearGradient")
		.attr("id", "gradient")
		.attr("x1", "0%")
		.attr("y1", "100%")
		.attr("x2", "100%")
		.attr("y2", "100%")
		.attr("spreadMethod", "pad");
	
	legend.append("stop").attr("offset", "0%").attr("stop-color", "white").attr("stop-opacity", 1);
	legend.append("stop").attr("offset", "100%").attr("stop-color", "red").attr("stop-opacity", 1);
	
	key.append("rect")
		.attr("width",keyWidth)
		.attr("height",keyHeight)
		.attr("x",0)
		.attr("y",0)
      	.style("fill", "url(#gradient)")
		.attr("transform", "translate("+margin+","+margin+")")
	
	var yScale = d3.scaleLinear().domain([0,100]).range([0,keyWidth])
	var yAxis = d3.axisBottom()
	     .scale(yScale)
	     .ticks(4);

    key.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate("+(margin)+","+(keyHeight+margin)+")")
		.call(yAxis)
		.append("text")
		.attr("x", keyWidth)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("axis title");
}