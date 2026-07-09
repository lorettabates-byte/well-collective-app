package com.wellcollective.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

public class WellCheckWidgetProvider extends AppWidgetProvider {
  @Override
  public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
    for (int appWidgetId : appWidgetIds) {
      updateWidget(context, appWidgetManager, appWidgetId);
    }
  }

  static void refreshWidgets(Context context) {
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    ComponentName componentName = new ComponentName(context, WellCheckWidgetProvider.class);
    int[] ids = manager.getAppWidgetIds(componentName);
    for (int id : ids) {
      updateWidget(context, manager, id);
    }
  }

  private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
    SharedPreferences prefs = context.getSharedPreferences(WellCheckWidgetPlugin.PREFS, Context.MODE_PRIVATE);
    RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.well_check_widget);

    views.setTextViewText(R.id.widget_points, prefs.getString("points", "--"));
    views.setTextViewText(R.id.widget_areas, prefs.getString("areas", "--"));
    views.setTextViewText(R.id.widget_sleep, prefs.getString("sleep", "--"));
    views.setTextViewText(R.id.widget_energy_in, prefs.getString("energyIn", "--"));
    views.setTextViewText(R.id.widget_energy_out, prefs.getString("energyOut", "--"));
    views.setTextViewText(R.id.widget_steps, prefs.getString("steps", "--"));

    String updatedAt = prefs.getString("updatedAt", "");
    views.setTextViewText(
      R.id.widget_status,
      updatedAt == null || updatedAt.isEmpty() ? "Tap to open today's WELL Check" : "Updated " + updatedAt
    );

    Intent intent = new Intent(context, MainActivity.class);
    intent.setAction(Intent.ACTION_VIEW);
    intent.putExtra("route", "/well-check");
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      flags |= PendingIntent.FLAG_IMMUTABLE;
    }
    PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
    views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

    manager.updateAppWidget(appWidgetId, views);
  }
}
