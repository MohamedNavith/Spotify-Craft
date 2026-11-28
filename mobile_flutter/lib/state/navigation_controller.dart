import 'package:flutter/material.dart';

/// Strict LIFO navigation state across nested tab navigators (Home, Search,
/// Library, Settings), Dynamic Island, Verci Studio overlay, modals, and
/// collapsible full-screen player.
class WavelengthNavigationController extends ChangeNotifier {
  final List<GlobalKey<NavigatorState>> tabNavigatorKeys = [
    GlobalKey<NavigatorState>(debugLabel: 'tab_home'),
    GlobalKey<NavigatorState>(debugLabel: 'tab_search'),
    GlobalKey<NavigatorState>(debugLabel: 'tab_library'),
    GlobalKey<NavigatorState>(debugLabel: 'tab_settings'),
  ];

  final List<ScrollController> tabScrollControllers = [
    ScrollController(),
    ScrollController(),
    ScrollController(),
    ScrollController(),
  ];

  int _currentTabIndex = 0;
  bool _isFullPlayerOpen = false;
  bool _isVerciOpen = false;
  bool _isDynamicIslandExpanded = false;
  bool _isKeyboardVisible = false;
  int _activeModalCount = 0;
  DateTime? _lastRootBackPressAt;

  int get currentTabIndex => _currentTabIndex;
  bool get isFullPlayerOpen => _isFullPlayerOpen;
  bool get isVerciOpen => _isVerciOpen;
  bool get isDynamicIslandExpanded => _isDynamicIslandExpanded;
  int get activeModalCount => _activeModalCount;

  void setKeyboardVisible(bool visible) {
    _isKeyboardVisible = visible;
  }

  void selectTab(int index) {
    if (index < 0 || index > 3) return;
    _isVerciOpen = false;
    _isDynamicIslandExpanded = false;
    if (_currentTabIndex == index) {
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
      notifyListeners();
      return;
    }
    _currentTabIndex = index;
    _isFullPlayerOpen = false;
    notifyListeners();
  }

  void openFullPlayer() {
    _isDynamicIslandExpanded = false;
    if (!_isFullPlayerOpen) {
      _isFullPlayerOpen = true;
      notifyListeners();
    }
  }

  void collapseFullPlayer() {
    if (_isFullPlayerOpen) {
      _isFullPlayerOpen = false;
      notifyListeners();
    }
  }

  void openVerci() {
    _isDynamicIslandExpanded = false;
    if (!_isVerciOpen) {
      _isVerciOpen = true;
      notifyListeners();
    }
  }

  void closeVerci() {
    if (_isVerciOpen) {
      _isVerciOpen = false;
      notifyListeners();
    }
  }

  void setDynamicIslandExpanded(bool expanded) {
    if (_isDynamicIslandExpanded != expanded) {
      _isDynamicIslandExpanded = expanded;
      notifyListeners();
    }
  }

  void pushModalMarker(String id) {
    _activeModalCount++;
    notifyListeners();
  }

  void popModalMarker(String id) {
    if (_activeModalCount > 0) _activeModalCount--;
    notifyListeners();
  }

  Future<T?> pushInActiveTab<T>(Widget page) async {
    _isVerciOpen = false;
    _isFullPlayerOpen = false;
    _isDynamicIslandExpanded = false;
    notifyListeners();
    final nav = tabNavigatorKeys[_currentTabIndex].currentState;
    if (nav == null) return null;
    return nav.push<T>(
      MaterialPageRoute<T>(builder: (_) => page),
    );
  }

  Future<bool> handleBackPress({
    required BuildContext rootContext,
    required void Function(String message) onShowExitToast,
  }) async {
    // 1. Dismiss keyboard first
    final focus = FocusManager.instance.primaryFocus;
    if (_isKeyboardVisible || (focus != null && focus.hasFocus)) {
      focus?.unfocus();
      if (_isKeyboardVisible) return true;
    }

    // 2. Dismiss active modal bottom sheet or dialog
    final rootNav = Navigator.of(rootContext, rootNavigator: true);
    if (rootNav.canPop()) {
      rootNav.pop();
      return true;
    }

    // 3. Exit Verci overlay back to player/tab
    if (_isVerciOpen) {
      closeVerci();
      return true;
    }

    // 4. Collapse expanded Dynamic Island capsule
    if (_isDynamicIslandExpanded) {
      setDynamicIslandExpanded(false);
      return true;
    }

    // 5. Collapse full screen player (mini player stays visible)
    if (_isFullPlayerOpen) {
      collapseFullPlayer();
      return true;
    }

    // 6. Pop one level inside active tab stack
    final activeNav = tabNavigatorKeys[_currentTabIndex].currentState;
    if (activeNav != null && activeNav.canPop()) {
      activeNav.pop();
      return true;
    }

    // 7. Return from Search / Library / Settings root back to Home root
    if (_currentTabIndex != 0) {
      _currentTabIndex = 0;
      notifyListeners();
      return true;
    }

    // 8. Double-back at Home root with Spotify-style exit toast
    final now = DateTime.now();
    if (_lastRootBackPressAt == null ||
        now.difference(_lastRootBackPressAt!) > const Duration(seconds: 2)) {
      _lastRootBackPressAt = now;
      onShowExitToast('Press back again to exit');
      return true;
    }

    return false;
  }

  BackOutcome resolveLogicalBack({
    required bool keyboardOpen,
    required bool modalOpen,
    required bool canPopNestedTab,
    required DateTime now,
  }) {
    if (keyboardOpen) return BackOutcome.dismissKeyboard;
    if (modalOpen) return BackOutcome.dismissModal;
    if (_isVerciOpen) {
      closeVerci();
      return BackOutcome.closeVerci;
    }
    if (_isDynamicIslandExpanded) {
      setDynamicIslandExpanded(false);
      return BackOutcome.collapseIsland;
    }
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
  closeVerci,
  collapseIsland,
  collapseFullPlayer,
  popTabRoute,
  switchToHomeTab,
  showExitToast,
  exitApp,
}
