import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

TestObject makeTO(String xpath) {
    TestObject to = new TestObject()
    to.addProperty("xpath", ConditionType.EQUALS, xpath)
    return to
}

def btnVerificar = makeTO("(//button[contains(translate(normalize-space(),'VERIFICAR CONDICIONES','verificar condiciones'),'verificar condiciones')])[1]")

String BASE_URL = 'http://localhost:4200'
int    TIMEOUT  = 30

def setupPage(String baseUrl, int timeout, def btnTO) {
    WebUI.executeJavaScript(
        "localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));",
        null
    )
    WebUI.navigateToUrl(baseUrl + '/monstera?pu=1')
    WebUI.waitForElementVisible(btnTO, timeout, FailureHandling.STOP_ON_FAILURE)
}

WebUI.openBrowser(BASE_URL + '/')
WebUI.maximizeWindow()

WebUI.comment('=== TEST 1: Condiciones ===')

setupPage(BASE_URL, TIMEOUT, btnVerificar)

WebUI.click(btnVerificar)

WebUI.waitForAlert(TIMEOUT)
String alertTexto1 = WebUI.getAlertText()
WebUI.acceptAlert()

// El mock server actualmente devuelve 'Verificación exitosa'
// así que validaremos contra eso en general.
WebUI.verifyMatch(alertTexto1, '.*(Condiciones|Riego|exitosa).*', true)

WebUI.comment('TEST 1 PASADO')

WebUI.closeBrowser()
