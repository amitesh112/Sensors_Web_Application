import cors from 'cors';
import Express from 'express';
import bodyparser from 'body-parser';
import assert from 'assert';
import STATUS from 'http-status';

import { SensorsInfo } from './sensors-info.js';
import { SensorType, Sensor, SensorReading } from './validators.js';
import { Errors } from 'cs544-js-utils';
import { DEFAULT_INDEX, DEFAULT_COUNT } from './params.js';

import { Link, SelfLinks, NavLinks,
	 SuccessEnvelope, PagedEnvelope, ErrorEnvelope }
  from './response-envelopes.js';
import { Result } from 'cs544-js-utils/dist/lib/errors.js';


//Based on 
//<https://plainenglish.io/blog/typed-express-request-and-response-with-typescript>
//Instead of depending on express.js types, specify query-string types
type RequestWithQuery = Express.Request
  & { query: { [_: string]: string|string[]|number } };

export type App = Express.Application;

type ServeRet = {
  app: App,
  close: () => void,
};

type SERVER_OPTIONS = {
  base?: string,
};
    
export function serve(model: SensorsInfo, options: SERVER_OPTIONS={})
  : ServeRet
{
  const app = Express();
  app.locals.sensorsInfo = model;
  const { base = '/sensors-info',  } = options;
  app.locals.base = base;
  setupRoutes(app);
  const close = () => app.locals.sessions.close();
  return { app, close };
}


function setupRoutes(app: Express.Application) {
  const base = app.locals.base;

  //allow cross-origin resource sharing
  app.use(cors(CORS_OPTIONS));

  //assume that all request bodies are parsed as JSON
  app.use(Express.json());

  //if uncommented, all requests are traced on the console
  // app.use(doTrace(app));

  //TODO: add routes
  app.put(`${base}/sensor-types`, doCreateSensorType(app));
  app.put(`${base}/sensors`, doCreateSensors(app));
  app.put(`${base}/sensor-readings`, doCreateSensorReadings(app));
  

  app.get(`${base}/sensor-types/:id`, doGetSensorType(app));
  app.get(`${base}/sensors/:id`, doGetSensors(app));

  app.get(`${base}/sensor-types`,doFindSensorTypes(app));
  app.get(`${base}/sensors`,doFindSensor(app));
  app.get(`${base}/sensor-readings`, findSensorReading(app));

  //must be last
  app.use(do404(app));  //custom handler for page not found
  app.use(doErrors(app)); //custom handler for internal errors
}

