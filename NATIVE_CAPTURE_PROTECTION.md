# Native Capture Protection for TRILLIONER LINK

Official references: [Android FLAG_SECURE guidance](https://developer.android.com/security/fraud-prevention/activities), [Apple capturedDidChangeNotification](https://developer.apple.com/documentation/uikit/uiscreen/captureddidchangenotification), and [MDN Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API).

## What the web app can and cannot do

The current web/PWA build uses a browser fallback: it hides protected content when the page becomes hidden, disables casual context-menu copying, shows a capture warning, and applies watermarks. A website cannot command Chrome, Firefox, Safari, or the Android browser to make OS screenshots black.

For the requested black screenshot/recording behavior, ship a native Android/iOS wrapper and enable the bridge exposed by `CaptureProtection.tsx`.

## Android native wrapper

Apply `FLAG_SECURE` to the Activity that hosts the private meeting or protected video. Android documents that this prevents screenshots and prevents the window from appearing on non-secure displays; the resulting screenshot is blank in covered cases.

```kotlin
class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
    setContentView(R.layout.activity_main)
  }
}
```

For Android 12+, consider `HIDE_OVERLAY_WINDOWS` for sensitive activities after compatibility testing:

```xml
<uses-permission android:name="android.permission.HIDE_OVERLAY_WINDOWS" />
```

The native WebView bridge should expose `AndroidSecureScreen.enable()` and `.disable()` to the web layer. Enable it only on protected video and private-meeting screens so normal public browsing can still be captured when appropriate.

## iOS native wrapper

iOS exposes capture-status notifications rather than a universal “make every screenshot black” switch. Observe `UIScreen.capturedDidChangeNotification`, pause protected media, and place an opaque black overlay while `UIScreen.main.isCaptured` is true. Also observe `UIApplication.userDidTakeScreenshotNotification` for audit/report signals; it fires after the screenshot, so it is detection, not prevention.

```swift
final class CaptureShield {
  private let shield = UIView()

  func start(in view: UIView) {
    shield.backgroundColor = .black
    shield.isHidden = true
    shield.frame = view.bounds
    shield.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(shield)

    NotificationCenter.default.addObserver(
      forName: UIScreen.capturedDidChangeNotification,
      object: UIScreen.main,
      queue: .main
    ) { [weak self] _ in
      self?.shield.isHidden = !UIScreen.main.isCaptured
      // Pause video/WebRTC here while the shield is visible.
    }
  }
}
```

The WKWebView message handler should implement the `webkit.messageHandlers.secureScreen.postMessage({ enabled: true })` call used by the web component. Native code must validate the message and apply/remove the shield only for approved protected routes.

## Audio and external cameras

`FLAG_SECURE` and an iOS black overlay protect pixels handled by the app. They cannot stop someone from recording with another phone, and operating-system screen-recording audio behavior differs by device and recorder. Never promise that audio capture is impossible; pause private media and mute/stop WebRTC tracks when capture is detected.

## Release requirements

- Test Android API levels and manufacturer variants, especially Android 11 and lower.
- Test iOS screen recording, AirPlay/mirroring, app switching, and screenshot notification behavior.
- Keep visible per-user watermarks and server-side copyright/report enforcement.
- Obtain legal/privacy review before enabling capture telemetry and define retention limits.
