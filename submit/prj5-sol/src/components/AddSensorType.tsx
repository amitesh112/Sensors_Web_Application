import React from 'react';
import { useState } from "react";
import { Errors } from 'cs544-js-utils';
import { PagedValues, makeSensorsWs, SensorsWs } from '../lib/sensors-ws';
// import { PagedValues, makeSensorsWs, SensorsWs } from '';
import SENSOR_DEFS, { FieldDef } from './sensor-fields';
import FormResult from './FormResult';
import MakeElement from './MakeElement';


type AppProps = {
  ws: SensorsWs, // Assuming SensorsWs is the correct type
};

function AddSensorTypeForm(props: AppProps) {
  const { ws } = props;
  const [formData, setFormData] = useState({
    id: '',
    manufacturer: '',
    modelNumber: '',
    quantity: '',
    unit: '',
    min: '',
    max: '',
  });
  const [formErrors, setFormErrors] = useState({
    id: '',
    manufacturer: '',
    modelNumber: '',
    quantity: '',
    unit: '',
    min: '',
    max: '',
  });
  const [formResult, setFormResult] = useState<Record<string, string>>({});
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

     setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value.trim() === '') {
        errors[key] = `"${key}" is required`;
      }
    });
  
    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors, ...errors };
      return newErrors;
    });
  
    return Object.keys(errors).length === 0;
  };
  const handleFormSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    const rootId = 'addSensorType';
    const form = document.getElementById(`${rootId}-form`) as HTMLFormElement;
    if(form){
      ev.preventDefault();
      clearErrors('addSensorType');
      const formDataVal = getFormData(form);
      try {
        // Wait for the promise to resolve
        const result = await ws.addSensorType(formDataVal);
        if(result.isOk){
          // <FormResult resultContainerId='addSensor' result={formResult}/>
          setFormResult(result.val);
        }
        else{
          if(result.errors[0].message==='Failed to fetch'){
            displayErrors(rootId,result.errors);
            
          }else{
            displayErrors(rootId,result.errors);
            validateForm();
          }
        }
      } catch (error) {
        // Handle any errors that occurred during the promise resolution
        const errorResult = Errors.errResult('Failed to Fetch');
        displayErrors('addSensorType', errorResult.errors);
      }
    }else{
    console.error(`Form with ID ${rootId}-form not found.`);
  }
};
function clearErrors(rootId: string) {
  document.querySelectorAll(`.${rootId}-errors`).forEach((el) => {
    el.innerHTML = '';
  });

  // Clear form errors state using the callback function
  setFormErrors((prevErrors) => {
    const newErrors = { ...prevErrors, id: '', sensorTypeId: '', period: '', min: '', max: '' };
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
  return (
      <div>
        <ul id="addSensorType-errors" className="addSensorType-errors"></ul>

        <form className="grid-form" id="addSensorType-form" name="addSensorType-form" onSubmit={handleFormSubmit}>
          <label htmlFor="addSensorType-id">
            Sensor Type ID <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-id" name="id" value={formData.id}
            onChange={handleInputChange}/>
            <br />
            <span id="addSensorType-id-error" className="addSensorType-errors error">{formErrors.id}</span>
          </span>

          <label htmlFor="addSensorType-manufacturer">
            Manufacturer <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-manufacturer" name="manufacturer" value={formData.manufacturer}
            onChange={handleInputChange}/>
            <br />
            <span id="addSensorType-manufacturer-error" className="addSensorType-errors error">{formErrors.manufacturer}</span>
          </span>

          <label htmlFor="addSensorType-modelNumber">
            Model Number <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-modelNumber" name="modelNumber" value={formData.modelNumber}
            onChange={handleInputChange}/>
            <br />
            <span id="addSensorType-modelNumber-error" className="addSensorType-errors error">{formErrors.modelNumber}</span>
          </span>

          <label htmlFor="addSensorType-quantity">
            Quantity <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-quantity" name="quantity" value={formData.quantity}
            onChange={handleInputChange} />
            <br />
            <span id="addSensorType-quantity-error" className="addSensorType-errors error">{formErrors.quantity}</span>
          </span>

          <label htmlFor="addSensorType-unit">
            Unit <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-unit" name="unit" value={formData.unit}
            onChange={handleInputChange}/>
            <br />
            <span id="addSensorType-unit-error" className="addSensorType-errors error">{formErrors.unit}</span>
          </span>

          <label htmlFor="addSensorType-min">
            Min Limit <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-min" name="min" type="number" value={formData.min}
            onChange={handleInputChange}/>
            <br />
            <span id="addSensorType-min-error" className="addSensorType-errors error">{formErrors.min}</span>
          </span>

          <label htmlFor="addSensorType-max">
            Max Limit <span className="required" title="Required">*</span>
          </label>
          <span>
            <input id="addSensorType-max" name="max" type="number" value={formData.max}
            onChange={handleInputChange}/>
            <br />
            <span id="addSensorType-max-error" className="addSensorType-errors error">{formErrors.max}</span>
          </span>
          <span></span>
           <button>Add Sensor Type</button>
        </form>
        <dl><FormResult resultContainerId='addSensorType' result={formResult} /></dl>
      </div>
  );
}

export default AddSensorTypeForm;
