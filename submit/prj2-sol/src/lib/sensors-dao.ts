import { Console } from 'console';
import { SensorType, Sensor, SensorReading,
	 SensorTypeSearch, SensorSearch, SensorReadingSearch,
       } from './validators.js';

import { Errors, } from 'cs544-js-utils';

import * as mongo from 'mongodb';

/** All that this DAO should do is maintain a persistent data for sensors.
 *
 *  Most routines return an errResult with code set to 'DB' if
 *  a database error occurs.
 */

/** return a DAO for sensors at URL mongodbUrl */
export async function
makeSensorsDao(mongodbUrl: string) : Promise<Errors.Result<SensorsDao>> {
  return SensorsDao.make(mongodbUrl);
}

//the types stored within collections
type DbSensorType = SensorType & { _id: string };
type DbSensor = Sensor & { _id: string };


const MONGO_OPTIONS = {
  ignoreUndefined: true,  //ignore undefined fields in queries
};

export class SensorsDao {
  private readonly client: mongo.MongoClient;
  private readonly sensorTypeGroup: mongo.Collection<SensorType>;
  private readonly sensorGroup: mongo.Collection<Sensor>;
  private readonly sensorReadingGroup: mongo.Collection<SensorReading>;
  
  private constructor(client: mongo.MongoClient, sensorTypeGroup: mongo.Collection<SensorType>,
    sensorGroup: mongo.Collection<Sensor>, 
    sensorReadingGroup: mongo.Collection<SensorReading>) {
    //TODO
    this.client = client;
    this.sensorTypeGroup = sensorTypeGroup;
    this.sensorGroup = sensorGroup;
    this.sensorReadingGroup = sensorReadingGroup;
  }

  /** factory method
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  static async make(dbUrl: string) : Promise<Errors.Result<SensorsDao>> {
    try {
      const client = await (new mongo.MongoClient(dbUrl)).connect();
      const db = client.db();
      const sensorReadingGroup = db.collection<SensorReading>('sensorReadings');
      const sensorTypeGroup = db.collection<SensorType>('sensorTypes');
      const sensorGroup = db.collection<Sensor>('sensors');
      return Errors.okResult(new SensorsDao(client, sensorTypeGroup, sensorGroup, sensorReadingGroup ));
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }

  /** Release all resources held by this dao.
   *  Specifically, close any database connections.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() : Promise<Errors.Result<void>> {
    try {
      await this.client.close();
      return Errors.VOID_RESULT;
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }

  /** Clear out all sensor info in this database
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async clear() : Promise<Errors.Result<void>> {
    try {
      await this.sensorTypeGroup.deleteMany({})
      await this.sensorGroup.deleteMany({});
      return Errors.VOID_RESULT;
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }

  }


  /** Add sensorType to this database.
   *  Error Codes: 
   *    EXISTS: sensorType with specific id already exists in DB.
   *    DB: a database error was encountered.
   */
  async addSensorType(sensorType: SensorType)
    : Promise<Errors.Result<SensorType>>
  {
    try {
      const collection = this.sensorTypeGroup;
      const projection = { _id: false };
      const currentSensorType = await collection.findOne({id: sensorType.id }, {projection});

      if (currentSensorType) {
        return Errors.errResult(
          `Sensor type with ID '${sensorType.id}' already exists.`,
          { code: 'EXISTS'}
        );
      }

      // Insert the new sensor type into the collection
      const result = await collection.insertOne(sensorType);

      if (result.insertedId) {
        // Get the added sensor type from the database
        const addedSensorType = await collection.findOne({ id: sensorType.id }, { projection });
  
        if (addedSensorType) {
          return Errors.okResult(addedSensorType);
        } else {
          return Errors.errResult('Failed to retrieve added sensor type from the database.', 'DB');
        }
      } else {
        return Errors.errResult('Failed to add sensor type to the database.', 'DB');
      }
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }

  }

  /** Add sensor to this database.
   *  Error Codes: 
   *    EXISTS: sensor with specific id already exists in DB.
   *    DB: a database error was encountered.
   */
  async addSensor(sensor: Sensor) : Promise<Errors.Result<Sensor>> {
    try {
      const collection = this.sensorGroup;
      const projection = { _id: false };
      // Check if a sensor with the same ID already exists
      const existingSensor = await collection.findOne({ id: sensor.id }, {projection});

      if (existingSensor) {
        
        return Errors.errResult(
          
          `Sensor with ID '${sensor.id}' already exists.`,
          { code: 'EXISTS'}
        );

      }

      const result = await collection.insertOne(sensor);
      
      if (result.insertedId) {
        // Get the added sensor from the database
        const addedSensor = await collection.findOne({ id: sensor.id }, { projection });
        if(addedSensor){
          return Errors.okResult(addedSensor);
        }else{
          return Errors.errResult('Failed to retrieve added sensor type from the database.', 'DB');
        }
      } else {
        return Errors.errResult('Failed to add sensor to the database.', 'DB');
      }
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }

  }

