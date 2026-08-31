package com.wellcollective.app;

import android.graphics.Color;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Edge-to-edge: WebView extends behind system bars.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

    // Explicitly set status bar + navigation bar colors before super.onCreate so
    // there is no white flash between the splash screen and the WebView loading.
    // android:statusBarColor in styles.xml can be ignored by some Android versions
    // in edge-to-edge mode; the Window API is always respected.
    getWindow().setStatusBarColor(Color.parseColor("#050b14"));
    getWindow().setNavigationBarColor(Color.TRANSPARENT);

    // White icons on the dark status bar background.
    WindowInsetsControllerCompat insetsController =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (insetsController != null) {
      insetsController.setAppearanceLightStatusBars(false);
    }

    registerPlugin(WellCheckWidgetPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
