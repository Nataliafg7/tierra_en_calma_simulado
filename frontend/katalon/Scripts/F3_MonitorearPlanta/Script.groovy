import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

TestObject makeTO(String xpath) {
    TestObject to = new TestObject()
    to.addProperty("xpath", ConditionType.EQUALS, xpath)
    return to
}

def txtPlanta = makeTO("//*[contains(text(),'Planta de Prueba')]")
def btnMonitorear = makeTO("(//button[contains(translate(normalize-space(),'MONITOREAR','monitorear'),'monitorear')])[1]")

String BASE_URL = 'http://localhost:4200'
int    TIMEOUT  = 30

WebUI.openBrowser(BASE_URL + '/')
WebUI.maximizeWindow()

WebUI.executeJavaScript(
    "localStorage.setItem('usuario', JSON.stringify({ ID_USUARIO: 1, NOMBRE: 'Usuario E2E' }));",
    null
)

WebUI.navigateToUrl(BASE_URL + '/mis-plantas')

WebUI.comment('=== TEST: Activar monitoreo para una planta ===')

WebUI.waitForElementVisible(txtPlanta, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.verifyElementVisible(txtPlanta)

WebUI.waitForElementVisible(btnMonitorear, TIMEOUT, FailureHandling.STOP_ON_FAILURE)
WebUI.click(btnMonitorear)

WebUI.waitForCondition(
    "return window.location.href.includes('/monstera') && window.location.href.includes('pu=1')",
    TIMEOUT
)

String currentUrl = WebUI.getUrl()
WebUI.verifyMatch(currentUrl, '.*monstera.*pu=1.*', true)

WebUI.comment('TEST PASADO')

WebUI.closeBrowser()
