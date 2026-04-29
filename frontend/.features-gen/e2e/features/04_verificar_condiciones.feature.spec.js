// Generated from: e2e\features\04_verificar_condiciones.feature
import { test } from "playwright-bdd";

test.describe('Verificar Condiciones (F5)', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('que tengo una sesión activa', null, { page }); 
    await And('me encuentro en la vista de la planta con ID "1"', null, { page }); 
  });
  
  test('Condiciones óptimas', async ({ Given, When, Then, page }) => { 
    await Given('que el servidor reporta condiciones óptimas', null, { page }); 
    await When('hago clic en el botón de verificar condiciones', null, { page }); 
    await Then('debo ver una alerta con el mensaje "Condiciones óptimas"', null, { page }); 
  });

  test('Activación de riego automático', async ({ Given, When, Then, page }) => { 
    await Given('que el servidor reporta que se requiere riego', null, { page }); 
    await When('hago clic en el botón de verificar condiciones', null, { page }); 
    await Then('debo ver una alerta con el mensaje "Riego automático activado"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\04_verificar_condiciones.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que tengo una sesión activa","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And me encuentro en la vista de la planta con ID \"1\"","isBg":true,"stepMatchArguments":[{"group":{"start":45,"value":"\"1\"","children":[{"start":46,"value":"1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given que el servidor reporta condiciones óptimas","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When hago clic en el botón de verificar condiciones","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then debo ver una alerta con el mensaje \"Condiciones óptimas\"","stepMatchArguments":[{"group":{"start":35,"value":"\"Condiciones óptimas\"","children":[{"start":36,"value":"Condiciones óptimas","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":17,"pickleLine":16,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que tengo una sesión activa","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And me encuentro en la vista de la planta con ID \"1\"","isBg":true,"stepMatchArguments":[{"group":{"start":45,"value":"\"1\"","children":[{"start":46,"value":"1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given que el servidor reporta que se requiere riego","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When hago clic en el botón de verificar condiciones","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then debo ver una alerta con el mensaje \"Riego automático activado\"","stepMatchArguments":[{"group":{"start":35,"value":"\"Riego automático activado\"","children":[{"start":36,"value":"Riego automático activado","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end