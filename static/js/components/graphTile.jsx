import React, {Component} from 'react';
import {Line} from 'react-chartjs-2'

const data = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Test Data',
      fill: true,
      lineTension: 0,
      backgroundColor: '#555',
      borderColor: '#0C0',
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0.0,
      borderJoinStyle: 'miter',
      maintainAspectRatio: false,
      pointBorderColor: '#0F0',
      pointBackgroundColor: '#FFFFFF',
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: 'rgba(75,192,192,1)',
      pointHoverBorderColor: 'rgba(220,220,220,1)',
      pointHoverBorderWidth: 2,
      pointRadius: 1,
      pointHitRadius: 10,
      data: [65, 59, 80, 81, 56, 55, 40]
    }
  ]
};

const options = {responsive: true, maintainAspectRatio: false}

class GraphTile extends Component {
    render() {
        return <Line data={data} options={options} />
    }
}

export default GraphTile;
