package com.wellcollective.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Enable edge-to-edge so env(safe-area-inset-bottom) reports the real
    // Android navigation bar height and the bottom tab bar clears it correctly.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

    // Force white status bar icons (dark appearance = false) so they're
    // visible on the dark app background. Without this they can render as
    // dark icons on a dark bar and look like a white block.
    WindowInsetsControllerCompat insetsController =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (insetsController != null) {
      insetsController.setAppearanceLightStatusBars(false);
    }

    registerPlugin(WellCheckWidgetPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
