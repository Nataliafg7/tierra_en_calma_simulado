// Generated from: e2e\features\05_simulador_flujo_completo.feature
import { test } from "playwright-bdd";

test.describe('Flujo Completo de Telemetría (E2E)', () => {

  test('Flujo integral de monitoreo', async ({ Given, When, Then, And, page }) => { 
    await Given('que el sistema tiene datos de prueba configurados', null, { page }); 
    await When('inicio sesión con credenciales válidas', null, { page }); 
    await And('navego a la sección "Mis Plantas"', null, { page }); 
    await And('selecciono monitorear la planta "Helecho"', null, { page }); 
    await Then('debo ver las métricas en tiempo real "22.0 °C"', null, { page }); 
    await And('hago clic en verificar condiciones', null, { page }); 
    await And('el sistema debe confirmar la "Verificación exitosa"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\05_simulador_flujo_completo.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":7,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que el sistema tiene datos de prueba configurados","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When inicio sesión con credenciales válidas","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"And navego a la sección \"Mis Plantas\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Mis Plantas\"","children":[{"start":21,"value":"Mis Plantas","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":10,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"And selecciono monitorear la planta \"Helecho\"","stepMatchArguments":[{"group":{"start":32,"value":"\"Helecho\"","children":[{"start":33,"value":"Helecho","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then debo ver las métricas en tiempo real \"22.0 °C\"","stepMatchArguments":[{"group":{"start":37,"value":"\"22.0 °C\"","children":[{"start":38,"value":"22.0 °C","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And hago clic en verificar condiciones","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And el sistema debe confirmar la \"Verificación exitosa\"","stepMatchArguments":[{"group":{"start":29,"value":"\"Verificación exitosa\"","children":[{"start":30,"value":"Verificación exitosa","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end