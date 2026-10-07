package com.wellcollective.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import androidx.appcompat.app.ActionBar;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;


public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Kill the title/action bar BEFORE the window is created. BridgeActivity calls
    // super.onCreate() before setTheme(), so window features come from the manifest
    // theme (AppTheme.NoActionBarLaunch). Theme.SplashScreen only sets the framework
    // android:windowActionBar, not the AppCompat one, so AppCompat would otherwise
    // install a white bar showing android:label ("WELL Collective").
    supportRequestWindowFeature(Window.FEATURE_NO_TITLE);

    // Edge-to-edge: content extends behind system bars.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

    // Paint status bar dark before super.onCreate so no white flash appears during
    // the splash→WebView transition. setStatusBarColor is deprecated in API 35+ but
    // EdgeToEdge.enable() alone leaves a white flash (transparent bar reveals loading
    // WebView). Explicit color is the only reliable fix across all Android versions.
    getWindow().setStatusBarColor(Color.parseColor("#050b14"));
    getWindow().setNavigationBarColor(Color.parseColor("#050b14"));

    // White icons on the dark status bar.
    WindowInsetsControllerCompat insetsController =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (insetsController != null) {
      insetsController.setAppearanceLightStatusBars(false);
      insetsController.setAppearanceLightNavigationBars(false);
    }

    registerPlugin(WellCheckWidgetPlugin.class);
    super.onCreate(savedInstanceState);

    // If an ActionBar still slipped through (theme resolution varies by OEM/API),
    // hide it outright. This is the guaranteed removal, independent of themes.
    ActionBar actionBar = getSupportActionBar();
    if (actionBar != null) {
      actionBar.hide();
    }

    // Belt-and-suspenders: also paint the WebView background dark so the content
    // area doesn't flash white while React is initializing.
    getBridge().getWebView().setBackgroundColor(Color.parseColor("#050b14"));
  }
}
