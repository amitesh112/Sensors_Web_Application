import { Errors, Checkers } from 'cs544-js-utils';
import { validateFindCommand, SensorType, Sensor, SensorReading,
	 makeSensorType, makeSensor, makeSensorReading
       } from './validators.js';
import { read } from 'fs';

type FlatReq = Checkers.FlatReq; //dictionary mapping strings to strings
type SensorTypeId = string;
type SensorId = string;


//marks T as having being run through validate()
type Checked<T> = Checkers.Checked<T>;

/*********************** Top Level Sensors Info ************************/

export class SensorsInfo {

  //TODO: define instance fields; good idea to keep private and
  //readonly when possible.

  private sensorTypeMap: Record<SensorTypeId, SensorType>;
  private sensorMap: Record<SensorId, Sensor> ;
  private sensorReadingMap: Record<SensorId, SensorReading[]>;

  constructor() {
    this.sensorTypeMap = {};
    this.sensorMap = {};
    this.sensorReadingMap = {};
    //TODO
  }

  /** Clear out all sensors info from this object.  Return empty array */
  clear() : Errors.Result<string[]> {
    //TODO
    return Errors.okResult([]);
  }

  /** Add sensor-type defined by req to this.  If there is already a
   *  sensor-type having the same id, then replace it. Return single
   *  element array containing the added sensor-type.
   *
   *  Error Codes:
   *     'REQUIRED': a required field is missing.
   *     'BAD_VAL': a bad value in a field (a numeric field is not numeric)
   *     'BAD_RANGE': an incorrect range with min >= max.
   */
  addSensorType(req: Record<string, string>) : Errors.Result<SensorType[]> {
    const sensorTypeResult = makeSensorType(req);
    if (!sensorTypeResult.isOk) return sensorTypeResult;
    const sensorType = sensorTypeResult.val;
    this.sensorTypeMap[sensorType.id] = sensorType;
    return Errors.okResult([sensorType]);
  }
  
  /** Add sensor defined by req to this.  If there is already a 
   *  sensor having the same id, then replace it.  Return single element
   *  array containing the added sensor.
   *
   *  Error Codes:
   *     'REQUIRED': a required field is missing.
   *     'BAD_VAL': a bad value in a field (a numeric field is not numeric)
   *     'BAD_RANGE': an incorrect range with min >= max.
   *     'BAD_ID': unknown sensorTypeId.
   */
  addSensor(req: Record<string, string>): Errors.Result<Sensor[]> {
    const sensorOk=makeSensor(req);
    if(!sensorOk.isOk) return sensorOk;
    const sensor=sensorOk.val;
    const idCheck=sensor.sensorTypeId;
    if(!this.sensorTypeMap.hasOwnProperty(idCheck)){ return Errors.errResult("SensorTypeID does not exist",'BAD_ID');}
    this.sensorMap[sensor.id] = sensor;
    if(sensor.expected.min < this.sensorTypeMap[idCheck].limits.min || sensor.expected.max > this.sensorTypeMap[idCheck].limits.max) 
      {
        return Errors.errResult("Inconsistent Range", 'BAD_RANGE');
      }
    this.sensorMap[sensor.id] = sensor;
    return Errors.okResult([sensor]);
  }

