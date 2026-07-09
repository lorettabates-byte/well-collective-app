# WELL Check WidgetKit Target

This folder contains the iPhone Home Screen and Lock Screen WidgetKit source for WELL Check.

Before the iOS App Store build, add a Widget Extension target in Xcode named `WellCheckWidget`, include these Swift files, and enable the App Group `group.com.wellcollective.app` for both the app target and widget target.

The web app already publishes the same snapshot shape used by the Android widget:

- `points`
- `areas`
- `sleep`
- `energyIn`
- `energyOut`
- `steps`
- `updatedAt`
