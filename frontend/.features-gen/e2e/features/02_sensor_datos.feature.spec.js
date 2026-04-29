// Generated from: e2e\features\02_sensor_datos.feature
import { test } from "playwright-bdd";

test.describe('Visualización de Sensor y Datos (F2 y F4)', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('que he iniciado sesión exitosamente', null, { page }); 
    await And('accedo a la vista de monitoreo de mi planta con ID "1"', null, { page }); 
  });
  
  test('Visualización de lecturas actuales', async ({ Then, And, page }) => { 
    await Then('debo ver la lectura de temperatura "25.0 °C"', null, { page }); 
    await And('debo ver la lectura de humedad "60.0%"', null, { page }); 
  });

  test('Visualización del historial', async ({ Then, page }) => { 
    await Then('debo ver el gráfico del historial de lecturas', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\02_sensor_datos.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que he iniciado sesión exitosamente","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And accedo a la vista de monitoreo de mi planta con ID \"1\"","isBg":true,"stepMatchArguments":[{"group":{"start":51,"value":"\"1\"","children":[{"start":52,"value":"1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then debo ver la lectura de temperatura \"25.0 °C\"","stepMatchArguments":[{"group":{"start":35,"value":"\"25.0 °C\"","children":[{"start":36,"value":"25.0 °C","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And debo ver la lectura de humedad \"60.0%\"","stepMatchArguments":[{"group":{"start":31,"value":"\"60.0%\"","children":[{"start":32,"value":"60.0%","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":16,"pickleLine":15,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que he iniciado sesión exitosamente","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And accedo a la vista de monitoreo de mi planta con ID \"1\"","isBg":true,"stepMatchArguments":[{"group":{"start":51,"value":"\"1\"","children":[{"start":52,"value":"1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then debo ver el gráfico del historial de lecturas","stepMatchArguments":[]}]},
]; // bdd-data-end