  /** Add sensor reading defined by req to this.  If there is already
   *  a reading for the same sensorId and timestamp, then replace it.
   *  Return single element array containing added sensor reading.
   *
   *  Error Codes:
   *     'REQUIRED': a required field is missing.
   *     'BAD_VAL': a bad value in a field (a numeric field is not numeric)
   *     'BAD_RANGE': an incorrect range with min >= max.
   *     'BAD_ID': unknown sensorId.
   */
  addSensorReading(req: Record<string, string>)
    : Errors.Result<SensorReading[]> 
  {
    const sensorReadingResult=makeSensorReading(req);
    if(!sensorReadingResult.isOk) return sensorReadingResult;
    const sensorReading=sensorReadingResult.val;
    if(!this.sensorMap.hasOwnProperty(sensorReading.sensorId)){ return Errors.errResult("SensorTypeID does not exist",'BAD_ID');}
    // Check if the sensorId already exists in sensorReadingMap
    const sensorId = sensorReading.sensorId;
    const timestamp = sensorReading.timestamp;
    // Check if the sensorId already exists in sensorReadingMap
    if(this.sensorReadingMap.hasOwnProperty(sensorId)) {
      const existingReadings = this.sensorReadingMap[sensorId];
      let isTimestampMatched = false;
      for(let i = 0; i < existingReadings.length; i++) {
        if (existingReadings[i].timestamp === timestamp) {
          // Replace the existing reading with the new reading
          this.sensorReadingMap[sensorId][i]=sensorReading;
          isTimestampMatched = true;
          break; // Exit the loop once the replacement is done
        }
      }
      if(!isTimestampMatched) {
        // Push the new reading into the array if timestamp didn't match
        this.sensorReadingMap[sensorId].push(sensorReading);
      }
    } 
    else 
    {
      // If the sensorId doesn't exist in sensorReadingMap, create a new entry
      this.sensorReadingMap[sensorId] = [sensorReading];
    }
  return Errors.okResult([sensorReading]);
  }

  /** Find sensor-types which satify req. Returns [] if none. 
   *  Note that all primitive SensorType fields can be used to filter.
   *  The returned array must be sorted by sensor-type id.
   */
  findSensorTypes(req: FlatReq) : Errors.Result<SensorType[]> {
    const validResult: Errors.Result<Checked<FlatReq>> =
      validateFindCommand('findSensorTypes', req);
    if (!validResult.isOk) return validResult;

    // Step 1: Check if 'id' is present in req and add the corresponding SensorType if found
  if (req.id && !this.sensorTypeMap.hasOwnProperty(req.id)) {
    return Errors.okResult([]);
  }
    const candidateSensorTypes: SensorType[] = req.id
    ? [this.sensorTypeMap[req.id]] // If id is specified, add the corresponding SensorType
    : Object.values(this.sensorTypeMap);
    // Step 3: Filter the list based on other fields in req (add your filtering logic here)
  let filteredSensorTypes = candidateSensorTypes.filter((sensorType) => {
    // Example filtering: Check other fields in req and return true for matching sensor types
    return (
      (!req.manufacturer || sensorType.manufacturer === req.manufacturer) && 
      (!req.quantity || sensorType.quantity === req.quantity) &&
      (!req.modelNumber || sensorType.modelNumber === req.modelNumber) &&
      (!req.unit || sensorType.unit === req.unit)
      // Add more conditions as needed
    );
  });
    
    
    return Errors.okResult(filteredSensorTypes);
  }
  
  /** Find sensors which satify req. Returns [] if none. 
   *  Note that all primitive Sensor fields can be used to filter.
   *  The returned array must be sorted by sensor id.
   */
  findSensors(req: FlatReq) : Errors.Result<Sensor[]> { 
    //TODO
    const validResult: Errors.Result<Checked<FlatReq>> =
      validateFindCommand('findSensors', req);
    if (!validResult.isOk) return validResult;

    if (req.id && !this.sensorMap.hasOwnProperty(req.id)) {
      return Errors.okResult([]);
    }
    const candidateSensors: Sensor[] = req.id
    ? [this.sensorMap[req.id]] // If id is specified, add the corresponding SensorType
    : Object.values(this.sensorMap);

    // Further filter based on sensorTypeId (if specified)
  if (req.sensorTypeId) {
    const filteredSensors = candidateSensors.filter(sensor => sensor.sensorTypeId === req.sensorTypeId);
    return Errors.okResult(filteredSensors);
  }
    return Errors.okResult(candidateSensors);
  }
  