// TODO: add route handlers 
function doCreateSensorType(app: Express.Application) {
  return (async function(req: Express.Request, res: Express.Response) {
    try {
      const result = await app.locals.sensorsInfo.addSensorType(req.body);
      if (!result.isOk) throw result;
      const currSensorType = result.val;
      // const { id } = currSensorType;
      res.location(selfHref(req, currSensorType.id));
      const response = selfResult<SensorType>(req, currSensorType, STATUS.CREATED);
      res.status(STATUS.CREATED).json(response);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doCreateSensors(app: Express.Application) {
  return (async function(req: Express.Request, res: Express.Response) {
    try {
      const result = await app.locals.sensorsInfo.addSensor(req.body);
      if (!result.isOk) throw result;
      const sensor = result.val;
      const { id }=sensor;
      res.location(selfHref(req, id));
      const response = selfResult<Sensor>(req, sensor, STATUS.CREATED);
      res.status(STATUS.CREATED).json(response);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
function doCreateSensorReadings(app: Express.Application) {
  return (async function(req: Express.Request, res: Express.Response) {
    try {
      const result = await app.locals.sensorsInfo.addSensorReading(req.body);
      if (!result.isOk) throw result;
      const sensorRead = result.val;
      res.location(selfHref(req, sensorRead.id));
      const response =
	selfResult<SensorReading>(req, sensorRead, STATUS.CREATED);
      res.status(STATUS.CREATED).json(response);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


function doGetSensorType(app: Express.Application) {
  return (async function(req: Express.Request, res: Express.Response) {
    try {
      const sensorTypeId = req.params.id;
      const result = await app.locals.sensorsInfo.findSensorTypes({ sensorTypeId });
      if (!result.isOk) throw result;
      if (result.val.length === 0) { // Check if the result is empty
          return res.status(404).json(result);
      }
      const sensorTypes = result.val[0];

      const response = selfResult<SensorType>(req, sensorTypes);
      res.json(response);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
function doGetSensors(app: Express.Application) {
  return (async function(req: Express.Request, res: Express.Response) {
    try {
      const sensorId = req.params.id;
      const result = await app.locals.sensorsInfo.findSensors( {id : sensorId} );
      if (!result.isOk) throw result;
      if(result.val.length===0){
        const temp = {
          isOk:false,
          status: STATUS.NOT_FOUND,
          errors: [	{ options: { code: 'NOT_FOUND' } }, ],
        };
        res.status(404).json(temp);
      }
      const sensors = result.val[0];
      const response = selfResult(req, sensors);
      res.json(response);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doFindSensorTypes(app:Express.Application){
  return (async function(req:Express.Request, res: Express.Response){
    try{
        // Modify the query to request one more result than requested by the count query parameter
        const q = { ...req.query };      
        // const index = Number(q.index ??  DEFAULT_INDEX);
        const count = Number(q.count ??  DEFAULT_COUNT);
        const q1 = { ...q, count: count + 1 };

        // Call the findSensorTypes service with the modified query
        const result = await app.locals.sensorsInfo.findSensorTypes(q1);

        if (!result.isOk) throw result;

        // Send each object individually in the response
        const response = pagedResult<SensorType>(req, 'id', result.val);
        res.json(response);
    }
    catch(err){
      const mapped=mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
function doFindSensor(app:Express.Application){
  return (async function(req:Express.Request, res: Express.Response){
    try{
        // Modify the query to request one more result than requested by the count query parameter
        const q = { ...req.query };      
        // const index = Number(q.index ??  DEFAULT_INDEX);
        const count = Number(q.count ??  DEFAULT_COUNT);
        const q1 = { ...q, count: count + 1 };

        // Call the findSensorTypes service with the modified query
        const result = await app.locals.sensorsInfo.findSensors(q1);

        if (!result.isOk) throw result;

        // Send each object individually in the response
        const response = pagedResult<Sensor>(req, 'id', result.val);
        res.json(response);
    
    }
    catch(err){
      const mapped=mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
function findSensorReading(app:Express.Application){
  return (async function(req:Express.Request, res: Express.Response){
    try{
        // Modify the query to request one more result than requested by the count query parameter
        const q = { ...req.query };      
        // const index = Number(q.index ??  DEFAULT_INDEX);
        const count = Number(q.count ??  DEFAULT_COUNT);
        const q1 = { ...q, count: count + 1 };

        // Call the findSensorTypes service with the modified query
        const result = await app.locals.sensorsInfo.findSensorReadings(q1);

        if (!result.isOk) throw result;

        // Send each object individually in the response
        const response = pagedResult<SensorReading>(req, 'value', result.val);
        res.json(response);
    
    }
    catch(err){
      const mapped=mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doTrace(app: Express.Application) {
  return (async function(req: Express.Request, res: Express.Response, 
			 next: Express.NextFunction) {
    console.log(req.method, req.originalUrl);
    next();
  });
}


/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app: Express.Application) {
  return async function(req: Express.Request, res: Express.Response) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result = {
      status: STATUS.NOT_FOUND,
      errors: [	{ options: { code: 'NOT_FOUND' }, message, }, ],
    };
    res.status(404).json(result);
  };
}

/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app: Express.Application) {
  return async function(err: Error, req: Express.Request, res: Express.Response,
			next: Express.NextFunction) {
    const message = err.message ?? err.toString();
    const [status, code] = (err instanceof SyntaxError)
      ? ['BAD_REQUEST', 'SYNTAX' ]
      : ['INTERNAL_SERVER_ERROR', 'INTERNAL'];
    const result = {
      status: STATUS[status],
      errors: [ { options: { code }, message } ],
    };
    res.status(Number(STATUS[status])).json(result);
    if (status === 'INTERNAL_SERVER_ERROR') console.error(result.errors);
  };
}



/************************* HATEOAS Utilities ***************************/

/** Return original URL for req */
function requestUrl(req: Express.Request) {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

/** Return path for req.  If id specified extend with /id, otherwise add in
 *  any query params. 
 */
function selfHref(req: Express.Request, id: string = '') {
  const url = new URL(requestUrl(req));
  return url.pathname + (id ? `/${id}` : url.search);
}

/** Produce paging link for next (dir === 1), prev (dir === -1)
 *  for req having nResults results.  Return undefined if there
 *  is no such link.
 */
function pageLink(req: Express.Request, nResults: number, dir: 1|-1) {
  const url = new URL(requestUrl(req));
  const count = Number(req.query?.count ?? DEFAULT_COUNT);
  const index0 = Number(url.searchParams.get('index') ?? 0);
  if (dir > 0 ? nResults <= count : index0 <= 0) return undefined;
  const index = dir > 0 ? index0 + count : count > index0 ? 0 : index0 - count;
  url.searchParams.set('index', String(index));
  url.searchParams.set('count', String(count));
  return url.pathname + url.search;
}

/** Return a success envelope for a single result. */
function selfResult<T>(req: Express.Request, result: T,
		       status: number = STATUS.OK)
  : SuccessEnvelope<T>
{
  const method = req.method;
  return { isOk: true,
	   status,
	   links: { self: { rel: 'self', href: selfHref(req), method } },
	   result,
	 };
}


/** Return a paged envelope for multiple results for type T. */
function pagedResult<T>(req: Express.Request, idKey: keyof T, results: T[])
  : PagedEnvelope<T>
{
  const nResults = results.length;
  const result = //(T & {links: { self: string } })[]  =
    results.map(r => {
      const selfLinks : SelfLinks =
	{ self: { rel: 'self', href: selfHref(req, String(r[idKey])),
		  method: 'GET' } };
	return { result: r, links: selfLinks };
    });
  const links: NavLinks =
    { self: { rel: 'self', href: selfHref(req), method: 'GET' } };
  const next = pageLink(req, nResults, +1);
  if (next) links.next = { rel: 'next', href: next, method: 'GET', };
  const prev = pageLink(req, nResults, -1);
  if (prev) links.prev = { rel: 'prev', href: prev, method: 'GET', };
  const count = req.query.count ? Number(req.query.count) : DEFAULT_COUNT;
  return { isOk: true, status: STATUS.OK, links,
	   result: result.slice(0, count), };
}
 
/*************************** Mapping Errors ****************************/

//map from domain errors to HTTP status codes.  If not mentioned in
//this map, an unknown error will have HTTP status BAD_REQUEST.
const ERROR_MAP: { [code: string]: number } = {
  EXISTS: STATUS.CONFLICT,
  NOT_FOUND: STATUS.NOT_FOUND,
  BAD_REQ: STATUS.BAD_REQUEST,
  AUTH: STATUS.UNAUTHORIZED,
  DB: STATUS.INTERNAL_SERVER_ERROR,
  INTERNAL: STATUS.INTERNAL_SERVER_ERROR,
}

/** Return first status corresponding to first options.code in
 *  errors, but INTERNAL_SERVER_ERROR dominates other statuses.  Returns
 *  BAD_REQUEST if no code found.
 */
function getHttpStatus(errors: Errors.Err[]) : number {
  let status: number = 0;
  for (const err of errors) {
    if (err instanceof Errors.Err) {
      const code = err?.options?.code;
      const errStatus = (code !== undefined) ? ERROR_MAP[code] : -1;
      if (errStatus > 0 && status === 0) status = errStatus;
      if (errStatus === STATUS.INTERNAL_SERVER_ERROR) status = errStatus;
    }
  }
  return status !== 0 ? status : STATUS.BAD_REQUEST;
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapResultErrors(err: Error|Errors.ErrResult) : ErrorEnvelope {
  const errors = err instanceof Errors.ErrResult
    ? err.errors
    : [ new Errors.Err(err.message ?? err.toString(), {code: 'UNKNOWN'}), ];
  const status = getHttpStatus(errors);
  if (status === STATUS.INTERNAL_SERVER_ERROR)  console.error(errors);
  return { isOk: false, status, errors, };
} 

/**************************** CORS Options *****************************/

/** options which affect whether cross-origin (different scheme, domain or port)
 *  requests are allowed
 */
const CORS_OPTIONS = {
  //if localhost origin, reflect back in Access-Control-Allow-Origin res hdr
  // origin: /localhost:\d{4}/,
  
  // simple reflect req origin hdr back to Access-Control-Allow-Origin res hdr
  origin: true,

  //methods allowed for cross-origin requests
  methods: [ 'GET', 'PUT', ],

  //request headers allowed on cross-origin requests
  //used to allow JSON content
  allowedHeaders: [ 'Content-Type', ],

  //response headers exposed to cross-origin requests
  exposedHeaders: [  'Location', 'Content-Type', ],
};

