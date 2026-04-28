import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

TestObject makeTO(String xpath) {
    TestObject to = new TestObject()
    to.addProperty("xpath", ConditionType.EQUALS, xpath)
    return to
}

def inputCorreo = makeTO("//input[@placeholder='Correo']")
def inputPassword = makeTO("//input[@placeholder='Contraseña']")
def btnIngresar = makeTO("//button[normalize-space()='Ingresar']")
def txtTemp = makeTO("//*[contains(text(),'25.0') and contains(text(),'°C')]")
def txtHum = makeTO("//*[contains(text(),'60.0%')]")
def canvas = makeTO("//canvas")

String BASE_URL      = 'http://localhost:4200'
int    TIMEOUT       = 30
int    SHORT_TIMEOUT = 5

WebUI.openBrowser(BASE_URL + '/login')
WebUI.maximizeWindow()

WebUI.waitForElementVisible(inputCorreo, TIMEOUT)

boolean loginVisible = WebUI.verifyElementVisible(inputCorreo, FailureHandling.OPTIONAL)

if (loginVisible) {
    WebUI.setText(inputCorreo, '1001498893')
    WebUI.setText(inputPassword, 'Natalia728')
    WebUI.click(btnIngresar)

    try {
        WebUI.waitForAlert(3)
        WebUI.acceptAlert()
    } catch (Exception e) {}
}

WebUI.delay(1)

WebUI.navigateToUrl(BASE_URL + '/monstera?pu=1')

WebUI.comment('=== TEST 1: Lectura de temperatura y humedad visible ===')

WebUI.waitForElementVisible(txtTemp, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(txtTemp)

WebUI.waitForElementVisible(txtHum, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(txtHum)

WebUI.comment('TEST 1 PASADO: Temperatura y humedad mostradas correctamente.')

WebUI.comment('=== TEST 2: Canvas del gráfico visible ===')

WebUI.navigateToUrl(BASE_URL + '/monstera?pu=1')

WebUI.waitForElementVisible(canvas, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(canvas)

WebUI.comment('TEST 2 PASADO: El canvas del gráfico Chart.js es visible.')

WebUI.closeBrowser()
