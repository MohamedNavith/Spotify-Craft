import 'package:flutter/material.dart';

/// Strict LIFO navigation state across nested tab navigators, overlays,
/// keyboard focus, and collapsible full-screen player.
class WavelengthNavigationController extends ChangeNotifier {
  final List<GlobalKey<NavigatorState>> tabNavigatorKeys = [
    GlobalKey<NavigatorState>(debugLabel: 'tab_home'),
    GlobalKey<NavigatorState>(debugLabel: 'tab_search'),
    GlobalKey<NavigatorState>(debugLabel: 'tab_library'),
  ];

  final List<ScrollController> tabScrollControllers = [
    ScrollController(),
    ScrollController(),
    ScrollController(),
  ];

  int _currentTabIndex = 0;
  bool _isFullPlayerOpen = false;
  bool _isKeyboardVisible = false;
  int _activeModalCount = 0;
  DateTime? _lastRootBackPressAt;

  final List<String> _overlayStack = [];

  int get currentTabIndex => _currentTabIndex;
  bool get isFullPlayerOpen => _isFullPlayerOpen;
  int get activeModalCount => _activeModalCount;

  void setKeyboardVisible(bool visible) {
    _isKeyboardVisible = visible;
  }

  void selectTab(int index) {
    if (index < 0 || index > 2) return;
    if (_currentTabIndex == index) {
      // Spotify pattern: tapping the active tab pops to its root and scrolls to top
      final nav = tabNavigatorKeys[index].currentState;
      if (nav != null && nav.canPop()) {
        nav.popUntil((route) => route.isFirst);
      } else if (tabScrollControllers[index].hasClients) {
        tabScrollControllers[index].animateTo(
          0,
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
        );
      }
      return;
    }
    _currentTabIndex = index;
    _isFullPlayerOpen = false;
    notifyListeners();
  }

  void openFullPlayer() {
    if (!_isFullPlayerOpen) {
      _isFullPlayerOpen = true;
      _overlayStack.remove('full_player');
      _overlayStack.add('full_player');
      notifyListeners();
    }
  }

  void collapseFullPlayer() {
    if (_isFullPlayerOpen) {
      _isFullPlayerOpen = false;
      _overlayStack.remove('full_player');
      notifyListeners();
    }
  }

  void pushModalMarker(String id) {
    _activeModalCount++;
    _overlayStack.add('modal:$id');
    notifyListeners();
  }

  void popModalMarker(String id) {
    if (_activeModalCount > 0) _activeModalCount--;
    _overlayStack.remove('modal:$id');
    notifyListeners();
  }

  Future<T?> pushInActiveTab<T>(Widget page) async {
    collapseFullPlayer();
    final nav = tabNavigatorKeys[_currentTabIndex].currentState;
    if (nav == null) return null;
    return nav.push<T>(
      MaterialPageRoute<T>(builder: (_) => page),
    );
  }

  /// Strict LIFO back-button decision engine.
  /// Returns true if the back event was handled inside the app, false only when
  /// double-back at root Home should exit cleanly.
  Future<bool> handleBackPress({
    required BuildContext rootContext,
    required void Function(String message) onShowExitToast,
  }) async {
    // 1. Close keyboard if open
    final focus = FocusManager.instance.primaryFocus;
    if (_isKeyboardVisible || (focus != null && focus.hasFocus)) {
      focus?.unfocus();
      if (_isKeyboardVisible) return true;
    }

    // 2. Dismiss active modal sheets / menus / dialogs strictly before screen nav
    final rootNav = Navigator.of(rootContext, rootNavigator: true);
    if (rootNav.canPop()) {
      rootNav.pop();
      return true;
    }

    // 3. Collapse expanded full player back to previous screen (mini-player stays visible)
    if (_isFullPlayerOpen) {
      collapseFullPlayer();
      return true;
    }

    // 4. Pop one level in the current tab's nested LIFO navigator stack
    final activeNav = tabNavigatorKeys[_currentTabIndex].currentState;
    if (activeNav != null && activeNav.canPop()) {
      activeNav.pop();
      return true;
    }

    // 5. If on Search or Library root, return cleanly to Home root first
    if (_currentTabIndex != 0) {
      _currentTabIndex = 0;
      notifyListeners();
      return true;
    }

    // 6. At root Home only: double-back within 2s to exit
    final now = DateTime.now();
    if (_lastRootBackPressAt == null ||
        now.difference(_lastRootBackPressAt!) > const Duration(seconds: 2)) {
      _lastRootBackPressAt = now;
      onShowExitToast('Press back again to exit');
      return true;
    }

    return false;
  }

  /// Pure unit-testable LIFO order helper without BuildContext.
  BackOutcome resolveLogicalBack({
    required bool keyboardOpen,
    required bool modalOpen,
    required bool canPopNestedTab,
    required DateTime now,
  }) {
    if (keyboardOpen) return BackOutcome.dismissKeyboard;
    if (modalOpen) return BackOutcome.dismissModal;
    if (_isFullPlayerOpen) {
      collapseFullPlayer();
      return BackOutcome.collapseFullPlayer;
    }
    if (canPopNestedTab) return BackOutcome.popTabRoute;
    if (_currentTabIndex != 0) {
      _currentTabIndex = 0;
      notifyListeners();
      return BackOutcome.switchToHomeTab;
    }
    if (_lastRootBackPressAt == null ||
        now.difference(_lastRootBackPressAt!) > const Duration(seconds: 2)) {
      _lastRootBackPressAt = now;
      return BackOutcome.showExitToast;
    }
    return BackOutcome.exitApp;
  }

  @override
  void dispose() {
    for (final c in tabScrollControllers) {
      c.dispose();
    }
    super.dispose();
  }
}

enum BackOutcome {
  dismissKeyboard,
  dismissModal,
  collapseFullPlayer,
  popTabRoute,
  switchToHomeTab,
  showExitToast,
  exitApp,
}
