// Generated from: e2e\features\03_monitorear.feature
import { test } from "playwright-bdd";

test.describe('Monitorear Planta (F3)', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('que tengo una sesión activa y plantas registradas', null, { page }); 
    await And('me encuentro en la sección "Mis Plantas"', null, { page }); 
  });
  
  test('Activación de monitoreo exitosa', async ({ When, Then, page }) => { 
    await Then('debo ver mi planta "Planta de Prueba" en la lista', null, { page }); 
    await When('hago clic en el botón de monitorear de la planta', null, { page }); 
    await Then('debo ser redirigido a la vista de monitoreo con ID de planta "1"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\03_monitorear.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que tengo una sesión activa y plantas registradas","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And me encuentro en la sección \"Mis Plantas\"","isBg":true,"stepMatchArguments":[{"group":{"start":27,"value":"\"Mis Plantas\"","children":[{"start":28,"value":"Mis Plantas","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then debo ver mi planta \"Planta de Prueba\" en la lista","stepMatchArguments":[{"group":{"start":19,"value":"\"Planta de Prueba\"","children":[{"start":20,"value":"Planta de Prueba","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When hago clic en el botón de monitorear de la planta","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then debo ser redirigido a la vista de monitoreo con ID de planta \"1\"","stepMatchArguments":[{"group":{"start":61,"value":"\"1\"","children":[{"start":62,"value":"1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end