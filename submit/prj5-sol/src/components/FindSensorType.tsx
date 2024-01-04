import React, { useEffect } from 'react';
import { useState } from "react";
import { Errors } from 'cs544-js-utils';
import { PagedValues, makeSensorsWs, SensorsWs } from '../lib/sensors-ws';
import SENSOR_DEFS, { FieldDef } from './sensor-fields';
import FormResult from './FormResult';
import MakeElement from './MakeElement';
import SensorResults from './SensorResults';
import Scroll from './Scroll';


type AppProps = {
  ws: SensorsWs, // Assuming SensorsWs is the correct type
};

function FindSensorTypeForm(props: AppProps) {
  const handlePrevClick = async () => {
    if (resultLinks.prev) {
      const prevResult = await ws.findSensorTypesByRelLink(resultLinks.prev);

      if (prevResult.isOk) {
        setResults(prevResult.val.values);
        setResultLinks({ prev: prevResult.val.prev, next: prevResult.val.next });
      } else {
        console.error("Error fetching next results");
      }
    }
  };
  const handleNextClick = async () => {
    if (resultLinks.next) {
      const nextResult = await ws.findSensorTypesByRelLink(resultLinks.next);

      if (nextResult.isOk) {
        setResults(nextResult.val.values);
        setResultLinks({ prev: nextResult.val.prev, next: nextResult.val.next });
      } else {
        console.error("Error fetching next results");
      }
    }
  };
  const { ws } = props;
  const [results, setResults] = useState<Record<string, string>[]>([]);
  const [resultLinks, setResultLinks] = useState<{ prev?: string; next?: string }>({});
  const [submitted, setSubmitted] = useState(false); 
  const [formData, setFormData] = useState({
    id: '',
    manufacturer: '',
    modelNumber: '',
    quantity: '',
    unit: '',
  });
  const [formErrors, setFormErrors] = useState({
    id: '',
    manufacturer: '',
    modelNumber: '',
    quantity: '',
    unit: '',
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  function clearErrors(rootId: string) {
    document.querySelectorAll(`.${rootId}-errors`).forEach((el) => {
      el.innerHTML = '';
    });
  
    // Clear form errors state using the callback function
    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors, id: '', sensorTypeId: '' };
      return newErrors;
    });
  }
  function getFormData(form: HTMLFormElement) : Record<string, string> {
    const pairs =
      [...new FormData(form).entries()]
      .map(([k, v]) => [k, v as string])
      .filter(([_, v]) => v.trim().length > 0);
    return Object.fromEntries(pairs);
  }
  function displayErrors(rootId: string, errors: Errors.Err[]) {
    for (const err of errors) {
      const id = err.options.widget;
      const widget = id && document.querySelector(`#${rootId}-${id}-error`);
      if (widget) {
        widget.append(err.message);
      }
      else {
        const li = makeElement('li', {class: 'error'}, err.message);
        document.querySelector(`#${rootId}-errors`)!.append(li);
      }
    }
  }
  function makeElement(tagName: string,
    attrs: {[attr: string]: string} = {},
    text='')
{
const element = document.createElement(tagName);
for (const [k, v] of Object.entries(attrs)) {
element.setAttribute(k, v);
}
if (text.length > 0) element.append(text);
return element;
}

  const handleFindSensorType = async(ev: React.FormEvent<HTMLFormElement>) => {
    const rootId = 'findSensorTypes';
    const form = document.getElementById(`${rootId}-form`) as HTMLFormElement;
    if(form){
      ev.preventDefault();
      clearErrors('findSensorTypes');
      const formDataVal = getFormData(form);
      try{
        const result = await ws.findSensorTypesByReq(formDataVal);
        if(result.isOk){
          setResults(result.val.values);
          setResultLinks({
            prev: result.val.prev ,
            next: result.val.next
          });
          
          setSubmitted(true); 
        }else{
          // console.log(result);
          displayErrors(rootId,result.errors);
          setSubmitted(false); 
        }
      }catch(errors){
        const errorResult = Errors.errResult('Failed to Fetch');
        displayErrors('addSensorType', errorResult.errors);
      }
    } else {
      console.error(`Form with ID ${rootId}-form not found.`);
    }
  }
  return (
      <div>
        <ul id="findSensorTypes-errors" className="findSensorTypes-errors"></ul>

        <form className="grid-form" id="findSensorTypes-form" name="findSensorTypes-form" onSubmit={handleFindSensorType}>
          <label htmlFor="findSensorTypes-id">
            Sensor Type ID 
          </label>
          <span>
            <input id="findSensorTypes-id" name="id" value={formData.id}
            onChange={handleInputChange}/>
            <br />
            <span id="findSensorTypes-id-error" className="findSensorTypes-errors error"></span>
          </span>

          <label htmlFor="findSensorTypes-manufacturer">
            Manufacturer
          </label>
          <span>
            <input id="findSensorTypes-manufacturer" name="manufacturer" value={formData.manufacturer}
            onChange={handleInputChange}/>
            <br />
            <span id="findSensorTypes-manufacturer-error" className="findSensorTypes-errors error"></span>
          </span>

          <label htmlFor="findSensorTypes-modelNumber">
            Model Number 
          </label>
          <span>
            <input id="findSensorTypes-modelNumber" name="modelNumber" value={formData.modelNumber}
            onChange={handleInputChange}/>
            <br />
            <span id="findSensorTypes-modelNumber-error" className="findSensorTypes-errors error"></span>
          </span>

          <label htmlFor="findSensorType-quantity">
            Quantity 
          </label>
          <span>
            <input id="findSensorTypes-quantity" name="quantity" value={formData.quantity}
            onChange={handleInputChange} />
            <br />
            <span id="findSensorTypes-quantity-error" className="findSensorTypes-errors error"></span>
          </span>

          <label htmlFor="findSensorTypes-unit">
            Unit 
          </label>
          <span>
            <input id="findSensorTypes-unit" name="unit" value={formData.unit}
            onChange={handleInputChange}/>
            <br />
            <span id="findSensorTypes-unit-error" className="findSensorTypes-errors error"></span>
          </span>
          <span></span>
           <button>Find Sensor Type</button>
        </form>
        <Scroll prevLink={resultLinks.prev} nextLink={resultLinks.next} onPrevClick={handlePrevClick} onNextClick={handleNextClick} />
        {submitted && <SensorResults results={results} />}
        <Scroll prevLink={resultLinks.prev} nextLink={resultLinks.next} onPrevClick={handlePrevClick} onNextClick={handleNextClick} />
      </div>
  );
}


export default FindSensorTypeForm;

