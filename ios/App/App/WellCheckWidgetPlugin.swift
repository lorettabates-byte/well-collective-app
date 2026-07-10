import Capacitor
import Foundation
import WidgetKit

private let wellCheckWidgetAppGroup = "group.com.wellcollective.app"

@objc(WellCheckWidgetPlugin)
public class WellCheckWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WellCheckWidgetPlugin"
    public let jsName = "WellCheckWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveSnapshot", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveSnapshot(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: wellCheckWidgetAppGroup) else {
            call.reject("WELL Check widget storage is unavailable.")
            return
        }

        [
            "points",
            "areas",
            "sleep",
            "energyIn",
            "energyOut",
            "steps",
            "updatedAt",
            "reminder",
            "unreadCount"
        ].forEach { key in
            if let value = call.getString(key) {
                defaults.set(value, forKey: key)
            }
        }

        defaults.synchronize()
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve(["ok": true])
    }
}
