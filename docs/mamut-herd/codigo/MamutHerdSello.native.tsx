// Sello "Un producto de Mamut Herd" para React Native / Expo.
// En celular usa los PNG (logos/png): copia los que necesites a assets/mamut-herd/.
import { Image, Linking, Pressable } from "react-native";

const MAMUT_HERD_URL = "MAMUT_HERD_URL";

const imagenes = {
  claro: require("../assets/mamut-herd/un-producto-de-mamut-herd-apilado-para-fondo-claro.png"),
  oscuro: require("../assets/mamut-herd/un-producto-de-mamut-herd-apilado-para-fondo-oscuro.png"),
};

export function MamutHerdSello({ fondo = "claro", ancho = 180 }: { fondo?: "claro" | "oscuro"; ancho?: number }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(MAMUT_HERD_URL)}
      accessibilityRole="link"
      accessibilityLabel="Un producto de Mamut Herd"
      style={{ alignSelf: "center", paddingVertical: 12 }}
    >
      <Image source={imagenes[fondo]} style={{ width: ancho, height: ancho / 2.71 }} resizeMode="contain" />
    </Pressable>
  );
}