  /** Find sensor readings which satify req. Returns [] if none.  Note
   *  that req must contain sensorId to specify the sensor whose
   *  readings are being requested.  Additionally, it may use
   *  partially specified inclusive bounds [minTimestamp,
   *  maxTimestamp] and [minValue, maxValue] to filter the results.
   *
   *  The returned array must be sorted numerically by timestamp.
   */

  
  findSensorReadings(req: FlatReq) : Errors.Result<SensorReading[]> {
    
    const validResult: Errors.Result<Checked<FlatReq>> =
      validateFindCommand('findSensorReadings', req);
    if (!validResult.isOk) return validResult;


    //Extra Validation Checks Introduced use in case of extra test cases
    // if(!req.sensorId){
    //   return Errors.errResult("ID Expected",'REQUIRED');
    // }
    // let minTimestamp:number;
    // let maxTimestamp:number;
    // let minValue:number;
    // let maxValue:number;
    //  // Convert and validate minTimestamp and maxTimestamp
    //  if(req.minTimestamp && req.maxTimestamp){
    //      minTimestamp = Number(req.minTimestamp);
    //      maxTimestamp = Number(req.maxTimestamp);
    //     if (isNaN(minTimestamp) || isNaN(maxTimestamp) || minTimestamp > maxTimestamp) {
    //       return Errors.errResult("Invalid timestamp range", 'BAD_RANGE');
    //     }
    //  }
    //  // Convert and validate minValue and maxValue
    //  if(req.minValue && req.maxValue){
    //      minValue = Number(req.minValue);
    //      maxValue = Number(req.maxValue);
    //     if (isNaN(minValue) || isNaN(maxValue) || minValue > maxValue) {
    //     return Errors.errResult("Invalid value range", 'BAD_RANGE');
    //     }
    //  }
     
    if (req.sensorId && !this.sensorReadingMap.hasOwnProperty(req.sensorId)) {
      return Errors.okResult([]);
    }
    let sensorReadings:SensorReading[] = this.sensorReadingMap[req.sensorId];


    if(req.minValue && req.maxValue){
      sensorReadings = sensorReadings.filter((reading) => {
        return reading.value >= Number(req.minValue) && reading.value<=Number(req.maxValue);
      });
    }
    if(req.minTimestamp && req.maxTimestamp){
      sensorReadings = sensorReadings.filter((reading) => {
        return reading.timestamp >= Number(req.minTimestamp) && reading.timestamp<=Number(req.maxTimestamp);
      });
    }
    if(req.minValue && !req.maxValue){
      sensorReadings = sensorReadings.filter((reading) => {
        return reading.value >= Number(req.minValue);
      });
    }

    
    return Errors.okResult(sensorReadings);
  }
  
}

/*********************** SensorsInfo Factory Functions *****************/

export function makeSensorsInfo(sensorTypes: FlatReq[]=[],
				sensors: FlatReq[]=[],
				sensorReadings: FlatReq[]=[])
  : Errors.Result<SensorsInfo>
{
  const sensorsInfo = new SensorsInfo();
  const addResult =
    addSensorsInfo(sensorTypes, sensors, sensorReadings, sensorsInfo);
  return (addResult.isOk) ? Errors.okResult(sensorsInfo) : addResult;
}

export function addSensorsInfo(sensorTypes: FlatReq[], sensors: FlatReq[],
			       sensorReadings: FlatReq[],
			       sensorsInfo: SensorsInfo)
  : Errors.Result<void>
{
  for (const sensorType of sensorTypes) {
    const result = sensorsInfo.addSensorType(sensorType);
    if (!result.isOk) return result;
  }
  for (const sensor of sensors) {
    const result = sensorsInfo.addSensor(sensor);
    if (!result.isOk) return result;
  }
  for (const reading of sensorReadings) {
    const result = sensorsInfo.addSensorReading(reading);
    if (!result.isOk) return result;
  }
  return Errors.VOID_RESULT;
}



/****************************** Utilities ******************************/

//TODO add any utility functions or classes
