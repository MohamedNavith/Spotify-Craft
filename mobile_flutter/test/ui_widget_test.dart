import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wavelength_app/state/navigation_controller.dart';

void main() {
  testWidgets('FullPlayer expands over mini-player view and collapses cleanly back via LIFO',
      (WidgetTester tester) async {
    final nav = WavelengthNavigationController();
    addTearDown(nav.dispose);

    await tester.pumpWidget(
      MaterialApp(
        home: ListenableBuilder(
          listenable: nav,
          builder: (ctx, _) => PopScope(
            canPop: false,
            onPopInvokedWithResult: (didPop, _) async {
              if (!didPop) {
                await nav.handleBackPress(
                  rootContext: ctx,
                  onShowExitToast: (_) {},
                );
              }
            },
            child: Stack(
              children: [
                Scaffold(
                  body: const Center(child: Text('Mini Player Bar')),
                  floatingActionButton: FloatingActionButton(
                    onPressed: nav.openFullPlayer,
                    child: const Icon(Icons.expand_less),
                  ),
                ),
                if (nav.isFullPlayerOpen)
                  const Positioned.fill(
                    child: Material(
                      child: Center(child: Text('Full Player View')),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );

    expect(find.text('Mini Player Bar'), findsOneWidget);
    expect(find.text('Full Player View'), findsNothing);

    await tester.tap(find.byIcon(Icons.expand_less));
    await tester.pumpAndSettle();
    expect(find.text('Full Player View'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Full Player View'), findsNothing);
    expect(find.text('Mini Player Bar'), findsOneWidget);
  });
}
