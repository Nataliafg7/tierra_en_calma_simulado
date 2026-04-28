import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

// ─────────────────────────────────────────────────────────────────────────────
// Función auxiliar para crear Test Objects dinámicamente sin necesidad
// de crearlos en el Object Repository manualmente.
// ─────────────────────────────────────────────────────────────────────────────
TestObject makeTO(String xpath) {
    TestObject to = new TestObject()
    to.addProperty("xpath", ConditionType.EQUALS, xpath)
    return to
}

// ─────────────────────────────────────────────────────────────────────────────
// Selectores
// ─────────────────────────────────────────────────────────────────────────────
def inputCorreo = makeTO("//input[@placeholder='Correo']")
def inputPassword = makeTO("//input[@placeholder='Contraseña']")
def btnIngresar = makeTO("//button[normalize-space()='Ingresar']")
def txtHelecho = makeTO("//*[contains(text(),'Helecho')]")
def btnMonitorear = makeTO("(//button[contains(translate(normalize-space(),'MONITOREAR','monitorear'),'monitorear')])[1]")
def txtTemp = makeTO("//*[contains(text(),'22.0') and contains(text(),'°C')]")
def canvas = makeTO("//canvas")
def btnVerificar = makeTO("(//button[contains(translate(normalize-space(),'VERIFICAR CONDICIONES','verificar condiciones'),'verificar condiciones')])[1]")

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de configuración
// ─────────────────────────────────────────────────────────────────────────────
String BASE_URL = 'http://localhost:4200'
int    TIMEOUT  = 30

// ─────────────────────────────────────────────────────────────────────────────
// Abrir navegador
// ─────────────────────────────────────────────────────────────────────────────
WebUI.openBrowser(BASE_URL + '/login')
WebUI.maximizeWindow()

WebUI.comment('=== ETAPA 1: Login simulado ===')

WebUI.waitForElementVisible(inputCorreo, TIMEOUT)

boolean loginVisible = WebUI.verifyElementVisible(
    inputCorreo,
    FailureHandling.OPTIONAL
)

if (loginVisible) {
    WebUI.setText(inputCorreo, '1001498893')
    WebUI.setText(inputPassword, 'Natalia728')
    WebUI.click(btnIngresar)

    try {
        WebUI.waitForAlert(3)
        WebUI.acceptAlert()
    } catch (Exception e) {
    }
}

WebUI.delay(1)

WebUI.comment('=== ETAPA 2: Mis Plantas - verificar Helecho y activar monitoreo ===')

WebUI.navigateToUrl(BASE_URL + '/mis-plantas')

WebUI.waitForElementVisible(txtHelecho, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(txtHelecho)

WebUI.waitForElementVisible(btnMonitorear, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.click(btnMonitorear)

WebUI.comment('=== ETAPA 3: Vista MonsteraComponent - temperatura y canvas ===')

WebUI.navigateToUrl(BASE_URL + '/monstera?pu=1')

WebUI.waitForElementVisible(txtTemp, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(txtTemp)

WebUI.waitForElementVisible(canvas, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(canvas)

WebUI.comment('=== ETAPA 4: Verificar condiciones y validar el alert ===')

WebUI.waitForElementVisible(btnVerificar, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.click(btnVerificar)

WebUI.waitForAlert(TIMEOUT)
String alertTexto = WebUI.getAlertText()
WebUI.acceptAlert()

WebUI.verifyMatch(
    alertTexto,
    '.*Verificaci.*n exitosa.*',
    true
)

WebUI.comment('FLUJO COMPLETO PASADO: Login → Mis Plantas → MonsteraComponent → Verificar Condiciones. Alert: ' + alertTexto)

WebUI.closeBrowser()
