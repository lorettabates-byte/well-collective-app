package com.wellcollective.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Enable edge-to-edge so env(safe-area-inset-bottom) reports the real
    // Android navigation bar height and the bottom tab bar clears it correctly.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    registerPlugin(WellCheckWidgetPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
