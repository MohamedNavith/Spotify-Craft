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

  testWidgets('LIFO unwinds Verci and expanded Dynamic Island before Full Player',
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
                const Scaffold(body: Center(child: Text('Mini Player Bar'))),
                if (nav.isFullPlayerOpen) const Text('Full Player View'),
                if (nav.isDynamicIslandExpanded) const Text('Expanded Island'),
                if (nav.isVerciOpen) const Text('Verci Overlay'),
              ],
            ),
          ),
        ),
      ),
    );

    nav.openFullPlayer();
    nav.setDynamicIslandExpanded(true);
    nav.openVerci();
    await tester.pump();
    expect(find.text('Verci Overlay'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pump();
    expect(find.text('Verci Overlay'), findsNothing);
    expect(find.text('Full Player View'), findsOneWidget);

    nav.setDynamicIslandExpanded(true);
    await tester.pump();
    expect(find.text('Expanded Island'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pump();
    expect(find.text('Expanded Island'), findsNothing);
    expect(find.text('Full Player View'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pump();
    expect(find.text('Full Player View'), findsNothing);
    expect(find.text('Mini Player Bar'), findsOneWidget);
  });
}
