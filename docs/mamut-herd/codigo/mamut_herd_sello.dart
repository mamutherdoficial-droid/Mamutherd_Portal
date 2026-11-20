// Sello "Un producto de Mamut Herd" para Flutter.
// 1. Copia los PNG a assets/mamut-herd/ y decláralos en pubspec.yaml:
//      flutter:
//        assets:
//          - assets/mamut-herd/
// 2. Para abrir el enlace usa el paquete url_launcher.
// 3. Cambia MAMUT_HERD_URL.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

const mamutHerdUrl = 'MAMUT_HERD_URL';

class MamutHerdSello extends StatelessWidget {
  const MamutHerdSello({super.key, this.ancho = 180});
  final double ancho;

  @override
  Widget build(BuildContext context) {
    final oscuro = Theme.of(context).brightness == Brightness.dark;
    final fondo = oscuro ? 'para-fondo-oscuro' : 'para-fondo-claro';
    return Semantics(
      link: true,
      label: 'Un producto de Mamut Herd',
      child: InkWell(
        onTap: () => launchUrl(Uri.parse(mamutHerdUrl), mode: LaunchMode.externalApplication),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Image.asset(
            'assets/mamut-herd/un-producto-de-mamut-herd-apilado-$fondo.png',
            width: ancho,
            excludeFromSemantics: true,
          ),
        ),
      ),
    );
  }
}
