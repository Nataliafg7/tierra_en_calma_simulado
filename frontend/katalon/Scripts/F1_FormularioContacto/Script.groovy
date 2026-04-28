import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

TestObject makeTO(String xpath) {
    TestObject to = new TestObject()
    to.addProperty("xpath", ConditionType.EQUALS, xpath)
    return to
}

def formContacto = makeTO("//form")
def btnEnviar = makeTO("//button[normalize-space()='Enviar mensaje' or contains(translate(normalize-space(),'ENVIAR MENSAJE','enviar mensaje'),'enviar mensaje')]")
def inputNombre = makeTO("//label[contains(translate(.,'NOMBRE','nombre'),'nombre')]/following-sibling::input | //input[@id=//label[contains(translate(.,'NOMBRE','nombre'),'nombre')]/@for]")
def inputCorreo = makeTO("//label[contains(translate(.,'CORREO','correo'),'correo')]/following-sibling::input | //input[@id=//label[contains(translate(.,'CORREO','correo'),'correo')]/@for]")
def inputMensaje = makeTO("//label[contains(translate(.,'MENSAJE','mensaje'),'mensaje')]/following-sibling::textarea | //textarea[@id=//label[contains(translate(.,'MENSAJE','mensaje'),'mensaje')]/@for]")

String BASE_URL        = 'http://localhost:4200'
int    TIMEOUT         = 30
int    SHORT_TIMEOUT   = 5

WebUI.openBrowser(BASE_URL + '/')
WebUI.maximizeWindow()

WebUI.comment('=== TEST 1: Formulario visible con botón de envío ===')

WebUI.waitForElementVisible(formContacto, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(formContacto)

WebUI.waitForElementVisible(btnEnviar, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(btnEnviar)

WebUI.comment('TEST 1 PASADO')

WebUI.comment('=== TEST 2: Botón deshabilitado con formulario vacío ===')

WebUI.navigateToUrl(BASE_URL + '/')

WebUI.waitForElementVisible(btnEnviar, TIMEOUT, FailureHandling.STOP_ON_FAILURE)

WebUI.verifyElementAttributeValue(btnEnviar, 'disabled', 'true', SHORT_TIMEOUT, FailureHandling.STOP_ON_FAILURE)

WebUI.comment('TEST 2 PASADO')

WebUI.comment('=== TEST 3: Enviar formulario con datos válidos ===')

WebUI.navigateToUrl(BASE_URL + '/')

WebUI.waitForElementVisible(inputNombre, TIMEOUT)
WebUI.setText(inputNombre, 'Test User')

WebUI.waitForElementVisible(inputCorreo, TIMEOUT)
WebUI.setText(inputCorreo, 'test@example.com')

WebUI.waitForElementVisible(inputMensaje, TIMEOUT)
WebUI.setText(inputMensaje, 'Prueba E2E')

WebUI.click(btnEnviar)

String alertText = WebUI.getAlertText()
WebUI.acceptAlert()

WebUI.verifyMatch(alertText, '.*fue enviado correctamente.*', true)

WebUI.waitForElementAttributeValue(inputNombre, 'value', '', SHORT_TIMEOUT, FailureHandling.STOP_ON_FAILURE)

WebUI.comment('TEST 3 PASADO')

WebUI.closeBrowser()
