import React, {Component} from 'react';
import GraphTile from './components/graphTile'
import ConfigTab from './components/configTab'
import DockLayout from 'rc-dock'


const ws = new WebSocket('ws://192.168.2.111:7123/ws')

const defaultLayout = {
  dockbox: {
    mode: 'horizontal',
    children: [
      {
        mode: 'horizontal',
        tabs: [
          {id: 'graph1', title: 'Graph 1', content: <GraphTile />},
          {id: 'cfg1', title: 'Config 1', content: <ConfigTab />}
        ]
    },
    {
      mode: 'horizontal',
      tabs: [
        {id: 'graph2', title: 'Graph 2', content: <GraphTile />},
        {id: 'cfg2', title: 'Config 2', content: <ConfigTab />}
      ]
    }
    ]
  }
};

const docStyle = {position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}

class App extends Component {
    constructor(props) {
       super(props);

       this.state = {
           ws: null,
           serverData: {}
       };
   }

    componentDidMount() {
        ws.onopen = (evt) => {
            console.log('ws connected')
            this.setState({ ws: ws })
            let cmd = {add_categories: {
                PCBandwidth: {
                    start: "2019-10-22 00:00 -0600",
                    end: "2019-10-22 23:59 -0600"
                    }
                }
            }
            ws.send(JSON.stringify(cmd))
        }

        ws.onmessage = (evt) => {
            let data = JSON.parse(evt.data)
            this.setState({serverData: data})
            console.log(data)
        }

        ws.onclose = () => {
            console.log('ws connection closed')
        }

        ws.error = (evt) => {
            console.log('ws error: ', evt)
        }
    }

    render() {
        return <DockLayout defaultLayout={defaultLayout} style={docStyle}/>
    }
}

export default App;
