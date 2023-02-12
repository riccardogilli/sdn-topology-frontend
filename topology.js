const BASEURL = 'http://localhost:3000'

let hosts = []
let switches = []
let links = []
let id_map = {}
let next_id = 0
let ports_switch = {}

async function get_hosts() {
    let res = await axios.get(BASEURL + '/hosts')
    return res.data
}
async function get_switches() {
    let res = await axios.get(BASEURL + '/switches')
    return res.data
}
async function get_links() {
    let res = await axios.get(BASEURL + '/links')
    return res.data
}

async function get_flow_table(id) {
    let res = await axios.get(BASEURL + '/stats/flow/' + id)
    return res.data
}

function generate_id_int(id_str) {
    id_str = id_str.replace('s', 1);
    return id_str;
}

function reset_topology() {
    id_map = {}
    next_id = 0
    ports_switch = {}
}

function build_topology() {
    let res = []
    let nodes = []
    let edges = []

    if (!switches) {
        switches = []
    }
    for (let [idx, switch_] of switches.entries()) {
        let id = switch_.ports[0].name.split('-')[0] || switch_.dpid
        id_map[id] = next_id
        next_id++;

        nodes.push({
            id: id,
            //x: (600 + 200 * idx),
            //y: 100,
            name: parseInt(switch_.dpid),
            device_type: "switch",
        })

        for (let [idx2, port] of switch_.ports.entries()) {
            ports_switch[port.name] = id
        }
    }

    if (!hosts) {
        hosts = []
    }
    for (let [idx, host] of hosts.entries()) {
        let ip = [host.ipv4[0] || host.ipv6[0]]
        id_map[host.port.name] = next_id
        next_id++
        nodes.push({
            id: host.port.name,
            //x: (400 + 200 * idx),
            //y: 200,
            name: ip,
            device_type: "host"
        })
        edges.push({
            source: id_map[host.port.name],
            target: id_map[host.port.name.split('-')[0]]
        })
    }

    if (!links) {
        links = []
    }
    for (let [idx, link] of links.entries()) {
        if (!link.src || !link.dst) {
            continue
        }

        source = id_map[link.src.name] || id_map[ports_switch[link.src.name]]
        target = id_map[link.dst.name] || id_map[ports_switch[link.dst.name]]

        let present = false
        for (let edge of edges) {
            if ((edge.source == source && edge.target == target) || (edge.source == target && edge.target == source)) {
                present = true
                break
            }
        }

        if (!present) {
            edges.push({
                source: source,
                target: target,
                color: 'red'
            })
        }

    }


    res = {
        nodes,
        links: edges
    }

    return res
}