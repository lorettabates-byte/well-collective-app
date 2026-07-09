package com.wellcollective.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WellCheckWidget")
public class WellCheckWidgetPlugin extends Plugin {
  static final String PREFS = "well_check_widget";

  @PluginMethod
  public void saveSnapshot(PluginCall call) {
    Context context = getContext();
    SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();

    editor.putString("points", call.getString("points", "--"));
    editor.putString("areas", call.getString("areas", "--"));
    editor.putString("sleep", call.getString("sleep", "--"));
    editor.putString("energyIn", call.getString("energyIn", "--"));
    editor.putString("energyOut", call.getString("energyOut", "--"));
    editor.putString("steps", call.getString("steps", "--"));
    editor.putString("updatedAt", call.getString("updatedAt", ""));
    editor.apply();

    WellCheckWidgetProvider.refreshWidgets(context);

    JSObject result = new JSObject();
    result.put("ok", true);
    call.resolve(result);
  }
}