  /** Add sensorReading to this database.
   *  Error Codes: 
   *    EXISTS: reading for same sensorId and timestamp already in DB.
   *    DB: a database error was encountered.
   */
  async addSensorReading(sensorReading: SensorReading)
    : Promise<Errors.Result<SensorReading>> 
  {

    try {
      const collection = this.sensorReadingGroup;
      const projection = { _id: false };
      // Check if a sensor reading with the same sensor ID and timestamp already exists
      const existingSensorReading = await collection.findOne({
        sensorId: sensorReading.sensorId,
        timestamp: sensorReading.timestamp,
      }, {projection});
  
      if (existingSensorReading) {
        return Errors.errResult(
          `Sensor reading for sensor ID '${sensorReading.sensorId}' at timestamp '${sensorReading.timestamp}' already exists.`,
          { code: 'EXISTS' }
        );
      }
      
  
      // Insert the new sensor reading into the collection
      const result = await collection.insertOne(sensorReading);
  
      if (result.insertedId) {
        // Get the added sensor reading from the database
        const sensorReadingWithId = await collection.findOne({
          sensorId: sensorReading.sensorId,
          timestamp: sensorReading.timestamp,
        }, {projection});
        if(sensorReadingWithId){
          // Return the added sensor reading with the generated ID
          return Errors.okResult(sensorReadingWithId);
        }else{
          return Errors.errResult('Failed to retrieve added sensor type from the database.', 'DB');
        }
        
      } else {
        return Errors.errResult('Failed to add sensor reading to the database.', 'DB');
      }
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }


  }

  /** Find sensor-types which satify search. Returns [] if none. 
   *  Note that all primitive SensorType fields can be used to filter.
   *  The returned array must be sorted by sensor-type id.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensorTypes(search: SensorTypeSearch)
    : Promise<Errors.Result<SensorType[]>> 
  {
    try {
      const query: Record<string, any> = {};
  
      const validSearchFields = ['id', 'manufacturer', 'modelNumber', 'quantity', 'unit'];

      // Add search criteria to the query based on the provided filters
      validSearchFields.forEach(field => {
        if (search[field as keyof SensorTypeSearch]) {
          query[field] = search[field as keyof SensorTypeSearch];
        }
      });

  
      // Find sensor types that match the query
      const sensorTypes = await this.sensorTypeGroup.find(query).sort({ id: 1 }).toArray();
  
      return Errors.okResult(sensorTypes);
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }

  }
  
  /** Find sensors which satify search. Returns [] if none. 
   *  Note that all primitive Sensor fields can be used to filter.
   *  The returned array must be sorted by sensor-type id.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensors(search: SensorSearch) : Promise<Errors.Result<Sensor[]>> 
  {
    try {
      // Initialize an empty query object
      const query: Record<string, any> = {};

      const validSearchFields = ['sensorTypeId', 'id'];
  
      validSearchFields.forEach(field => {
        if (search[field as keyof SensorSearch]) {
          query[field] = search[field as keyof SensorSearch];
        }
      });

      // Find sensors that match the query and sort them by sensor-type id
      const sensors = await this.sensorGroup.find(query).sort({ id: 1 }).toArray();
  
      // Return the matching sensors
      return Errors.okResult(sensors);
    } catch (e) {
      // Handle any database error by returning an error result with the code 'DB'
      return Errors.errResult(e.message, 'DB');
    }

  }

  /** Find sensor readings which satisfy search. Returns [] if none. 
   *  The returned array must be sorted by timestamp.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async findSensorReadings(search: SensorReadingSearch)
    : Promise<Errors.Result<SensorReading[]>> 
  {
    try {
      const query: Record<string, any> = {};
      // Add search criteria to the query based on the provided filters
      
      if (search.sensorId) {
        query.sensorId = search.sensorId;
      }
      
      if (search.minTimestamp && search.maxTimestamp) {
        query.timestamp = { $gte: search.minTimestamp, $lte: search.maxTimestamp };
      }
  
      if (search.minValue && search.maxValue) {
        query.value = { $gte: search.minValue, $lte: search.maxValue };
      } else if (search.minValue) {
        query.value = { $gte: search.minValue };
      }
      
      const readings = await this.sensorReadingGroup.find(query).sort({ timestamp: 1 }).toArray();
  
      return Errors.okResult(readings);
    } catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }
  
} //SensorsDao

//mongo err.code on inserting duplicate entry
const MONGO_DUPLICATE_CODE = 11000;