import React, {Component} from 'react';
import GraphTile from './components/graphTile'

const ws = new WebSocket('ws://192.168.2.111:7123/ws')

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
        return (
            <div className="app">
                <GraphTile />
            </div>
        )
    }
}

export default App;
