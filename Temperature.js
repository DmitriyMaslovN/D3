
const w = 1500;
const h = 600;

const tempSvg = d3.select(".main")
                 .append("svg")
                 .attr("width", w +100)
                 .attr("height", h +180 )
                 .attr("class", "dotSvg")


const tooltip = d3.select(".main")
                  .append("div")
                  .attr("id", "tooltip")
                  .style("opacity", 0)
                  .style("font-size", "22px")
                  .style("pointer-events", "none") // prevent stiking tooltip

d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json").then( (data)=>{
  tempSvg.append("text")
        .text("Monthly Global Land-Surface Temperature")
        .attr("id", "title")
        .attr("x", w/3)
        .attr("y", 50)
        .style("font-size", "30px")
        .attr("fill", "white")
  
    tempSvg.append("text")
        .text("Temperature by year: 1753 - 2015")
        .attr("id", "description")
        .attr("x", w/2.5)
        .attr("y", 80)
        .style("font-size", "25px")
        .attr("fill", "white")
  const xScale = d3.scaleLinear()
                   .domain([d3.min(data.monthlyVariance, d => d["year"]-1 ), 
                            d3.max(data.monthlyVariance, d => d["year"]) ]) 
                   .range([60, w])
                 
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format(".0f")).ticks(40); // every 5 years
  
tempSvg.append("g")
        .attr("id", "x-axis")
        .attr("transform", "translate(30," + h  + ")")
        .style("font-size", "11px")
        .call(xAxis);
  const yScale = d3.scaleLinear()
                   .domain([d3.min(data.monthlyVariance, d => d["month"] -1.5 ), // little space from bottom
                            d3.max(data.monthlyVariance, d => d["month"]) - 0.5])
                   .range([h,100 ]);
  
  const timeFormat = d3.timeFormat("%B")
  const yAxis = d3.axisLeft(yScale).tickFormat(d => timeFormat(new Date(1970,d,1,0,0,0))) // variable year, just need month
  
  tempSvg.append("g")
        .attr("id", "y-axis")
        .attr("transform", "translate(90, 0)")
        .style("font-size", "16px")
        .call(yAxis);
  
  tempSvg.append("text")
        .text("Month")
        .attr("transform", "rotate(-30)")
        .attr("x", -30)
        .attr("y", 100)
        .style("font-size", "25px")
        .attr("fill", "lightblue");
  tempSvg.append("text")
          .attr("id", "legend")
          .text("Years")
          .attr("fill", "lightblue")
          .style("font-size", "25px")
          .attr("transform", "translate(" +  ( w/2)  + "," + (h +50)  +")")
   tempSvg.append("text")
          .text("Base temperature: " + data.baseTemperature + "°C")
          .attr("fill", "lightblue")
          .style("font-size", "25px")
          .attr("transform", "translate(" +  105  + "," + (h +150)  +")")
  
    var variance = data.monthlyVariance.map(d => d["variance"]);
    var minTemp = data.baseTemperature + Math.min(...variance)  // get temperature range min max from base
    var maxTemp = data.baseTemperature + Math.max(...variance)

    // aproximate solution 'legend' here http://bl.ocks.org/couchand/6537398
  const colorScale =  d3.scaleThreshold()    // returns the extent value in the domain [und,0][0,1][1,und]                
                        .domain([minTemp,(minTemp + 2.2), 
                                 (data.baseTemperature - 2.2),
                                 data.baseTemperature,
                                 (data.baseTemperature + 2.2), 
                                 maxTemp])
                        .range(["#200eef","#2112d1","#8bc2ef", "#a3ffa0", "#e5a7be","#d72727"])  
                        
  const xScaleLeg = d3.scaleLinear()
                      .domain([minTemp, maxTemp])
                      .range([0, 300])
  
  const xAxisLeg = d3.axisBottom(xScaleLeg)
                     .tickFormat(d3.format(".1f")) 
                     .tickValues(colorScale.domain()); // add scale and decimal value for the color and our scale
  const legend = tempSvg.append("g")
                        .attr("id", "legend")
                        .attr("transform", "translate(100, " + (h + 100) + ")")
                        .call(xAxisLeg)
                        
  legend.append("g").selectAll("rect")
       .data(colorScale.range().map( d =>colorScale.invertExtent(d)))
        .enter()
        .append("rect") 
        .attr("class", "cellLeg")
        .attr("height", 20)
        .attr("fill", d =>  colorScale(d[0])) // from what color
        .attr("x", d => xScaleLeg(d[0]))  // offset by x
        .attr("width", d => xScaleLeg(d[1]) - xScaleLeg(d[0])) // min max domain x - scale leg
        .attr("transform", "translate(0, -20)");
  
   tempSvg.append("g")
        .selectAll("rect")  // haven't created, but we take it
        .data(data.monthlyVariance)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", d => xScale(d["year"]))  // the same line in x axis
        .attr("y", d => yScale(d["month"]))  // the same line in y axis
        .attr("width", 4)
        .attr("height",42)
        .attr("data-month", d => d["month"] - 1) // month 0 - 11
        .attr("data-year", d => d["year"])
        .attr("data-temp", d =>{
          return data.baseTemperature + d.variance  // base temp + difference
          })
        .attr("fill",  d => {
         return colorScale(data.baseTemperature + d.variance)
          })
        .style("cursor", "pointer")
        .style("stroke", "black") // stroke border
        .attr("transform", "translate(28, 20)")
        .on("mouseover", d => {
          tooltip.style("opacity", 1) // shoe tooltip
                 .style("position", "absolute")
                 .attr("data-year", d["year"])
                 .style("color", "white")
          tooltip.html("Year: "+ d["year"]+ ", Month: " +timeFormat(new Date(1970,d["month"],0)) + // full month name
                       "<br/>" +
                     (data.baseTemperature + d.variance).toFixed(3) + " &#8451;" + "<br/>"+
                      d.variance + " &#8451;") 
                  .style("top", d3.event.pageY - 120 + "px") // position on bar bit lower cursor
                  .style("left", d3.event.pageX + 5 + "px")
              
          })
          .on("mouseout", d => tooltip.style("opacity", 0));
   
})
