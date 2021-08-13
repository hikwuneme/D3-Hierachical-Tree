//Setting the dimensions and creating the svg
const margin =  {top: 50, bottom: 0, right: 200, left: 100};
const width = 1050;
const height = 2000;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const svg = d3.select('body').append('svg').attr('width', width).attr('height', height)
                            //.append('g').attr('transform', 'translate('+margin.right+', '+margin.top+')');

//Creating an svg group element
const grp = svg.append('g').attr('transform', 'translate('+margin.right+', '+margin.top+')');
//Creating the tree layout
const tree = d3.tree().size([innerHeight, innerWidth])
const duration = 750
const i = 0

//Creating the zoom element for the tree
svg.call(d3.zoom().on('zoom', function(event) {grp.attr('transform', event.transform)}));

//Loading the data
d3.json('https://a0311773.scedt.tees.ac.uk/IV/data.json')
    .then(data => {
        const root = d3.hierarchy(data, d => d.children) 
        root.x0 = innerHeight/2
        root.y0 = 0
        root.children.forEach(collapse)
        update(root)
    //Function to collapse nodes and children
        function collapse(d) {
            if(d.children) {
              d._children = d.children
              d._children.forEach(collapse)
              d.children = null
            }
          }

        function update(source){
        const nodes = tree(root).descendants()
        const links = tree(root).links()
        nodes.forEach(function(d){d.y = d.depth * 180})
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
//Create the nodes
        const node = grp.selectAll('g.node')
                        .data(nodes, function(d){return d.id})
                    
        const nodeEnter = node.enter()
                                .append('g')
                                .attr('class', 'node')
                                .attr('transform', d => 'translate('+source.y0+', '+source.x0+')')
                                .on("click", click)
//Add circle for nodes
                nodeEnter.append('circle')
                    .attr('class', 'node')
                    .attr('fill', function(d) {return d._children ? "lightsteelblue" : "#fff"})
                    .attr('stroke', 'steel-blue')
                    .attr('stroke-width', 1.5)
                    .attr('r', 1.5)
//Add text for nodes
                nodeEnter.append('text')
                    .attr('dy', 6)
                    .attr('x', d => d.children || d._children ? -10 : 10)
                    .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
                    .attr('font-size', d => 14 - d.depth)
                    .text(d => d.data.name)
//Updating the nodes
        const nodeUpdate = nodeEnter.merge(node)
                nodeUpdate.transition()
                        .duration(duration)
                        .attr('transform', d => 'translate('+d.y+', '+d.x+')')
                nodeUpdate.select('circle')
                        .attr('r', 7)
                        .style("fill", function(d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        })
                        .attr('cursor', 'pointer')
                nodeUpdate.select('text').style('fill-opacity', 1)
//Removing nodes
        const nodeExit = node.exit().transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "translate(" + source.y + "," + source.x + ")";
                        })
                        .remove();
                nodeExit.select('circle')
                      .attr('r', 1e-6);
                nodeExit.select('text')
                      .style('fill-opacity', 1e-6);
//Creating the links
        const link = grp.selectAll('path')
                        .data(links, d => d.target.id)

        const linkEnter = link.enter()
                            .append("path")
                            .attr("d", d => {const o = {x: source.x0, y: source.y0};
                                            return diagonal({source: o, target: o});
                                                                        })
//To update links
        const linkUpdate = linkEnter.merge(link)
                linkUpdate.transition()
                        .duration(duration)
                        .attr('d', function(d){ return diagonal(d, d.parent) });    
//To remove links
        const linkExit = link.exit().transition()
                        .duration(duration)
                        .attr('d', function(d) {const o = {x: source.x, y: source.y}
                                                 return diagonal({source: o, target: o})
                                                                            })
                        .remove();

        nodes.forEach(d => {d.x0 = d.x;
                            d.y0 = d.y})  
//Declaring the click function that was called earlier  
        function click(event, d) {
                if (d.children) {d._children = d.children;
                                d.children = null;}
                else {d.children = d._children;
                        d._children = null;}
                update(d); }
            }                  
        })
//Code is adapted from Mike Bostock's Collapsible Tree Code with some changes and additions made
