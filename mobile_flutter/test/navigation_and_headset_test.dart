import 'package:flutter_test/flutter_test.dart';
import 'package:wavelength_app/audio/headset_click_detector.dart';
import 'package:wavelength_app/state/navigation_controller.dart';

void main() {
  group('HeadsetClickDetector', () {
    test('1 press = play/pause, 2 presses = next, 3 presses = previous', () async {
      final events = <HeadsetAction>[];
      final detector = HeadsetClickDetector(
        onAction: events.add,
        clickWindow: const Duration(milliseconds: 60),
      );

      // Single press
      detector.registerMediaClick();
      await Future<void>.delayed(const Duration(milliseconds: 90));
      expect(events, [HeadsetAction.togglePlayPause]);

      // Double press
      events.clear();
      detector.registerMediaClick();
      detector.registerMediaClick();
      await Future<void>.delayed(const Duration(milliseconds: 90));
      expect(events, [HeadsetAction.nextTrack]);

      // Triple press (fires immediately on 3rd click)
      events.clear();
      detector.registerMediaClick();
      detector.registerMediaClick();
      detector.registerMediaClick();
      expect(events, [HeadsetAction.previousTrack]);

      detector.dispose();
    });
  });

  group('WavelengthNavigationController LIFO stack', () {
    test('pops keyboard -> modal -> fullPlayer -> nested tab -> Home -> exit toast -> exit', () {
      final nav = WavelengthNavigationController();
      addTearDown(nav.dispose);

      nav.selectTab(2); // Switch to Library
      nav.openFullPlayer();

      final t0 = DateTime(2026, 1, 1, 12, 0, 0);

      // 1. Keyboard dismissed first even when everything else is open
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: true,
          modalOpen: true,
          canPopNestedTab: true,
          now: t0,
        ),
        BackOutcome.dismissKeyboard,
      );

      // 2. Modal sheet dismissed before collapsing full player
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: false,
          modalOpen: true,
          canPopNestedTab: true,
          now: t0,
        ),
        BackOutcome.dismissModal,
      );

      // 3. Full player collapses next (keeping mini-player visible)
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: false,
          modalOpen: false,
          canPopNestedTab: true,
          now: t0,
        ),
        BackOutcome.collapseFullPlayer,
      );
      expect(nav.isFullPlayerOpen, isFalse);

      // 4. Nested route inside Library tab pops one level
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: false,
          modalOpen: false,
          canPopNestedTab: true,
          now: t0,
        ),
        BackOutcome.popTabRoute,
      );

      // 5. Library tab root switches back to Home tab first
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: false,
          modalOpen: false,
          canPopNestedTab: false,
          now: t0,
        ),
        BackOutcome.switchToHomeTab,
      );
      expect(nav.currentTabIndex, 0);

      // 6. First back at Home shows exit toast
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: false,
          modalOpen: false,
          canPopNestedTab: false,
          now: t0,
        ),
        BackOutcome.showExitToast,
      );

      // 7. Second back within 2 seconds exits cleanly
      expect(
        nav.resolveLogicalBack(
          keyboardOpen: false,
          modalOpen: false,
          canPopNestedTab: false,
          now: t0.add(const Duration(seconds: 1)),
        ),
        BackOutcome.exitApp,
      );
    });
  });
}
