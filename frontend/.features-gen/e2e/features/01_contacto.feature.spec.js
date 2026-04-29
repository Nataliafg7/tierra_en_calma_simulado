// Generated from: e2e\features\01_contacto.feature
import { test } from "playwright-bdd";

test.describe('Formulario de Contacto (F1)', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('que estoy en la página principal', null, { page }); 
  });
  
  test('Visualización del formulario', async ({ Then, And, page }) => { 
    await Then('debo ver el formulario de contacto', null, { page }); 
    await And('el botón de envío debe estar visible', null, { page }); 
  });

  test('Validación de campos vacíos', async ({ Then, page }) => { 
    await Then('el botón de envío debe estar deshabilitado', null, { page }); 
  });

  test('Envío exitoso del formulario', async ({ When, Then, And, page }) => { 
    await When('completo el formulario con nombre "Test User", correo "test@example.com" y mensaje "Prueba E2E"', null, { page }); 
    await And('hago clic en el botón de enviar mensaje', null, { page }); 
    await Then('el formulario debe reiniciarse', null, { page }); 
    await And('debo ver un mensaje de confirmación "fue enviado correctamente"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\01_contacto.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que estoy en la página principal","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then debo ver el formulario de contacto","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And el botón de envío debe estar visible","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":14,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que estoy en la página principal","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then el botón de envío debe estar deshabilitado","stepMatchArguments":[]}]},
  {"pwTestLine":19,"pickleLine":17,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que estoy en la página principal","isBg":true,"stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When completo el formulario con nombre \"Test User\", correo \"test@example.com\" y mensaje \"Prueba E2E\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Test User\"","children":[{"start":35,"value":"Test User","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":54,"value":"\"test@example.com\"","children":[{"start":55,"value":"test@example.com","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":83,"value":"\"Prueba E2E\"","children":[{"start":84,"value":"Prueba E2E","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"And hago clic en el botón de enviar mensaje","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then el formulario debe reiniciarse","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And debo ver un mensaje de confirmación \"fue enviado correctamente\"","stepMatchArguments":[{"group":{"start":36,"value":"\"fue enviado correctamente\"","children":[{"start":37,"value":"fue enviado correctamente","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end