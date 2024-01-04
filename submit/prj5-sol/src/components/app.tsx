import React from 'react';

// import { makeSensorsWs, SensorsWs } from '../lib/sensors-ws.js';
import { PagedValues, makeSensorsWs, SensorsWs } from '../lib/sensors-ws';
import Tab from './tab.js';
import  AddSensorType from './AddSensorType.js'; 
import  FindSensorType from './FindSensorType.js'; 
import  AddSensor from './AddSensor.js'; 
import  FindSensor from './FindSensor.js'; 
import SENSOR_FIELDS from './sensor-fields.js';

type AppProps = {
  wsUrl: string,
};
export default function App(props: AppProps) {
  const ws = makeSensorsWs(props.wsUrl);
  const [ selectedId, selectTab ] = React.useState('addSensorType');
  
  return (
    <div className="tabs">
      <Tab id="addSensorType" label="Add Sensor Type" 
           isSelected={selectedId === 'addSensorType'}
           select={selectTab}>
            <AddSensorType ws={ws}/>
      </Tab>
      <Tab id="addSensor" label="Add Sensor" 
           isSelected={selectedId === 'addSensor'}
           select={selectTab}>
           <AddSensor ws={ws} />
      </Tab>
      <Tab id="findSensorTypes" label="Find Sensor Types" 
           isSelected={selectedId === 'findSensorTypes'}
           select={selectTab}>
            <FindSensorType ws={ws}/>
      </Tab>
      <Tab id="findSensors" label="Find Sensors" 
           isSelected={selectedId === 'findSensors'}
           select={selectTab}>
            <FindSensor ws={ws}/>
      </Tab>
    </div>
  );
}

