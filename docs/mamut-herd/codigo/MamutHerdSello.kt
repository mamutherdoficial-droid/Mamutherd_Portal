// Sello "Un producto de Mamut Herd" para Android con Jetpack Compose.
// 1. Copia el PNG a res/drawable-nodpi/ con nombre en minúsculas y guiones bajos, por ejemplo:
//    un_producto_de_mamut_herd_apilado_para_fondo_claro.png
//    un_producto_de_mamut_herd_apilado_para_fondo_oscuro.png
//    (Los SVG usan máscaras, que Android no importa bien como vector; por eso aquí va PNG.)
// 2. Cambia MAMUT_HERD_URL.
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp

private const val MAMUT_HERD_URL = "MAMUT_HERD_URL"

@Composable
fun MamutHerdSello(modifier: Modifier = Modifier, oscuro: Boolean = isSystemInDarkTheme()) {
    val uri = LocalUriHandler.current
    Image(
        painter = painterResource(
            if (oscuro) R.drawable.un_producto_de_mamut_herd_apilado_para_fondo_oscuro
            else R.drawable.un_producto_de_mamut_herd_apilado_para_fondo_claro
        ),
        contentDescription = "Un producto de Mamut Herd",
        contentScale = ContentScale.Fit,
        modifier = modifier
            .width(180.dp)
            .clickable { uri.openUri(MAMUT_HERD_URL) }
            .padding(vertical = 12.dp)
    )
}
