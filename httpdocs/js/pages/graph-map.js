/**
 * (C) 2020-21 - ntop.org
 * Script used by the network inside the Service/Periodicity Map.
 */

let network;
let updateViewStateId;
let highlightActive = false;
let nodesDataset = [];
let edgesDataser = [];

const SAVE_TIMEOUT = 500;
const MIN_SCALE = 0.15;

if (MAP === undefined) {
    console.error("The MAP constant is not defined!");
}

const defaultOptions = { 
    autoResize: true, 
    nodes: { 
        shape: "dot", 
        scaling: {
            min: 10,
            max: 30,
            label: {
                min: 8,
                max: 30,
            },
        },
        shadow: false,
    },
    edges: {
        width: 0.15,
        color: { inherit: "from" },
        smooth: {
            type: "continuous",
            roundness: 0
        },
    },
    interaction: {
        tooltipDelay: 150,
        hideEdgesOnDrag: true,
        hideEdgesOnZoom: true,
    },
    physics: {
        barnesHut: {
            springConstant: 0,
            avoidOverlap: 0.3,
            gravitationalConstant: -1000,
            damping: 0.65,
            centralGravity: 0
        },
        stabilization: {
            onlyDynamicEdges: false
        }
    }
};

function saveTopologyView(network) {

    // get all nodes position
    const positions = network.getPositions(data.nodes.map(x => x.id));

    // save the nodes position, the network scale and the network view position
    const info = {
        positions: positions,
        network: {
            scale: network.getScale(),
            position: network.getViewPosition()
        }
    };

    $.post(`${http_prefix}/lua/pro/enterprise/map_handler.lua`, { JSON: JSON.stringify(info), csrf: VIEW_CSRF, map: MAP, action: 'save_view' });
}

function setEventListenersNetwork(network) {

    network.on("click", function(e) {
    });

    network.on("doubleClick", function (params) {

        const target = params.nodes[0];
        const selectedNode = data.nodes.find(n => n.id == target);

        let query = "";
        // same thing for the host_pool_id
        if (hostPoolId !== "") {
            query = `&host_pool_id=${hostPoolId}`;
        }
        // for the VLAN id as well
        if (vlanId !== "") {
            query = `&vlan=${vlanId}`;
        }
        if (unicastOnly !== "") {
            query = `&unicast_only=true`;
        }

        if (selectedNode !== undefined && host === "") {
            window.location.href = http_prefix + `/lua/pro/enterprise/${MAP}_map.lua?page=graph&host=` + selectedNode.id + query;
        }
        else if (selectedNode !== undefined && host !== "") {
            window.location.href = http_prefix + '/lua/host_details.lua?host=' + selectedNode.id;
        }

    });

    network.on('zoom', function(e) {

        if (network.getScale() <= MIN_SCALE) {
            network.moveTo({
                scale: MIN_SCALE + 0.25,
                position: {x: 0, y: 0},
                animation: { duration: 1000, easingFunction: 'easeInOutCubic' }
            });
        }

        if (SAVE_TIMEOUT !== undefined) {
            clearTimeout(updateViewStateId);
        }

        updateViewStateId = setTimeout(saveTopologyView, SAVE_TIMEOUT, network);
    });

    network.on("dragEnd", function(e) {

        if (updateViewStateId !== undefined) {
            clearTimeout(updateViewStateId);
        }

        saveTopologyView(network);
    });
}

function loadGraph(container) {

    const dataRequest = { action: 'load_graph', map: MAP};
    // if an host has been defined inside the URL query then add it to the request
    if (host !== "") {
        dataRequest.host = host;
    }
    // same thing for the host_pool_id
    if (hostPoolId !== "") {
        dataRequest.host_pool_id = hostPoolId;
    }
    // for the VLAN id as well
    if (vlanId !== "") {
        dataRequest.vlan = vlanId;
    }
    if (unicastOnly !== "") {
        dataRequest.unicast_only = true;
    }

    const request = $.get(`${http_prefix}/lua/pro/enterprise/map_handler.lua`, dataRequest);
    request.then(function(response) {
        
        data = response;

        const {nodes, edges} = data;
        nodesDataset = new vis.DataSet(nodes);
        edgesDataset = new vis.DataSet(edges);
        const datasets = {nodes: nodesDataset, edges: edgesDataset};

        network = new vis.Network(container, datasets, defaultOptions);
        saveTopologyView(network);
        setEventListenersNetwork(network);
    });
}

function stabilizeNetwork(network) {
    
    if (network === undefined) {
        console.error("The network is undefined!");
        return;
    }

    if (!(network instanceof vis.Network)) {
        console.error("Not a vis.Network instance!");
        return;
    }

    network.stabilize(1000);

    setTimeout(() => {
        saveTopologyView(network);
    }, 1000);

    $(`#autolayout-modal`).modal('hide');
}

$(document).ready(function() {
    $(`button[data-toggle="tooltip"]`).tooltip();
});